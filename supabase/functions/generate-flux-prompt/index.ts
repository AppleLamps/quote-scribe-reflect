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

    const { text, directions } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    // System prompt for generating Flux image prompts
    let systemContent = `You are a Flux image prompt engineer. Your task is to turn the user's idea into a highly detailed, optimized prompt for image generation with Flux models.

MANDATE:
- Focus above all on **clarity and specificity** to produce the best possible image
- Create a single, comprehensive prompt that includes all necessary details
- Keep the prompt under **1000 characters** for optimal performance

GUIDELINES:
- Structure the prompt with clear subject, setting, style, and technical details
- Include specific artistic styles, lighting, camera angles, and quality descriptors
- Use precise adjectives and descriptive terms that guide the image generation
- Add technical parameters like aspect ratio, resolution, or quality modifiers if relevant
- Balance creative elements with technical precision

PROMPT STRUCTURE:
1. Subject: Main focus of the image (person, object, scene)
2. Action/State: What's happening or the condition
3. Setting/Environment: Where it takes place
4. Style/Aesthetic: Artistic approach (photorealistic, painterly, cyberpunk, etc.)
5. Lighting/Mood: Atmosphere and lighting conditions
6. Technical details: Camera type, quality descriptors, aspect ratio
7. Additional elements: Specific details that enhance the image

If the input is unclear or unusable, respond with: INPUT NEEDS CLARITY.`;

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
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
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
