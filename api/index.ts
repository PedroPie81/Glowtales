// GlowTales Warm Storytelling API Backend Layer
import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
app.use(express.json({ limit: "15mb" }));

// Custom high-compatibility CORS & Preflight middleware to allow cross-origin requests
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

// Path-normalization middleware to ensure total compatibility when deployed under serverless environments
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

// Lazy initializer for Google Gen AI with dynamic hot-swapping and request-header auth support
const aiClientsCache = new Map<string, GoogleGenAI>();

function getGoogleGenAI(req?: express.Request): GoogleGenAI {
  let reqKey = "";
  if (req) {
    // 1. Check incoming HTTP headers for dynamic auth injection from the platform or proxy
    const authHeader = req.headers.authorization || req.headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
      reqKey = authHeader.replace(/^Bearer\s+/i, "").trim();
    }
    if (!reqKey) {
      const xGoogKey = req.headers["x-goog-api-key"] || req.headers["x-api-key"] || req.headers["X-Goog-Api-Key"] || req.headers["X-Api-Key"];
      if (xGoogKey && typeof xGoogKey === "string") {
        reqKey = xGoogKey.trim();
      }
    }
    if (!reqKey) {
      const queryKey = req.query.apiKey || req.query.apikey || req.query.token || req.query.key || req.query["api-key"] || req.query["api_key"];
      if (queryKey && typeof queryKey === "string") {
        reqKey = queryKey.trim();
      }
    }
  }

  // Fall back to process.env.GEMINI_API_KEY or process.env.VITE_GEMINI_API_KEY
  const currentKey = (reqKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();

  // Log clean diagnostics without exposing full credentials
  console.log("[getGoogleGenAI Dialect] Resolving credentials:", {
    source: reqKey ? (reqKey.startsWith("ya29.") ? "HTTP Authorization Header (OAuth Token)" : "HTTP Request Headers (API Key)") : "statically defined environment variables",
    hasKey: !!currentKey,
    keyLength: currentKey.length,
    prefix: currentKey ? currentKey.substring(0, 5) : "none"
  });

  const isPlaceholder = (key: string) => {
    const lowerKey = key.toLowerCase();
    return (
      lowerKey === "my_gemini_api_key" ||
      lowerKey === "placeholder" ||
      lowerKey === "your_api_key" ||
      lowerKey === "your_gemini_api_key" ||
      lowerKey === ""
    );
  };

  if (!currentKey || isPlaceholder(currentKey)) {
    throw new Error("GEMINI_API_KEY is unset or set to placeholder. Please configure your key in Settings > Secrets within Google AI Studio.");
  }

  let client = aiClientsCache.get(currentKey);
  if (!client) {
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
      console.log("Configuring Gemini with live OAuth token (ya29.) session bypass");
      sdkOptions.httpOptions.baseUrl = "https://generativelanguage.googleapis.com";
      sdkOptions.httpOptions.headers['Authorization'] = `Bearer ${currentKey}`;
    }

    client = new GoogleGenAI(sdkOptions);
    aiClientsCache.set(currentKey, client);
  }
  return client;
}

// Helper to safely serialize any error object into a clean string representation
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

// Error formatter for Gemini interactions with request context to prevent false api-key-missing alarms
function handleGeminiError(error: any, context = "action", req?: express.Request) {
  console.log(`[Gemini Sync] API Error in ${context}:`, error);
  const errorString = getCleanErrorString(error);
  
  const isPermissionDenied = error?.status === 403 || 
                             error?.statusCode === 403 || 
                             errorString.includes("insufficient authentication scopes") || 
                             errorString.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
                             errorString.includes("PERMISSION_DENIED");
                             
  let resolvedKey = "";
  if (req) {
    const authHeader = req.headers.authorization || req.headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
      resolvedKey = authHeader.replace(/^Bearer\s+/i, "").trim();
    }
    if (!resolvedKey) {
      const xGoogKey = req.headers["x-goog-api-key"] || req.headers["x-api-key"] || req.headers["X-Goog-Api-Key"] || req.headers["X-Api-Key"];
      if (xGoogKey && typeof xGoogKey === "string") {
        resolvedKey = xGoogKey.trim();
      }
    }
  }
  const activeKey = resolvedKey || (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
  
  const isPlaceholderKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return (
      lowerKey === "my_gemini_api_key" ||
      lowerKey === "placeholder" ||
      lowerKey === "your_api_key" ||
      lowerKey === "your_gemini_api_key" ||
      lowerKey === ""
    );
  };

  const isApiKeyMissingOrInvalid = !activeKey || isPlaceholderKey(activeKey);

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

