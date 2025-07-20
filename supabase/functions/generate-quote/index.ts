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

    const { text, files, directions } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // ✨ Ultra‑strict system prompt
    let systemContent = `You are a one‑line wisdom forge. Turn any input into ONE unforgettable sentence (≤200 characters). 
Rules:
1. Convey a single insight; no dual messages.
2. Use at most ONE metaphor OR simile—many lines will have none.
3. Anchor the idea in at least one concrete, sensory object (e.g. matchstick, mailbox, subway rail). No abstract-only imagery.
4. BANNED imagery & phrases: stars, rivers, storms, seeds, mirrors, journeys, dawn, echo, whisper, spark, door ajar, time river, ice river.
5. No quotation marks, dialogue dashes, or ellipses.
6. Rotate tone each time: Hemingway blunt, Zen paradox, Sagan cosmic, Angelou tender, Nietzsche daring, Austen wry.
7. Keep language muscular: strong verbs, plain nouns, minimal adjectives; avoid filler.
8. If rules can’t be met, respond exactly: INPUT NEEDS CLARITY.`;

    if (directions && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }

    const messages = [
      { role: 'system', content: systemContent }
    ];

    const userMessageContent = [];

    if (text && text.trim().length > 0) {
      userMessageContent.push({ type: 'text', text: `Text content: ${text.trim()}` });
    }

    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files`);
      for (const file of files){
        try {
          if (file.type.startsWith('image/')) {
            userMessageContent.push({
              type: 'image_url',
              image_url: { url: file.url, detail: 'high' }
            });
          } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
            const fileResponse = await fetch(file.url);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              userMessageContent.push({ type: 'text', text: `Content from ${file.name}:\n${fileContent}` });
            }
          } else {
            userMessageContent.push({ type: 'text', text: `[File attached: ${file.name}]` });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          userMessageContent.push({ type: 'text', text: `[File attached: ${file.name} - could not process content]` });
        }
      }
    }

    if (userMessageContent.length === 0) {
      userMessageContent.push({ type: 'text', text: 'Please generate a profound quote or reflection.' });
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
        max_tokens: 400,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedQuote = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ quote: generatedQuote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate quote' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
