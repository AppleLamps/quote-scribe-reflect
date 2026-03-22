import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
};

const ALLOWED_MODELS = ['gpt-5.4-2026-03-05'];
const MAX_TEXT_LENGTH = 50000;
const MAX_DIRECTIONS_LENGTH = 5000;

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth check ---
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

    // --- Input validation ---
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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

    const modelToUse = (model && ALLOWED_MODELS.includes(model)) ? model : ALLOWED_MODELS[0];

    // System prompt (server-defined, not overridable)
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

    messages.push({ role: 'user', content: [{ type: 'text', text: `Idea to convert to Flux prompt: ${text.trim()}` }] });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        max_completion_tokens: 1500,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in generate-flux-prompt function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate prompt' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
