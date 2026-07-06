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
4. "coverIllustrationPrompt": a highly descriptive, master-quality children's book-cover drawing prompt suitable for text-to-image. It MUST start precisely with: "Award-winning whimsical children's book cover illustration, masterfully hand-drawn watercolor and gouache, soft textures, comforting storybook style: [detailed cozy scene depicting ${name} enjoying ${specialInterests} with exquisite details, soft warm lighting, and gentle organic shadows]"
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
        throw err2;
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

// Generate Book Cover Image Endpoint (Disabled for now as requested)
app.post("/api/generate-image", async (req, res) => {
  return res.status(400).json({ error: "Picture creation is disabled for now." });
});

const disabled_generate_image = async (req: any, res: any) => {
  try {
    const { title, coverIllustrationPrompt, referencePhoto, characterAppearance } = req.body;

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
    finalPrompt += ", award-winning children's storybook cover illustration, masterpiece fine art style, warm cozy lighting with soft golden glow, intricate watercolor washes with natural deckled edges, gentle pencil textures and visible paper grain, exquisite gouache painting details, highly detailed and whimsical character expressions, beautiful balanced composition, comforting storybook colors. Warm, magical, comforting atmosphere, perfectly peaceful. Strictly zero flat vector art, zero harsh neon, zero modern digital flat design, zero 3D rendering, zero noisy sparkles.";

    console.log("Generating book cover illustration with prompt length:", finalPrompt.length);

    const partsPayload: any[] = [];
    if (refImagePart) {
      partsPayload.push(refImagePart);
    }
    partsPayload.push({ text: finalPrompt });

    // Vector SVG fallback when model quota/demand is exceeded or API is unconfigured
    const generateCozyCoverSvg = (bookTitle: string, promptText: string) => {
      const cleanPrompt = promptText.replace(/Warm soft pastel children's book cover illustration.*?:/gi, "").trim();
      const croppedPrompt = cleanPrompt.length > 200 ? cleanPrompt.substring(0, 197) + "..." : cleanPrompt;
      const lowerPrompt = (promptText + " " + bookTitle).toLowerCase();
      
      let innerIllustrationSvg = "";

      if (lowerPrompt.includes("train") || lowerPrompt.includes("locomotive") || lowerPrompt.includes("railway") || lowerPrompt.includes("engine") || lowerPrompt.includes("track") || lowerPrompt.includes("wheel")) {
        // Train/Locomotive SVG illustration
        innerIllustrationSvg = `
          <!-- Train Inner Frame Background -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="url(#nightSky)" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#475569" stroke-width="2" />
          
          <!-- Sun/Moon with gentle glow -->
          <circle cx="330" cy="70" r="45" fill="#FEF08A" opacity="0.15" />
          <circle cx="330" cy="70" r="30" fill="#FEF08A" opacity="0.85" />
          
          <!-- Beautiful stars -->
          <g opacity="0.7">
            <circle cx="60" cy="50" r="2" fill="#FFF" />
            <circle cx="120" cy="30" r="1.5" fill="#FFF" />
            <circle cx="210" cy="60" r="2" fill="#FFF" />
            <circle cx="280" cy="35" r="1" fill="#FFF" />
          </g>

          <!-- Gently rolling silhouette hills -->
          <path d="M 0 240 Q 120 180 240 220 T 400 210 L 400 340 L 0 340 Z" fill="#132A13" opacity="0.6" />
          <path d="M 0 260 Q 160 210 300 240 T 400 250 L 400 340 L 0 340 Z" fill="#1B4332" />

          <!-- Track -->
          <rect x="20" y="295" width="360" height="6" fill="#64748B" rx="2" />
          <line x1="20" y1="301" x2="380" y2="301" stroke="#334155" stroke-width="3" />
          
          <!-- Wooden Sleepers -->
          <line x1="50" y1="301" x2="50" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />
          <line x1="110" y1="301" x2="110" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />
          <line x1="170" y1="301" x2="170" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />
          <line x1="230" y1="301" x2="230" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />
          <line x1="290" y1="301" x2="290" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />
          <line x1="350" y1="301" x2="350" y2="315" stroke="#451A03" stroke-width="5" stroke-linecap="round" />

          <!-- Steam Train -->
          <g transform="translate(70, 140)">
            <!-- Steaming puffs of cloud from chimney -->
            <g opacity="0.85">
              <circle cx="50" cy="5" r="12" fill="#FFF" />
              <circle cx="68" cy="-10" r="16" fill="#FFF" opacity="0.9" />
              <circle cx="92" cy="-25" r="22" fill="#FFF" opacity="0.75" />
              <circle cx="125" cy="-38" r="28" fill="#FFF" opacity="0.5" />
            </g>

            <!-- Locomotive Cab -->
            <rect x="150" y="30" width="75" height="90" rx="8" fill="url(#trainBody)" />
            <!-- Cab Roof curve -->
            <path d="M 145 30 Q 187.5 18 230 30 Z" fill="#0369A1" />
            <!-- Cab Window -->
            <rect x="165" y="45" width="45" height="35" rx="6" fill="#F0FDF4" stroke="#0284C7" stroke-width="3" />
            
            <!-- Boiler body -->
            <rect x="35" y="55" width="115" height="65" rx="4" fill="url(#trainBoiler)" />
            <!-- Cowcatcher -->
            <polygon points="-5,120 40,120 20,95" fill="#334155" />
            <!-- Nose Front cap -->
            <rect x="15" y="65" width="20" height="45" fill="#1E293B" rx="3" />
            
            <!-- Chimney / Stack -->
            <rect x="45" y="20" width="22" height="38" fill="#0F172A" rx="2" />
            <rect x="41" y="16" width="30" height="6" fill="#E2E8F0" rx="1" />

            <!-- Headlamp with glowing beam -->
            <rect x="8" y="72" width="10" height="15" fill="#E2E8F0" rx="2" />
            <polygon points="8,80 -80,50 -80,110" fill="url(#glow)" opacity="0.35" />

            <!-- Wheels (Exactly 6 beautiful detailed red wheels) -->
            <g fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5">
              <circle cx="32" cy="128" r="18" />
              <circle cx="32" cy="128" r="6" fill="#FFF" stroke="none" />
              
              <circle cx="67" cy="128" r="18" />
              <circle cx="67" cy="128" r="6" fill="#FFF" stroke="none" />
              
              <circle cx="102" cy="128" r="18" />
              <circle cx="102" cy="128" r="6" fill="#FFF" stroke="none" />
              
              <circle cx="137" cy="128" r="18" />
              <circle cx="137" cy="128" r="6" fill="#FFF" stroke="none" />
              
              <circle cx="172" cy="128" r="18" />
              <circle cx="172" cy="128" r="6" fill="#FFF" stroke="none" />
              
              <circle cx="207" cy="128" r="18" />
              <circle cx="207" cy="128" r="6" fill="#FFF" stroke="none" />
            </g>
            
            <!-- Driving Wheel coupling metal rods -->
            <line x1="32" y1="128" x2="207" y2="128" stroke="#94A3B8" stroke-width="5" stroke-linecap="round" />
            <line x1="32" y1="128" x2="207" y2="128" stroke="#475569" stroke-width="2" stroke-linecap="round" />
          </g>
          <text x="200" y="315" text-anchor="middle" fill="#BAE6FD" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="1.5">CHUGGING ON TRACKS</text>
        `;
      } else if (lowerPrompt.includes("star") || lowerPrompt.includes("space") || lowerPrompt.includes("constellation") || lowerPrompt.includes("telescope") || lowerPrompt.includes("sky") || lowerPrompt.includes("night") || lowerPrompt.includes("moon") || lowerPrompt.includes("sirius") || lowerPrompt.includes("astronomy") || lowerPrompt.includes("galaxy")) {
        // Space/Stars SVG illustration
        innerIllustrationSvg = `
          <!-- Deep Space Frame Background -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="url(#nightSky)" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#1E293B" stroke-width="2" />
          
          <!-- Nebulae glowing gas -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="url(#nebula)" style="mix-blend-mode: screen;" />

          <!-- Radiant Golden Astrolabe ring -->
          <circle cx="200" cy="150" r="110" fill="none" stroke="url(#goldRim)" stroke-width="2" opacity="0.2" />
          <circle cx="200" cy="150" r="100" fill="none" stroke="url(#goldRim)" stroke-width="3" stroke-dasharray="6,4" opacity="0.4" />

          <!-- A gorgeous ringed Saturn-like planet -->
          <g transform="translate(80, 80)">
            <!-- Behind ring -->
            <ellipse cx="0" cy="0" rx="35" ry="8" fill="#FDBA74" transform="rotate(-15)" opacity="0.5" />
            <circle cx="0" cy="0" r="18" fill="#FB923C" />
            <!-- Front ring -->
            <path d="M -33.8 9 A 35 8 0 0 0 33.8 -9" fill="none" stroke="#FDBA74" stroke-width="5" transform="rotate(-15)" />
          </g>

          <!-- Luminous Crescent Moon -->
          <g transform="translate(310, 70)">
            <circle cx="0" cy="0" r="30" fill="#FEF08A" opacity="0.15" />
            <path d="M 12 -22 A 25 25 0 1 0 12 22 A 20 20 0 1 1 12 -22" fill="#FDE047" />
          </g>

          <!-- Beautiful interconnected constellations -->
          <g stroke="#93C5FD" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.75" fill="none">
            <polyline points="140,160 200,120 260,150 220,210 140,160" />
            <line x1="200" y1="120" x2="200" y2="70" />
            <line x1="260" y1="150" x2="300" y2="180" />
          </g>

          <!-- Shining stars -->
          <g fill="#FFF">
            <polygon points="200,64 202,68 206,70 202,72 200,76 198,72 194,70 198,68" />
            <polygon points="140,154 142,158 146,160 142,162 140,166 138,162 134,160 138,158" />
            <polygon points="200,114 202,118 206,120 202,122 200,126 198,122 194,120 198,118" />
            <polygon points="260,144 262,148 266,150 262,152 260,156 258,152 254,150 258,148" />
            <polygon points="220,204 222,208 226,210 222,212 220,216 218,212 214,210 218,208" fill="#FDE047" />
            <polygon points="300,174 302,178 306,180 302,182 300,186 298,182 294,180 298,178" />
          </g>

          <!-- Silhouette of a Child looking through a beautiful Brass telescope -->
          <g transform="translate(160, 190)">
            <!-- Tripod stand -->
            <line x1="50" y1="65" x2="35" y2="120" stroke="#78350F" stroke-width="4.5" stroke-linecap="round" />
            <line x1="50" y1="65" x2="65" y2="120" stroke="#78350F" stroke-width="4.5" stroke-linecap="round" />
            <line x1="50" y1="65" x2="50" y2="125" stroke="#451A03" stroke-width="3" stroke-linecap="round" />
            
            <!-- Brass telescope body -->
            <g transform="rotate(-25, 50, 65)">
              <rect x="15" y="58" width="80" height="14" fill="url(#goldRim)" rx="2" />
              <rect x="95" y="60" width="15" height="10" fill="#CA8A04" rx="1" />
              <rect x="5" y="61" width="10" height="8" fill="#5F3A15" />
            </g>

            <!-- Small child silhouette standing and looking -->
            <g transform="translate(0, 50)">
              <!-- Cap/Head -->
              <circle cx="12" cy="15" r="11" fill="#1E293B" />
              <!-- Hair curve -->
              <path d="M 4 14 Q 10 4 20 12" stroke="#1E293B" stroke-width="3" stroke-linecap="round" />
              <!-- Body cozy jacket -->
              <path d="M 2 26 Q 12 24 22 26 L 25 65 L -1 65 Z" fill="#334155" rx="5" />
              <!-- Cozy scarf -->
              <rect x="4" y="24" width="16" height="8" fill="#EF4444" rx="3" />
              <path d="M 14 30 L 16 48" stroke="#EF4444" stroke-width="4" stroke-linecap="round" />
            </g>
          </g>

          <text x="200" y="315" text-anchor="middle" fill="#FEF08A" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="1.5">MAP OF SIRIUS & THE STARS</text>
        `;
      } else if (lowerPrompt.includes("shell") || lowerPrompt.includes("beach") || lowerPrompt.includes("sea") || lowerPrompt.includes("ocean") || lowerPrompt.includes("sand") || lowerPrompt.includes("wave") || lowerPrompt.includes("shore") || lowerPrompt.includes("spiral")) {
        // Beach Shells SVG illustration
        innerIllustrationSvg = `
          <!-- Sand Box Frame -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="url(#sandGrad)" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#D97706" stroke-width="2.5" />
          
          <!-- Soft sparkling beach waves washing from the corner -->
          <path d="M 0 0 L 0 110 Q 110 80 200 120 T 400 90 L 400 0 Z" fill="#E0F2FE" opacity="0.6" />
          <path d="M 0 0 L 0 90 Q 95 65 180 100 T 400 70 L 400 0 Z" fill="#BAE6FD" opacity="0.8" />
          
          <!-- Compartment dividers representing sensory order! -->
          <!-- Outer wooden drawer border -->
          <rect x="20" y="100" width="360" height="180" rx="14" fill="#FEFDFB" stroke="#B45309" stroke-width="3" />
          <!-- Vertical Dividers -->
          <line x1="140" y1="100" x2="140" y2="280" stroke="#D97706" stroke-width="3" />
          <line x1="260" y1="100" x2="260" y2="280" stroke="#D97706" stroke-width="3" />

          <!-- Compartment 1: Symmetrical Starfish -->
          <g transform="translate(80, 185)">
            <!-- Sea Star with realistic bumps and cozy shading -->
            <path d="M 0 -45 
                     L 10 -15 
                     L 42 -12
                     L 16 10
                     L 25 42
                     L 0 25
                     L -25 42
                     L -16 10
                     L -42 -12
                     L -10 -15 Z" fill="#F97316" stroke="#C2410C" stroke-width="2.5" stroke-linejoin="round" />
            <!-- Star dots/sensory details -->
            <circle cx="0" cy="0" r="4.5" fill="#FFF" />
            <circle cx="0" cy="-22" r="2.5" fill="#FFF" />
            <circle cx="0" cy="12" r="2.5" fill="#FFF" />
            <circle cx="-18" cy="-6" r="2.5" fill="#FFF" />
            <circle cx="18" cy="-6" r="2.5" fill="#FFF" />
            <circle cx="-12" cy="22" r="2.5" fill="#FFF" />
            <circle cx="12" cy="22" r="2.5" fill="#FFF" />
            <text x="0" y="65" text-anchor="middle" fill="#7C2D12" font-size="9.5" font-weight="bold" font-family="sans-serif">STELLA</text>
          </g>

          <!-- Compartment 2: Nautilus Spiral Shell -->
          <g transform="translate(200, 185)">
            <!-- Spiral ammonite drawing using multiple concentric elements -->
            <path d="M 0 -35 A 35 35 0 1 1 -25 25 A 25 25 0 1 1 -10 -15 A 15 15 0 1 1 0 0 L 0 -5" fill="none" stroke="#DB2777" stroke-width="4" stroke-linecap="round" />
            <path d="M -8 -30 C 15 -35 25 -10 18 10 C 10 30 -15 25 -20 15" fill="none" stroke="#F43F5E" stroke-width="2.5" />
            <ellipse cx="0" cy="0" rx="32" ry="24" fill="#FDA4AF" opacity="0.3" />
            <text x="0" y="65" text-anchor="middle" fill="#881337" font-size="9.5" font-weight="bold" font-family="sans-serif">SPIRALIS</text>
          </g>

          <!-- Compartment 3: Radiant Scallop Shell -->
          <g transform="translate(320, 185)">
            <path d="M -28 10 
                     C -30 -25 30 -25 28 10 
                     L 16 28 
                     L -16 28 Z" fill="#67E8F9" stroke="#0891B2" stroke-width="2.5" />
            <!-- Radiating ribs -->
            <line x1="0" y1="-20" x2="0" y2="28" stroke="#0891B2" stroke-width="2.5" />
            <line x1="-12" y1="-18" x2="-8" y2="28" stroke="#0891B2" stroke-width="2" />
            <line x1="12" y1="-18" x2="8" y2="28" stroke="#0891B2" stroke-width="2" />
            <line x1="-22" y1="-5" x2="-14" y2="28" stroke="#0891B2" stroke-width="1.5" />
            <line x1="22" y1="-5" x2="14" y2="28" stroke="#0891B2" stroke-width="1.5" />
            <text x="0" y="65" text-anchor="middle" fill="#0E7490" font-size="9.5" font-weight="bold" font-family="sans-serif">PECTEN</text>
          </g>

          <text x="200" y="315" text-anchor="middle" fill="#78350F" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="1.5">ORGANIZED SHELL TRAY</text>
        `;
      } else if (lowerPrompt.includes("clock") || lowerPrompt.includes("watch") || lowerPrompt.includes("tick") || lowerPrompt.includes("gear") || lowerPrompt.includes("time") || lowerPrompt.includes("dial")) {
        // Clock/Pocket Watch SVG illustration
        innerIllustrationSvg = `
          <!-- Blueprint Paper Background -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="#F8FAFC" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#CBD5E1" stroke-width="2" />
          
          <!-- Symmetrical faint blue grid lines representing perfect sensory order -->
          <g stroke="#E2E8F0" stroke-width="0.75">
            <line x1="40" y1="0" x2="40" y2="340" />
            <line x1="80" y1="0" x2="80" y2="340" />
            <line x1="120" y1="0" x2="120" y2="340" />
            <line x1="160" y1="0" x2="160" y2="340" />
            <line x1="200" y1="0" x2="200" y2="340" stroke="#94A3B8" stroke-width="1" />
            <line x1="240" y1="0" x2="240" y2="340" />
            <line x1="280" y1="0" x2="280" y2="340" />
            <line x1="320" y1="0" x2="320" y2="340" />
            <line x1="360" y1="0" x2="360" y2="340" />

            <line x1="0" y1="40" x2="400" y2="40" />
            <line x1="0" y1="80" x2="400" y2="80" />
            <line x1="0" y1="120" x2="400" y2="120" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#94A3B8" stroke-width="1" />
            <line x1="0" y1="200" x2="400" y2="200" />
            <line x1="0" y1="240" x2="400" y2="240" />
            <line x1="0" y1="280" x2="400" y2="280" />
          </g>

          <!-- Golden Chronometer pocket watch in the center -->
          <g transform="translate(200, 140)">
            <!-- Outer Solid Golden Case Ring -->
            <circle cx="0" cy="0" r="110" fill="url(#goldRim)" stroke="#854D0E" stroke-width="4.5" />
            <!-- Outer Glass Ring Bezel -->
            <circle cx="0" cy="0" r="96" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
            <!-- Watch Dial Plate -->
            <circle cx="0" cy="0" r="90" fill="url(#clockPlate)" stroke="#94A3B8" stroke-width="2" />
            
            <!-- Highly Symmetrical Interlocking Brass Gears behind hands -->
            <g opacity="0.18" fill="none" stroke="#451A03" stroke-width="2.5">
              <!-- Center gear -->
              <circle cx="0" cy="0" r="28" stroke-dasharray="6,3" />
              <!-- Upper-right gear -->
              <circle cx="28" cy="-22" r="38" stroke-dasharray="8,4" />
              <circle cx="28" cy="-22" r="18" />
              <!-- Lower-left gear -->
              <circle cx="-32" cy="18" r="46" stroke-dasharray="10,5" />
              <circle cx="-32" cy="18" r="24" />
            </g>

            <!-- Precise Dial Ticks -->
            <g stroke="#1E293B" stroke-width="1.5">
              <!-- Twelve hourly dial ticks -->
              <line x1="0" y1="-90" x2="0" y2="-78" stroke-width="3" />
              <line x1="90" y1="0" x2="78" y2="0" stroke-width="3" />
              <line x1="0" y1="90" x2="0" y2="78" stroke-width="3" />
              <line x1="-90" y1="0" x2="-78" y2="0" stroke-width="3" />
              
              <line x1="45" y1="-78" x2="39" y2="-68" />
              <line x1="78" y1="-45" x2="68" y2="-39" />
              <line x1="78" y1="45" x2="68" y2="39" />
              <line x1="45" y1="78" x2="39" y2="68" />
              <line x1="-45" y1="78" x2="-39" y2="68" />
              <line x1="-78" y1="45" x2="-68" y2="39" />
              <line x1="-78" y1="-45" x2="-68" y2="-39" />
              <line x1="-45" y1="-78" x2="-39" y2="-68" />
            </g>

            <!-- Elegant Roman Numbers on clock face -->
            <g font-family="'Times New Roman', Georgia, serif" font-weight="bold" font-size="11.5" fill="#0F172A" text-anchor="middle">
              <text x="0" y="-64">XII</text>
              <text x="68" y="4">III</text>
              <text x="0" y="72">VI</text>
              <text x="-66" y="4">IX</text>
            </g>

            <!-- Steel Blue ornate clock hands -->
            <!-- Ornate Hour Hand -->
            <g transform="rotate(115)">
              <line x1="0" y1="0" x2="0" y2="-46" stroke="#1E3A8A" stroke-width="4.5" stroke-linecap="round" />
              <circle cx="0" cy="-32" r="6" fill="none" stroke="#1E3A8A" stroke-width="3.5" />
            </g>
            <!-- Sleek Minute Hand -->
            <g transform="rotate(342)">
              <line x1="0" y1="0" x2="0" y2="-68" stroke="#0F172A" stroke-width="3" stroke-linecap="round" />
              <polygon points="0,-72 4,-62 -4,-62" fill="#0F172A" />
            </g>
            <!-- Glowing Red Ticking Second Hand -->
            <g transform="rotate(220)">
              <line x1="0" y1="18" x2="0" y2="-74" stroke="#EF4444" stroke-width="1.25" stroke-linecap="round" />
              <circle cx="0" cy="-56" r="3.5" fill="#EF4444" />
            </g>

            <!-- Center watch hub casing -->
            <circle cx="0" cy="0" r="8" fill="#A16207" />
            <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
          </g>

          <text x="200" y="315" text-anchor="middle" fill="#0F172A" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="1.5">TICKING CHRONOMETER ENGINE</text>
        `;
      } else {
        // Default Sleeping Fox / Bedtime room scene
        innerIllustrationSvg = `
          <!-- Cozy Cabin Frame Background -->
          <rect x="0" y="0" width="400" height="340" rx="24" fill="#2E1A11" />
          <rect x="0" y="0" width="400" height="340" rx="24" fill="none" stroke="#5C3D2E" stroke-width="2.5" />
          
          <!-- Inner room wall with faint wallpaper stripes -->
          <rect x="15" y="15" width="370" height="310" rx="16" fill="#451A03" />
          <g stroke="#78350F" stroke-width="2" opacity="0.2">
            <line x1="45" y1="15" x2="45" y2="325" />
            <line x1="85" y1="15" x2="85" y2="325" />
            <line x1="125" y1="15" x2="125" y2="325" />
            <line x1="165" y1="15" x2="165" y2="325" />
            <line x1="205" y1="15" x2="205" y2="325" />
            <line x1="245" y1="15" x2="245" y2="325" />
            <line x1="285" y1="15" x2="285" y2="325" />
            <line x1="325" y1="15" x2="325" y2="325" />
            <line x1="365" y1="15" x2="365" y2="325" />
          </g>

          <!-- Arch Window looking out to starry sky -->
          <g transform="translate(45, 45)">
            <!-- Window frame -->
            <path d="M 0 120 L 0 50 A 40 40 0 0 1 80 50 L 80 120 Z" fill="url(#nightSky)" stroke="#D97706" stroke-width="4.5" />
            <!-- Horizontal window divider -->
            <line x1="0" y1="75" x2="80" y2="75" stroke="#D97706" stroke-width="3" />
            <!-- Vertical window divider -->
            <line x1="40" y1="10" x2="40" y2="120" stroke="#D97706" stroke-width="3" />
            <!-- Glowing crescent moon -->
            <path d="M 52 35 A 12 12 0 1 0 52 55 A 10 10 0 1 1 52 35" fill="#FEF08A" />
            <circle cx="20" cy="40" r="1" fill="#FFF" />
            <circle cx="60" cy="90" r="1" fill="#FFF" />
          </g>

          <!-- Stack of three neat books on bedside table -->
          <g transform="translate(275, 185)">
            <!-- Bedside Table top -->
            <rect x="-15" y="45" width="100" height="10" fill="#78350F" rx="2" />
            <rect x="0" y="55" width="12" height="40" fill="#5C3D2E" />
            <rect x="58" y="55" width="12" height="40" fill="#5C3D2E" />

            <!-- Green Book -->
            <rect x="-5" y="32" width="80" height="13" fill="#065F46" rx="2" />
            <rect x="-8" y="34" width="6" height="9" fill="#FBBF24" />
            <!-- Orange Book -->
            <rect x="5" y="19" width="65" height="13" fill="#C2410C" rx="2" />
            <rect x="2" y="21" width="6" height="9" fill="#FED7AA" />
            <!-- Blue Book -->
            <rect x="0" y="6" width="72" height="13" fill="#1E3A8A" rx="2" />
            <rect x="-3" y="8" width="6" height="9" fill="#93C5FD" />
          </g>

          <!-- Little Sleeping Fox in cozy checkered quilt bed in the center -->
          <g transform="translate(130, 155)">
            <!-- Wooden Bed posts -->
            <rect x="-10" y="25" width="12" height="70" fill="#B45309" rx="3" />
            <rect x="110" y="45" width="12" height="50" fill="#B45309" rx="3" />
            <!-- Headboard/Footboard lines -->
            <rect x="0" y="55" width="112" height="35" fill="#92400E" rx="2" />

            <!-- Mattress white layer -->
            <rect x="-2" y="50" width="114" height="12" fill="#F8FAFC" rx="1" />

            <!-- Checkered warm quilt blanket -->
            <rect x="35" y="50" width="77" height="36" fill="#1E3A8A" rx="2" />
            <!-- Quilt pattern -->
            <g stroke="#3B82F6" stroke-width="1.5" opacity="0.4">
              <line x1="45" y1="50" x2="45" y2="86" />
              <line x1="55" y1="50" x2="55" y2="86" />
              <line x1="65" y1="50" x2="65" y2="86" />
              <line x1="75" y1="50" x2="75" y2="86" />
              <line x1="85" y1="50" x2="85" y2="86" />
              <line x1="95" y1="50" x2="95" y2="86" />
              <line x1="105" y1="50" x2="105" y2="86" />
              
              <line x1="35" y1="58" x2="112" y2="58" />
              <line x1="35" y1="68" x2="112" y2="68" />
              <line x1="35" y1="78" x2="112" y2="78" />
            </g>

            <!-- White fluffy Pillow -->
            <rect x="0" y="45" width="38" height="20" rx="6" fill="#FFF" stroke="#E2E8F0" stroke-width="1" />

            <!-- Sleeping cute orange Fox on pillow -->
            <g transform="translate(6, 42)">
              <!-- Fox head -->
              <path d="M 5 -1 C -4 -1 -8 8 -2 14 C 4 20 18 16 18 10 C 18 4 14 -1 5 -1 Z" fill="#EA580C" />
              <path d="M 12 10 C 14 10 18 13 18 10 C 18 7 13 4 10 4" fill="#FFF" />
              <!-- Fox ears -->
              <polygon points="0,0 -8,-10 -2,4" fill="#EA580C" />
              <polygon points="-2,-2 -6,-8 -4,2" fill="#FDBA74" />
              <polygon points="10,0 16,-10 12,4" fill="#EA580C" />
              
              <!-- Curved body tucked under blanket -->
              <path d="M 10 12 C 22 14 36 28 36 40 C 32 45 15 45 10 32 Z" fill="#EA580C" />
              <!-- Cozy white chest fluff -->
              <path d="M 8 13 C 14 13 18 24 10 24 C 6 24 4 17 8 13 Z" fill="#F1F5F9" />
              
              <!-- Tiny closed sleeping eye -->
              <path d="M 1 10 Q 5 13 8 10" fill="none" stroke="#2D1C12" stroke-width="2.2" stroke-linecap="round" />
            </g>
          </g>

          <!-- Little warm glowing Candle on the table -->
          <g transform="translate(325, 185)">
            <rect x="0" y="22" width="10" height="24" fill="#EF4444" rx="1" />
            <!-- Wick -->
            <line x1="5" y1="22" x2="5" y2="17" stroke="#1E293B" stroke-width="1.5" />
            <!-- Glowing Flame -->
            <path d="M 5 8 Q 8 13 5 17 Q 2 13 5 8 Z" fill="#FBBF24" />
            <circle cx="5" cy="14" r="10" fill="#FEF08A" opacity="0.3" />
          </g>

          <text x="200" y="315" text-anchor="middle" fill="#FDBA74" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="1.5">COZY BEDTIME CABIN</text>
        `;
      }

      // Color scheme for warm comforting feeling (terracotta cream)
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" style="background: linear-gradient(135deg, #FAF6F0 0%, #F5E8DB 100%); font-family: 'Quicksand', 'Lora', system-ui, sans-serif;">
        <defs>
          <!-- Main backdrop gradient -->
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FAF6F0" />
            <stop offset="100%" stop-color="#F5E8DB" />
          </linearGradient>
          
          <!-- Outer cover border shadow -->
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#5C3D2E" flood-opacity="0.12" />
          </filter>

          <!-- Card shadow -->
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#4A3427" flood-opacity="0.18" />
          </filter>
          
          <!-- Warm glow radial gradient -->
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#FEF08A" stop-opacity="0" />
          </radialGradient>
          
          <!-- Train engine gradient -->
          <linearGradient id="trainBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0E91D4" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>

          <linearGradient id="trainBoiler" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>

          <!-- Deep night sky gradient -->
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0B132B" />
            <stop offset="60%" stop-color="#1C2541" />
            <stop offset="100%" stop-color="#3A506B" />
          </linearGradient>

          <!-- Nebula glow gradient -->
          <radialGradient id="nebula" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#818CF8" stop-opacity="0.35" />
            <stop offset="50%" stop-color="#C084FC" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#0B132B" stop-opacity="0" />
          </radialGradient>

          <!-- Beach sand gradient -->
          <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FEF3C7" />
            <stop offset="100%" stop-color="#FCD34D" />
          </linearGradient>

          <!-- Sage / clock gradient -->
          <linearGradient id="clockPlate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#F1F5F9" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="50%" stop-color="#EAB308" />
            <stop offset="100%" stop-color="#CA8A04" />
          </linearGradient>
        </defs>

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
        <g transform="translate(100, 240)" filter="url(#cardShadow)">
          ${innerIllustrationSvg}
        </g>
        
        <!-- Elegant children storybook text alignment -->
        <g transform="translate(300, 140)">
          <text text-anchor="middle" fill="#5F3A15" font-size="28" font-family="'Fraunces', Georgia, serif" font-weight="800" letter-spacing="-0.02em" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.03))">${bookTitle || "A Cozy GlowTale"}</text>
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
    let selectedImageModel = "gemini-3.1-flash-image"; // Prefer premium model for supreme book illustrations
    let base64ImageBytes = "";

    try {
      console.log(`Generating premium cover illustration using primary model: ${selectedImageModel}`);
      apiResponse = await withRetry(() => getGoogleGenAI(req).models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: partsPayload,
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4", // Beautiful book portrait aspect ratio!
            imageSize: "1K",    // Request high-resolution detail to prevent basic/blurry outputs
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
        throw new Error("No inline bytes returned from primary model");
      }

      console.log(`Cover illustration successfully generated using primary model: ${selectedImageModel}`);
      return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

    } catch (imageErr: any) {
      console.log("[Image Model Fallback] Premium model gemini-3.1-flash-image unavailable. Falling back to gemini-3.1-flash-lite-image...");
      
      try {
        selectedImageModel = "gemini-3.1-flash-lite-image";
        apiResponse = await withRetry(() => getGoogleGenAI(req).models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
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
          throw new Error("Gemini lite image model did not return inline image bytes.");
        }

        console.log(`Cover illustration successfully generated using fallback model: ${selectedImageModel}`);
        return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });

      } catch (imageErr2: any) {
        console.log("[Image Cover Fallback Info] Both Imagen models returned resource limits or are unlicensed. Generating high-quality customized vector book cover SVG...");
        
        try {
          // Soft, soothing cover template
          const fallbackModel = "gemini-3.5-flash";
          const svgPrompt = `You are a professional children's book illustrator. Since our specialized image model is at full rate capacity right now, we need you to render a beautiful children's book portrait cover illustration in standard raw SVG format.

The illustration is for a sensitive, autistic child and should depict:
- Book Title: "${title || "A Cozy GlowTale"}"
- Child attributes: "${characterAppearance || "A friendly child"}"
- Setting/Theme description: "${coverIllustrationPrompt}"

Please return ONLY a valid inline <svg> block. 
1. The viewport must be exactly: viewBox="0 0 600 800" (portrait format).
2. It should have a warm pale background plate, simple comforting lines, charming curves, circular highlights, glowing stars, representing the theme beautifully.
3. It MUST display the title "${title || "A Cozy GlowTale"}" beautifully, centered at the top, in large readable elegant letters.
4. No fluorescent or overwhelming shapes, no sharp edges. Comforting pastel hues.
5. Keep the code fully compatible. No markdown wrappers (\`\`\`svg or \`\`\`xml). Start your response directly with "<svg" and close with "</svg>".`;

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
          const offlineSvg = generateCozyCoverSvg(title || "A Cozy GlowTale", coverIllustrationPrompt);
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
};

export const config = {
  maxDuration: 60,
};

export default app;
