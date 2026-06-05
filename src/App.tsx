import { useState, useEffect } from "react";
import { Sparkles, Compass, BookOpen, Clock, Heart, Menu, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Home from "./components/Home";
import CreateStory from "./components/CreateStory";
import Examples from "./components/Examples";
import HowItWorks from "./components/HowItWorks";
import AboutUs from "./components/AboutUs";
import WhyUs from "./components/WhyUs";

type ACTIVE_TAB = "home" | "create" | "examples" | "how-it-works" | "about" | "why-us";

export default function App() {
  const [activeTab, setActiveTab] = useState<ACTIVE_TAB>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Elegant real-time display (UTC) for neurodivergent predictability
    const tick = () => {
      const d = new Date();
      setCurrentTime(d.toISOString().substring(11, 16) + " UTC");
    };
    tick();
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as ACTIVE_TAB);
    setMobileMenuOpen(false);
    // Smooth scroll to top for comfortable reading
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "create", label: "Create a Story" },
    { id: "examples", label: "Example Tales" },
    { id: "how-it-works", label: "How It Works" },
    { id: "about", label: "About Us" },
    { id: "why-us", label: "Why Us" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home onNavigate={handleNavigate} />;
      case "create":
        return <CreateStory />;
      case "examples":
        return <Examples />;
      case "how-it-works":
        return <HowItWorks />;
      case "about":
        return <AboutUs />;
      case "why-us":
        return <WhyUs onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col antialiased selection:bg-sky-100 selection:text-sky-900" id="glowtales-root">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand ID */}
          <div 
            onClick={() => handleNavigate("home")}
            className="flex items-center gap-2 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-400 to-violet-400 text-white shadow-xs group-hover:scale-105 transition">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-sans text-slate-800">
              Glow<span className="text-sky-500 font-medium">Tales</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-routing-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition active:scale-95 ${
                  activeTab === item.id
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                }`}
                id={`nav-item-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Clock timer & helper actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-400 shadow-3xs">
              <Clock className="h-3 w-3" />
              <span>{currentTime || "09:28 UTC"}</span>
            </div>
            <button
              onClick={() => handleNavigate("create")}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95"
              id="header-cta-create"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-slate-700 outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Slide */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            id="mobile-drawer"
          >
            <div className="px-4 py-3 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium block ${
                    activeTab === item.id
                      ? "bg-sky-50 text-sky-600 font-bold"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{currentTime}</span>
                <button
                  onClick={() => handleNavigate("create")}
                  className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  <Sparkles className="h-3 w-3" />
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Page Content frame with comfortable margins and animation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Humble, clean footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-sky-400 fill-sky-400" />
            <span className="font-semibold text-slate-600">GlowTales</span>
            <span>&copy; 2026 Peter's Family Project.</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleNavigate("why-us")} className="hover:underline font-semibold text-sky-600">Why Us (Free)</button>
            <button onClick={() => handleNavigate("how-it-works")} className="hover:underline">Methodology</button>
            <button onClick={() => handleNavigate("about")} className="hover:underline">About peter</button>
            <a href="mailto:peteradamj@gmail.com" className="hover:underline">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