// Retry decorator to absorb transient 429 / 503 limits dynamically
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
    const isDailyQuotaExceeded = errorString.toLowerCase().includes("exceeded") && 
                                 (errorString.toLowerCase().includes("quota") || errorString.toLowerCase().includes("limit"));
    
    const isRetryable = (status === 429 || status === 503 || errorString.includes("429") || errorString.includes("503") || errorString.toLowerCase().includes("rate") || errorString.toLowerCase().includes("unavailable") || errorString.toLowerCase().includes("demand")) && !isDailyQuotaExceeded;
    
    if (!isRetryable || retries <= 0) {
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
    if (k.includes("API") || k.includes("GEMINI") || k.includes("PORT") || k.includes("NODE")) {
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

    const approxWordCount = length === "Short" ? "200-300 words" : length === "Long" ? "600-800 words" : "400-500 words";
    
    const triggerInjunction = triggers && triggers.trim() 
      ? (addressTriggers 
          ? `Gently reference the potential sensory trigger "${triggers}" but render it completely peaceful, safe, organized, quiet, and totally in the control of or reassuring to ${name}. Keep everything quiet and peaceful.`
          : `Ensure there is absolutely NO mention or occurrence of sensory triggers like "${triggers}". Avoid loud noises, bright flashing lights, crowded spaces, or sudden unpredictable changes. Setting must remain steady and predictable.`)
      : "Ensure the setting is completely safe, friendly, low-sensory, clean, and highly structured.";

    const appearanceClause = customAppearance && customAppearance.trim()
      ? `Their appearance description is: "${customAppearance.trim()}". Weave their appearance into the coverIllustrationPrompt description.`
      : `Create a comforting consistent description under characterAppearance (e.g., "a cheerful 8-year-old child wearing a cozy knitted soft yellow sweater, comfortable navy sensory-trousers, and friendly brown hair").`;

    const companionClause = companionName && companionName.trim()
      ? `Include a calm companion character named "${companionName.trim()}" who is a ${companionType || "friend"}.${companionAppearance && companionAppearance.trim() ? ` Description: "${companionAppearance.trim()}".` : ""} They support ${name} warmly.`
      : "";

    const systemInstruction = `You are a warm, nurturing children's storytelling specialist and pediatric psychologist crafting low-stimulus, comforting personalized stories for neurodivergent (specifically autistic or sensory-sensitive) kids.
Your writing style must follow these neurodivergent-friendly pillars:
1. **Literal Language**: Write using clear, reassuring, concrete nouns. Avoid abstract metaphors, confusing figures of speech, idioms, or loud surprises.
2. **Special Interests as Superpowers**: Weave ${name}'s passionate interest in "${specialInterests}" into the center of the story in a detailed, organized, and celebrated way. Autistic traits like intense focus, pattern-seeking, or systematic knowledge should be presented as wonderful strengths.
3. **Structured & Calming**: Maintain slow, predictable pacing, offering reassuring statements that things are okay. Ensure a joyful, highly ordered, safe, and logical conclusion with zero sudden cliffhangers or scary surprises.
4. **Divided pages**: You MUST structure the complete narrative divided into exactly 3 to 5 pages. Separate each page with a single line containing exactly:
---
This allows our warm book reader to let the child easily flip through pages sequentially without cognitive overload. Do not put '---' at the very beginning or end of the text.
5. **No inline images**: Do NOT insert any image markers or illustrations inside the story chapters. This storybook has ONLY ONE single beautiful front cover image to prevent continuity issues.
6. **Book Cover Description**: Draft a beautiful, highly detailed, serene cover image prompt focusing on ${name} and their special interest in ${specialInterests} in a soft, cozy, comforting setting.`;

    const prompt = `Write a comforting personalized story for ${name}, who is ${age || "unknown"} years old, uses pronouns "${pronouns || "they/them"}".
Their special interest is: "${specialInterests}".
Sensory comfort & trigger guideline: "${triggers || "none"}".
Guideline processing: ${triggerInjunction}
${companionClause}

Requested Story Parameters:
- **Story Length**: ${length || "Medium"} (~${approxWordCount})
- **Sensory Level / Pacing**: ${sensoryLevel || "Standard low-sensory"}
- **Mood / Book Structure**: ${structure || "Calming bedtime story"}
- **Narrative Perspective**: ${perspective || "Third-person"}
${appearanceClause}

Please structure your JSON response with:
1. "title": a cozy, peaceful title (e.g. "Liam's Cozy Railway Adventure")
2. "content": the complete story text, split into 3-5 pages separated by a line with exactly '---'. Keep each page's text beautiful and calming.
3. "characterAppearance": a consistent, comforting description of the child's cozy physical appearance.
4. "coverIllustrationPrompt": a highly descriptive portrait book-cover drawing prompt suitable for text-to-image. It MUST start precisely with: "Warm soft pastel children's book cover illustration, cozy background, clean borders, comforting style: [detailed scene depicting ${name} enjoying ${specialInterests} in a snug, eye-friendly setting]"
5. "keyFeatures": of the story, containing "specialInterestUsed", "strengthsCelebrated", and "sensoryLevel".`;

    const config = {
      systemInstruction,
      responseMimeType: "application/json" as const,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { 
            type: Type.STRING, 
            description: "The complete storybook markdown text. Ensure you partition pages/chapters by a single line with exactly '---' (with 3-5 pages total)." 
          },
          characterAppearance: { type: Type.STRING },
          coverIllustrationPrompt: { type: Type.STRING },
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
        required: ["title", "content", "characterAppearance", "coverIllustrationPrompt", "keyFeatures"]
      }
    };

    let response;
    let selectedModel = "gemini-3.5-flash";
    try {
      console.log("Generating cozy story text with primary model: gemini-3.5-flash");
      response = await withRetry(() => getGoogleGenAI(req).models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config
      }));
    } catch (err: any) {
      if (isAuthOrPermissionError(err)) throw err;
      console.log("[Quota Fallback] falling back to gemini-3.1-flash-lite...");
      try {
        selectedModel = "gemini-3.1-flash-lite";
        response = await withRetry(() => getGoogleGenAI(req).models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config
        }));
      } catch (err2: any) {
        if (isAuthOrPermissionError(err2)) throw err2;
        console.log("[Quota Fallback] falling back to gemini-2.5-flash...");
        try {
          selectedModel = "gemini-2.5-flash";
          response = await withRetry(() => getGoogleGenAI(req).models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config
          }));
        } catch (err3: any) {
          throw err3;
        }
      }
    }

    if (!response.text) {
      throw new Error("No response text returned from Gemini API.");
    }

    const storyData = JSON.parse(response.text.trim());
    console.log(`Cozy story text successfully generated using model: ${selectedModel}`);
    return res.json(storyData);

  } catch (error: any) {
    const errorDetails = handleGeminiError(error, "story generation", req);
    res.status(errorDetails.status).json({
      error: errorDetails.error,
      details: errorDetails.details
    });
  }
});

