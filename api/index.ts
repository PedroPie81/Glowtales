// GlowTales Secure API Backend Layer
// Version: 1.1.1 (Updated to ensure full local and container cross-environments synchronization)
import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
app.use(express.json({ limit: "15mb" }));

// Custom high-compatibility CORS & Preflight middleware to allow cross-origin requests from Netlify / Vercel static frontends
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  // Set anti-caching headers to secure fresh state fetching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Path-normalization middleware to ensure total compatibility when deployed under serverless environments (like Vercel)
// Vercel may rewrite /api/generate-story to execute api/index.ts with req.url mapped to /generate-story or /api/generate-story.
app.use((req, res, next) => {
  const originalUrl = req.url;
  if (req.url.endsWith("/generate-story")) {
    req.url = "/api/generate-story";
  } else if (req.url.endsWith("/generate-image")) {
    req.url = "/api/generate-image";
  }
  if (originalUrl !== req.url) {
    console.log(`[Path Normalization] Normalized request URL from ${originalUrl} to ${req.url}`);
  }
  next();
});

// Lazy initializer for Google Gen AI with dynamic hot-swapping support for updated keys
let cachedApiKey: string | null = null;
let aiInstance: GoogleGenAI | null = null;
function getGoogleGenAI(): GoogleGenAI {
  const currentKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!aiInstance || cachedApiKey !== currentKey) {
    console.log("Configuring or Refreshing Google Gen AI Client instance:", {
      hasKey: !!currentKey,
      keyLength: currentKey.length,
      prefix: currentKey ? currentKey.substring(0, 5) : "none"
    });
    if (!currentKey || currentKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is unset or set to placeholder. Please configure your key in Settings > Secrets within Google AI Studio.");
    }

    const isAccessToken = currentKey.startsWith("ya29.");
    const sdkOptions: any = {
      apiKey: isAccessToken ? "" : currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    };

    if (isAccessToken) {
      console.log("Configuring with live OAuth access token (ya29.) bypass");
      sdkOptions.httpOptions.baseUrl = "https://generativelanguage.googleapis.com";
      sdkOptions.httpOptions.headers['Authorization'] = `Bearer ${currentKey}`;
    }

    aiInstance = new GoogleGenAI(sdkOptions);
    cachedApiKey = currentKey;
  }
  return aiInstance;
}

// Helper to safely serialize any error object or stream into a searchable string representation
function getCleanErrorString(error: any): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return `${error.message || ""} ${error.stack || ""}`;
  }
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}

// Helper to determine if an error is a non-retryable permission or auth issue
function isAuthOrPermissionError(error: any): boolean {
  const errStr = getCleanErrorString(error).toLowerCase();
  const status = error?.status || error?.statusCode || (error?.response && error?.response?.status);
  return (
    status === 401 || 
    status === 403 || 
    errStr.includes("api key") || 
    errStr.includes("apikey") || 
    errStr.includes("key is missing") ||
    errStr.includes("unauthorized") || 
    errStr.includes("scopes") || 
    errStr.includes("access_token_scope_insufficient") ||
    errStr.includes("permission_denied")
  );
}

// Error formatter for Gemini interactions
function handleGeminiError(error: any, context = "action") {
  console.log(`[Gemini Sync] API Error in ${context}:`, error);
  const errorString = getCleanErrorString(error);
  
  const isPermissionDenied = error?.status === 403 || 
                             error?.statusCode === 403 || 
                             errorString.includes("insufficient authentication scopes") || 
                             errorString.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
                             errorString.includes("PERMISSION_DENIED");
                             
  const isApiKeyMissingOrInvalid = !process.env.GEMINI_API_KEY || 
                                   process.env.GEMINI_API_KEY.trim() === "" ||
                                   process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY";

  if (isPermissionDenied || isApiKeyMissingOrInvalid || isAuthOrPermissionError(error)) {
    const rawMsg = error?.message || errorString || "No specific error text returned.";
    return {
      error: "Your Gemini API Key is missing, unauthorized, or contains insufficient scopes.",
      details: `Raw Details: ${rawMsg}. Please check that your valid GEMINI_API_KEY is active and authorized under Settings > Secrets.`,
      status: 400
    };
  }

  const isRateLimit = error?.status === 429 || 
                      error?.statusCode === 429 || 
                      errorString.includes("429") || 
                      errorString.toLowerCase().includes("rate limit") || 
                      errorString.toLowerCase().includes("quota") ||
                      errorString.toLowerCase().includes("503") ||
                      errorString.toLowerCase().includes("unavailable") ||
                      errorString.toLowerCase().includes("demand");

  if (isRateLimit) {
    return {
      error: "We hit a quiet spot (Service limits reached).",
      details: "The content generation service is currently experiencing high demand. Please try again in a few moments.",
      status: 400
    };
  }

  return {
    error: `We could not complete your ${context} request at this moment.`,
    details: error?.message || errorString,
    status: 505
  };
}

