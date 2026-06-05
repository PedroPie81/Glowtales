import { useState } from "react";
import { EXAMPLES } from "../data";
import { BookOpen, Sparkle } from "lucide-react";
import { motion } from "motion/react";

export default function Examples() {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const story = EXAMPLES[activeStoryIdx];

  // Convert the text into segments to render paragraphs and clean display text
  const renderFormattedLine = (lineText: string) => {
    // Strip any remaining square-bracket tags
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

  const renderStoryBody = () => {
    const rawContent = story.content;
    const lines = rawContent.split("\n");

    return lines.map((line, index) => {
      const cleaned = line.trim();
      if (!cleaned) return null;

      // Check for markers [IMAGE_1], etc. and skip them
      const match = cleaned.match(/^\[IMAGE_(\d+)\]$/);
      if (match) {
        return null;
      }

      // Normal paragraph
      return (
        <p key={`p-${index}`} className="text-slate-700 font-sans text-sm sm:text-base leading-relaxed mb-4 font-normal">
          {renderFormattedLine(cleaned)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto" id="examples-tales-page">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded">Instant Inspiration</span>
        <h1 className="text-3xl font-medium text-slate-800 font-sans">Curated Example Tales</h1>
        <p className="text-sm text-slate-500 font-sans max-w-xl mx-auto">
          Experience what GlowTales creates instantly without any API wait times. Tap into a story below.
        </p>
      </div>

      {/* Segment switcher */}
      <div className="flex justify-center gap-4">
        {EXAMPLES.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => {
              setActiveStoryIdx(idx);
            }}
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold tracking-wide border transition active:scale-95 ${
              activeStoryIdx === idx
                ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            id={`tab-example-${ex.id}`}
          >
            <BookOpen className="h-4 w-4" />
            {ex.title.split(" and ")[0] || ex.title}
          </button>
        ))}
      </div>

      {/* Story Layout wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Story details & Sidebar stats */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            key={story.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6"
          >
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block mb-1">Focus Point</span>
              <h3 className="text-lg font-medium text-slate-800 font-sans">{story.specialInterest}</h3>
            </div>

            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block mb-1">superpower celebrated</span>
              <p className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg font-sans">
                {story.superpower}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Pacing:</span>
                <span className="font-medium text-slate-700 text-right">Comforting</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Sensory Filter:</span>
                <span className="font-medium text-slate-700 text-right">{story.keyFeatures.sensoryLevel}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Interest Integration:</span>
                <span className="font-medium text-slate-700 text-right">{story.keyFeatures.specialInterestUsed}</span>
              </div>
            </div>

            {/* Focus Reader note */}
            <div className="rounded-xl bg-sky-50 p-4 border border-sky-100 text-xs text-sky-900 leading-relaxed space-y-2">
              <span className="font-semibold text-sky-700 flex items-center gap-1">
                <Sparkle className="h-3.5 w-3.5 text-sky-600 fill-sky-200" />
                Pure Text Focus Mode
              </span>
              <span>
                GlowTales provides a high-focus literary experience. Without visual distractions, children can completely anchor onto literal nouns, repeating lines, and reassuring story structures.
              </span>
            </div>
          </motion.div>
        </div>

        {/* Story Text Output */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div
            key={`view-${story.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100/80 p-6 sm:p-10 shadow-xs space-y-6"
            id="curated-story-viewer"
          >
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-slate-800 leading-tight">
                {story.title}
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-1">Pre-validated story pattern</p>
            </div>

            {/* Story contents rendered with processed tags */}
            <div className="prose max-w-none text-slate-700 leading-relaxed font-sans">
              {renderStoryBody()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
