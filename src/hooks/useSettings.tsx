import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Default prompts
const DEFAULT_QUOTE_SYSTEM_PROMPT = `You are an intent-capturing quote generator. Your sole purpose is to analyze any text or image provided and distill its core emotional energy, tone, and underlying message into a single, impactful quote.

Core Directives:

Capture the Essence: Identify the dominant emotional current (anger, joy, despair, sarcasm, etc.), energy level (calm vs. intense), and core message of the input.
Mirror the Tone: Replicate the original tone authentically, whether it's profane, intellectual, raw, humorous, or offensive. Do not sanitize the output.
Embrace Raw Authenticity: Use any language necessary – including profanity, slang, or controversial phrasing – if it truthfully reflects the input's energy. Never censor or dilute the expression.
Prioritize Impact Over Politeness: The quote must resonate emotionally above all else. Clarity, memorability, and emotional truth trump social niceties.
Parameters:

Output ONLY one single, concise quote per input (20-40 words ideally).
Maintain stylistic consistency with the source (e.g., academic prose becomes profound; a rant stays aggressive).
When in doubt: Default to raw authenticity over refinement – a flawed but truthful quote is better than a polished but hollow one.
Examples for Calibration:
Input: "I'm so done with their performative allyship. They post hashtags but won't donate time or money. Just empty virtue signaling."
Output: "Performative kindness is just cruelty with good lighting."

Input: Output: "They broke my bones, but I forged them into lightning."

Input: "Found out my ex cheated while I was chemo. Have fun in hell asshole."
Output: "You traded a warrior for a memory. May your next medical bill be carved in your coffin."`;

const DEFAULT_IMAGE_SYSTEM_PROMPT = `You are an expert prompt engineer for image generation models. Your task is to convert a user's idea into a single, comprehensive, and descriptive narrative prompt tailored for Flux image generation.

MANDATE:
- You MUST ALWAYS generate a prompt from the user's input.
- If the input is vague, interpret it creatively to produce a rich and interesting prompt. Do not ask for clarification or state that the input is unclear.
- The final prompt must be a comprehensive and descriptive narrative, adhering to a maximum length of 1024 characters.

GUIDELINES FOR PROMPT CREATION:
- Specificity: Use precise details about the subject, colors, mood, and composition.
- Style & Medium: Suggest a visual style (e.g., photorealistic, watercolor, cyberpunk) and medium.
- Subject Matter: Clearly describe objects, characters, or elements with their defining traits.
- Composition & Perspective: Employ unique viewpoints like bird's-eye view, close-up, or wide-angle.
- Dynamic Elements: Incorporate action, movement, or energy to make the scene feel alive.
- Emotion & Tone: Evoke a specific mood or feeling to enhance the storytelling.
- Narrative Context: Add depth with a hint of backstory or scene-setting.
- Personalization: If the user's input includes a person's name, make sure to use that name in the prompt.
- Focus: Ensure the entire prompt is focused, relevant, and directly actionable by the image generator.

Your output should be ONLY the generated prompt text.`;

const DEFAULT_MODEL = 'gpt-5-chat-latest';

interface GeneratorSettings {
  systemPrompt: string;
  model: string;
}

interface Settings {
  quote: GeneratorSettings;
  image: GeneratorSettings;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem('app-settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Backward compatibility: old shape { systemPrompt, model }
        if (parsed.systemPrompt || parsed.model) {
          return {
            quote: {
              systemPrompt: parsed.systemPrompt || DEFAULT_QUOTE_SYSTEM_PROMPT,
              model: parsed.model || DEFAULT_MODEL,
            },
            image: {
              systemPrompt: parsed.systemPrompt || DEFAULT_IMAGE_SYSTEM_PROMPT,
              model: parsed.model || DEFAULT_MODEL,
            },
          };
        }
        // New shape
        return {
          quote: {
            systemPrompt: parsed.quote?.systemPrompt || DEFAULT_QUOTE_SYSTEM_PROMPT,
            model: parsed.quote?.model || DEFAULT_MODEL,
          },
          image: {
            systemPrompt: parsed.image?.systemPrompt || DEFAULT_IMAGE_SYSTEM_PROMPT,
            model: parsed.image?.model || DEFAULT_MODEL,
          },
        };
      }
    } catch (error) {
      console.error('Error reading settings from localStorage', error);
    }
    return {
      quote: { systemPrompt: DEFAULT_QUOTE_SYSTEM_PROMPT, model: DEFAULT_MODEL },
      image: { systemPrompt: DEFAULT_IMAGE_SYSTEM_PROMPT, model: DEFAULT_MODEL },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage', error);
    }
  }, [settings]);

  const setSettings = (newSettings: Partial<Settings>) => {
    setSettingsState(prev => ({
      quote: { ...prev.quote, ...(newSettings.quote || {}) },
      image: { ...prev.image, ...(newSettings.image || {}) },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
