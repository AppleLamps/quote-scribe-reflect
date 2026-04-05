import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_IMAGE_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
  'google/gemini-3.1-flash-image-preview',
];

const MAX_TEXT_LENGTH = 50000;
const MAX_DIRECTIONS_LENGTH = 5000;
const MAX_FILES = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // --- Input parsing & validation ---
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { text, files, directions, model } = await req.json();

    if (text && typeof text === 'string' && text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: 'Text exceeds maximum length' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (directions && typeof directions === 'string' && directions.length > MAX_DIRECTIONS_LENGTH) {
      return new Response(JSON.stringify({ error: 'Directions exceed maximum length' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (files && Array.isArray(files) && files.length > MAX_FILES) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_FILES} files allowed` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((!text || typeof text !== 'string' || text.trim().length === 0) && (!files || !Array.isArray(files) || files.length === 0)) {
      return new Response(JSON.stringify({ error: 'Text or files are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageModel = ALLOWED_IMAGE_MODELS.includes(model) ? model : 'google/gemini-3.1-flash-image-preview';

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
    const textModelContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `You are an expert image prompt engineer for a creativity app. Users paste thoughts, quotes, notes, or attach reference images. Some want a literal scene; others want a symbolic or metaphorical visualization.

Write exactly ONE image-generation prompt: the raw text an image model should use. No title, no preamble, no markdown, no quotation marks around the prompt, no bullet lists.

How to interpret the input:
- If the user describes something concrete (objects, places, people, actions), keep it faithful and specific; do not replace it with abstraction unless the text is clearly metaphorical or emotional-only.
- If the input is abstract, emotional, or aphoristic, translate it into a single strong visual metaphor or symbolic scene that preserves the mood and theme.
- If "Content to visualize" is empty or only has style notes but reference images are attached, infer subject, mood, palette, and composition from those images and describe one cohesive scene.
- If both text and images are present, merge them unless they conflict; when they conflict, follow the text.

Quality bar for the prompt you output:
- One clear focal idea and composition (avoid cluttered "kitchen sink" descriptions unless the user asks for that).
- Concrete sensory detail: lighting, color palette, materials/textures, atmosphere, and spatial layout where it helps.
- Honor any "Artistic style preferences" below; they override your default style choices when they specify medium or look.
- The image must contain no text, letters, numbers, logos, captions, signage, or watermarks—purely visual.
- If the source material is intense or graphic, keep emotional weight using atmosphere, symbolism, or suggestion rather than explicit gore or sexual content (reduces model refusals while staying true to tone).
- Aim for roughly 2–5 sentences, or one dense paragraph, and stay under 1200 characters.

Content to visualize:
${promptInput}

Output only the final image prompt, nothing else.`
      }
    ];

    // If images were uploaded, fetch them via signed URL and convert to base64 for the text model
    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.type?.startsWith('image/') && file.url) {
          try {
            const imgResponse = await fetch(file.url);
            if (imgResponse.ok) {
              const arrayBuffer = await imgResponse.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              textModelContent.push({
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`
                }
              });
            }
          } catch (e) {
            console.error(`Failed to fetch image ${file.name}:`, e);
          }
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
        model: 'google/gemini-2.5-flash-lite',
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

  } catch (error: unknown) {
    console.error('Error generating image:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate image';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
