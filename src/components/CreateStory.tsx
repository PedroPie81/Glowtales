import { useState, useRef, useEffect } from "react";
import { StoryInput, StoryResult } from "../types";
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  User, 
  Heart, 
  EyeOff, 
  Settings2, 
  Loader2, 
  BookOpen, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  Activity,
  Smile,
  X,
  Camera,
  UploadCloud,
  SkipBack,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StoryIllustration from "./StoryIllustration";

export default function CreateStory() {
  // 1. Inputs State
  const [formData, setFormData] = useState<StoryInput>({
    name: "",
    age: "",
    pronouns: "they/them",
    specialInterests: "",
    triggers: "",
    addressTriggers: false,
    length: "Medium",
    sensoryLevel: "Low sensory, reassuring and repetitive",
    structure: "Calming bedtime story with orderly resolution",
    perspective: "Third-person",
    includeIllustrations: false,
    visualStyle: "watercolor",
    customAppearance: "",
    referencePhoto: "",
    companionName: "",
    companionType: "friend",
    companionAppearance: ""
  });

  const [showCompanionForm, setShowCompanionForm] = useState(false);

  // 2. Generation & Output State
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);
  const [generationError, setGenerationError] = useState<{ message: string; isRateLimit: boolean } | null>(null);

  // Individual image generation status
  // record index -> boolean
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  // record index -> error text
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
  
  // Custom narrative creation step
  const [activeFormStep, setActiveFormStep] = useState<"profile" | "comfort" | "format">("profile");



  // Helper helper to handle form defaults or help triggers
  const fillSampleInterest = (interest: string, triggers: string = "") => {
    setFormData(prev => ({ ...prev, specialInterests: interest, triggers }));
  };

  // Dynamic API Base URL logic for cloud-resilient orchestration: 
  // Determines if we are running locally within AI Studio, or shared on a Cloud Run container.
  // We prioritize high-compatibility relative routing for local containers, Vercel subdomains, and official containers.
  const getApiUrl = (path: string): string => {
    const hostname = window.location.hostname;
    // If we are on local dev, a .run.app container, or a .vercel.app deployment, relative routing is used.
    const isLocalOrCloudRunContainer = 
      hostname.includes("run.app") || 
      hostname.includes("vercel.app") || 
      hostname.includes("localhost") || 
      hostname.includes("127.0.0.1") || 
      hostname.startsWith("192.") || 
      hostname.startsWith("10.");
    if (isLocalOrCloudRunContainer) {
      return path;
    }
    // For other custom domains, we first try relative routes in fetchWithRetry.
    // If the server doesn't respond or returns static SPA fallback HTML (meaning they only deployed static files),
    // we seamlessly redirect backend calls to our AI Studio container backend.
    return path;
  };

  // Robust fetch retry helper that intelligently handles local backends, static hosting fallbacks,
  // server reboots, cold starts, and intermittent network limits.
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 4, delay = 1500): Promise<Response> => {
    const targetUrl = url.startsWith("/api") ? getApiUrl(url) : url;
    
    try {
      const response = await fetch(targetUrl, options);
      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html") || response.status === 502 || response.status === 503 || response.status === 504;

      // Detect if we got HTML on an API route from a custom domain (indicating a static fallback page / 404 on host like Netlify/Github Pages)
      const hostname = window.location.hostname;
      const isStaticOnlyFallback = isHtml && url.startsWith("/api") && 
        !hostname.includes("localhost") && 
        !hostname.includes("127.0.0.1") && 
        !hostname.includes("run.app") && 
        !hostname.includes("vercel.app");

      if (isStaticOnlyFallback) {
        // Redirect the request to our pre-compiled AI Studio container backend
        const stableContainerBackendUrl = "https://ais-pre-n63434nzcpnc5bhqrly7ct-92816011625.europe-west2.run.app";
        const fallbackUrl = `${stableContainerBackendUrl}${url}`;
        console.warn(`[API Dynamic Fallback] Static-only host detected (API returned HTML fallback). Delegating request to AI Studio container backend: ${fallbackUrl}`);
        
        try {
          const fallbackRes = await fetch(fallbackUrl, options);
          return fallbackRes;
        } catch (fallbackErr) {
          console.error("[API Dynamic Fallback] Cloud Run fallback backend was unreachable:", fallbackErr);
          // Fall through to return the original HTML response to be parsed and raise a clear connection reload notice
        }
      }

      if (isHtml && retries > 0) {
        console.warn(`[Client-Side Retry] Server restarting or HTML received (status: ${response.status}). Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }

      return response;
    } catch (err) {
      // If a network connection error was thrown (meaning no backend is listening on this domain at all, common for pure static frontends)
      const hostname = window.location.hostname;
      const isCustomStaticHost = url.startsWith("/api") && 
        !hostname.includes("localhost") && 
        !hostname.includes("127.0.0.1") && 
        !hostname.includes("run.app") && 
        !hostname.includes("vercel.app");

      if (isCustomStaticHost) {
        const stableContainerBackendUrl = "https://ais-pre-n63434nzcpnc5bhqrly7ct-92816011625.europe-west2.run.app";
        const fallbackUrl = `${stableContainerBackendUrl}${url}`;
        try {
          console.warn(`[API Dynamic Fallback] Connection failed. Delegating request to AI Studio container backend: ${fallbackUrl}`);
          return await fetch(fallbackUrl, options);
        } catch (fallbackErr) {
          console.error("[API Dynamic Fallback] Cloud Run fallback backend was unreachable:", fallbackErr);
        }
      }

      if (retries > 0) {
        console.warn(`[Client-Side Retry] Connection error. Retrying in ${delay}ms... (${retries} attempts left)`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  // 3. API Handlers
  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter the child's name so we can make them the star of the tale!");
      return;
    }
    if (!formData.specialInterests.trim()) {
      alert("Please specify a special interest or passionate topic!");
      return;
    }

    setIsGeneratingStory(true);
    setGenerationError(null);
    setStoryResult(null);
    setGeneratingImages({});
    setImageErrors({});



    try {
      const response = await fetchWithRetry("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      let data: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        const isHtml = rawText.trim().startsWith("<") || rawText.includes("<!DOCTYPE html>") || rawText.toLocaleLowerCase().includes("the page");
        const cleanMsg = isHtml 
          ? "The application server was temporarily reloading or restarting. Please click 'Create Story' again to formulate your narrative."
          : rawText || `Server error (${response.status})`;
        throw { message: cleanMsg, isRateLimit: response.status === 429 };
      }

      if (!response.ok) {
        const isRate = response.status === 429 || String(data.details || "").includes("429") || String(data.error || "").toLowerCase().includes("limit");
        throw { message: data.error || data.details || "Request failed", isRateLimit: isRate };
      }

      const result: StoryResult = {
        ...data,
        images: {}
      };

      setStoryResult(result);

      // If "includeIllustrations" is checked, kick off sequential image generation!
      if (formData.includeIllustrations) {
        triggerSequentialIllustrations(result);
      }

    } catch (err: any) {
      console.error(err);
      setGenerationError({
        message: err.message || "We could not construct the narrative right now. Please try again.",
        isRateLimit: err.isRateLimit || false
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Sequential Illustration Trigger loop to absorb rate spikes and minimize parallel requests
  const triggerSequentialIllustrations = async (storyObj: StoryResult) => {
    const prompts = storyObj.suggestedIllustrations || [];
    
    for (let i = 0; i < prompts.length; i++) {
      const markerIdx = i + 1;
      const promptText = prompts[i];
      if (!promptText) continue;

      // Set image i to loading
      setGeneratingImages(prev => ({ ...prev, [markerIdx]: true }));
      setImageErrors(prev => ({ ...prev, [markerIdx]: "" }));

      try {
        const imageRes = await fetchWithRetry("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            illustrationDescription: promptText,
            characterAppearance: storyObj.characterAppearance,
            objectAppearance: storyObj.objectAppearance,
            referencePhoto: formData.referencePhoto
          })
        });

        let imageData: any;
        const imgContentType = imageRes.headers.get("content-type") || "";
        if (imgContentType.includes("application/json")) {
          imageData = await imageRes.json();
        } else {
          const imgText = await imageRes.text();
          const isHtml = imgText.trim().startsWith("<") || imgText.includes("<!DOCTYPE html>") || imgText.toLocaleLowerCase().includes("the page");
          const cleanMsg = isHtml 
            ? "The narrative engine is temporarily reloading."
            : imgText || `Server error (${imageRes.status})`;
          throw new Error(cleanMsg);
        }

        if (!imageRes.ok) {
          const isRate = imageRes.status === 429 || String(imageData.details || "").includes("429");
          throw new Error(
            isRate 
              ? "Gemini API limits reached. You can trigger this spot manually anytime with 'Try again'." 
              : imageData.error || "Failed to render illustration space."
          );
        }

        if (imageData.imageUrl) {
          setStoryResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              images: {
                ...(prev.images || {}),
                [markerIdx]: imageData.imageUrl
              }
            };
          });
        }
      } catch (err: any) {
        console.error(`Error loading image index ${markerIdx}:`, err);
        setImageErrors(prev => ({ ...prev, [markerIdx]: err.message || "Transient rate limit." }));
      } finally {
        setGeneratingImages(prev => ({ ...prev, [markerIdx]: false }));
      }

      // Add a slight gentle delay between sequential requests
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  // Manual generation trigger for a single failed/skipped spot
  const handleSingleIllustrationRegen = async (markerIdx: number) => {
    if (!storyResult) return;
    const promptText = storyResult.suggestedIllustrations[markerIdx - 1];
    if (!promptText) return;

    setGeneratingImages(prev => ({ ...prev, [markerIdx]: true }));
    setImageErrors(prev => ({ ...prev, [markerIdx]: "" }));

    try {
      const imageRes = await fetchWithRetry("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          illustrationDescription: promptText,
          characterAppearance: storyResult.characterAppearance,
          objectAppearance: storyResult.objectAppearance,
          referencePhoto: formData.referencePhoto
        })
      });

      let imageData: any;
      const imgContentType = imageRes.headers.get("content-type") || "";
      if (imgContentType.includes("application/json")) {
        imageData = await imageRes.json();
      } else {
        const imgText = await imageRes.text();
        const isHtml = imgText.trim().startsWith("<") || imgText.includes("<!DOCTYPE html>") || imgText.toLocaleLowerCase().includes("the page");
        const cleanMsg = isHtml 
          ? "The server was temporarily reloading. Please click try again."
          : imgText || `Server error (${imageRes.status})`;
        throw new Error(cleanMsg);
      }

      if (!imageRes.ok) {
        throw new Error(imageData.error || "Illustration request failed.");
      }

      if (imageData.imageUrl) {
        setStoryResult(prev => {
          if (!prev) return null;
          return {
            ...prev,
            images: {
              ...(prev.images || {}),
              [markerIdx]: imageData.imageUrl
            }
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      setImageErrors(prev => ({ ...prev, [markerIdx]: err.message || "Failed to generate dynamic artwork." }));
    } finally {
      setGeneratingImages(prev => ({ ...prev, [markerIdx]: false }));
    }
  };

  // 4. Custom Parser - return clean text without illustrations as they have been removed per user request
  const renderFormattedLine = (lineText: string) => {
    // Strip Web speech vocal directive tags (e.g. [calm], [warm], [soft pause Ns]) from onscreen text
    const cleanDisplay = lineText.replace(/\[([^\]]+)\]/g, (match, tag) => {
      if (tag.toUpperCase().startsWith("IMAGE_")) {
        return match;
      }
      return "";
    }).replace(/\s+/g, " ").trim();

    // Simple robust markdown parser for **bold** and *italic*
    const parts = cleanDisplay.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={idx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const parseAndRenderContentMarkup = (story: StoryResult) => {
    const rawContent = story.content;
    const lines = rawContent.split("\n");

    return lines.map((line, index) => {
      const cleaned = line.trim();
      if (!cleaned) return null;

      // Check for tag match like [IMAGE_1] and skip rendering placeholders
      const match = cleaned.match(/^\[IMAGE_(\d+)\]$/);
      if (match) {
        return null;
      }

      // Normal markdown text lines format
      return (
        <div key={`story-para-${index}`} className="my-4 font-sans text-sm sm:text-base text-slate-700 leading-relaxed">
          {renderFormattedLine(cleaned)}
        </div>
      );
    });
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="create-story-container">
      
      {/* LEFT BLOCK: Sectioned Creator Form (Takes 5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-medium text-slate-800 font-sans flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-500 fill-sky-200" />
              Configure the Story
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Provide your child’s preferences. We mold the pacing and language beautifully.
            </p>
          </div>

          {/* Stepper selection tabs */}
          <div className="flex gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveFormStep("profile")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeFormStep === "profile" 
                  ? "bg-sky-50 text-sky-700" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              1. Child Profile
            </button>
            <button
              onClick={() => setActiveFormStep("comfort")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeFormStep === "comfort" 
                  ? "bg-sky-50 text-sky-700" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              2. Comfort & Anchors
            </button>
            <button
              onClick={() => setActiveFormStep("format")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeFormStep === "format" 
                  ? "bg-sky-50 text-sky-700" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              3. Length & Vibe
            </button>
          </div>

          <form onSubmit={handleGenerateStory} className="space-y-5 pt-2">
            {/* STEP 1: profile info */}
            {activeFormStep === "profile" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="child-name">
                    Child's Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="child-name"
                      type="text"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                      placeholder="e.g. Leo, Maya, Christopher"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="child-age">
                      Age (Optional)
                    </label>
                    <input
                      id="child-age"
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                      placeholder="e.g. 7"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="child-pronouns">
                      Pronouns
                    </label>
                    <input
                      id="child-pronouns"
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                      placeholder="e.g. he/him, she/her"
                      value={formData.pronouns}
                      onChange={(e) => setFormData(prev => ({ ...prev, pronouns: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150/60">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !showCompanionForm;
                      setShowCompanionForm(nextState);
                      if (!nextState) {
                        setFormData(prev => ({
                          ...prev,
                          companionName: "",
                          companionType: "friend",
                          companionAppearance: ""
                        }));
                      }
                    }}
                    className={`cursor-pointer w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                      showCompanionForm 
                        ? "bg-sky-50 border-sky-200 text-sky-850" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Add another character (Companion)
                    </span>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded-full">
                      {showCompanionForm ? "Active" : "Optional"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showCompanionForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3 space-y-3 pl-1 border-l-2 border-sky-100"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" htmlFor="companion-name">
                              Companion’s Name *
                            </label>
                            <input
                              id="companion-name"
                              type="text"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white"
                              placeholder="e.g. Oliver, Sparky"
                              value={formData.companionName || ""}
                              onChange={(e) => setFormData(prev => ({ ...prev, companionName: e.target.value }))}
                              required={showCompanionForm}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" htmlFor="companion-role">
                              Relation / Type
                            </label>
                            <select
                              id="companion-role"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white cursor-pointer"
                              value={formData.companionType || "friend"}
                              onChange={(e) => setFormData(prev => ({ ...prev, companionType: e.target.value }))}
                            >
                              <option value="friend">Friend / Playmate</option>
                              <option value="sibling">Sibling (Brother / Sister)</option>
                              <option value="cousin">Cousin</option>
                              <option value="nephew">Nephew / Niece</option>
                              <option value="pet">Pet (Dog, Cat, etc.)</option>
                              <option value="robot">Helpful Robot</option>
                              <option value="creature">Friendly Creature</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" htmlFor="companion-appearance">
                            Physical Appearance (Optional)
                          </label>
                          <input
                            id="companion-appearance"
                            type="text"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white"
                            placeholder="e.g. wears soft green boots, carries a red backpack, has floppy ears"
                            value={formData.companionAppearance || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, companionAppearance: e.target.value }))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep("comfort")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600"
                  >
                    Adjust Comfort Settings <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Interests, triggers, and anchors */}
            {activeFormStep === "comfort" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600" htmlFor="special-interests">
                      Special Interests / Deep Focus *
                    </label>
                    <span className="text-[10px] text-sky-600 font-semibold uppercase tracking-wider">anchors safety</span>
                  </div>
                  <textarea
                    id="special-interests"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                    placeholder="e.g. steam train engine models, star coordinates, blue marbles, geometric puzzles"
                    value={formData.specialInterests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInterests: e.target.value }))}
                    required
                  />
                  
                  {/* Small suggestions chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400">Examples:</span>
                    <button 
                      type="button" 
                      onClick={() => fillSampleInterest("vintage steam train tracks and timetables", "sudden changes, loud whistles")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition"
                    >
                      Trains
                    </button>
                    <button 
                      type="button" 
                      onClick={() => fillSampleInterest("telescope star alignments and Orion Belt", "bright flashing strobe lights")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition"
                    >
                      Star mapping
                    </button>
                    <button 
                      type="button" 
                      onClick={() => fillSampleInterest("sorting blocks by exact count & color values", "crowded loud halls")}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition"
                    >
                      Sorting blocks
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="sensory-triggers">
                    Sensory triggers or dislikes to avoid/manage
                  </label>
                  <input
                    id="sensory-triggers"
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                    placeholder="e.g. loud high whistles, flashing lights, sudden changes"
                    value={formData.triggers}
                    onChange={(e) => setFormData(prev => ({ ...prev, triggers: e.target.value }))}
                  />
                </div>

                {/* Gently check / address triggers */}
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input
                    id="gently-address"
                    type="checkbox"
                    className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    checked={formData.addressTriggers}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressTriggers: e.target.checked }))}
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="gently-address" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Gently reference and soothe triggers
                    </label>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      If checked, we safely address them in a peaceful situation to reassure the child. If unchecked, the triggers are omitted completely.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep("profile")}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormStep("format")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600"
                  >
                    Format & Output <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Format preferences, include Illustrations */}
            {activeFormStep === "format" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="select-length">
                      Length
                    </label>
                    <select
                      id="select-length"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                      value={formData.length}
                      onChange={(e: any) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    >
                      <option value="Short">Short (~300w)</option>
                      <option value="Medium">Medium (~550w)</option>
                      <option value="Long">Long (~900w)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="select-perspective">
                      Perspective
                    </label>
                    <select
                      id="select-perspective"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                      value={formData.perspective}
                      onChange={(e: any) => setFormData(prev => ({ ...prev, perspective: e.target.value }))}
                    >
                      <option value="Third-person">Third person (Leo did)</option>
                      <option value="First-person">First person (I did)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="select-sensory">
                    Sensory Pacing & Pattern style
                  </label>
                  <select
                    id="select-sensory"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formData.sensoryLevel}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, sensoryLevel: e.target.value }))}
                  >
                    <option value="Low sensory, reassuring and repetitive">Low sensory, high repetition</option>
                    <option value="Steady pacing with structured transitions">Steady structured pacing</option>
                    <option value="Rich details, spatial numbers and systems">High-detail coordinate orientation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="select-structure">
                    Story Structure / Environment
                  </label>
                  <select
                    id="select-structure"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formData.structure}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, structure: e.target.value }))}
                  >
                    <option value="Calming bedtime story with orderly resolution">Bedtime (Calming & soothing sleep)</option>
                    <option value="Orderly safety patrol with friendly helpers">Quiet patrol / Help friends</option>
                    <option value="Nature discovery under peaceful schedules">Nature Discovery schedules</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep("comfort")}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    &larr; Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* TRIGGER CREATOR ACTION PANEL */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isGeneratingStory}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 text-xs sm:text-sm shadow-sm transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-trigger-generation"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Writing customized tale...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Story
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comforting literary note */}
        <div className="bg-sky-50/50 rounded-2xl border border-sky-100 p-4 text-xs text-sky-900/85 font-sans leading-relaxed space-y-1">
          <span className="font-semibold text-sky-800 flex items-center gap-1.5">
            <Smile className="h-3.5 w-3.5 text-sky-600 fill-sky-200" />
            Tranquil Reading Mode
          </span>
          <p>
            To avoid sensory distraction and maintain absolute focus and consistency, GlowTales runs in a beautiful, pure high-typography text reader mode.
          </p>
        </div>
      </div>

      {/* RIGHT BLOCK: Story Preview Output (Takes 7 cols) */}
      <div className="lg:col-span-7">
        
        {/* State A: Initial loading screen */}
        {isGeneratingStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-14 text-center space-y-6 shadow-xs flex flex-col items-center justify-center min-h-[460px]"
            id="story-loader-screener"
          >
            <div className="relative">
              <div className="absolute inset-x-0 -top-4 mx-auto w-10 h-10 bg-sky-100 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-10 w-10 text-sky-500 animate-spin relative" />
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-medium text-slate-800 font-sans">Drafting sensory comfort...</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Our pedatric engine is avoiding metaphors, aligning "{formData.specialInterests}" symmetrically, and ensuring the pacing remains safe and friendly.
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1 max-w-xs overflow-hidden">
              <div className="bg-sky-500 h-full animate-[shimmer_1.5s_infinite]" style={{ width: "65%" }} />
            </div>
          </motion.div>
        )}

        {/* State B: Error boundary note */}
        {generationError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-orange-50 border border-orange-100 rounded-3xl p-6 sm:p-10 space-y-4"
            id="story-error-screener"
          >
            <div className="p-3 bg-white rounded-2xl inline-block shadow-xs">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-orange-950 font-sans">
                {generationError.isRateLimit ? "Service limits reached" : "We hit a quiet spot"}
              </h3>
              <p className="text-xs text-orange-850 font-sans leading-relaxed">
                {generationError.isRateLimit 
                  ? "We have momentarily hit the default sandbox Gemini API limits. Please wait a minute or connect your own API Key in Settings > Secrets to continue uninterrupted."
                  : generationError.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                {isGeneratingStory ? "Constructing narrative..." : "Retry Narrative creation"}
              </button>
            </div>
          </motion.div>
        )}

        {/* State C: Empty/Idle screen */}
        {!isGeneratingStory && !storyResult && !generationError && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[460px]" id="empty-story-state">
            <BookOpen className="h-12 w-12 text-slate-300 stroke-[1.5] mb-4" />
            <h3 className="text-base font-medium text-slate-700 font-sans">Your custom storybook starts here</h3>
            <p className="text-xs text-slate-400 font-sans max-w-sm mt-1.5 leading-relaxed">
              Fill in the star's details on the left, then click <strong>Create Story</strong> to formulate a magical adventure tailored to their favorite focus system.
            </p>
          </div>
        )}

        {/* State D: Completed and active Story Viewer output block */}
        {storyResult && !isGeneratingStory && !generationError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100/90 p-6 sm:p-10 space-y-6 shadow-xs relative"
            id="dynamic-storybook-viewer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-medium text-slate-800 leading-tight">
                  {storyResult.title}
                </h1>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-sky-600 font-semibold font-sans">
                  <Smile className="h-3.5 w-3.5" />
                  <span>Personalized story for {formData.name}</span>
                </div>
              </div>
            </div>

            {/* Key Features diagnostic tabs below header */}
            <div className="grid grid-cols-3 gap-3 pt-1 text-slate-700" id="diagnostic-pills">
              <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Anchored Interest</span>
                <span className="text-[10px] sm:text-xs font-semibold leading-tight block truncate" title={storyResult.keyFeatures.specialInterestUsed}>
                  {storyResult.keyFeatures.specialInterestUsed}
                </span>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">superpower featured</span>
                <span className="text-[10px] sm:text-xs font-semibold leading-tight block text-sky-600 truncate" title={storyResult.keyFeatures.strengthsCelebrated}>
                  {storyResult.keyFeatures.strengthsCelebrated}
                </span>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Sensory Level</span>
                <span className="text-[10px] sm:text-xs font-semibold leading-tight block text-violet-600 truncate" title={storyResult.keyFeatures.sensoryLevel}>
                  {storyResult.keyFeatures.sensoryLevel}
                </span>
              </div>
            </div>

            {/* Structured story sections */}
            <div className="prose max-w-none text-slate-700 leading-relaxed font-sans" id="markdown-story-body">
              {parseAndRenderContentMarkup(storyResult)}
            </div>

            {/* Ending comforting badge */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-center text-center">
              <div className="inline-flex items-center gap-1.5 bg-sky-50 px-4 py-2 rounded-full border border-sky-100 text-xs font-semibold text-sky-800">
                <Smile className="h-4 w-4 text-sky-600 fill-sky-200 animate-bounce" />
                <span>The End of a Gentle Adventure</span>
              </div>
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
