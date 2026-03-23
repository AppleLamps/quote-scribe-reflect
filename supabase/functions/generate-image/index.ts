import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
  'google/gemini-3.1-flash-image-preview',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
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

    if (text && text.length > 10000) {
      return new Response(JSON.stringify({ error: 'Text exceeds maximum length of 10000 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const modelToUse = ALLOWED_MODELS.includes(model) ? model : 'google/gemini-3.1-flash-image-preview';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the user message content
    const contentParts: any[] = [];

    let prompt = "Generate a visually striking, artistic image that represents the essence and meaning of the following content. The image should be evocative, symbolic, and beautiful — capturing the core emotion and theme.";

    if (directions) {
      prompt += `\n\nAdditional artistic direction: ${directions}`;
    }

    if (text && text.trim()) {
      prompt += `\n\nContent to visualize:\n${text.trim()}`;
    }

    contentParts.push({ type: "text", text: prompt });

    // Add image files if present
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.base64 && file.type?.startsWith('image/')) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${file.base64}`
            }
          });
        }
      }
    }

    console.log(`Generating image with model: ${modelToUse}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: contentParts,
          }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      throw new Error('No image was generated. The model may not have produced an image for this input.');
    }

    return new Response(JSON.stringify({ imageUrl, description: textResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate image' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
