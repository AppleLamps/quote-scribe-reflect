import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a wise philosopher and poet. Your task is to read the user\'s text carefully and generate a single, profound, thought-provoking quote or reflection that captures the essence, deeper meaning, or universal truth found within their content. The quote should be inspiring, memorable, and offer new perspective. Keep it concise but impactful - ideally 1-3 sentences. Do not include quotation marks in your response.' 
          },
          { role: 'user', content: `Please generate a profound quote or reflection based on this text:\n\n${text}` }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedQuote = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ quote: generatedQuote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate quote' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});