// Retry decorator to absorb 429 / 503 limits dynamically. Keep retries low (max 1) and delay fast to prevent gateway/proxy timeouts (30s limits) on serverless platforms.
async function withRetry<T>(fn: () => Promise<T>, retries = 1, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (isAuthOrPermissionError(error)) {
      console.log("[Gemini Retry Aborted] Non-retryable authentication or authorization error detected.");
      throw error;
    }

    const errorString = getCleanErrorString(error);
    const status = error?.status || error?.statusCode || (error?.response && error?.response?.status);
    
    // If daily free-tier quota is fully exhausted, retrying is futile and slow. Skip retry to fallback instantly.
    const isDailyQuotaExceeded = errorString.toLowerCase().includes("exceeded") && 
                                 (errorString.toLowerCase().includes("quota") || errorString.toLowerCase().includes("limit"));
    
    const isRetryable = (status === 429 || status === 503 || errorString.includes("429") || errorString.includes("503") || errorString.toLowerCase().includes("rate") || errorString.toLowerCase().includes("unavailable") || errorString.toLowerCase().includes("demand")) && !isDailyQuotaExceeded;
    
    if (!isRetryable || retries <= 0) {
      if (isDailyQuotaExceeded) {
        console.log("[Gemini Retry Bypassed] Daily quota limits reached, bypassing retry to trigger instant fallback cascade.");
      }
      throw error;
    }
    const jitter = Math.random() * 400;
    const nextDelay = delay * 2 + jitter;
    console.log(`[Gemini Auto-Retry] Rescheduling call in ${nextDelay.toFixed(0)}ms (Attempts left: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, nextDelay));
    return withRetry(fn, retries - 1, nextDelay);
  }
}


// Debug Env Endpoint
app.get("/api/debug-env", (req, res) => {
  const keys = Object.keys(process.env);
  const debugInfo: Record<string, string> = {};
  for (const k of keys) {
    if (k.includes("API") || k.includes("GEMINI") || k.includes("GOOGLE") || k.includes("PORT") || k.includes("NODE")) {
      const val = process.env[k];
      debugInfo[k] = val ? (val.length <= 8 ? `[len: ${val.length}] ${val}` : `[len: ${val.length}] ${val.slice(0, 4)}...${val.slice(-4)}`) : "undefined";
    }
  }
  res.json({ debugInfo });
});

// Generate Story Endpoint
app.post("/api/generate-story", async (req, res) => {
  try {
    const { 
      name, 
      age, 
      pronouns, 
      specialInterests, 
      triggers, 
      addressTriggers, 
      length, 
      sensoryLevel, 
      structure, 
      perspective,
      customAppearance,
      companionName,
      companionType,
      companionAppearance
    } = req.body;

    if (!name || !specialInterests) {
      return res.status(400).json({ error: "Missing required fields (Child's Name and Special Interests)" });
    }

    const narrativeWordCount = length === "Short" ? "around 250 words" : length === "Long" ? "around 600-750 words" : "around 400-500 words";
    
    // Dynamic number of illustrations: Create 4-6 image prompts/markers for a short story. Short story -> 5 images. Else 4 images.
    const numImages = length === "Short" ? 5 : 4;
    const imageMarkers = Array.from({ length: numImages }, (_, i) => `[IMAGE_${i + 1}]`);
    const imageTagsString = imageMarkers.join(", ");

    const triggerInjunction = triggers && triggers.trim() 
      ? (addressTriggers 
          ? `Gently reference the potential sensory trigger "${triggers}" but render it completely peaceful, safe, organized, and totally in the control of or reassuring to ${name}. There are absolutely no loud sudden surprises, everything is perfectly quiet and tranquil.`
          : `Ensure there is absolutely NO mention of sensory triggers like "${triggers}". Avoid loud noises, bright flashing lights, crowded spaces, or sudden unpredictable shifts. Keep the setting peaceful and calm.`)
      : "Ensure the setting is completely safe, friendly, sensory-friendly, tidy, and predictable.";

    const appearanceClause = customAppearance && customAppearance.trim()
      ? `For characterAppearance, you MUST use exactly this character appearance description: "${customAppearance.trim()}".
You MUST incorporate this exact physical description in each and every element of 'suggestedIllustrations' to guarantee absolute character consistency without any drift.`
      : `Create a hyper-detailed, highly consistent physical appearance description for ${name} (including detailed hairstyle/color, exact clothing description down to stripes, patterns, color shades, such as "a cozy or comfy knitted navy-blue sweater with exactly two horizontal grass-green hoops across the chest, simple beige sensory trousers, short straight ginger hair, and friendly round hazel eyes", pants, footwear, facial features, age) to be returned in 'characterAppearance'. Then, you MUST use this EXACT same description for ${name} in each and every element of 'suggestedIllustrations' to maintain strict character continuity across all drawings. Avoid any physical drift or clothing changes.`;

    const companionClause = companionName && companionName.trim()
      ? `Include a secondary character / companion in the story names "${companionName.trim()}" who is a ${companionType || "friend/sibling/pet/friendly creature"}.${companionAppearance && companionAppearance.trim() ? ` Their exact consistent appearance is: "${companionAppearance.trim()}".` : ""} 
Make sure this companion actively participates in the adventures with ${name} and is featured alongside ${name} consistently in the story text and the described illustrations in 'suggestedIllustrations'. Avoid any physical model drift for ${companionName.trim()} in the drawings.`
      : "";

    const systemInstruction = `You are a gentle, nurturing pediatric psychologist and skilled children's book author specializing in calm, warm stories for neurodivergent (specifically autistic) children.
Your story must adhere to the following neurodivergent-friendly guidelines:
1. **Literal Language**: Write in clear, concrete, and reassuring phrases. Completely avoid abstract metaphors, idioms, sarcasm, or figures of speech which could be confusing or distressing.
2. **Special Interests & Strengths**: Naturally weave the focus interests (${specialInterests}) into the core narrative as a point of discovery, happiness, and order. Let the main character's affinity for these interests be celebrated as an incredible superpower (e.g., rich attention to detail, hyperfocus, pattern recognition, or deep technical knowledge).
3. **Safe & Predictable**: Write with steady, calm pacing. Provide reassurance that things are safe. Give comforting repetition if matching high repetition style. Guarantee a gentle, happy, and fully reassuring resolution with zero cliffhangers or shock events.
4. **Markdown Formatting**: Output paragraphs in clean Markdown.
5. **Image Markers**: In your content, insert EXACTLY ${numImages} markers: ${imageTagsString} on their own separate lines between logical story paragraphs. Do not clump them together. Spread them out evenly across the text. Make sure they are uppercase and on their own separate lines. e.g.
Paragraph 1

[IMAGE_1]

Paragraph 2

6. **Strict Pattern & Object Continuation in Illustration Descriptions**:
- Generate exactly ${numImages} illustration descriptions in 'suggestedIllustrations' representing sequentially progressing scenes from the story (e.g. Image 1 is introduction, Image 2 is action, Image 3 is details, etc.). Every single description MUST be highly distinct, descriptive, and filled with peaceful environmental details. They must NEVER be duplicate, near-duplicate, or generic.
- For each scene, specify what other characters or objects are present, where they are standing/sitting, and what background objects exist. Describe the exact structural continuation: "stands next to the same dark wooden bench near the exact same clean railroad tracks with the station sign in the top left".
- Maintain total continuation: Keep every detail in perfect, sequential alignment. Ensure the child wears the exact same clothing (e.g., 'the exact same navy knitted sweater with two grass-green hoops across the chest', 'the exact same beige sensory trousers') in every single illustration description. If a train has carriages, explicitly state its exact design (e.g., 'a shiny sky-blue steam engine with pristine brass steam valves, exactly six solid bright red wheels, and two dark green passenger carriages attached behind it') in every single scene description. Never let colors, counts, or styles fluctuate randomly, as autistic kids deeply notice!`;

    const prompt = `Write a personalized children's story for a child named ${name} who is ${age || "unknown"} years old, and uses pronouns "${pronouns || "they/them"}".
Their special interest is: "${specialInterests}".
Triggers/Sensory preferences to respect: "${triggers || "none"}".
Action on triggers: ${triggerInjunction}
${companionClause ? `Companion info: ${companionClause}` : ""}
Requested format details:
- **Story Length**: ${length || "Medium"} (~${narrativeWordCount})
-- **Pacing & Sensory Level**: ${sensoryLevel || "Low sensory, reassuring and repetitive"}
- **Story Structure / Mood**: ${structure || "Calming bedtime story"}
- **Narrative Perspective**: ${perspective || "Third-person"}

Appearance requirement:
${appearanceClause}

Every single image description inside 'suggestedIllustrations' MUST start exactly with:
"Soft pastel children's book illustration, calm style, clear lines, non-overwhelming: [detailed consistent character description]." followed by the specific scene elements. Ensure [detailed consistent character description] matches 'characterAppearance' exactly!

Your response must be JSON matching the schema, with the title, the content including the ${numImages} image markers ([IMAGE_1] to [IMAGE_${numImages}]) on separate lines, a description of the consistent physical appearance of ${name} (for characterAppearance), a description of the key focus objects (for objectAppearance), exactly ${numImages} distinct illustration descriptions in suggestedIllustrations matching the [IMAGE_1] to [IMAGE_${numImages}] points, and the keyFeatures tags.`;

    const config = {
      systemInstruction,
      responseMimeType: "application/json" as const,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { 
            type: Type.STRING, 
            description: `The complete markdown formatted text of the story. You MUST insert exactly ${numImages} tags: ${imageTagsString} on their own lines between paragraphs spread evenly.` 
          },
          characterAppearance: { type: Type.STRING, description: "Consistent character appearance description (e.g. 'A small 7-year-old boy named Leo, wearing bright red overalls and a soft yellow cap, with copper hair and wide blue eyes')." },
          objectAppearance: { type: Type.STRING, description: "Consistent main object appearance (e.g. 'A shiny sky-blue steam engine with pristine brass steam valves and exactly six bright red wheels')." },
          suggestedIllustrations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: `Must contain exactly ${numImages} descriptions for images corresponding to each image spot [IMAGE_1] to [IMAGE_${numImages}] in order. Do not skip any spots.`
          },
          keyFeatures: {
            type: Type.OBJECT,
            properties: {
              specialInterestUsed: { type: Type.STRING },
              strengthsCelebrated: { type: Type.STRING },
              sensoryLevel: { type: Type.STRING }
            },
            required: ["specialInterestUsed", "strengthsCelebrated", "sensoryLevel"]
          }
        },
        required: ["title", "content", "characterAppearance", "objectAppearance", "suggestedIllustrations", "keyFeatures"]
      }
    };

    let response;
    let selectedModel = "gemini-3.5-flash";
    try {
      console.log("Attempting story generation with highly responsive primary model: gemini-3.5-flash");
      // Call primary model gemini-3.5-flash with retry for fast, stable structured JSON content
      response = await withRetry(() => getGoogleGenAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config
      }));
    } catch (err: any) {
      if (isAuthOrPermissionError(err)) {
        console.log("[Gemini Fallback System] Directly aborting fallback stream due to authorization configuration mismatch.", err);
        throw err;
      }

      console.log("[Quota Fallback Info] Primary gemini-3.5-flash reached limit. Handled gracefully; falling back to gemini-3.1-flash-lite...");
      try {
        selectedModel = "gemini-3.1-flash-lite";
        response = await withRetry(() => getGoogleGenAI().models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config
        }));
      } catch (err2: any) {
        if (isAuthOrPermissionError(err2)) throw err2;
        console.log("[Quota Fallback Info] Secondary gemini-3.1-flash-lite reached limit. Handled gracefully; falling back to gemini-2.5-flash...");
        try {
          selectedModel = "gemini-2.5-flash";
          response = await withRetry(() => getGoogleGenAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config
          }));
        } catch (err3: any) {
          if (isAuthOrPermissionError(err3)) throw err3;
          console.log("[Quota Fallback Info] Tertiary gemini-2.5-flash reached limit. Handled gracefully; falling back to gemini-flash-latest...");
          try {
            selectedModel = "gemini-flash-latest";
            response = await withRetry(() => getGoogleGenAI().models.generateContent({
              model: "gemini-flash-latest",
              contents: prompt,
              config
            }));
          } catch (err4: any) {
            console.log("[Gemini Fatal] All narrative models (gemini-3.5-flash, gemini-3.1-flash-lite, gemini-2.5-flash, gemini-flash-latest) failed.", err4);
            throw err4;
          }
        }
      }
    }

    console.log(`Story successfully generated using model: ${selectedModel}`);

    if (!response.text) {
      throw new Error("No response text returned from Gemini API.");
    }

    const storyData = JSON.parse(response.text.trim());

    // Programmatically enforce strict prefix formatting & absolute character consistency as requested
    if (customAppearance && customAppearance.trim()) {
      storyData.characterAppearance = customAppearance.trim();
    }

    const basePrefix = `Soft pastel children's book illustration, calm style, clear lines, non-overwhelming: ${storyData.characterAppearance}.`;

    if (Array.isArray(storyData.suggestedIllustrations)) {
      storyData.suggestedIllustrations = storyData.suggestedIllustrations.map((promptText: string) => {
        let cleanText = promptText;
        // Strip any existing "Soft pastel..." format markers the model might have output to avoid duplication
        const prefixMarkers = [
          "Soft pastel children's book illustration, calm style, clear lines, non-overwhelming:",
          "Soft pastel children's book illustration, calm style, clear lines, non-overwhelming"
        ];
        for (const marker of prefixMarkers) {
          if (cleanText.toLowerCase().includes(marker.toLowerCase())) {
            const idx = cleanText.toLowerCase().indexOf(marker.toLowerCase()) + marker.length;
            cleanText = cleanText.substring(idx);
          }
        }
        // Slice off any leading punctuation
        cleanText = cleanText.replace(/^[:\s,.]+/g, "").trim();
        
        return `${basePrefix} ${cleanText}`;
      });
    }

    return res.json(storyData);

  } catch (error: any) {
    const errorDetails = handleGeminiError(error, "story generation");
    res.status(errorDetails.status).json({
      error: errorDetails.error,
      details: errorDetails.details
    });
  }
});

