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
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // Prepare messages for OpenAI
    const messages = [
      { 
        role: 'system', 
        content: 'You are a profound, history-making reflection generator. Your task is to create a single, impactful quote or reflection that captures and mirrors the exact tone, emotional energy, and intent of the input—whether it is joyful, angry, hopeful, despairing, sarcastic, mournful, or any other feeling. Your response should be worthy of history: concise, memorable, and powerful. Do not soften, sanitize, critique, or reframe the original content in any way. Express only the raw truth and feeling present in the input. Reply with 1-3 sentences. Do not use quotation marks.' 
      }
    ];

    // Build user message with text and/or images
    const userMessageContent = [];
    
    // Add text if provided
    if (text && text.trim().length > 0) {
      userMessageContent.push({
        type: 'text',
        text: `Text content: ${text.trim()}`
      });
    }

    // Process files
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files`);
      
      for (const file of files) {
        try {
          if (file.type.startsWith('image/')) {
            // For images, add them directly to the vision model
            userMessageContent.push({
              type: 'image_url',
              image_url: {
                url: file.url,
                detail: 'high'
              }
            });
          } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
            // For text files, fetch and include content
            const fileResponse = await fetch(file.url);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              userMessageContent.push({
                type: 'text',
                text: `Content from ${file.name}:\n${fileContent}`
              });
            }
          } else {
            // For other file types, just mention them
            userMessageContent.push({
              type: 'text',
              text: `[File attached: ${file.name}]`
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          userMessageContent.push({
            type: 'text',
            text: `[File attached: ${file.name} - could not process content]`
          });
        }
      }
    }

    // If no content was added, add a default message
    if (userMessageContent.length === 0) {
      userMessageContent.push({
        type: 'text',
        text: 'Please generate a profound quote or reflection.'
      });
    }

    messages.push({
      role: 'user',
      content: userMessageContent
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.5-preview',
        messages: messages,
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