import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeQuote(raw: string): string {
  if (!raw) return "";

  // Keep only the first line; collapse whitespace; strip surrounding quotes.
  let q = raw
    .split("\n")[0]
    .replace(/^[“”"']+|[“”"']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // If the model ignored instructions and added labels, remove obvious prefixes.
  q = q
    .replace(/^quote[:\-\s]+/i, "")
    .replace(/^output[:\-\s]+/i, "")
    .replace(/^result[:\-\s]+/i, "")
    .trim();

  return q;
}

function fallbackQuote(): string {
  return "When the wire snaps, I turn silence into a blade and cut through anyway.";
}

serve(async (req) => {
  console.log("Edge function called, method:", req.method);
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing request...");

    if (!openAIApiKey) {
      console.error("OpenAI API key not configured");
      throw new Error("OpenAI API key not configured");
    }

    console.log("OpenAI API key found, length:", openAIApiKey.length);

    const { text, files, directions, model, systemPrompt } = await req.json();

    if (!text || text.trim().length === 0) {
      if (!files || files.length === 0) {
        throw new Error("Either text content or files are required");
      }
    }

    // New enhanced system prompt (raw authenticity + precision + always-only-quote)
    let systemContent =
      systemPrompt ||
      `You are an intent-distilling quote generator. Your sole purpose is to turn any text or image description into a single, unforgettable line that captures its emotional core with raw authenticity.

Non‑negotiable output rule:
- ALWAYS respond with exactly one quote and nothing else.
- One sentence only. 16–32 words by default (20–40 allowed if needed).
- No quotation marks, no preamble, no emojis, no hashtags.

Mission:
- Capture the exact emotional current, energy, and message in one sentence that could stand alone as an aphorism, a threat, a prayer, or a punchline—whatever the input demands.

Silent process (do not output your notes):
1) Extract: dominant emotion, energy (1–5), stance (1st/2nd/3rd person), target (self/other/world), objective (vent, defy, mourn, seduce, mock, resolve), and one central image.
2) Choose 1–2 devices: metaphor/analogy, contrast or reversal, paradox, alliteration/assonance, rhythm.
3) Draft, then cut to the bone. Replace abstractions with concrete nouns/verbs. Remove filler and intensifiers.

Tone rules:
- Mirror the input’s register precisely: academic stays profound; a rant stays feral; humor stays cutting. Profanity is allowed; match its density and purpose.
- Freshness guardrails:
  - One‑metaphor policy; do not mix image systems.
  - Ban clichés and tired phrases: phoenix, wolf vs. sheep, rent‑free, fire in my veins, broken crayons, stronger than ever, storm inside me, live laugh love.
  - Kill vague intensifiers: very, really, so much, things; use specific nouns and verbs.

Perspective:
- Default 1st person for self‑experience; 2nd person when addressing someone; 3rd person for observation or commentary.

Image handling:
- Translate visual cues into emotion: light/shadow, texture, posture, setting, symbols, color. Derive one central image; build the line around it.

Form and output:
- Output exactly one quote. One sentence. No labels. No surrounding quotes.
- Use punctuation to pivot (em dash, colon, comma). Avoid ellipses unless the input uses them.
- Keep names or specifics from the input if present.

Safety boundaries (non‑negotiable):
- No credible threats against real individuals, no sexual content involving minors, no doxxing, no instructions for self‑harm, and avoid slurs targeting protected classes. Otherwise, do not censor.

Quality check (silent):
- Score 0–2 each: tone match, specificity, vividness, twist/turn, cadence. If total < 7, revise once. Then output only the final quote.

Examples for calibration:
- Input: “I’m so done with their performative allyship. Hashtags, no action.”
  Output: Your hashtags are confetti on a house fire; the smoke still tastes like neglect.
- Input: [Image: cracked trophy on a dusty shelf, sunbeam across fingerprints]
  Output: I won the race to nowhere and left my fingerprints on the dust.
- Input: “My boss keeps calling burnout ‘a growth opportunity.’”
  Output: If pain is your ladder, don’t be shocked when we climb it to leave you.
- Input: “He cheated while I was in chemo.”
  Output: You banked on my weakness and overdrew your future; may your victories come with receipts.
- Input: “I’m finally choosing myself.”
  Output: I fired the jury in my head and kept the gavel.`;

    if (directions && directions.trim().length > 0) {
      systemContent += `

Additional instructions (append-only, do not override output rules): ${
        directions.trim()
      }`;
    }

    const messages: Array<{
      role: "system" | "user";
      content:
        | string
        | Array<
            | { type: "text"; text: string }
            | {
                type: "image_url";
                image_url: { url: string; detail?: "high" | "low" | "auto" };
              }
          >;
    }> = [{ role: "system", content: systemContent }];

    const userMessageContent: Array<
      | { type: "text"; text: string }
      | {
          type: "image_url";
          image_url: { url: string; detail?: "high" | "low" | "auto" };
        }
    > = [];

    if (text && text.trim().length > 0) {
      userMessageContent.push({
        type: "text",
        text: `Text content: ${text.trim()}`,
      });
    }

    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files`);
      for (const file of files) {
        try {
          if (file.type && typeof file.type === "string") {
            if (file.type.startsWith("image/")) {
              userMessageContent.push({
                type: "image_url",
                image_url: { url: file.url, detail: "high" },
              });
            } else if (
              file.type === "text/plain" ||
              file.type === "text/markdown"
            ) {
              const fileResponse = await fetch(file.url);
              if (fileResponse.ok) {
                const fileContent = await fileResponse.text();
                userMessageContent.push({
                  type: "text",
                  text: `Content from ${file.name}:\n${fileContent}`,
                });
              } else {
                userMessageContent.push({
                  type: "text",
                  text: `[File attached: ${file.name} - could not fetch content]`,
                });
              }
            } else {
              userMessageContent.push({
                type: "text",
                text: `[File attached: ${file.name}]`,
              });
            }
          } else {
            userMessageContent.push({
              type: "text",
              text: `[File attached: ${file.name || "unknown"}]`,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          userMessageContent.push({
            type: "text",
            text: `[File attached: ${file.name} - could not process content]`,
          });
        }
      }
    }

    if (userMessageContent.length === 0) {
      userMessageContent.push({
        type: "text",
        text: "Please generate a profound, single-sentence quote.",
      });
    }

    messages.push({ role: "user", content: userMessageContent });

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "gpt-5",
          messages,
          max_tokens: 120,
          temperature: 0.9,
          top_p: 0.95,
          presence_penalty: 0.4,
          frequency_penalty: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    const raw = (data?.choices?.[0]?.message?.content || "").trim();
    let generatedQuote = normalizeQuote(raw);

    // Last-resort fallback if the model fails to follow format.
    if (!generatedQuote) {
      generatedQuote = fallbackQuote();
    }

    return new Response(JSON.stringify({ quote: generatedQuote }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-quote function:", error);

    // Still return a quote to satisfy "always respond with the quote".
    const safeFallback = fallbackQuote();
    return new Response(JSON.stringify({ quote: safeFallback }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
