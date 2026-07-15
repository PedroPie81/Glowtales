import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { StoryInput, StoryResult } from "../types";
import { getAuthHeaders } from "../lib/auth";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  User, 
  Heart, 
  BookOpen, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  Smile,
  Trash2,
  Bookmark,
  Camera,
  Layers,
  Sparkle,
  Loader2,
  Maximize2,
  Eye,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function CreateStory() {
  const location = useLocation();

  // 1. Form Data State
  const [formData, setFormData] = useState<StoryInput>({
    name: "",
    age: "7",
    pronouns: "they/them",
    specialInterests: "",
    triggers: "",
    addressTriggers: false,
    length: "Medium",
    sensoryLevel: "Low sensory, reassuring and repetitive",
    structure: "Calming bedtime story with orderly resolution",
    perspective: "Third-person",
    customAppearance: ""
  });

  // Listen for initial router state (e.g. from homepage cards)
  useEffect(() => {
    document.title = "Craft a Personalized Bedtime Story | GlowTales";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Generate a custom, sensory-safe bedtime story designed specifically for your child. Tailor pacing, length, and special interest topics with concrete language structure."
      );
    }
  }, []);

  useEffect(() => {
    if (location.state && typeof location.state === "object") {
      const stateObj = location.state as Record<string, any>;
      if (stateObj.specialInterests) {
        setFormData(prev => ({
          ...prev,
          specialInterests: stateObj.specialInterests
        }));
      }
    }
  }, [location.state]);

  // 2. Navigation / Tab Step inside Form
  const [activeFormStep, setActiveFormStep] = useState<"profile" | "pacing" | "theme">("profile");

  // 3. Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [errorState, setErrorState] = useState<{ message: string; details?: string } | null>(null);
  const [tempApiKey, setTempApiKey] = useState("");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [isEnlargedCoverOpen, setIsEnlargedCoverOpen] = useState(false);

  // 4. Bookshelf list of stories stored in localStorage
  const [bookshelf, setBookshelf] = useState<StoryResult[]>([]);
  // Currently read page (0 = Cover page, 1 = Page 1, etc.)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  // Text size toggle for sensitive custom readers
  const [readerFontSize, setReaderFontSize] = useState<"md" | "lg" | "xl">("lg");

  // Loading messages loop
  const loadingMessages = [
    "Kindling the fireplace embers...",
    "Gathering golden warm ink...",
    "Whispering story ideas to the birds...",
    "Knitting magical blankets for the stars...",
    "Placing a cozy bookmark in your imagination...",
    "Tuning the clock to serene bedtime hours..."
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      timer = setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % loadingMessages.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Load bookshelf on mount
  useEffect(() => {
    const saved = localStorage.getItem("glowtales_library_v2");
    if (saved) {
      try {
        setBookshelf(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to read shelf:", e);
      }
    }
  }, []);

  // Save changes to bookshelf helper
  const saveBookshelfToStorage = (updated: StoryResult[]) => {
    setBookshelf(updated);
    localStorage.setItem("glowtales_library_v2", JSON.stringify(updated));
  };

  // Helper to append a book to our personal hand-carved bookshelf!
  const handleAddToBookshelf = () => {
    if (!story) return;
    const exists = bookshelf.some(b => b.title === story.title);
    if (exists) {
      // Toggle delete
      const filtered = bookshelf.filter(b => b.title !== story.title);
      saveBookshelfToStorage(filtered);
    } else {
      const newBook: StoryResult = {
        ...story,
        id: `story_${Date.now()}`,
        createdAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      };
      saveBookshelfToStorage([newBook, ...bookshelf]);
    }
  };

  const handleRemoveFromBookshelf = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookshelf.filter(b => b.id !== id);
    saveBookshelfToStorage(updated);
  };

  // Pre-fill cozy presets for fast testing / comforting suggestions
  const handleQuickPreset = (interest: string, triggersText: string) => {
    setFormData(prev => ({
      ...prev,
      specialInterests: interest,
      triggers: triggersText,
      name: "Leo"
    }));
  };

  // Submits form and orchestrates backend API call
  const generatePersonalizedStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter the child's name so they can be the cozy star of their novel!");
      return;
    }
    if (!formData.specialInterests.trim()) {
      alert("Please detail their special interests (such as trains, clocks, or space maps)!");
      return;
    }

    setIsGenerating(true);
    setErrorState(null);
    setStory(null);
    setCurrentPageIndex(0);

    try {
      // Step A: Generate narrative and cover prompt
      const storyRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!storyRes.ok) {
        const errorJson = await storyRes.json().catch(() => ({}));
        const errObj: any = new Error(errorJson.error || `Story generation failed with status: ${storyRes.status}`);
        errObj.details = errorJson.details;
        throw errObj;
      }

      const storyData: StoryResult = await storyRes.json();
      
      // Seed initial result with no cover image URL yet
      setStory(storyData);
      setIsGenerating(false);

      // Trigger cover image generation in the background asynchronously
      generateCoverArtwork(storyData);

    } catch (err: any) {
      console.error(err);
      const isAuthProblem = 
        String(err.message || "").toLowerCase().includes("api key") || 
        String(err.message || "").toLowerCase().includes("apikey") || 
        String(err.message || "").toLowerCase().includes("unauthorized") || 
        String(err.message || "").toLowerCase().includes("permission") || 
        String(err.details || "").toLowerCase().includes("api key") || 
        String(err.details || "").toLowerCase().includes("apikey") || 
        String(err.details || "").toLowerCase().includes("api_key");

      setErrorState({
        message: err.message || "The story creation encountered a little quiet spot.",
        details: err.details || (isAuthProblem 
          ? "Your GEMINI_API_KEY is unset or invalid. Please configure your key in Google AI Studio under Settings > Secrets." 
          : "The server could not complete the story generation. If you recently configured GEMINI_API_KEY on Vercel, please make sure you triggered a new Redeployment so Vercel can load the updated variables onto the live server.")
      });
      setIsGenerating(false);
    }
  };

  // Generates dynamic cover artwork utilizing the Imagen / Gemini fallback API
  const generateCoverArtwork = async (storyData: StoryResult) => {
    setIsGeneratingCover(true);
    setCoverError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: storyData.title,
          coverIllustrationPrompt: storyData.coverIllustrationPrompt,
          referencePhoto: formData.referencePhoto,
          characterAppearance: storyData.characterAppearance
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Cover painting failed with status: ${res.status}`);
      }

      const imgData = await res.json();
      if (imgData.imageUrl) {
        const updatedStory = {
          ...storyData,
          coverImageUrl: imgData.imageUrl
        };
        setStory(updatedStory);

        // Also update bookshelf item if it was already saved
        setBookshelf(prevShelf => {
          const updatedShelf = prevShelf.map(item => {
            if (item.title === storyData.title) {
              return { ...item, coverImageUrl: imgData.imageUrl };
            }
            return item;
          });
          localStorage.setItem("glowtales_library_v2", JSON.stringify(updatedShelf));
          return updatedShelf;
        });
      }
    } catch (err: any) {
      console.error("Cover image generation error:", err);
      setCoverError(err.message || "The cover painting encountered a little quiet spot.");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Parse text pages by the '---' line splitter
  const getStoryPages = () => {
    if (!story) return [];
    // Split by '---' on its own line
    return story.content
      .split(/\n---\s*\n|\n---\n|---/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  const pages = getStoryPages();
  const totalBookPages = pages.length + 1; // + 1 for Front Cover

  return (
    <div className="max-w-6xl mx-auto py-2 font-sans" id="create-tale-viewport">
      
      {/* Visual Page Header: Cozy children book banner */}
      <div className="text-center mb-10 max-w-2xl mx-auto px-4" id="intro-cozy-container">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 mb-3">
          <BookOpen className="h-3 w-3" /> Warm Custom Studio
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-amber-900 font-display mb-3">
          Settle Down with a Cozy Custom Tale
        </h1>
        <p className="text-amber-800/80 text-sm md:text-base leading-relaxed">
          Craft a low-stimulus, comforting adventure celebrating your child's passions, structured with soothing pacing and a happy, logical resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start px-2">
        
        {/* LEFT COLUMN: Generation Form (span 5) */}
        {!story && (
          <div className="lg:col-span-5 bg-[#FAF6F0] border border-[#E9DFD0] rounded-3xl p-6 shadow-sm relative overflow-hidden" id="story-form-block">
            
            {/* Subtle wood-grain frame background effect */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-700/80" />

          <h2 className="text-xl font-bold font-display text-amber-900 mb-6 flex items-center justify-between">
            <span>📚 Story Book Builder</span>
            <span className="text-xs text-amber-600/70 font-sans font-normal">Page-by-page personalized</span>
          </h2>

          {/* Form Step Badges */}
          <div className="flex bg-amber-100/50 rounded-2xl p-1 mb-6 text-xs font-semibold text-amber-800">
            <button
              onClick={() => setActiveFormStep("profile")}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                activeFormStep === "profile" ? "bg-white text-amber-950 font-bold shadow-xs" : "hover:text-amber-950"
              }`}
            >
              1. Child's Profile
            </button>
            <button
              onClick={() => setActiveFormStep("pacing")}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                activeFormStep === "pacing" ? "bg-white text-amber-950 font-bold shadow-xs" : "hover:text-amber-950"
              }`}
            >
              2. Passions & Support
            </button>
            <button
              onClick={() => setActiveFormStep("theme")}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                activeFormStep === "theme" ? "bg-white text-amber-950 font-bold shadow-xs" : "hover:text-amber-950"
              }`}
            >
              3. Vibe & Reading
            </button>
          </div>

          <form onSubmit={generatePersonalizedStory} className="space-y-6">
            
            {/* Step 1: Child's Profile content */}
            {activeFormStep === "profile" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="child-name">
                    Child's First Name
                  </label>
                  <div className="relative">
                    <input
                      id="child-name"
                      type="text"
                      className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900 font-medium placeholder-amber-700/30"
                      placeholder="e.g. Leo, Alice, Danny"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <User className="absolute right-3.5 top-3.5 h-4 w-4 text-[#C5B49D]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="child-age">
                      Age (for vocabulary)
                    </label>
                    <input
                      id="child-age"
                      type="number"
                      min="2"
                      max="16"
                      className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                      value={formData.age}
                      onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="child-pronouns">
                      Pronouns
                    </label>
                    <select
                      id="child-pronouns"
                      className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                      value={formData.pronouns}
                      onChange={e => setFormData(prev => ({ ...prev, pronouns: e.target.value }))}
                    >
                      <option value="he/him">He / Him</option>
                      <option value="she/her">She / Her</option>
                      <option value="they/them">They / Them</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="child-phys-desc">
                    Appearance Details (Friendly Comfort)
                  </label>
                  <textarea
                    id="child-phys-desc"
                    rows={2}
                    className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900 placeholder-amber-700/40"
                    placeholder="e.g., green overalls, yellow cap, friendly smile, big glasses (Helps generate matching cover image!)"
                    value={formData.customAppearance}
                    onChange={e => setFormData(prev => ({ ...prev, customAppearance: e.target.value }))}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFormStep("pacing")}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition duration-150 mt-2"
                >
                  Next Step: Passions <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Passions & Support content */}
            {activeFormStep === "pacing" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1" htmlFor="child-interests">
                    Special Interests & Passions (Crucial ⭐)
                  </label>
                  <span className="block text-[11px] text-amber-800/60 mb-2 leading-relaxed font-sans">
                    Weave their deep interest (e.g. steam trains, pocket watches, bird-watching, solar systems) directly into the story as a celebrated talent!
                  </span>
                  <textarea
                    id="child-interests"
                    rows={2}
                    className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900 placeholder-amber-700/30"
                    placeholder="e.g., steam trains, sorting marbles by color, old maps, mechanical gears"
                    value={formData.specialInterests}
                    onChange={e => setFormData(prev => ({ ...prev, specialInterests: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="child-triggers">
                    Sensory Preferences or Potential Triggers
                  </label>
                  <input
                    id="child-triggers"
                    type="text"
                    className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900 placeholder-amber-700/30"
                    placeholder="e.g., sudden loud siren noises, large busy crowds, flashing lights"
                    value={formData.triggers}
                    onChange={e => setFormData(prev => ({ ...prev, triggers: e.target.value }))}
                  />
                </div>

                <div className="bg-amber-100/30 border border-amber-200/50 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="address-triggers"
                      type="checkbox"
                      className="cursor-pointer h-4 w-4 rounded-sm text-amber-600 focus:ring-amber-500 border-amber-300 mt-0.5"
                      checked={formData.addressTriggers}
                      onChange={e => setFormData(prev => ({ ...prev, addressTriggers: e.target.checked }))}
                    />
                    <label htmlFor="address-triggers" className="text-xs text-amber-900 font-sans cursor-pointer leading-tight">
                      <strong>Reassuring Trigger Practice</strong>
                      <span className="block text-amber-800/70 text-[10.5px] mt-0.5">
                        Instead of omitting, gently address the trigger in the story, demonstrating how it can be safely and peacefully resolved in a Quiet, low-sensory environment.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Quick Presets row */}
                <div className="pt-1">
                  <span className="block text-[10px] uppercase tracking-widest text-[#9C6B43] font-bold mb-2">💡 Quick Inspo Presets</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPreset("steam locomotives with exact wheels count", "loud whistling whistles")}
                      className="cursor-pointer bg-[#F5EBE1] hover:bg-[#EBDCCF] text-[#6E421E] px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-250/20"
                    >
                      Steam Trains 🚂
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset("cozy mechanical pocket watches ticking", "crowded buzzing schoolrooms")}
                      className="cursor-pointer bg-[#F5EBE1] hover:bg-[#EBDCCF] text-[#6E421E] px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-250/20"
                    >
                      Pocket Clocks 🕰️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset("sorting beach seashells by spiral patterns", "unexpected visual flashes")}
                      className="cursor-pointer bg-[#F5EBE1] hover:bg-[#EBDCCF] text-[#6E421E] px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-250/20"
                    >
                      Beach Shells 🐚
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFormStep("theme")}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition duration-150"
                >
                  Next: Pacing & Length <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 3: Vibe & Reading content */}
            {activeFormStep === "theme" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="book-length">
                      Length
                    </label>
                    <select
                      id="book-length"
                      className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                      value={formData.length}
                      onChange={e => setFormData(prev => ({ ...prev, length: e.target.value as any }))}
                    >
                      <option value="Short">Short (~2-3 pages)</option>
                      <option value="Medium">Medium (~3-5 pages)</option>
                      <option value="Long">Long (~4-6 pages)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="book-perspective">
                      Perspective
                    </label>
                    <select
                      id="book-perspective"
                      className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                      value={formData.perspective}
                      onChange={e => setFormData(prev => ({ ...prev, perspective: e.target.value as any }))}
                    >
                      <option value="Third-person">Third-Person ("Leo felt...")</option>
                      <option value="First-person">First-Person ("I felt...")</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="sensory-pacing">
                    Sensory Level & Sound Pacing
                  </label>
                  <select
                    id="sensory-pacing"
                    className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-3 py-3 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                    value={formData.sensoryLevel}
                    onChange={e => setFormData(prev => ({ ...prev, sensoryLevel: e.target.value }))}
                  >
                    <option value="Low sensory, reassuring and repetitive">Low-stimulation, calm repetition & predictable patterns</option>
                    <option value="Extremely quiet, slow tempo descriptive">Extremely quiet, focus on micro-details & soft environments</option>
                    <option value="Mild interest-led adventure">Mildly interactive, exploring focus passions happily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-widest mb-1.5" htmlFor="story-resolve">
                    Story Structure / Calm Flow
                  </label>
                  <select
                    id="story-resolve"
                    className="w-full bg-white border border-[#E0D4C3] rounded-2xl px-3 py-3 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-amber-900"
                    value={formData.structure}
                    onChange={e => setFormData(prev => ({ ...prev, structure: e.target.value }))}
                  >
                    <option value="Calming bedtime story with orderly resolution">Soft winding-down bedtime story for deep peace</option>
                    <option value="Structured sensory routine helper with happy closure">Sensory logic routine builder with familiar steps</option>
                    <option value="Warm discovery tale showcasing detail-attention skill">Discovery tale showcasing sensory-detail strengths</option>
                  </select>
                </div>

                {/* Confirm banner: Single cover image reminder */}
                <div className="bg-amber-100/30 border border-amber-200/40 rounded-2xl p-3 text-[10.5px] text-amber-900 leading-normal flex items-start gap-2">
                  <Bookmark className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="font-sans">
                    <strong>Front Cover Illustration only:</strong> This book creates one beautiful front cover illustration matching your child's specifics. No chaotic inner-page images to prevent cognitive visual inconsistency.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep("pacing")}
                    className="flex-1 bg-amber-50 cursor-pointer text-amber-900 font-bold border border-amber-250/20 py-3 rounded-xl hover:bg-amber-100/60 font-sans text-xs transition active:scale-98"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition duration-150"
                  >
                    <Sparkles className="h-4 w-4 fill-white" /> Create Cozy Story!
                  </button>
                </div>
              </motion.div>
            )}

          </form>
          
          {/* Wooden desk drawer accent line */}
          <div className="mt-8 pt-4 border-t border-amber-900/10 text-center">
            <span className="text-[11px] text-[#A58E71] font-serif italic">Every story is written using server-secure, fully personalized intelligence.</span>
          </div>

        </div>
        )}

        {/* RIGHT COLUMN: Interactive Cozy Reader & Bookshelf (span 7 or 12) */}
        <div className={`${story ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-7"} flex flex-col gap-8`} id="comfort-display-frame">
          
          {/* 1. Loading State */}
          {isGenerating && (
            <div className="bg-[#FAF6F0] border border-[#E9DFD0] rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center" id="generator-loader">
              <div className="relative mb-6">
                {/* Glowing cozy campfire animation */}
                <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkle className="h-8 w-8 text-amber-600 fill-amber-500 animate-spin-slow" />
                </div>
                <div className="absolute top-1 left-2 h-2 w-2 rounded-full bg-orange-400 animate-ping" />
              </div>
              <h3 className="text-xl font-bold font-display text-amber-900 mb-2">
                Weaving Warm Thoughts...
              </h3>
              <p className="text-amber-700/80 text-sm max-w-sm font-serif italic">
                "{loadingMessages[loadingMessageIdx]}"
              </p>
              <div className="w-48 bg-amber-100/60 rounded-full h-1.5 mt-6 overflow-hidden">
                <div className="bg-amber-600 h-full animate-loader rounded-full" />
              </div>
            </div>
          )}

          {/* 2. Error Panel */}
          {errorState && !isGenerating && (
            <div className="bg-[#FAF5EE] border border-[#EADBCC] rounded-3xl p-8 text-center" id="generator-error">
              <AlertCircle className="h-10 w-10 text-amber-800 mx-auto mb-3" />
              <h3 className="text-md font-bold text-amber-950 mb-1 font-display">Could Not Connect To Storyteller</h3>
              <p className="text-amber-900/85 text-xs mb-4 max-w-md mx-auto">{errorState.message}</p>
              
              {errorState.details && (
                <div className="bg-white/90 p-4 rounded-2xl text-[10px] sm:text-xs text-[#5D4E41] font-mono mb-4 text-left border border-[#EDE4D9] max-h-24 overflow-y-auto leading-relaxed">
                  {errorState.details}
                </div>
              )}

              {/* Dynamic API Key secure injector form for standalone website mode */}
              {(errorState.message.toLowerCase().includes("api key") || 
                errorState.message.toLowerCase().includes("unauthorized") ||
                errorState.message.toLowerCase().includes("scopes") ||
                (errorState.details && errorState.details.toLowerCase().includes("api_key")) ||
                (errorState.details && errorState.details.toLowerCase().includes("api key"))) && (
                <div className="bg-[#FAF0E6] border border-[#E3D4C3] rounded-2xl p-5 mb-5 text-left space-y-3" id="fallback-api-key-panel">
                  <h4 className="text-xs font-bold text-[#6B5138] uppercase tracking-wider">🌟 Standalone Website Helper</h4>
                  <p className="text-[#6B5A4B] text-[11px] leading-relaxed">
                    Because this is the public-facing, shared website URL, Google AI Studio secures your private, billable administrative Key. If you wish to play directly on this standalone link, please paste your <strong>Gemini API Key</strong> below to establish a secure browser-side connection:
                  </p>
                  <p className="text-[10px] text-[#A6937C] font-semibold italic">
                    🔓 Stored exclusively inside your personal browser's local sessionStorage (never shared or saved to any backend database).
                  </p>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="password"
                      placeholder="Paste your Gemini API Key (AIzaSy...)"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="bg-white border border-[#DDD3C5] rounded-xl px-3 py-2 text-xs text-[#5D4E41] w-full focus:outline-hidden focus:ring-1 focus:ring-[#C5965E] font-mono shadow-inner"
                      id="standalone-api-key-input"
                    />
                    <button
                      onClick={() => {
                        if (tempApiKey.trim()) {
                          sessionStorage.setItem("gemini_api_key", tempApiKey.trim());
                          console.log("[GlowTales Auth Proxy] Activating manual public API key bypass");
                          setErrorState(null);
                        }
                      }}
                      disabled={!tempApiKey.trim()}
                      className="bg-[#C5965E] hover:bg-[#B3834D] disabled:opacity-50 text-white font-bold text-xs px-4 rounded-xl cursor-pointer active:scale-95 transition whitespace-nowrap"
                      id="save-api-key-btn"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setErrorState(null)}
                  className="cursor-pointer bg-[#F5EFE6] hover:bg-[#EADBCC] text-[#6B5138] border border-[#EADBCC] font-bold text-xs py-2 px-4 rounded-xl active:scale-95 transition"
                >
                  Clear Notice
                </button>
              </div>
            </div>
          )}

          {/* 3. Empty State Instructions */}
          {!story && !isGenerating && !errorState && (
            <div className="bg-[#FCFAF7] border border-[#EDE4D9] rounded-3xl p-10 text-center shadow-3xs flex flex-col items-center justify-center" id="empty-story-placeholder">
              <div className="p-4 rounded-full bg-amber-50 border border-amber-100 mb-4">
                <BookOpen className="h-8 w-8 text-[#C5965E]" />
              </div>
              <h3 className="text-lg font-bold font-display text-amber-950 mb-2">Your Cozy Storybook Awaits</h3>
              <p className="text-amber-800/70 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                Fill out your kid's character details and special interests on the left. Press <strong className="text-amber-900">Create Cozy Story</strong> to watch a gorgeous personalized hardcover book generate right before your eyes.
              </p>
              
              <div className="w-full max-w-md bg-[#FAF6F0] p-4 rounded-2xl border border-[#E9DFD0]/60 text-left space-y-3">
                <span className="text-[10px] font-bold text-[#A48261] uppercase tracking-wider block">🛡️ Built-in Sensory Guardrails:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#715D4D]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span> Highly Literal Text
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span> No Loud Screaming
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span> Detail-focused Plot
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span> Comforting Ending
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. ACTIVE storybook reader */}
          {story && !isGenerating && (
            <div className="bg-[#FCFAF7] border border-[#ECCFBA] rounded-3xl p-5 md:p-7 shadow-xs relative" id="story-reader-module">
              
              {/* Reader Action Ribbon: Save to shelf & Custom font sizes */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECCFBA]/60 pb-4 mb-5 text-xs text-amber-900 font-sans">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setStory(null);
                      setCurrentPageIndex(0);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-3.5 py-2 font-bold transition active:scale-95 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 fill-white" />
                    <span>Build Another Story</span>
                  </button>

                  <button
                    onClick={handleAddToBookshelf}
                    className="inline-flex cursor-pointer items-center gap-1 bg-[#FAF6F0] hover:bg-amber-100 border border-[#E1D4C1] text-amber-900 rounded-xl px-3 py-2 font-bold transition active:scale-95"
                  >
                    <Heart className={`h-4.5 w-4.5 transition ${bookshelf.some(b => b.title === story.title) ? "text-red-500 fill-red-500" : "text-amber-800"}`} />
                    <span>{bookshelf.some(b => b.title === story.title) ? "Saved! ❤️" : "Save to Bookshelf"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-800/60 font-medium">Font size:</span>
                  <div className="inline-flex bg-[#FAF6F0] border border-[#E1D4C1] rounded-xl p-0.5">
                    <button
                      onClick={() => setReaderFontSize("md")}
                      className={`px-2 py-1 text-[10.5px] cursor-pointer rounded-lg font-bold ${readerFontSize === "md" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setReaderFontSize("lg")}
                      className={`px-2.5 py-1 text-[12.5px] cursor-pointer rounded-lg font-bold ${readerFontSize === "lg" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setReaderFontSize("xl")}
                      className={`px-3 py-1 text-[14.5px] cursor-pointer rounded-lg font-bold ${readerFontSize === "xl" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                    >
                      A
                    </button>
                  </div>
                </div>
              </div>

              {/* BOOK CONTAINER LAYOUT */}
              <div className="min-h-[460px] flex flex-col justify-between" id="virtual-book-canvas">
                
                {/* PAGE CONTAINER */}
                <div className="flex-1 py-1">
                  
                  {/* COVER PAGE (INDEX 0) */}
                  {currentPageIndex === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col md:flex-row gap-6 items-center"
                      id="storybook-cover-sheet"
                    >
                      {/* Left Block: Hardcover Cozy Graphic */}
                      <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative w-full max-w-[270px] aspect-[3/4] rounded-2xl shadow-xl border-r-8 border-amber-950/25 bg-gradient-to-tr from-[#3D2612] to-[#634021] text-amber-50 overflow-hidden flex flex-col justify-between p-6 text-center border-l border-t border-b border-amber-800/20">
                          
                          {story.coverImageUrl && (
                            <div className="absolute inset-0 w-full h-full z-0">
                              <img
                                src={story.coverImageUrl}
                                alt="Cover Art"
                                className="w-full h-full object-cover"
                              />
                              {/* Dark gradient overlay to ensure text legibility */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/70 z-10" />
                            </div>
                          )}

                          {story.coverImageUrl && !isGeneratingCover && (
                            <button
                              onClick={() => setIsEnlargedCoverOpen(true)}
                              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/55 hover:bg-black/80 text-amber-100 hover:text-white transition-all active:scale-95 border border-amber-300/10 shadow-sm"
                              title="Enlarge Clean Cover Art (Without Overlaid Text)"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Top Border & Star */}
                          <div className="border-b border-amber-400/20 pb-4 flex flex-col items-center z-20">
                            <Sparkle className="h-6 w-6 text-amber-400 fill-amber-300/80 mb-1 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">GlowTales Bedtime Book</span>
                          </div>

                          {/* Center Title and child's name */}
                          <div className="space-y-3 my-auto z-20">
                            <h4 className="text-base sm:text-lg font-extrabold font-display leading-tight text-amber-100 italic px-2 drop-shadow-md">
                              {story.title}
                            </h4>
                            <div className="w-16 h-[1.5px] bg-amber-400/40 mx-auto" />
                            <p className="text-[11px] font-serif text-amber-200/90 tracking-wide drop-shadow-sm">
                              Especially for <span className="font-bold text-amber-100">{formData.name}</span>
                            </p>
                          </div>

                          {/* Bottom design elements */}
                          <div className="border-t border-amber-400/20 pt-4 flex justify-between items-center text-[10px] text-amber-300/70 font-mono z-20">
                            <span>EDITION I</span>
                            <div className="flex gap-1">
                              <span className="text-xs">✦</span>
                              <span className="text-xs">✦</span>
                              <span className="text-xs">✦</span>
                            </div>
                            <span>UTC COZY</span>
                          </div>
                          
                          {/* Book cover Spine accent layout */}
                          <div className="absolute top-0 left-0 bottom-0 w-3 bg-amber-950/45 z-20" />

                          {/* Painting/Generating overlay */}
                          {isGeneratingCover && (
                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 z-30 backdrop-blur-xs">
                              <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-2" />
                              <span className="text-xs font-bold text-amber-200">Painting cover artwork...</span>
                              <span className="text-[9px] text-amber-300/80 mt-1 text-center">Detailed watercolor with Gemini</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Block: Cover Title Metadata */}
                      <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                        <span className="inline-block text-[10px] uppercase font-bold text-amber-700/80 tracking-widest bg-amber-100/40 px-2.5 py-1 rounded-full">
                          ⭐ A Personalized Adventure
                        </span>
                        
                        <h3 className="text-2xl md:text-3xl font-extrabold text-amber-950 font-display leading-tight">
                          {story.title}
                        </h3>

                        <p className="text-[#8B5E3C] text-xs font-sans">
                          Written especially for <strong className="text-amber-950">{formData.name}</strong> • Age {formData.age} • Pronouns {formData.pronouns}
                        </p>

                        <div className="bg-amber-100/20 border border-amber-250/30 rounded-2xl p-3.5 space-y-2 text-xs text-amber-950 text-left">
                          <span className="font-bold text-amber-900 block font-sans">💡 Autistic Strength Highlighted:</span>
                          <p className="text-amber-850/80 leading-relaxed font-sans text-[11px]">
                            {story.keyFeatures?.strengthsCelebrated || "Celebrating deep pattern logic and incredible focus!"}
                          </p>
                        </div>
                        
                        {story.characterAppearance && (
                          <div className="text-[10px] text-amber-800/60 leading-normal border-t border-amber-900/10 pt-2 text-left font-serif max-h-16 overflow-y-auto">
                            <strong>Consistent Hero style:</strong> {story.characterAppearance}
                          </div>
                        )}

                        {/* Cover image generation status & controls */}
                        <div className="pt-2">
                          {coverError && (
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-orange-800 flex items-start gap-2 text-left animate-fade-in">
                              <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Cover Painting Issue:</p>
                                <p className="opacity-90 text-[11px] leading-relaxed">{coverError}</p>
                                <button
                                  onClick={() => generateCoverArtwork(story)}
                                  className="mt-2 inline-flex items-center gap-1 cursor-pointer bg-orange-150 hover:bg-orange-200 text-orange-950 font-bold px-2.5 py-1 rounded-lg transition text-[10px]"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>Retry Painting</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {!story.coverImageUrl && !isGeneratingCover && !coverError && (
                            <button
                              onClick={() => generateCoverArtwork(story)}
                              className="inline-flex items-center gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition active:scale-95 shadow-sm"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                              Paint Detailed Cover Art
                            </button>
                          )}

                          {story.coverImageUrl && !isGeneratingCover && (
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                ✓ Custom Cover Art Painted
                              </span>
                              
                              <button
                                onClick={() => setIsEnlargedCoverOpen(true)}
                                className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 px-3.5 py-2 rounded-xl transition shadow-3xs active:scale-95"
                                title="View pristine cover illustration without overlaid text"
                              >
                                <Eye className="h-3.5 w-3.5 text-amber-800" />
                                <span>View Clean Artwork</span>
                              </button>

                              <button
                                onClick={() => generateCoverArtwork(story)}
                                className="inline-flex items-center gap-1 cursor-pointer text-[10.5px] font-bold text-amber-700 hover:text-amber-900 underline"
                                title="Regenerate Cover Artwork"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Repaint</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-[#C5A384] text-[11px] font-sans font-medium pt-2">
                          👉 Press Next Page below to start reading the chapter!
                        </p>
                      </div>

                    </motion.div>
                  )}

                  {/* PARCHMENT CONTENT PAGE (INDEX 1+) */}
                  {currentPageIndex > 0 && pages[currentPageIndex - 1] && (
                    <motion.div
                      key={currentPageIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#ECCFBA]/45 shadow-3xs"
                      id={`storybook-page-${currentPageIndex}`}
                    >
                      {/* Page number badge */}
                      <div className="text-right text-[11px] font-mono text-amber-600/60 mb-3 uppercase tracking-wider font-bold">
                        Page {currentPageIndex} of {pages.length}
                      </div>

                      {/* Display readable content */}
                      <div className={`text-amber-950 font-serif leading-relaxed tracking-wide space-y-4 text-left ${
                        readerFontSize === "md" ? "text-sm sm:text-base" :
                        readerFontSize === "lg" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                      }`}>
                        {pages[currentPageIndex - 1].split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            {paragraph.trim().replace(/^---$/g, "")}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* BOTTOM STORYBOOK PAGE FLIPPER CONTROLS */}
                <div className="flex items-center justify-between border-t border-[#ECCFBA]/60 pt-4 mt-6">
                  {/* Previous page button */}
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition ${
                      currentPageIndex === 0 
                        ? "text-amber-900/30 bg-transparent cursor-not-allowed" 
                        : "text-[#623E1C] bg-amber-100 hover:bg-amber-200"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" /> Cover
                  </button>

                  <div className="text-xs font-mono font-bold text-amber-800">
                    {currentPageIndex === 0 ? "📙 Cover Page" : `📖 Chapter Page ${currentPageIndex}`}
                  </div>

                  {/* Next page button */}
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.min(totalBookPages - 1, prev + 1))}
                    disabled={currentPageIndex === totalBookPages - 1}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition ${
                      currentPageIndex === totalBookPages - 1 
                        ? "text-amber-900/30 bg-transparent cursor-not-allowed" 
                        : "text-white bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* 5. INTERACTIVE WOODEN BOOKSHELF */}
          <div className="bg-[#FAF6F0] border border-[#E9DFD0] rounded-3xl p-5 shadow-xs relative" id="cozy-bookshelf-component">
            <h3 className="text-md font-bold text-amber-900 font-display mb-4 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-700 fill-amber-300" />
              <span>My Warm Wooden Bookshelf ({bookshelf.length})</span>
            </h3>

            {bookshelf.length === 0 ? (
              <div className="border border-dashed border-amber-950/20 rounded-2xl p-6 text-center text-xs text-amber-800/60 font-serif italic">
                Your shelf is empty! Craft a tale, and click "Save to Bookshelf" to collect your children's book series here in order.
              </div>
            ) : (
              <div className="space-y-4" id="bookshelf-list">
                
                {/* Visual Wooden Shelf Board Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-2" id="bookshelf-row">
                  {bookshelf.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setStory(book);
                        setCurrentPageIndex(0);
                        if (book.inputs) {
                          setFormData(book.inputs);
                        }
                      }}
                      className="cursor-pointer group flex flex-col focus:outline-none text-left bg-white border border-[#EDE4D9] rounded-2xl p-3 shadow-3xs hover:shadow-xs hover:border-[#D5C2AD] transition-all relative overflow-hidden"
                    >
                      {/* Cover spine ornament strip */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-800/40 group-hover:bg-amber-800/80 transition" />

                      {/* Small visual image cover frame */}
                      <div className="aspect-[3/4] w-full rounded-lg bg-gradient-to-tr from-[#3D2612] to-[#634021] mb-2 overflow-hidden flex flex-col justify-between p-2.5 text-center border border-amber-900/30 relative shadow-3xs group-hover:shadow-xs transition">
                        {book.coverImageUrl ? (
                          <img
                            src={book.coverImageUrl}
                            alt="Book Miniature"
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <>
                            <div className="flex justify-center">
                              <Sparkle className="h-3 w-3 text-amber-400 fill-amber-300" />
                            </div>
                            <span className="text-[9px] font-bold text-amber-100 leading-tight block truncate font-serif px-0.5">
                              {book.title}
                            </span>
                            <div className="text-[8px] text-amber-300/70 font-sans tracking-tight">
                              GlowTales
                            </div>
                            {/* Book Spine miniature */}
                            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-950/40" />
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pl-1">
                        <h4 className="text-[12px] font-bold text-amber-950 truncate group-hover:text-amber-700">
                          {book.title}
                        </h4>
                        <p className="text-[10px] text-amber-800/70 block font-sans">
                          For {book.inputs?.name || "Cozy Star"} • {book.createdAt || "Curated"}
                        </p>
                      </div>

                      {/* Remove delete clicker utility */}
                      <button
                        onClick={(e) => handleRemoveFromBookshelf(book.id || "", e)}
                        className="cursor-pointer absolute top-1 right-1 p-1 bg-white/90 rounded-md border border-amber-100 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition text-[#A48261]"
                        title="Remove from shelf"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  ))}
                </div>

                {/* Wooden Board shelf line overlay */}
                <div className="h-3 bg-gradient-to-b from-[#A07044] to-[#7F5027] rounded-full shadow-3xs border-b border-[#5E3614]" />
                
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Pristine Clean Cover Art Modal */}
      <AnimatePresence>
        {isEnlargedCoverOpen && story && story.coverImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setIsEnlargedCoverOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-lg w-full aspect-[3/4] bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clean cover artwork with no writing across it */}
              <img
                src={story.coverImageUrl}
                alt="Enlarged Pristine Cover Art"
                className="w-full h-full object-cover select-none"
              />

              {/* Close Button */}
              <button
                onClick={() => setIsEnlargedCoverOpen(false)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition active:scale-95 shadow-md border border-white/10"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Bottom Info Ribbon */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-left">
                <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase font-mono">Pristine Illustration Artwork</span>
                <h4 className="text-base font-bold text-white mt-1 leading-tight">{story.title}</h4>
                {story.characterAppearance && (
                  <p className="text-neutral-300 text-xs mt-1 line-clamp-2 leading-relaxed">
                    Style: {story.characterAppearance}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
