import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge function called, method:', req.method);
  
  // Handle CORS preflight requests
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

    const { text, files, directions } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // Updated system prompt
    let systemContent = `You are a quote generator that transforms user input into a short, potent reflection (≤280 characters) that expresses the core message of the original text—clearly, freshly, and in a distinct voice.

Your output must:
- Reflect the meaning or moral of the input, even if it rephrases or reimagines it.
- Use only one metaphor or image (if any).
- Be complete in thought and emotionally unified—no stacking of semi-related ideas.

Tonal variation is essential. Rotate unpredictably across styles:
- Direct & stark (like Hemingway)
- Playful & paradoxical (like Zen koans)
- Cosmic & precise (like Carl Sagan)
- Tender & intimate (like Maya Angelou)
- Witty & observant (like Jane Austen)
- Bold & challenging (like Nietzsche)

DO:
- Ground ideas in small, concrete details or objects
- Match the emotional resonance of the input: is it regretful, hopeful, ironic, bitter?
- Vary syntax, diction, and rhythm between responses
- Leave a hint of mystery, wit, or sting

DO NOT:
- Stack metaphors or dual insights
- Use quotation marks
- Repeat stock imagery (no stars, rivers, storms, journeys, mirrors, seeds, dawn, etc.)
- Produce generic, flowery, or abstract AI-sounding lines

Your goal: One striking line that captures the truth behind the user’s words—refined, not inflated.`;

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
            userMessageContent.push({
              type: 'image_url',
              image_url: {
                url: file.url,
                detail: 'high'
              }
            });
          } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
            const fileResponse = await fetch(file.url);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              userMessageContent.push({
                type: 'text',
                text: `Content from ${file.name}:\n${fileContent}`
              });
            }
          } else {
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
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 500,
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
