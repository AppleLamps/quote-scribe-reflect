import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_IMAGE_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
  'google/gemini-3.1-flash-image-preview',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text, files, directions, model } = await req.json();

    if ((!text || typeof text !== 'string' || text.trim().length === 0) && (!files || files.length === 0)) {
      return new Response(JSON.stringify({ error: 'Text or files are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageModel = ALLOWED_IMAGE_MODELS.includes(model) ? model : 'google/gemini-3.1-flash-image-preview';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // ===== STEP 1: Use text model to craft the perfect image generation prompt =====
    console.log('Step 1: Generating optimized image prompt with text model...');

    let promptInput = '';
    if (text && text.trim()) {
      promptInput = text.trim().substring(0, 2000);
    }
    if (directions) {
      promptInput += `\n\nArtistic style preferences: ${directions}`;
    }

    // Build content for the text model (include uploaded images for context)
    const textModelContent: any[] = [
      {
        type: "text",
        text: `You are an expert image prompt engineer. Given the following content, create a detailed, vivid image generation prompt that will produce a stunning visual artwork. 

The prompt should:
- Be highly descriptive with specific visual details (colors, lighting, composition, textures, mood)
- Focus on abstract, symbolic, or metaphorical imagery inspired by the themes
- NOT include any text, words, or letters in the image
- Be 2-4 sentences long
- Be optimized for AI image generation

Content to visualize:
${promptInput}

Respond with ONLY the image generation prompt, nothing else.`
      }
    ];

    // If images were uploaded, include them for the text model to analyze
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.base64 && file.type?.startsWith('image/')) {
          textModelContent.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${file.base64}`
            }
          });
        }
      }
    }

    const promptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: textModelContent }
        ],
      }),
    });

    if (!promptResponse.ok) {
      const errText = await promptResponse.text();
      console.error('Prompt generation error:', promptResponse.status, errText);
      if (promptResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (promptResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Prompt generation failed: ${promptResponse.status}`);
    }

    const promptData = await promptResponse.json();
    const optimizedPrompt = promptData.choices?.[0]?.message?.content?.trim();

    if (!optimizedPrompt) {
      throw new Error('Failed to generate optimized prompt');
    }

    console.log('Optimized prompt:', optimizedPrompt);

    // ===== STEP 2: Generate the image using the optimized prompt =====
    console.log(`Step 2: Generating image with model: ${imageModel}`);

    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel,
        messages: [
          { role: 'user', content: optimizedPrompt }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation error:', imageResponse.status, errorText);
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = imageData.choices?.[0]?.message?.content;

    if (!imageUrl) {
      const finishReason = imageData.choices?.[0]?.finish_reason;
      console.error('No image in response. Finish reason:', finishReason);
      const errorMsg = finishReason === 'safety' || finishReason === 'content_filter'
        ? 'The content was flagged by safety filters. Try rephrasing or using more abstract language.'
        : 'No image was generated. Try simplifying your input or changing the artistic direction.';
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      imageUrl, 
      description: textResponse,
      generatedPrompt: optimizedPrompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate image' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
