import { useState } from "react";
import { Sparkles, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

// Import premium pre-generated watercolor illustrations for example stories
import leoPlatformImg from "../assets/images/leo_platform_v3_1780221986339.png";
import leoEngineImg from "../assets/images/leo_engine_v3_1780222002550.png";
import leoCountingImg from "../assets/images/leo_counting_v3_1780222022269.png";
import leoSunsetImg from "../assets/images/leo_sunset_v3_1780222036455.png";

import mayaPorchImg from "../assets/images/maya_porch_new_1780221552781.png";
import mayaTelescopeImg from "../assets/images/maya_telescope_new_1780221572448.png";
import mayaBadgerImg from "../assets/images/maya_badger_new_1780221593574.png";
import mayaBurrowImg from "../assets/images/maya_burrow_new_1780221612345.png";

interface StoryIllustrationProps {
  keyword: string;
  description: string;
  characterAppearance?: string;
  objectAppearance?: string;
  imageUrl?: string;
  onGenerateImage?: () => Promise<void>;
  isGenerating?: boolean;
  visualStyle?: "vector" | "watercolor" | "contrast";
  childName?: string;
  errorMsg?: string;
}

export default function StoryIllustration({
  keyword,
  description,
  characterAppearance,
  objectAppearance,
  imageUrl,
  onGenerateImage,
  isGenerating = false,
  visualStyle = "watercolor",
  childName,
  errorMsg: parentErrorMsg,
}: StoryIllustrationProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleManualGenerate = async () => {
    if (!onGenerateImage) return;
    setLocalError(null);
    try {
      await onGenerateImage();
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || "Failed to generate dynamic illustration from the Gemini API.");
    }
  };

  // Get premium pre-generated fallback if available
  const getPreGeneratedFallback = () => {
    switch (keyword) {
      // Leo's Train Story
      case "train_platform":
        return leoPlatformImg;
      case "blue_engine_desc":
        return leoEngineImg;
      case "counting_wheels":
        return leoCountingImg;
      case "sunset_chugging":
        return leoSunsetImg;

      // Maya's Star Story
      case "porch_stars":
        return mayaPorchImg;
      case "telescope_lens":
        return mayaTelescopeImg;
      case "badger_friend":
        return mayaBadgerImg;
      case "happy_burrow":
        return mayaBurrowImg;

      default:
        return null;
    }
  };

  const preGeneratedFall = getPreGeneratedFallback();

  // Render highly specific, beautifully crafted calm SVGs for each story state
  // Supports 'vector' (100% mathematically consistent), 'contrast' (silent golden glyphs), and 'watercolor'
  const renderFallbackSVG = (style: "vector" | "contrast" | "watercolor") => {
    const strokeColor = "#475569";
    const secondaryColor = "#ef4444"; // Consistent Wheel Red
    const isContrastMode = style === "contrast";

    // 1. High contrast silent gold-on-slate glyph style (Ultra-predictable & Calming)
    if (isContrastMode) {
      switch (keyword) {
        case "train_platform":
        case "blue_engine_desc":
        case "counting_wheels":
        case "sunset_chugging":
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a] p-4" id="contrast-train">
              <rect width="100%" height="100%" fill="#0f172a" rx="16" />
              {/* Orderly Star & Rail Silhouette */}
              <line x1="20" y1="160" x2="380" y2="160" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="8,6" />
              <circle cx="200" cy="100" r="35" fill="none" stroke="#fef08a" strokeWidth="3" />
              {/* Symbolic Standalone Steam Train Glyphs */}
              <rect x="175" y="85" width="50" height="30" fill="none" stroke="#fef08a" strokeWidth="2.5" />
              <circle cx="185" cy="125" r="8" fill="none" stroke="#fef08a" strokeWidth="2.5" />
              <circle cx="200" cy="125" r="8" fill="none" stroke="#fef08a" strokeWidth="2.5" />
              <circle cx="215" cy="125" r="8" fill="none" stroke="#fef08a" strokeWidth="2.5" />
              <text x="50%" y="185" textAnchor="middle" fill="#fde047" className="text-[10px] font-mono tracking-widest">
                SYMBOLIC PREDICTABLE LAYOUT
              </text>
            </svg>
          );
        case "porch_stars":
        case "telescope_lens":
        case "badger_friend":
        case "happy_burrow":
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a] p-4" id="contrast-stars">
              <rect width="100%" height="100%" fill="#0f172a" rx="16" />
              <circle cx="200" cy="90" r="45" fill="none" stroke="#fef08a" strokeWidth="2.5" />
              {/* Star shapes */}
              <polygon points="200,60 203,70 212,70 205,76 208,85 200,80 192,85 195,76 188,70 197,70" fill="none" stroke="#fef08a" strokeWidth="2" />
              {/* Symmetrical line points */}
              <line x1="120" y1="90" x2="155" y2="90" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3,3" />
              <line x1="245" y1="90" x2="280" y2="90" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3,3" />
              <circle cx="120" cy="90" r="4" fill="#fbbf24" />
              <circle cx="280" cy="90" r="4" fill="#fbbf24" />
              <text x="50%" y="180" textAnchor="middle" fill="#fde047" className="text-[10px] font-mono tracking-widest">
                SAFE SPACE HARMONY
              </text>
            </svg>
          );
        default:
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a]" id="contrast-generic">
              <rect width="100%" height="100%" fill="#0f172a" rx="16" />
              <circle cx="200" cy="95" r="40" fill="none" stroke="#fbbf24" strokeWidth="3" />
              <path d="M 170 95 Q 200 70 230 95" fill="none" stroke="#fbbf24" strokeWidth="3" />
              <circle cx="185" cy="115" r="6" fill="#fbbf24" />
              <circle cx="215" cy="115" r="6" fill="#fbbf24" />
              <text x="50%" y="170" textAnchor="middle" fill="#fde047" className="text-[10px] font-mono tracking-widest">
                PREDICTABLE GLYPH ACTIVE
              </text>
            </svg>
          );
      }
    }

    // 2. Watercolor SVG fallback styles (if images fail or are not available)
    if (style === "watercolor") {
      switch (keyword) {
        case "train_platform":
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f0f9ff]" id="wc-train-platform">
              <rect width="100%" height="100%" fill="#fbf7f5" rx="16" />
              {/* Soft warm sun */}
              <circle cx="310" cy="70" r="30" fill="#fef08a" opacity="0.6" className="blur-xs" />
              {/* Soft platforms */}
              <rect width="400" height="40" y="160" fill="#f1f5f9" />
              <line x1="0" y1="160" x2="400" y2="160" stroke="#cbd5e1" strokeWidth="4" />
              <text x="50%" y="110" textAnchor="middle" fill="#64748b" className="text-xs font-serif italic">
                Soothing Station Platform (Watercolor Style)
              </text>
            </svg>
          );
        case "blue_engine_desc":
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#ecfeff]" id="wc-blue-engine">
              <rect width="100%" height="100%" fill="#f0fdfa" rx="16" />
              <rect x="140" y="70" width="120" height="60" rx="10" fill="#bae6fd" opacity="0.8" />
              <circle cx="160" cy="140" r="15" fill="#fca5a5" />
              <circle cx="190" cy="140" r="15" fill="#fca5a5" />
              <circle cx="220" cy="140" r="15" fill="#fca5a5" />
              <text x="50%" y="45" textAnchor="middle" fill="#0891b2" className="text-xs font-serif italic">
                Soothing Watercolored Blue Engine
              </text>
            </svg>
          );
        default:
          return (
            <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f8fafc]" id="wc-generic">
              <rect width="100%" height="100%" fill="#fbfbfe" rx="16" />
              <circle cx="200" cy="90" r="30" fill="#bfdbfe" opacity="0.5" />
              <text x="50%" y="150" textAnchor="middle" fill="#64748b" className="text-xs font-serif italic">
                Soft Watercolor Canvas Fallback
              </text>
            </svg>
          );
      }
    }

    // 3. Vector Style: 100% Mathematically Consistent Symmetrical Vector Art
    // Guaranteed to be perfectly continuous across views to protect child predictability
    switch (keyword) {
      case "train_platform":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f0f9ff]" id="vector-train-platform">
            {/* Sky background */}
            <rect width="100%" height="100%" fill="#e0f2fe" rx="16" />
            <circle cx="200" cy="140" r="60" fill="#fef08a" opacity="0.5" /> {/* Sunset backdrop */}
            
            {/* Symmetrical brick lines */}
            <rect x="0" y="160" width="400" height="40" fill="#cbd5e1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="3" />
            
            {/* Tracks */}
            <line x1="0" y1="184" x2="400" y2="184" stroke="#64748b" strokeWidth="5" />
            <line x1="0" y1="192" x2="400" y2="192" stroke="#475569" strokeWidth="3" />

            {/* Platform canopy columns */}
            <line x1="40" y1="0" x2="40" y2="160" stroke="#475569" strokeWidth="4" />
            <rect x="25" y="30" width="30" height="12" rx="2" fill="#475569" />

            {/* Timetable poster */}
            <rect x="100" y="50" width="45" height="55" rx="3" fill="#ffffff" stroke="#475569" strokeWidth="2.5" />
            <line x1="110" y1="65" x2="135" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="110" y1="75" x2="135" y2="75" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="110" y1="85" x2="128" y2="85" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Leo Character - STANDING on the platform (100% Predictable Profile) */}
            {/* Head (Peach skin) */}
            <circle cx="300" cy="90" r="13" fill="#ffd8a8" />
            {/* Hair (Symmetric light-brown) */}
            <path d="M 287 90 Q 300 74 313 90 Z" fill="#b45309" />
            {/* Green caps (Green cap & green bill) */}
            <path d="M 285 86 Q 300 71 315 86 Z" fill="#16a34a" /> {/* crown */}
            <path d="M 285 86 L 274 89 L 285 91 Z" fill="#15803d" /> {/* bill */}
            {/* Safe Orange Knit Sweater */}
            <rect x="286" y="103" width="28" height="34" rx="6" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
            {/* Cozy blue trousers */}
            <rect x="288" y="137" width="10" height="24" rx="2" fill="#2563eb" />
            <rect x="302" y="137" width="10" height="24" rx="2" fill="#2563eb" />
            {/* Black shoes */}
            <ellipse cx="293" cy="161" rx="6" ry="2.5" fill="#1e293b" />
            <ellipse cx="307" cy="161" rx="6" ry="2.5" fill="#1e293b" />
            
            {/* Face details (Happy, simple, serene eyes) */}
            <circle cx="291" cy="91" r="1.5" fill="#1e293b" />
            <path d="M 287 96 Q 291 99 295 96" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

            <text x="50%" y="25" textAnchor="middle" fill="#334155" className="text-[10px] font-sans font-semibold tracking-wider">
              SAFE STATION PLATFORM
            </text>
          </svg>
        );

      case "blue_engine_desc":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f0f9ff]" id="vector-blue-engine">
            <rect width="100%" height="100%" fill="#e0f2fe" rx="16" />
            <circle cx="200" cy="140" r="60" fill="#fef08a" opacity="0.5" /> {/* Matching Sunset backdrop */}

            {/* Symmetrical platform line */}
            <rect x="0" y="160" width="400" height="40" fill="#cbd5e1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="3" />
            
            {/* Sleek locomotive - Standalone only (NO carriages attached, exactly 6 red wheels) */}
            {/* Main sky-blue boiler */}
            <rect x="120" y="75" width="120" height="58" rx="4" fill="#0ea5e9" stroke="#0284c7" strokeWidth="2" />
            {/* Driver cabin */}
            <rect x="230" y="55" width="55" height="78" rx="5" fill="#0284c7" />
            <rect x="242" y="65" width="30" height="28" rx="3" fill="#e0f2fe" stroke="#0369a1" strokeWidth="1" />
            {/* Back tender outline (short, standalone) */}
            <rect x="285" y="80" width="30" height="53" rx="3" fill="#0284c7" />

            {/* Cowcatcher */}
            <polygon points="90,133 120,105 120,133" fill="#1e293b" />
            
            {/* Chimney smoke stack */}
            <rect x="140" y="45" width="18" height="30" fill="#334155" />
            <ellipse cx="149" cy="45" rx="11" ry="4" fill="#1e293b" />
            <circle cx="149" cy="28" r="10" fill="#ffffff" opacity="0.8" />
            <circle cx="162" cy="20" r="14" fill="#ffffff" opacity="0.6" />

            {/* EXACTLY SIX BRIGHT RED WHEELS (Flawless predictability) */}
            <circle cx="130" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="161" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="192" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="223" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="254" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="285" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            
            {/* Linkage rod */}
            <line x1="130" y1="145" x2="285" y2="145" stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />
            
            {/* Brass valves */}
            <circle cx="195" cy="65" r="6" fill="#eab308" />
            <path d="M185,75 Q195,60 205,75 Z" fill="#fbbf24" />

            <text x="50%" y="25" textAnchor="middle" fill="#334155" className="text-[10px] font-sans font-semibold tracking-wider">
              STANDALONE SKY-BLUE ENGINE (NO CARRIAGES)
            </text>
          </svg>
        );

      case "counting_wheels":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f0f9ff]" id="vector-counting-wheels">
            <rect width="100%" height="100%" fill="#e0f2fe" rx="16" />
            <circle cx="200" cy="140" r="60" fill="#fef08a" opacity="0.5" /> {/* Matching Sunset backdrop */}

            {/* Symmetrical platform line */}
            <rect x="0" y="160" width="400" height="40" fill="#cbd5e1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="3" />

            {/* Exactly same standalone train position bottom */}
            <rect x="140" y="75" width="120" height="58" rx="4" fill="#0ea5e9" opacity="0.7" />
            <rect x="250" y="55" width="55" height="78" rx="5" fill="#0284c7" opacity="0.7" />
            
            {/* THE EXACT SAME SIX RED WHEELS - Positioned identically */}
            <circle cx="150" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="181" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="212" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="243" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="274" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="305" cy="145" r="15" fill={secondaryColor} stroke="#ffffff" strokeWidth="2.5" />
            <line x1="150" y1="145" x2="305" y2="145" stroke="#cbd5e1" strokeWidth="3" />

            {/* Leo Character - KNEELING next to the train wheels (100% Sweater & Cap Identity) */}
            {/* Kneeling Body shift */}
            <rect x="62" y="118" width="28" height="34" rx="6" fill="#f97316" stroke="#ea580c" strokeWidth="1" transform="rotate(12 76 135)" />
            {/* Cozy blue trousers kneeling */}
            <path d="M 60 148 Q 50 162 70 160 Q 85 160 85 148 Z" fill="#2563eb" />
            <ellipse cx="68" cy="161" rx="5.5" ry="2.5" fill="#1e293b" />

            {/* Head (Peach skin) */}
            <circle cx="85" cy="100" r="13" fill="#ffd8a8" />
            {/* Hair (Symmetric light-brown) */}
            <path d="M 72 100 Q 85 84 98 100 Z" fill="#b45309" />
            {/* Green cap & green bill */}
            <path d="M 70 96 Q 85 81 100 96 Z" fill="#16a34a" />
            <path d="M 70 96 L 59 99 L 70 101 Z" fill="#15803d" />

            {/* Hand pointing to key wheel #1 */}
            <circle cx="112" cy="132" r="4.5" fill="#ffd8a8" />
            <line x1="90" y1="126" x2="112" y2="132" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />

            {/* Eye focus lines (glowing dashes showing attention to detail) */}
            <line x1="98" y1="102" x2="138" y2="138" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

            {/* Symmetrical count badges */}
            <rect x="142" y="15" width="130" height="24" rx="12" fill="#1e293b" />
            <text x="207" y="31" fill="#fef08a" textAnchor="middle" className="text-[10px] font-mono tracking-wider font-bold">
              COUNTING WHEELS: 1.. 2.. 3
            </text>
          </svg>
        );

      case "sunset_chugging":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#f0f9ff]" id="vector-sunset-chugging">
            {/* Peaceful Pink and Lavender Sunset Horizon */}
            <defs>
              <linearGradient id="vectorSunset" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="60%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#vectorSunset)" rx="16" />
            <circle cx="200" cy="120" r="45" fill="#fde047" opacity="0.8" />

            {/* Sleek straight rail tracks fading into the center sunset distance (symmetry) */}
            <polygon points="190,120 210,120 250,200 150,200" fill="#475569" opacity="0.3" />
            <line x1="192" y1="120" x2="152" y2="200" stroke="#cbd5e1" strokeWidth="3.5" />
            <line x1="208" y1="120" x2="248" y2="200" stroke="#cbd5e1" strokeWidth="3.5" />

            {/* Symmetrical ties/sleepers */}
            <line x1="178" y1="145" x2="222" y2="145" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="168" y1="165" x2="232" y2="165" stroke="#cbd5e1" strokeWidth="3" />
            <line x1="158" y1="185" x2="242" y2="185" stroke="#cbd5e1" strokeWidth="3.5" />

            {/* The SAME Standalone Sky-Blue Engine (rendered small in golden distance, NO CARRIAGES ATTACHED) */}
            <rect x="186" y="102" width="28" height="15" rx="1" fill="#4338ca" />
            <rect x="198" y="97" width="13" height="20" rx="1" fill="#312e81" />
            <circle cx="199" cy="118" r="3.5" fill="#000000" />
            <circle cx="206" cy="118" r="3.5" fill="#000000" />
            <circle cx="213" cy="118" r="3.5" fill="#000000" />

            {/* Tiny steam puffs */}
            <circle cx="190" cy="94" r="5" fill="#ffffff" opacity="0.8" />
            <circle cx="182" cy="88" r="7" fill="#ffffff" opacity="0.6" />

            <text x="50%" y="25" textAnchor="middle" fill="#ffffff" className="text-[10px] font-sans font-semibold tracking-wider opacity-90">
              SOLITARY STANDALONE ENGINE RETURNING HOME SAFELY
            </text>
          </svg>
        );

      case "porch_stars":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a]" id="vector-porch-stars">
            {/* Deep dark blue cosmic starry backdrop */}
            <rect width="100%" height="100%" fill="#1e1b4b" rx="16" />
            
            {/* Symmetrical glowing star cluster */}
            <polygon points="120,40 122,44 127,44 123,47 125,52 120,49 115,52 117,47 113,44 118,44" fill="#fbbf24" />
            <polygon points="280,30 281.5,33 285,33 282.5,35 283.5,39 280,37 276.5,39 277.5,35 275,33 278.5,33" fill="#fde047" />
            <circle cx="80" cy="70" r="2.5" fill="#ffffff" />
            <circle cx="320" cy="50" r="2.5" fill="#ffffff" />

            {/* Cozy wooden porch framework with golden symmetry */}
            <rect x="30" y="140" width="340" height="60" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="50" y1="0" x2="50" y2="140" stroke="#334155" strokeWidth="4" />
            <line x1="350" y1="0" x2="350" y2="140" stroke="#334155" strokeWidth="4" />

            {/* Symmetrical wooden swinging porch bench */}
            <line x1="140" y1="0" x2="140" y2="110" stroke="#64748b" strokeWidth="1.5" />
            <line x1="260" y1="0" x2="260" y2="110" stroke="#64748b" strokeWidth="1.5" />
            <rect x="130" y="110" width="140" height="12" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="132" y="94" width="8" height="16" fill="#0f172a" />
            <rect x="260" y="94" width="8" height="16" fill="#0f172a" />

            {/* Maya Character - SITTING on the porch swing (100% Identical Dark Curly Braids & Navy Jumper) */}
            {/* Beautiful Brown Skin Head */}
            <circle cx="200" cy="85" r="13" fill="#78350f" />
            {/* Curly braids outlines */}
            <circle cx="187" cy="80" r="5" fill="#0f172a" />
            <circle cx="213" cy="80" r="5" fill="#0f172a" />
            <rect x="184" y="86" width="5" height="20" rx="2" fill="#0f172a" />
            <rect x="211" y="86" width="5" height="20" rx="2" fill="#0f172a" />
            {/* Pure Dark-Navy Knit Jumper */}
            <rect x="186" y="98" width="28" height="30" rx="6" fill="#1e3a8a" stroke="#172554" strokeWidth="1" />
            {/* Trousers */}
            <rect x="188" y="128" width="10" height="20" fill="#334155" />
            <rect x="202" y="128" width="10" height="20" fill="#334155" />
            {/* Gold star-navigation paper in hand */}
            <rect x="188" y="110" width="24" height="16" rx="2" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            <polygon points="200,114 201,117 204,117 202,119 203,122 200,120 197,122 198,119 196,117 199,117" fill="#ea580c" />

            {/* Maya Face peaceful eye lines */}
            <line x1="195" y1="85" x2="195" y2="88" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="205" y1="85" x2="205" y2="88" stroke="#ffffff" strokeWidth="1.5" />

            <text x="50%" y="25" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono tracking-widest">
              MAYA PORTRAIT - CORESIDENT SYMMETRY
            </text>
          </svg>
        );

      case "telescope_lens":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a]" id="vector-telescope">
            <rect width="100%" height="100%" fill="#1e1b4b" rx="16" />

            {/* Star constellations with geometric symmetry lines */}
            <line x1="160" y1="50" x2="210" y2="70" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
            <line x1="210" y1="70" x2="260" y2="50" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
            <line x1="210" y1="70" x2="230" y2="120" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
            <circle cx="160" cy="50" r="6" fill="#fde047" />
            <circle cx="210" cy="70" r="8" fill="#fbbf24" />
            <circle cx="260" cy="50" r="6" fill="#fde047" />
            <circle cx="230" cy="120" r="7" fill="#fbbf24" />

            {/* Cozy porch column outline */}
            <rect x="30" y="140" width="340" height="60" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="50" y1="0" x2="50" y2="140" stroke="#334155" strokeWidth="4" />

            {/* Modern Bronze Telescope */}
            <line x1="90" y1="130" x2="165" y2="60" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
            <line x1="120" y1="95" x2="110" y2="140" stroke="#475569" strokeWidth="2.5" />
            <line x1="120" y1="95" x2="135" y2="140" stroke="#475569" strokeWidth="2.5" />
            
            {/* Maya Character - STANDING next to telescope (100% Matching sweater and braids) */}
            {/* Dark curly braided hair */}
            <circle cx="70" cy="85" r="13" fill="#78350f" />
            <circle cx="57" cy="80" r="5" fill="#0f172a" />
            <circle cx="83" cy="80" r="5" fill="#0f172a" />
            <rect x="54" y="86" width="5" height="20" rx="2" fill="#0f172a" />
            <rect x="81" y="86" width="5" height="20" rx="2" fill="#0f172a" />
            {/* Pure Dark-Navy Knit Jumper */}
            <rect x="56" y="98" width="28" height="42" rx="6" fill="#1e3a8a" stroke="#172554" strokeWidth="1" />
            {/* Hands adjusting telescope dial */}
            <circle cx="95" cy="115" r="4.5" fill="#78350f" />

            <text x="50%" y="25" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono tracking-widest">
              ORDERLY GEOMETRIC CONSTELLATIONS
            </text>
          </svg>
        );

      case "badger_friend":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a]" id="vector-badger">
            <rect width="100%" height="100%" fill="#1e1b4b" rx="16" />
            
            {/* Star constellations with lines */}
            <circle cx="100" cy="50" r="2.5" fill="#ffffff" />
            <circle cx="300" cy="40" r="2.5" fill="#ffffff" />

            {/* Symmetrical soft green bushes */}
            <path d="M -20,200 Q 50,140 120,200 Z" fill="#065f46" />
            <path d="M 280,200 Q 350,140 420,200 Z" fill="#065f46" />

            {/* Bramble the Badger Face shape */}
            <path d="M 160,190 Q 200,105 240,190 Z" fill="#64748b" stroke="#475569" strokeWidth="2" />
            {/* White stripe */}
            <path d="M 185,190 L 196,120 L 204,120 L 215,190 Z" fill="#ffffff" />
            {/* Friendly blue eyes inside dark bands */}
            <path d="M 172,170 Q 183,150 190,158 Z" fill="#0f172a" />
            <path d="M 228,170 Q 217,150 210,158 Z" fill="#0f172a" />
            <circle cx="182" cy="162" r="3" fill="#ffffff" />
            <circle cx="218" cy="162" r="3" fill="#ffffff" />
            <circle cx="182" cy="162" r="1.2" fill="#3b82f6" />
            <circle cx="218" cy="162" r="1.2" fill="#3b82f6" />
            {/* Friendly Pink nose */}
            <ellipse cx="200" cy="182" rx="6" ry="4.5" fill="#fca5a5" />

            <text x="50%" y="25" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono tracking-widest">
              BRAMBLE PEERS WITH GENTLE CURIOSITY
            </text>
          </svg>
        );

      case "happy_burrow":
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#0f172a]" id="vector-burrow">
            <rect width="100%" height="100%" fill="#111827" rx="16" />

            {/* Radiant light trail (Symmetrical circles) */}
            <path d="M 40,180 Q 200,130 360,180" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="6,6" />
            <circle cx="90" cy="165" r="5" fill="#fde047" opacity="0.8" />
            <circle cx="150" cy="154" r="5" fill="#fde047" opacity="0.8" />
            <circle cx="210" cy="150" r="5" fill="#fde047" opacity="0.8" />
            <circle cx="270" cy="156" r="5" fill="#fde047" opacity="0.8" />

            {/* Symmetrical oak tree roots hollow */}
            <path d="M 140,0 L 160,130 Q 120,150 80,180 L 320,180 Q 280,150 240,130 L 260,0 Z" fill="#1e1b4b" stroke="#312e81" strokeWidth="2.5" />
            {/* Center Hollow Entrance */}
            <ellipse cx="200" cy="148" rx="42" ry="28" fill="#090514" stroke="#eab308" strokeWidth="3" />
            
            {/* Safe Pink Bed Burrow Inside */}
            <ellipse cx="200" cy="155" rx="18" ry="8" fill="#fda4af" />
            <ellipse cx="200" cy="155" rx="10" ry="4" fill="#f43f5e" />

            <text x="50%" y="25" textAnchor="middle" fill="#ae71ff" className="text-[10px] font-mono tracking-widest">
              ORDERLY PATH LEADING HOME SAFELY
            </text>
          </svg>
        );

      default:
        // Dynamic custom interest vector generator
        // Draw the child character representation along with orderly sorting blocks
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full max-h-[240px] rounded-2xl bg-[#ecfdf5]" id="vector-dynamic">
            <rect width="100%" height="100%" fill="#f0fdf4" rx="16" />
            {/* Orderly grid backdrop */}
            <path d="M 0,40 L 400,40 M 0,80 L 400,80 M 0,120 L 400,120 M 0,160 L 400,160 M 80,0 L 80,200 M 160,0 L 160,200 M 240,0 L 240,200 M 320,0 L 320,200" fill="none" stroke="#def7ec" strokeWidth="1.5" />
            
            {/* Sorting tray containing 4 colorful, perfectly sorted toy bricks */}
            <rect x="110" y="80" width="180" height="40" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
            
            <rect x="125" y="90" width="22" height="20" rx="3" fill="#3b82f6" />
            <circle cx="131" cy="95" r="2" fill="#ffffff" />
            <circle cx="141" cy="95" r="2" fill="#ffffff" />
            
            <rect x="160" y="90" width="22" height="20" rx="3" fill="#10b981" />
            <circle cx="166" cy="95" r="2" fill="#ffffff" />
            <circle cx="176" cy="95" r="2" fill="#ffffff" />

            <rect x="195" y="90" width="22" height="20" rx="3" fill="#f59e0b" />
            <circle cx="201" cy="95" r="2" fill="#ffffff" />
            <circle cx="211" cy="95" r="2" fill="#ffffff" />

            <rect x="230" y="90" width="22" height="20" rx="3" fill="#ef4444" />
            <circle cx="236" cy="95" r="2" fill="#ffffff" />
            <circle cx="246" cy="95" r="2" fill="#ffffff" />

            {/* Simple character profile peering happily from the corner */}
            <circle cx="330" cy="140" r="14" fill="#ffd8a8" />
            <rect x="316" y="154" width="28" height="30" rx="5" fill="#f97316" />
            <path d="M 317,136 Q 330,120 343,136 Z" fill="#b45309" />
            <circle cx="325" cy="140" r="1.5" fill="#1e293b" />
            <path d="M 322,145 Q 326,148 330,145" fill="none" stroke="#1e293b" strokeWidth="1" />

            <text x="50%" y="25" textAnchor="middle" fill="#047857" className="text-[10px] font-sans font-bold tracking-wider">
              {childName ? `${childName.toUpperCase()}'S SAFE ORDERLY GRID` : "SAFE ORDERLY SPACE"}
            </text>
            <text x="50%" y="160" textAnchor="middle" fill="#047857" className="text-[9px] font-mono tracking-wide opacity-80">
              100% PREDICTABLE GRID CONTINUITY ACTIVE
            </text>
          </svg>
        );
    }
  };

  const renderSelectedStyleContent = () => {
    if (visualStyle === "vector") {
      return renderFallbackSVG("vector");
    }
    if (visualStyle === "contrast") {
      return renderFallbackSVG("contrast");
    }

    // Default: Soft Watercolor Mode
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={description}
          referrerPolicy="no-referrer"
          className="h-full w-full max-h-[250px] object-cover rounded-xl"
          id={`generated-img-${keyword}`}
        />
      );
    }

    if (preGeneratedFall) {
      return (
        <img
          src={preGeneratedFall}
          alt={description}
          referrerPolicy="no-referrer"
          className="h-full w-full max-h-[250px] object-cover rounded-xl"
          id={`pre-generated-img-${keyword}`}
        />
      );
    }

    return renderFallbackSVG("watercolor");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="my-8 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-[#f8fafc]">
        {renderSelectedStyleContent()}

        {/* Status indicator / overlay */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="mt-3 text-xs font-medium text-slate-600">Creating Illustration utilizing Gemini...</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pb-1">
        <div className="flex-1">
          <span className="inline-block rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-600">
            {visualStyle === "vector" ? "📐 Geometric Vector Art" : visualStyle === "contrast" ? "🖤 Silent Contrast Glyph" : "🎨 Soft Watercolor (AI)"}
          </span>
          <p className="mt-1 text-xs text-slate-600 font-sans leading-relaxed">{description}</p>
        </div>

        {onGenerateImage && !imageUrl && !isGenerating && visualStyle === "watercolor" && (
          <button
            onClick={handleManualGenerate}
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f0f9ff] px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-[#e0f2fe] active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            Generate AI Artwork
          </button>
        )}
      </div>

      {(parentErrorMsg || localError) && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" />
          <span>{parentErrorMsg || localError}</span>
        </div>
      )}
    </motion.div>
  );
}