// Generate Image Endpoint
app.post("/api/generate-image", async (req, res) => {
  try {
    const { illustrationDescription, characterAppearance, objectAppearance, referencePhoto } = req.body;

    if (!illustrationDescription) {
      return res.status(400).json({ error: "Missing required parameter 'illustrationDescription'" });
    }

    // Since the backend already pre-formatted illustrationDescription to start exactly with the user's requested prefix, 
    // we use it. If not, we construct it perfectly.
    let fullImagePrompt = "";
    if (illustrationDescription.startsWith("Soft pastel children's book illustration, calm style, clear lines, non-overwhelming:")) {
      fullImagePrompt = `${illustrationDescription} ${objectAppearance ? `Main object: ${objectAppearance}.` : ''}`;
    } else {
      const characterDesc = characterAppearance || "A gentle child";
      fullImagePrompt = `Soft pastel children's book illustration, calm style, clear lines, non-overwhelming: ${characterDesc}. ${illustrationDescription}. ${objectAppearance ? `Main object: ${objectAppearance}.` : ''}`;
    }

    // Convert reference base64 photo to a Gemini parts object if available
    let refImagePart: any = null;
    if (referencePhoto && referencePhoto.includes("base64,")) {
      try {
        const parts = referencePhoto.split("base64,");
        const mimeType = parts[0].replace("data:", "").split(";")[0];
        const base64Data = parts[1];
        refImagePart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };
        // Add instruction guiding the character style from reference image
        fullImagePrompt = `In this illustration, capture the child's exact physical likeness (hair color/style, age, facial features) from the attached reference photo block, rendering them softly in: ${fullImagePrompt}`;
      } catch (err) {
        console.warn("Failed to parse reference photo base64 bytes:", err);
      }
    }

    // Negative style enhancement to reinforce extreme consistency and simplicity for autistic comfort
    fullImagePrompt += " Ensure there is zero clutter, zero sudden flashes or abstract graphics, and maximum detail continuity with matching backgrounds and clothes.";

    console.log("Generating illustration with prompt length:", fullImagePrompt.length);

    const partsPayload: any[] = [];
    if (refImagePart) {
      partsPayload.push(refImagePart);
    }
    partsPayload.push({ text: fullImagePrompt });

    // Helper for offline generic beautiful canvas SVGs when all APIs fail
    const generateOfflineFallbackSvg = (desc: string, char: string, obj: string) => {
      const seedText = desc + char + obj;
      const paletteBackgrounds = ["#F1F5F9", "#FFFBEB", "#FDF2F8", "#F0FDF4", "#EFF6FF", "#FAF5FF"];
      const bgIdx = Math.abs(seedText.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % paletteBackgrounds.length;
      const bgColor = paletteBackgrounds[bgIdx];

      // Format caption
      const cleanDesc = desc.replace("Soft pastel children's book illustration, calm style, clear lines, non-overwhelming:", "").trim();
      const croppedDesc = cleanDesc.length > 150 ? cleanDesc.substring(0, 147) + "..." : cleanDesc;

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" style="background-color:${bgColor}; font-family: 'Inter', system-ui, sans-serif;">
        <rect x="25" y="25" width="750" height="400" rx="32" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="8"/>
        <circle cx="120" cy="110" r="140" fill="rgba(255,255,255,0.4)"/>
        <circle cx="120" cy="110" r="100" fill="rgba(255,255,255,0.6)"/>
        <path d="M-100 450 Q 150 250, 400 450 Z" fill="rgba(255, 255, 255, 0.45)"/>
        <path d="M250 450 Q 550 220, 850 450 Z" fill="rgba(255, 255, 255, 0.5)"/>
        <path d="M100 450 Q 400 320, 700 450 Z" fill="rgba(255, 255, 255, 0.6)"/>
        <circle cx="340" cy="80" r="6" fill="#FBBF24" opacity="0.6"/>
        <circle cx="580" cy="140" r="4" fill="#FBBF24" opacity="0.5"/>
        <circle cx="230" cy="190" r="3" fill="#3B82F6" opacity="0.4"/>
        <circle cx="710" cy="110" r="5" fill="#3B82F6" opacity="0.4"/>
        <g transform="translate(400, 200)">
          <path d="M -90,-20 Q -60,-80 0,-40 Q 60,-80 90,-20 Q 130,10 90,50 Q 40,80 0,60 Q -45,80 -90,40 Q -130,15 -90,-20 Z" fill="white" opacity="0.8"/>
          <g transform="scale(0.8) translate(-10, -5)">
            <path d="M -60,20 L 60,20 L 70,35 L -50,35 Z" fill="#475569" opacity="0.75"/>
            <path d="M -60,5 L 60,5 L 60,20 L -60,20 Z" fill="#3B82F6" opacity="0.8"/>
            <path d="M -50,11 L 50,11" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
            <path d="M 0,-30 C -10,-45 -25,-30 0,0 C 25,-30 10,-45 0,-30 Z" fill="#F59E0B" opacity="0.9" transform="scale(0.8)"/>
          </g>
        </g>
        <g transform="translate(100, 310)">
          <rect x="0" y="0" width="600" height="90" rx="20" fill="white" opacity="0.95" />
          <rect x="0" y="0" width="600" height="90" rx="20" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1.5" />
          <text x="300" y="38" text-anchor="middle" fill="#0F172A" font-size="14" font-weight="600" letter-spacing="-0.01em">Cozy Story Illustration</text>
          <text x="300" y="62" text-anchor="middle" fill="#64748B" font-size="11.5" font-weight="400" letter-spacing="0.01em">${croppedDesc}</text>
        </g>
      </svg>`;
    };

    let apiResponse;
    let selectedImageModel = "gemini-2.5-flash-image";
    let base64ImageBytes = "";

    try {
      apiResponse = await withRetry(() => getGoogleGenAI().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: partsPayload,
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      }));

      const candidates = apiResponse.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            base64ImageBytes = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64ImageBytes) {
        throw new Error("Gemini image model did not return inline image bytes.");
      }

      console.log(`Illustration successfully generated using model: ${selectedImageModel}`);
      return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

    } catch (imageErr: any) {
      console.log("[Image Quota Info] gemini-2.5-flash-image hit a quiet spot. Trying secondary model gemini-3.1-flash-image as dynamic fallback...");
      
      try {
        selectedImageModel = "gemini-3.1-flash-image";
        apiResponse = await withRetry(() => getGoogleGenAI().models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: partsPayload,
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        }));

        const candidates = apiResponse.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
              base64ImageBytes = part.inlineData.data;
              break;
            }
          }
        }

        if (!base64ImageBytes) {
          throw new Error("Gemini image model did not return inline image bytes.");
        }

        console.log(`Illustration successfully generated using model: ${selectedImageModel}`);
        return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

      } catch (imageErr2: any) {
        console.log("[Image Quota Info] Both Imagen models returned resource limits or are unlicensed. Invoking Intelligent SVG Drawing Fallback via Gemini Text Engine...");
        
        try {
          // Fall back to generating highly customized raw SVG tags using the perfectly working gemini-2.5-flash text model!
          const fallbackModel = "gemini-2.5-flash";
          const svgPrompt = `You are a professional children's book vector illustrator. Since the specialized image model has hit temporary service limits, we need you to design a high-quality, soothing, and beautifully aligned children's book illustration in standard SVG format.

The illustration is for a sensitive, autistic child. It must have:
1. Soothing, gentle pastel background color (e.g., soft lavender, sky blue, sage, peach, mint, pale gold).
2. Clean, safe, modern minimalist vector styles. No aggressive, jagged, or chaotic shapes. Keep it simple, neat, structured and highly comforting.
3. Incorporate the core components described here:
   - Setting/Scene outline: "${illustrationDescription}"
   - Main Character appearance to depict: "${characterAppearance || "A gentle child"}"
   - Major Object / Toy / Interest to depict: "${objectAppearance || "Sensory interest/toy"}"

Return ONLY a single valid raw <svg> string. Ensure the SVG has viewBox="0 0 800 450" (16:9 ratio) and is fully self-contained, valid XML with beautiful stylized shapes, paths, lines, or circles depicting a lovely abstract or structured representation of the scene.
Make sure you preserve visual continuity of colors (e.g. if the character's clothing says "navy blue sweater with grass green hoops", use matching blues and greens!).
Do NOT output any markdown (no \`\`\`xml or \`\`\`svg wrappers). Start your response exactly with "<svg" and close with "</svg>".`;

          const fallbackResponse = await withRetry(() => getGoogleGenAI().models.generateContent({
            model: fallbackModel,
            contents: svgPrompt,
          }));

          let svgContent = fallbackResponse.text || "";
          svgContent = svgContent.replace(/```[a-z]*\s*/gi, "").replace(/```\s*$/g, "").trim();
          
          const startIndex = svgContent.indexOf("<svg");
          const endIndex = svgContent.lastIndexOf("</svg>");
          if (startIndex !== -1 && endIndex !== -1) {
            svgContent = svgContent.substring(startIndex, endIndex + 6);
          }

          if (svgContent.startsWith("<svg") && svgContent.includes("</svg>")) {
            console.log("Vector fallback SVG generated successfully by Gemini text engine!");
            const base64Bytes = Buffer.from(svgContent).toString("base64");
            return res.json({ 
              imageUrl: `data:image/svg+xml;base64,${base64Bytes}`,
              isVectorFallback: true 
            });
          } else {
            throw new Error("Invalid XML/SVG content returned from fallback model");
          }
        } catch (svgFallbackErr: any) {
          console.log("[Image Fallback Info] Vector fallback SVG generation failed, invoking offline generic SVG generator.", svgFallbackErr?.message || svgFallbackErr);
          const offlineSvg = generateOfflineFallbackSvg(illustrationDescription, characterAppearance || "", objectAppearance || "");
          const base64Bytes = Buffer.from(offlineSvg).toString("base64");
          return res.json({ 
            imageUrl: `data:image/svg+xml;base64,${base64Bytes}`,
            isVectorFallback: true,
            isOfflineFallback: true
          });
        }
      }
    }

  } catch (error: any) {
    const errorDetails = handleGeminiError(error, "illustration generation");
    res.status(errorDetails.status).json({
      error: errorDetails.error,
      details: errorDetails.details
    });
  }
});

export const config = {
  maxDuration: 60,
};

export default app;
