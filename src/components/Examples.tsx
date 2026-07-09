import { useState, useEffect } from "react";
import { EXAMPLES } from "../data";
import { BookOpen, Sparkle, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { motion } from "motion/react";

import leoCoverImg from "../assets/images/leo_steam_train_1779270419498.png";
import mayaCoverImg from "../assets/images/mayas_starry_night_1779270438533.png";

export default function Examples() {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [readerFontSize, setReaderFontSize] = useState<"md" | "lg" | "xl">("lg");

  useEffect(() => {
    document.title = "Cozy Bookshelf & Story Examples | GlowTales";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Browse and read our pre-generated sensory-friendly storybooks. Discover how we weave special interests like locomotives and stellar constellations into peaceful narratives."
      );
    }
  }, []);

  const story = EXAMPLES[activeStoryIdx];

  // Helper to split example stories clean of image placeholders and partitioned by chapters
  const getCleanExamplePages = () => {
    // Split the example narrative into separate logical chapters or pages
    // The raw content has paragraphs. We can join them, clean the [IMAGE] tags,
    // and split them into 3 beautiful pages for the child.
    const rawParagraphs = story.content
      .split("\n\n")
      .map(p => p.trim())
      .filter(p => p.length > 0 && !p.startsWith("[IMAGE_"));

    // Pack into 3 cozy pages
    const pages: string[] = [];
    if (rawParagraphs.length >= 6) {
      pages.push(rawParagraphs.slice(0, 2).join("\n\n"));
      pages.push(rawParagraphs.slice(2, 4).join("\n\n"));
      pages.push(rawParagraphs.slice(4).join("\n\n"));
    } else {
      pages.push(rawParagraphs.slice(0, 1).join("\n\n"));
      pages.push(rawParagraphs.slice(1, 3).join("\n\n"));
      pages.push(rawParagraphs.slice(3).join("\n\n"));
    }
    return pages;
  };

  const pages = getCleanExamplePages();
  const totalBookPages = pages.length + 1; // + 1 for Front Cover

  const handleStorySwitch = (idx: number) => {
    setActiveStoryIdx(idx);
    setCurrentPageIndex(0); // Reset to cover page
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2 font-sans text-center" id="examples-tales-page">
      
      {/* Visual Header */}
      <div className="space-y-3 max-w-2xl mx-auto" id="examples-header-container">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6F0] text-amber-800 border border-amber-200/40">
          <BookOpen className="h-3 w-3" /> Ready-to-Read Bookshelf
        </span>
        <h1 className="text-3xl font-extrabold text-amber-950 font-display">
          Browse Our Curated Example Tales
        </h1>
        <p className="text-sm text-amber-900/60 font-serif max-w-xl mx-auto leading-relaxed">
          Open a story from our local archives to see the GlowTales pacing, vocabulary structures, and sensory guidelines in action.
        </p>
      </div>

      {/* Book selector toggles */}
      <div className="flex justify-center gap-3 flex-wrap" id="examples-tab-ribbon">
        {EXAMPLES.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => handleStorySwitch(idx)}
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold tracking-tight border transition active:scale-95 ${
              activeStoryIdx === idx
                ? "bg-amber-600 text-white border-amber-600 shadow-md"
                : "bg-white text-amber-900 border-[#E4D5BE]/60 hover:bg-amber-50/50"
            }`}
            id={`tab-example-${ex.id}`}
          >
            <BookOpen className="h-4 w-4" />
            {ex.title.split(" and ")[0]} Edition
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start text-left">
        
        {/* LEFT COLUMN: Sidebar Story Strengths Panel (span 4) */}
        <div className="lg:col-span-4 space-y-6" id="example-specification-bars">
          <motion.div
            key={story.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#FAF6F0] rounded-2xl border border-[#EADBCC] p-6 shadow-3xs space-y-6"
          >
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">Passionate Topic Weaved In</span>
              <h3 className="text-base font-extrabold text-amber-950 font-display leading-tight">{story.specialInterest}</h3>
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">Superpower Celebrated ⭐</span>
              <p className="text-xs font-bold text-amber-900 bg-amber-100/50 border border-amber-200/40 px-3 py-2 rounded-xl">
                {story.superpower}
              </p>
            </div>

            <div className="space-y-3 pt-3 text-xs border-t border-[#EADBCC]/60 font-medium text-amber-900/80">
              <div className="flex justify-between items-start">
                <span>Story Pacing:</span>
                <span className="font-bold text-amber-950">Repetitive & Steady</span>
              </div>
              <div className="flex justify-between items-start">
                <span>Sensory Safeguard:</span>
                <span className="font-bold text-amber-950 text-right">{story.keyFeatures.sensoryLevel}</span>
              </div>
              <div className="flex justify-between items-start">
                <span>Special Interest Weave:</span>
                <span className="font-bold text-amber-950 text-right">{story.keyFeatures.specialInterestUsed}</span>
              </div>
            </div>

            {/* Educational note on sensory focus */}
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-xs text-orange-950 leading-relaxed space-y-2">
              <span className="font-bold text-orange-905 flex items-center gap-1">
                <Sparkle className="h-3.5 w-3.5 text-orange-600 fill-orange-200" />
                No Inner-Page Distractions
              </span>
              <p className="font-serif">
                This book has only one single comforting illustration on the cover. This is carefully designed for attention security, allowing your reader to absorb the text sequences without overwhelming visual noise.
              </p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Interactive Book Reader (span 8) */}
        <div className="lg:col-span-8 bg-[#FCFAF7] border border-[#ECCFBA] rounded-3xl p-6 sm:p-8 shadow-3xs relative" id="example-book-reader-card">
          
          {/* Controls Ribbon */}
          <div className="flex items-center justify-between border-b border-[#ECCFBA]/65 pb-3.5 mb-5 text-xs text-amber-900 font-sans">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              📚 Quick Example Reader
            </span>

            <div className="flex items-center gap-2">
              <span className="text-amber-800/60 font-medium">Size:</span>
              <div className="inline-flex bg-[#FAF6F0] border border-[#E1D4C1] rounded-xl p-0.5">
                <button
                  onClick={() => setReaderFontSize("md")}
                  className={`px-2 py-1 text-[11px] cursor-pointer rounded-lg font-bold ${readerFontSize === "md" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                >
                  A
                </button>
                <button
                  onClick={() => setReaderFontSize("lg")}
                  className={`px-2.5 py-1 text-[13px] cursor-pointer rounded-lg font-bold ${readerFontSize === "lg" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                >
                  A
                </button>
                <button
                  onClick={() => setReaderFontSize("xl")}
                  className={`px-3 py-1 text-[15px] cursor-pointer rounded-lg font-bold ${readerFontSize === "xl" ? "bg-amber-600 text-white shadow-3xs" : "text-amber-800 hover:text-amber-950"}`}
                >
                  A
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-[380px] flex flex-col justify-between" id="examples-virtual-canvas">
            
            <div className="flex-1 py-1">
              
              {/* BOOK COVER LAYOUT (Page 0) */}
              {currentPageIndex === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col md:flex-row gap-6 items-center"
                  id="example-cover-view"
                >
                  {/* Left Cover Mini Block Art drawing */}
                  <div className="w-full md:w-5/12 flex justify-center">
                    <div className="relative w-full max-w-[210px] aspect-[3/4] rounded-2xl shadow-md border-r-8 border-amber-950/20 bg-[#FAF6F0] overflow-hidden flex flex-col justify-between text-center">
                      <img 
                        src={story.id === "leo-trains" ? leoCoverImg : mayaCoverImg} 
                        alt={story.title} 
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                      {/* Hardback spine decoration */}
                      <div className="absolute top-0 bottom-0 left-0 w-3 bg-amber-950/25" />
                    </div>
                  </div>

                  {/* Right Cover Description Book Title */}
                  <div className="w-full md:w-7/12 space-y-4">
                    <span className="inline-block text-[10px] uppercase font-bold text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full">
                      📙 Classic Library Archive
                    </span>
                    <h2 className="text-2xl font-extrabold text-amber-950 font-display leading-tight">
                      {story.title}
                    </h2>
                    <p className="text-[#8B5E3C] text-xs font-sans leading-relaxed">
                      This is a pre-validated story focusing on <strong className="text-amber-950">{story.id === "leo-trains" ? "Leo" : "Maya"}</strong> and their special interest in <strong className="text-amber-950">{story.specialInterest}</strong>. It celebrates sequence consistency and calmness.
                    </p>
                    <p className="text-amber-600/90 text-xs font-bold font-sans">
                      👉 Click "Next Page" below to read this beautifully formatted digital hardback!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* PARCHMENT CONTENT BOOK PAGES */}
              {currentPageIndex > 0 && pages[currentPageIndex - 1] && (
                <motion.div
                  key={currentPageIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#ECCFBA]/40 shadow-3xs"
                  id="example-parchment-sheet"
                >
                  <div className="text-right text-[11px] font-mono text-amber-650/70 mb-3 uppercase font-bold">
                    Page {currentPageIndex} of {pages.length}
                  </div>

                  <div className={`text-amber-950 font-serif leading-relaxed tracking-wide space-y-4 text-left ${
                    readerFontSize === "md" ? "text-sm sm:text-base" :
                    readerFontSize === "lg" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                  }`}>
                    {pages[currentPageIndex - 1].split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Page turning footer */}
            <div className="flex items-center justify-between border-t border-[#ECCFBA]/65 pt-3.5 mt-5">
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
                {currentPageIndex === 0 ? "📙 Archive Cover" : `📖 Page ${currentPageIndex}`}
              </div>

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

      </div>

    </div>
  );
}
