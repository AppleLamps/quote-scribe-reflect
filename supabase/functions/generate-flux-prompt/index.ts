import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req)=>{
  console.log('Edge function called, method:', req.method);
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, length:', openAIApiKey.length);

    const { text, directions, model, systemPrompt } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    // System prompt for generating Flux image prompts
    let systemContent = systemPrompt || `You are an expert prompt engineer for image generation models. Your task is to convert a user's idea into a single, comprehensive, and descriptive narrative prompt.

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

    if (directions && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }

    const messages = [
      { role: 'system', content: systemContent }
    ];

    const userMessageContent = [];

    if (text && text.trim().length > 0) {
      userMessageContent.push({ type: 'text', text: `Idea to convert to Flux prompt: ${text.trim()}` });
    }

    if (userMessageContent.length === 0) {
      userMessageContent.push({ type: 'text', text: 'Please generate a detailed Flux image prompt.' });
    }

    messages.push({ role: 'user', content: userMessageContent });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4.1',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.6
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
