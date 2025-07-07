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

    const { text, files } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    // Process files to extract text content
    let combinedContent = text;
    
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files`);
      
      for (const file of files) {
        try {
          if (file.type.startsWith('image/')) {
            // For images, we'll include them in the context
            combinedContent += `\n\n[Image attached: ${file.name}]`;
          } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
            // For text files, fetch and include content
            const fileResponse = await fetch(file.url);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              combinedContent += `\n\nContent from ${file.name}:\n${fileContent}`;
            }
          } else {
            // For other file types, just mention them
            combinedContent += `\n\n[File attached: ${file.name}]`;
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          combinedContent += `\n\n[File attached: ${file.name} - could not process content]`;
        }
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a profound reflection generator. Your task is to read the user\'s text and any attached files carefully and generate a single, thought-provoking quote or reflection that captures the essence, tone, and emotional energy of their content. If images are attached, consider them as part of the context. Match the tone exactly - whether it\'s angry, frustrated, joyful, dark, offensive, sarcastic, or any other emotion. Do not sanitize or make it more positive than the original. Capture the raw truth and feeling within their words and attachments. Keep it concise but impactful - ideally 1-3 sentences. Do not include quotation marks in your response.' 
          },
          { role: 'user', content: `Please generate a profound quote or reflection based on this content:\n\n${combinedContent}` }
        ],
        max_tokens: 1000,
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