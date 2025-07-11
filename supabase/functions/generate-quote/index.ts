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

    const { text, files, directions } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // Prepare messages for OpenAI
    let systemContent = `You are a master of timeless wisdom and poetic expression. Create a single, profound quote that captures universal truths with the elegance and depth of history's greatest thinkers. Your words should resonate across centuries, embodying the kind of profound insight that echoes through generations.

CRITICAL: Express only ONE profound thought with poetic grace. Use metaphorical language, universal themes, and timeless wisdom. Do not use semicolons, conjunctions (and, but, so, yet), or transitions to link multiple ideas. Do not add a second reflection, consequence, or observation. Stop after the first profound insight.

Examples of CORRECT timeless, poetic quotes:
- "The deepest wells of wisdom spring from the silence between heartbeats"
- "In the cathedral of memory, every moment becomes eternal"
- "The soul speaks loudest in the language of forgotten dreams"

Examples of INCORRECT mundane quotes (DO NOT DO THIS):
- "Life is precious and we should appreciate every moment"
- "Hard work leads to success and happiness"
- "Dreams inspire us to work harder and achieve our goals"

Craft your response with the lyrical beauty of poetry and the weight of eternal truth. Reply in a single, transcendent sentence. Do not use quotation marks.`;
    
    if (directions && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }
    
    const messages = [
      { 
        role: 'system', 
        content: systemContent
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
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        max_tokens: 250,
        temperature: 1.1,
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
