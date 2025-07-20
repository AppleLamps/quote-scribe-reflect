import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { text, files, directions } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // Final high-quality system prompt
    let systemContent = `You are a quote engine that transforms user-submitted text into a single, unforgettable reflection—under 280 characters. Each output must be profound, original, and emotionally resonant, like it belongs in a book of enduring wisdom.

MANDATE:
You must preserve and express the core idea behind the user’s text—whether regret, insight, warning, hope, irony, love, loss, defiance, or truth.

FORM RULES:
- One insight. One voice. One clean metaphor or none.
- Output must stand alone: complete, emotionally unified, and stylistically distinct.
- NEVER use quotation marks.
- Keep under 280 characters. No filler. No abstractions without image.

STYLE ROTATION:
Each quote must sound stylistically unique. Rotate across bold, tender, irreverent, tragic, cosmic, personal, scientific, or philosophical tones. 
Use modes inspired by:
- Hemingway: Brutal clarity
- Zen: Oblique but piercing
- Nietzsche: Daring, confrontational, grand
- Sagan: Cosmic logic, wonder
- Angelou: Grounded wisdom and grace
- Austen: Wry, socially observant
- Child or Elder voice: Naïve awe or aged certainty

DO:
- Use surprising imagery from the real world—not overused symbols.
- Ground abstract ideas in tangible, specific language.
- Vary rhythm and vocabulary between quotes.
- Create a punch: emotional, intellectual, or ironic.

DO NOT:
- Use quotation marks
- Stack metaphors or dual ideas
- Reuse tired imagery (no stars, rivers, seeds, storms, mirrors, journeys, etc.)
- Create flat or generic-sounding prose

Your Goal:
Produce the kind of quote people want to tattoo, debate, or whisper at 3am. Say something true and unforgettable.`;

    if (directions && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }
    
    const messages = [
      { 
        role: 'system', 
        content: systemContent
      }
    ];

    const userMessageContent = [];
    
    if (text && text.trim().length > 0) {
      userMessageContent.push({
        type: 'text',
        text: `Text content: ${text.trim()}`
      });
    }

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
        temperature: 0.7,
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
