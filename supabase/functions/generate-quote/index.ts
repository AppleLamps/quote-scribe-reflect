import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
};

const ALLOWED_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-3.1-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'openai/gpt-5.2',
];
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const MAX_TEXT_LENGTH = 50000;
const MAX_DIRECTIONS_LENGTH = 5000;
const MAX_FILES = 10;

serve(async (req) => {
  console.log('Edge function called, method:', req.method);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // --- Input parsing & validation ---
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { text, files, directions, model } = await req.json();

    if (text && typeof text === 'string' && text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: 'Text exceeds maximum length' }), { status: 400, headers: corsHeaders });
    }

    if (directions && typeof directions === 'string' && directions.length > MAX_DIRECTIONS_LENGTH) {
      return new Response(JSON.stringify({ error: 'Directions exceed maximum length' }), { status: 400, headers: corsHeaders });
    }

    const modelToUse = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;

    if (files && Array.isArray(files) && files.length > MAX_FILES) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_FILES} files allowed` }), { status: 400, headers: corsHeaders });
    }

    if (!text || (typeof text === 'string' && text.trim().length === 0)) {
      if (!files || !Array.isArray(files) || files.length === 0) {
        return new Response(JSON.stringify({ error: 'Either text content or files are required' }), { status: 400, headers: corsHeaders });
      }
    }

    // System prompt (server-defined, not overridable)
    let systemContent = `You are an intent-capturing quote generator. Analyze any text or image description and distill its core emotional energy, tone, and underlying message into the most impactful quote possible.

CORE DIRECTIVES:

1. Capture the Essence: Identify the dominant emotion (anger, joy, despair, sarcasm, etc.), energy level (calm vs. intense), and core message.
2. Mirror the Tone: Replicate the original tone authentically—profane, intellectual, raw, humorous, or offensive. Never sanitize.
3. Embrace Raw Authenticity: Use any language necessary, including profanity, slang, or controversial phrasing, if it truthfully reflects the input's energy. Never censor or dilute.
4. Prioritize Impact Over Politeness: Emotional resonance matters above all. Clarity, memorability, and emotional truth outweigh social niceties.
5. No Antithesis Constructions: Never use "not X, but Y" contrasts, "less X, more Y" pivots, or any rhetorical antithesis pattern. Write plain, direct prose that carries the meaning through imagery, metaphor, or raw statement. Every clause should stand on its own and push forward.

ADAPTING TO INPUT:
- Text: Extract subtext, implied attitudes, and linguistic style.
- Images: Interpret visual cues (expressions, settings, symbols) into emotional equivalents.

PARAMETERS:
- Output exactly one quote per input (20–40 words ideal).
- Match the source's register: academic input becomes profound; a rant stays aggressive; humor stays sharp.
- Default to raw authenticity over refinement. A flawed, truthful quote beats a polished, hollow one.

EXAMPLES:

Input: "I'm so done with their performative allyship. They post hashtags but won't donate time or money. Just empty virtue signaling."
Output: "Your hashtags are confetti thrown on a fire. Performative kindness is cruelty with good lighting."

Input: "They tried to break me during the worst year of my life. I came out stronger than they ever expected."
Output: "They broke my bones and I forged them into lightning. The storm fears me now."

Input: "Found out my ex cheated while I was on chemo. Have fun in hell asshole."
Output: "You traded a warrior for a memory. May your next medical bill be carved in your coffin."`;

    if (directions && typeof directions === 'string' && directions.trim().length > 0) {
      systemContent += `\n\nAdditional instructions: ${directions.trim()}`;
    }

    const messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }> = [
      { role: 'system', content: systemContent }
    ];

    const userMessageContent = [];

    if (text && typeof text === 'string' && text.trim().length > 0) {
      userMessageContent.push({ type: 'text', text: `Text content: ${text.trim()}` });
    }

    if (files && Array.isArray(files) && files.length > 0) {
      console.log(`Processing ${files.length} files`);
      for (const file of files) {
        try {
          if (file.type && file.type.startsWith('image/')) {
            userMessageContent.push({
              type: 'image_url',
              image_url: { url: file.url, detail: 'high' }
            });
          } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
            const fileResponse = await fetch(file.url);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              userMessageContent.push({ type: 'text', text: `Content from ${file.name}:\n${fileContent.slice(0, 50000)}` });
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

    console.log('Using model:', modelToUse);

    const isOpenAI = modelToUse.startsWith('openai/');
    const requestBody: Record<string, unknown> = {
      model: modelToUse,
      messages: messages,
      temperature: 0.7,
    };
    if (isOpenAI) {
      requestBody.max_completion_tokens = 1500;
    } else {
      requestBody.max_tokens = 1500;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const errorData = await response.text();
      console.error('AI gateway error:', response.status, errorData);
      throw new Error(`AI gateway error: ${errorData}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from AI gateway');
    }

    const generatedQuote = data.choices[0].message.content?.trim();

    if (!generatedQuote) {
      throw new Error('Empty quote generated');
    }

    return new Response(JSON.stringify({ quote: generatedQuote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Error in generate-quote function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate quote';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
