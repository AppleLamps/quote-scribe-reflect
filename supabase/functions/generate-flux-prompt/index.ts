import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
};

const ALLOWED_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-3.1-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'openai/gpt-5.2',
];
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const MAX_TEXT_LENGTH = 50000;
const MAX_DIRECTIONS_LENGTH = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { text, directions, model } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text content is required' }), { status: 400, headers: corsHeaders });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: 'Text exceeds maximum length' }), { status: 400, headers: corsHeaders });
    }

    if (directions && typeof directions === 'string' && directions.length > MAX_DIRECTIONS_LENGTH) {
      return new Response(JSON.stringify({ error: 'Directions exceed maximum length' }), { status: 400, headers: corsHeaders });
    }

    const modelToUse = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;

    let systemContent = `You are an expert prompt engineer for image generation models. Your task is to convert a user's idea into a single, comprehensive, and descriptive narrative prompt.

MANDATE:
- You MUST ALWAYS generate a prompt from the user's input.
- If the input is vague, interpret it creatively to produce a rich and interesting prompt. Do not ask for clarification or state that the input is unclear.
- The final prompt must be a comprehensive and descriptive narrative, adhering to a maximum length of 1024 characters.

GUIDELINES FOR PROMPT CREATION:
- Specificity: Use precise details about the subject, colors, mood, and composition.
- Style & Medium: Suggest a visual style (e.g., photorealistic, watercolor, cyberpunk) and medium.
- Subject Matter: Clearly describe objects, characters, or elements with their defining traits.
- Composition & Perspective: Employ unique viewpoints like bird's-eye view, close-up, or wide-angle.
- Dynamic Elements: Incorporate action, movement, or energy to make the scene feel alive.
- Emotion & Tone: Evoke a specific mood or feeling to enhance the storytelling.
- Narrative Context: Add depth with a hint of backstory or scene-setting.
- Personalization: If the user's input includes a person's name, make sure to use that name in the prompt.
- Focus: Ensure the entire prompt is focused, relevant, and directly actionable by the image generator.

Your output should be ONLY the generated prompt text.`;

    if (directions && typeof directions === 'string' && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }

    const messages = [
      { role: 'system', content: systemContent }
    ];

    messages.push({ role: 'user', content: `Idea to convert to Flux prompt: ${text.trim()}` });

    const isOpenAI = modelToUse.startsWith('openai/');
    const requestBody: Record<string, unknown> = {
      model: modelToUse,
      messages: messages,
      temperature: 0.7,
    };
    if (isOpenAI) {
      requestBody.max_completion_tokens = 1500;
    } else {
      requestBody.max_tokens = 1500;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const errorData = await response.text();
      console.error('AI gateway error:', response.status, errorData);
      throw new Error(`AI gateway error: ${errorData}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Error in generate-flux-prompt function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate prompt';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
