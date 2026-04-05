

## Performance Optimization Plan

The main source of sluggishness is the **two-step image generation pipeline** (prompt engineering call → image generation call), which runs sequentially and can take 15-30+ seconds total. Quote generation is a single call and should be reasonably fast already.

Since we can't make the AI models respond faster, the biggest win is **perceived performance** — showing users what's happening during the wait — plus a few backend tweaks to reduce unnecessary overhead.

### Changes

**1. Add progress steps to ImageGenerator UI**
Show a multi-step progress indicator during generation: "Crafting prompt..." → "Generating image..." so users know the app isn't stuck. The edge function already returns `generatedPrompt`, so we can split this into two sequential `fetch` calls on the frontend, or simpler: just show an animated stepper with timed transitions.

**2. Use a lighter model for prompt engineering (backend)**
Switch the prompt-engineering step from `google/gemini-3-flash-preview` to `google/gemini-2.5-flash-lite` — it's the fastest model and prompt crafting doesn't need heavy reasoning. This shaves seconds off Step 1.

**3. Trim the system prompt in generate-image**
The prompt engineering system message is ~1200 characters. Condensing it reduces input tokens and speeds up the response.

**4. Skip base64 conversion for text-only requests**
When no images are attached, skip the file-processing loop entirely (already does this, but we can also avoid sending empty arrays).

**5. Add skeleton/shimmer loading states**
Replace the simple spinner with a shimmer placeholder in the image result area so the layout doesn't jump when the image arrives.

### Technical Details

- **ImageGenerator.tsx**: Add a `loadingStep` state (`'prompt' | 'image' | null`) and display step text below the spinner. Use `setTimeout` to transition from "Crafting prompt..." to "Generating image..." after ~5 seconds (approximate Step 1 duration), or split into two separate edge function calls for accurate progress.
- **generate-image/index.ts**: Change line `model: 'google/gemini-3-flash-preview'` to `model: 'google/gemini-2.5-flash-lite'` for the prompt step. Condense the system prompt.
- **QuoteGenerator.tsx**: Add a similar subtle progress message ("Reflecting on your words...") for perceived speed.