// Generate Book Cover Image Endpoint (Generated dynamically once per storybook)
app.post("/api/generate-image", async (req, res) => {
  try {
    const { coverIllustrationPrompt, referencePhoto, characterAppearance } = req.body;

    if (!coverIllustrationPrompt) {
      return res.status(400).json({ error: "Missing cover illustration prompt parameter" });
    }

    let finalPrompt = coverIllustrationPrompt;
    
    // Add custom reference image guidance if uploaded by user
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
        finalPrompt = `In this illustration, capture the child's exact physical likeness (hair style/color, facial features) from the attached reference photo block, rendering them softly in: ${coverIllustrationPrompt}`;
      } catch (err) {
        console.warn("Failed to parse reference photo base64 bytes:", err);
      }
    }

    // Append styling rules to enforce calm cozy aesthetics
    finalPrompt += ", children's storybook style, soft warm colors, high-contrast clean borders, calming, serene setting, eye-friendly, beautiful illustration, ultra-clear lighting. Ensure there is absolutely zero noise, zero bright fluorescent sparks, and zero overwhelming abstract clutter.";

    console.log("Generating book cover illustration with prompt length:", finalPrompt.length);

    const partsPayload: any[] = [];
    if (refImagePart) {
      partsPayload.push(refImagePart);
    }
    partsPayload.push({ text: finalPrompt });

    // Vector SVG fallback when model quota/demand is exceeded or API is unconfigured
    const generateCozyCoverSvg = (title: string, promptText: string) => {
      const cleanPrompt = promptText.replace(/Warm soft pastel children's book cover illustration.*?:/gi, "").trim();
      const croppedPrompt = cleanPrompt.length > 200 ? cleanPrompt.substring(0, 197) + "..." : cleanPrompt;

      // Color scheme for warm comforting feeling (terracotta cream)
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" style="background: linear-gradient(135deg, #FAF6F0 0%, #F5E8DB 100%); font-family: 'Quicksand', 'Lora', system-ui, sans-serif;">
        <!-- Soft background decorative elements -->
        <rect x="20" y="20" width="560" height="760" rx="36" fill="none" stroke="#E6C8AD" stroke-width="4" opacity="0.6" />
        <rect x="35" y="35" width="530" height="730" rx="28" fill="none" stroke="#E6C8AD" stroke-width="1.5" opacity="0.4" />
        
        <!-- Ambient forest canopy / mountain hills in background -->
        <path d="M-50 820 Q 150 630, 400 820 Z" fill="#EBDAC4" opacity="0.5" />
        <path d="M200 820 Q 420 590, 680 820 Z" fill="#E6D3B8" opacity="0.4" />
        <path d="M50 820 Q 300 680, 550 820 Z" fill="#DFCAA9" opacity="0.6" />

        <!-- Peaceful Sun/Moon glowing in top right -->
        <circle cx="480" cy="160" r="70" fill="#FFF6EA" filter="drop-shadow(0px 4px 12px rgba(254,233,203,0.5))" />
        <circle cx="480" cy="160" r="50" fill="#FFE8C8" opacity="0.7" />

        <!-- Glowing lanterns / fireflies -->
        <circle cx="120" cy="400" r="5" fill="#FBBF24" opacity="0.8" />
        <circle cx="120" cy="400" r="14" fill="#FBBF24" opacity="0.2" />
        <circle cx="500" cy="480" r="4" fill="#FBBF24" opacity="0.7" />
        <circle cx="500" cy="480" r="12" fill="#FBBF24" opacity="0.15" />
        <circle cx="200" cy="310" r="3" fill="#FBBF24" opacity="0.8" />

        <!-- Large central book cover illustration card frame -->
        <g transform="translate(100, 240)">
          <!-- Inner frame background -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="#FCFAF7" filter="drop-shadow(0px 8px 16px rgba(120,60,30,0.06))" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#ECE0D1" stroke-width="2" />
          
          <!-- Cozy centralized symbol illustration - cute sleeping fox & glowing stars in hills -->
          <g transform="translate(200, 160) scale(1.1)">
            <!-- Sleeping hills -->
            <path d="M-100 80 C-40 20 40 20 100 80 Z" fill="#EDE4D9" />
            <!-- Glowing Moon -->
            <path d="M-40 -40 A 30 30 0 1 0 10 -40 A 24 24 0 1 1 -40 -40" fill="#FCD34D" opacity="0.8" />
            <!-- Little Sleeping Fox/Creature -->
            <path d="M-15,30 C-30,30 -40,40 -45,55 C-45,60 -35,65 -25,65 C-15,65 -5,60 -2,55 C0,45 -2,40 -15,30 Z" fill="#E87C43" />
            <path d="M-5,45 C-1,45 8,48 10,55 C12,60 5,65 -2,65 C-9,65 -15,60 -15,55 Z" fill="#E5E7EB" opacity="0.9" />
            <!-- Sleeping curvy tails -->
            <path d="M-40,55 C-50,55 -60,65 -45,70 C-30,75 -25,65 -40,55 Z" fill="#E87C43" />
            <!-- Tiny closed eyes -->
            <path d="M-22,50 Q-18,52 -14,50" fill="none" stroke="#2D1C12" stroke-width="1.8" stroke-linecap="round" />
            
            <!-- Twinkling cover stars -->
            <polygon points="0,-10 3,-3 10,-3 5,2 7,9 0,5 -7,9 -5,2 -10,-3 -3,-3" fill="#FFE8C8" transform="translate(50, -20) scale(0.8)" />
            <polygon points="0,-10 3,-3 10,-3 5,2 7,9 0,5 -7,9 -5,2 -10,-3 -3,-3" fill="#FFE8C8" transform="translate(-60, 10) scale(0.6)" opacity="0.5" />
          </g>
        </g>
        
        <!-- Elegant children storybook text alignment -->
        <g transform="translate(300, 140)">
          <text text-anchor="middle" fill="#5F3A15" font-size="28" font-family="'Fraunces', Georgia, serif" font-weight="800" letter-spacing="-0.02em" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.03))">${title || "A Cozy GlowTale"}</text>
          <text y="35" text-anchor="middle" fill="#9C6B43" font-size="12" font-weight="700" letter-spacing="0.15em">PERSONALIZED EDITION</text>
        </g>

        <!-- Brief cover prompt overlay for tactile visualization -->
        <g transform="translate(60, 615)">
          <rect x="0" y="0" width="480" height="90" rx="18" fill="#FFFDFB" fill-opacity="0.9" stroke="#F1E6D9" stroke-width="1.5" />
          <text x="240" y="28" text-anchor="middle" fill="#6A4926" font-size="12" font-weight="600">Cover Scene Description</text>
          <text x="240" y="48" text-anchor="middle" fill="#8D755E" font-size="10" font-weight="400" width="400">
            <tspan x="240" dy="0">${croppedPrompt.substring(0, 75)}</tspan>
            <tspan x="240" dy="16">${croppedPrompt.substring(75, 150)}</tspan>
          </text>
        </g>
        
        <!-- Star indicators on bottom -->
        <g transform="translate(300, 735) scale(0.85)">
          <circle cx="-35" cy="0" r="3" fill="#DEC39E" />
          <circle cx="0" cy="0" r="5" fill="#C5965E" />
          <circle cx="35" cy="0" r="3" fill="#DEC39E" />
        </g>
      </svg>`;
    };

    let apiResponse;
    let selectedImageModel = "gemini-2.5-flash-image";
    let base64ImageBytes = "";

    try {
      apiResponse = await withRetry(() => getGoogleGenAI(req).models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: partsPayload,
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4", // Beautiful book portrait aspect ratio!
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

      console.log(`Cover illustration successfully generated using model: ${selectedImageModel}`);
      return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

    } catch (imageErr: any) {
      console.log("[Image Cover Fallback Warning] gemini-2.5-flash-image hit a quota cap. Falling back to gemini-3.1-flash-image...");
      
      try {
        selectedImageModel = "gemini-3.1-flash-image";
        apiResponse = await withRetry(() => getGoogleGenAI(req).models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: partsPayload,
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4",
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

        console.log(`Cover illustration successfully generated using model: ${selectedImageModel}`);
        return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

      } catch (imageErr2: any) {
        console.log("[Image Cover Fallback Info] Both Imagen models returned resource limits or are unlicensed. Generating high-quality customized vector book cover SVG...");
        
        try {
          // Soft, soothing cover template
          const fallbackModel = "gemini-2.5-flash";
          const svgPrompt = `You are a professional children's book illustrator. Since our specialized image model is at full rate capacity right now, we need you to render a beautiful children's book portrait cover illustration in standard raw SVG format.

The illustration is for a sensitive, autistic child and should depict:
- Child attributes: "${characterAppearance || "A friendly child"}"
- Setting/Theme description: "${coverIllustrationPrompt}"

Please return ONLY a valid inline <svg> block. 
1. The viewport must be exactly: viewBox="0 0 600 800" (portrait format).
2. It should have a warm pale background plate, simple comforting lines, charming curves, circular highlights, glowing stars, representing the theme beautifully.
3. No fluorescent or overwhelming shapes, no sharp edges. Comforting pastel hues.
4. Keep the code fully compatible. No markdown wrappers (\`\`\`svg or \`\`\`xml). Start your response directly with "<svg" and close with "</svg>".`;

          const fallbackResponse = await withRetry(() => getGoogleGenAI(req).models.generateContent({
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
            console.log("Vector cover illustration generated perfectly by Gemini Text Engine!");
            const base64Bytes = Buffer.from(svgContent).toString("base64");
            return res.json({ 
              imageUrl: `data:image/svg+xml;base64,${base64Bytes}`,
              isVectorFallback: true 
            });
          } else {
            throw new Error("Invalid inline SVG content from cover model.");
          }
        } catch (svgCoverErr: any) {
          console.log("[Image Fallback Info] Cover SVG generation failed, generating offline beautiful cover visual:", svgCoverErr?.message || svgCoverErr);
          const offlineSvg = generateCozyCoverSvg("Your Little Story", coverIllustrationPrompt);
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
    const errorDetails = handleGeminiError(error, "book cover generation", req);
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
