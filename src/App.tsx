import { useState, useEffect } from "react";
import { Sparkles, Compass, BookOpen, Clock, Heart, Menu, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { searchAndStoreApiKey } from "./lib/auth";
import Home from "./components/Home";
import CreateStory from "./components/CreateStory";
import Examples from "./components/Examples";
import HowItWorks from "./components/HowItWorks";
import AboutUs from "./components/AboutUs";
import WhyUs from "./components/WhyUs";

// Stable background visual configurations
const STARS = Array.from({ length: 45 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 1, // 1px to 3px
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 4 + 3, // 3s to 7s twinkle cycle
  delay: Math.random() * 4,
}));

const FIREFLIES = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  size: Math.random() * 4 + 3, // 3px to 7px
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 15 + 10, // 10s to 25s travel cycle
  delay: Math.random() * 5,
}));

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    // Check parameters on load to preserve the parent dynamic auth contexts
    const key = searchAndStoreApiKey();
    console.log("[GlowTales Auth] Synchronizing dynamic API security keys state on load:", { 
      active: !!key,
      source: key ? "Dynamic session/URL parameters" : "Container-bound environment variable default" 
    });

    // Elegant real-time display (UTC) for neurodivergent predictability
    const tick = () => {
      const d = new Date();
      setCurrentTime(d.toISOString().substring(11, 16) + " UTC");
    };
    tick();
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, []);

  // Smooth scroll to top on every route transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  const menuItems = [
    { id: "home", label: "Home Base", path: "/" },
    { id: "create", label: "Create a Tale", path: "/create" },
    { id: "examples", label: "Cozy Shelf", path: "/examples" },
    { id: "how-it-works", label: "Our Practice", path: "/how-it-works" },
    { id: "about", label: "Backstory", path: "/about" },
    { id: "why-us", label: "Pure Access", path: "/why-us" }
  ];

  const activeTab = menuItems.find(item => {
    if (item.path === "/") return pathname === "/";
    return pathname.startsWith(item.path);
  })?.id || "home";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6F0] via-[#FDFBF7] to-[#FAF6F0] text-amber-950 flex flex-col antialiased selection:bg-amber-200 selection:text-amber-950 relative overflow-hidden" id="glowtales-root">
      
      {/* BACKGROUND ELEMENTS */}
      
      {/* 1. Starfield Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-80">
        {STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-amber-400/40"
            style={{
              width: star.size,
              height: star.size,
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.15, 0.85, 0.15],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 2. Soft Ambient Clouds */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
        <motion.div
          className="absolute -top-16 -left-32 w-[600px] h-[300px] rounded-full bg-orange-100/35 blur-3xl"
          animate={{ x: [0, 80, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 w-[500px] h-[250px] rounded-full bg-amber-200/20 blur-3xl"
          animate={{ x: [0, -80, 0] }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-16 left-1/4 w-[550px] h-[270px] rounded-full bg-[#EADBCC]/20 blur-3xl"
          animate={{ y: [0, 50, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 3. Glowing Crescent Moon (Cozy beacon) */}
      <div className="absolute top-20 right-10 z-0 pointer-events-none overflow-hidden select-none opacity-40 sm:opacity-75 hidden sm:block">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-amber-200/20 blur-xl animate-pulse duration-[6000ms]" />
          <svg className="h-16 w-16 text-amber-600/70 drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.3 22h-.1c-5.5-.1-10-4.6-10-10.2 0-3.9 2.2-7.3 5.7-9 .5-.2 1.1 0 1.3.5.2.5 0 1.1-.5 1.3-2.7 1.3-4.5 4.1-4.5 7.2 0 4.4 3.6 8 8 8 .9 0 1.8-.1 2.6-.4.5-.2 1.1 0 1.3.5.2.5 0 1.1-.5 1.3-1.1.5-2.4.8-3.8.8zm4.4-9.3c-1 .3-1.7 1-2.1 1.9-.3 1-.3 2.1.2 3 .2.4.1.9-.2 1.2-.2.2-.5.3-.8.3-.2 0-.4-.1-.6-.2-.9-.7-1.3-1.7-1.3-2.8 0-1.5.8-2.9 2.1-3.6 1-.5 2.1-.5 3.1-.1.4.2.7.6.6 1.1-.1.5-.6.8-1 .6z" opacity="0.3" />
            <path d="M21 12.3c0-3.8-2.5-7.1-6.2-8.1-.5-.1-.8-.6-.6-1.1.1-.5.6-.8 1.1-.6 4.7 1.3 7.8 5.6 7.8 10.4 0 5.4-4 10-9.4 10.6-.5.1-1-.3-1.1-.8-.1-.5.3-1 .8-1.1 4.3-.5 7.6-4.2 7.6-8.7z" />
          </svg>
        </div>
      </div>

      {/* 4. Glowing Fireflies (Glow Bugs) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {FIREFLIES.map((bug) => (
          <motion.div
            key={bug.id}
            className="absolute rounded-full bg-yellow-250 shadow-[0_0_8px_#fef08a,0_0_16px_#f59e0b]"
            style={{
              width: bug.size,
              height: bug.size,
              left: `${bug.left}%`,
              top: `${bug.top}%`,
            }}
            animate={{
              x: [0, Math.random() * 80 - 40, Math.random() * 120 - 60, Math.random() * 60 - 30, 0],
              y: [0, Math.random() * 80 - 40, Math.random() * 65 - 30, Math.random() * 80 - 40, 0],
              opacity: [0.1, 0.9, 0.3, 0.9, 0.1],
              scale: [0.8, 1.2, 0.9, 1.3, 0.8],
            }}
            transition={{
              duration: bug.duration,
              delay: bug.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 1. Warm Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/80 backdrop-blur-md border-b border-amber-200/60 shadow-xs" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Warm Brand ID */}
          <Link 
            to="/"
            className="flex items-center gap-2 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-1.5 rounded-xl bg-amber-600 text-white shadow-md group-hover:scale-105 transition">
              <Star className="h-5 w-5 fill-white text-amber-100" />
            </div>
            <span className="text-md sm:text-lg font-extrabold tracking-tight font-display text-amber-950">
              Glow<span className="text-amber-600 font-medium">Tales</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-routing-nav">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition active:scale-95 ${
                  activeTab === item.id
                    ? "bg-amber-100 text-amber-900 border border-amber-300/40"
                    : "text-amber-900/70 hover:text-amber-950 hover:bg-amber-50"
                }`}
                id={`nav-item-${item.id}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Clock timer & helper actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/50 rounded-lg px-2.5 py-1 text-[11px] font-mono text-amber-800 shadow-inner">
              <Clock className="h-3 w-3 text-amber-700" />
              <span>{currentTime || "09:28 UTC"}</span>
            </div>
            <Link
              to="/create"
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-95"
              id="header-cta-create"
            >
              <Sparkles className="h-3.5 w-3.5 fill-white" />
              Craft Tale
            </Link>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-amber-900 hover:text-amber-950 outline-none"
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
            className="md:hidden bg-[#FAF6F0] border-b border-amber-200 relative z-40"
            id="mobile-drawer"
          >
            <div className="px-4 py-3 space-y-1">
              {menuItems.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold block ${
                    activeTab === item.id
                      ? "bg-amber-100 text-amber-900 font-extrabold"
                      : "text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2.5 border-t border-amber-200 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-800">{currentTime}</span>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  <Sparkles className="h-3 w-3 fill-white" />
                  Craft Tale
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Page Content frame with comfortable margins and animation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={pathname}>
            <Route path="/" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <Home />
              </motion.div>
            } />
            <Route path="/create" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <CreateStory />
              </motion.div>
            } />
            <Route path="/examples" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <Examples />
              </motion.div>
            } />
            <Route path="/how-it-works" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <HowItWorks />
              </motion.div>
            } />
            <Route path="/about" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <AboutUs />
              </motion.div>
            } />
            <Route path="/why-us" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <WhyUs />
              </motion.div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* 3. Cozy, Clean Dark-accent Footer */}
      <footer className="bg-[#FAF6F0] border-t border-amber-200 py-8 text-center text-xs text-amber-900/70 relative z-10" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-extrabold text-amber-950 font-display">GlowTales</span>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">V1.2.0</span>
            <span>&copy; 2026 Peter's Family Project. All rights reserved.</span>
          </div>
          <div className="flex gap-4 font-bold">
            <Link to="/why-us" className="hover:underline text-amber-800 hover:text-amber-950 transition">Why Free</Link>
            <Link to="/how-it-works" className="hover:underline text-amber-800 hover:text-amber-950 transition">Methodology</Link>
            <Link to="/about" className="hover:underline text-amber-800 hover:text-amber-950 transition">Peter's Backstory</Link>
            <a href="mailto:peteradamj@gmail.com" className="hover:underline text-amber-800 hover:text-amber-950 transition">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
