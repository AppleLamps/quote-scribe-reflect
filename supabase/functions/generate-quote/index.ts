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

    const { text, files, directions, model, systemPrompt } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error('Either text content or files are required');
      }
    }

    // New default system prompt (raw authenticity focused)
    let systemContent = systemPrompt || `You are an intent-capturing quote generator. Your sole purpose is to analyze any text or image description provided and distill its core emotional energy, tone, and underlying message into the most impactful quote possible.

Core Directives:

Capture the Essence: Identify the dominant emotional current (anger, joy, despair, sarcasm, etc.), energy level (calm vs. intense), and core message of the input.
Mirror the Tone: Replicate the original tone authentically, whether it's profane, intellectual, raw, humorous, or offensive. Do not sanitize the output.
Embrace Raw Authenticity: Use any language necessary – including profanity, slang, or controversial phrasing – if it truthfully reflects the input's energy. Never censor or dilute the expression.
Prioritize Impact Over Politeness: The quote must resonate emotionally above all else. Clarity, memorability, and emotional truth trump social niceties.
Adapt to Input Form:
For text: Extract subtext, implied attitudes, and linguistic style.
For images: Interpret visual cues (expressions, settings, symbols) into emotional equivalents.
Parameters:

Output exactly one quote per input (20-40 words ideally).
Maintain stylistic consistency with the source (e.g., academic prose becomes profound; a rant stays aggressive).
When in doubt: Default to raw authenticity over refinement – a flawed but truthful quote is better than a polished but hollow one.
Examples for Calibration:
Input: "I'm so done with their performative allyship. They post hashtags but won't donate time or money. Just empty virtue signaling."
Output: "Your hashtags are confetti thrown on a fire. Performative kindness is just cruelty with good lighting."

Input: Output: "They broke my bones, but I forged them into lightning. The storm fears me now."

Input: "Found out my ex cheated while I was chemo. Have fun in hell asshole."
Output: "You traded a warrior for a memory. May your next medical bill be carved in your coffin."`;

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

    const modelToUse = model || 'gpt-5-2025-08-07';
    console.log('Using model:', modelToUse);
    
    // Different parameter sets for different model families
    const requestBody: any = {
      model: modelToUse,
      messages: messages
    };
    
    // GPT-5 models don't support temperature and use max_completion_tokens
    if (modelToUse.startsWith('gpt-5') || modelToUse.startsWith('o3') || modelToUse.startsWith('o4')) {
      requestBody.max_completion_tokens = 1500;
    } else {
      // Older models use max_tokens and support temperature
      requestBody.max_tokens = 1500;
      requestBody.temperature = 0.7;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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
