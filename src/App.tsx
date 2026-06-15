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

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    // Check parameters on load to preserve the parent dynamic auth contexts
    const key = searchAndStoreApiKey();
    console.log("[GlowTales Auth] Synchronizing dynamic API security keys state on load:", { active: !!key });

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
    <div className="min-h-screen bg-[#FEFBFA] text-amber-950 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-950" id="glowtales-root">
      
      {/* 1. Warm Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FCFAF7]/90 backdrop-blur-md border-b border-[#EADBCC]/60 shadow-[0_2px_8px_rgba(98,62,28,0.03)]" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Warm Brand ID */}
          <Link 
            to="/"
            className="flex items-center gap-2 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-1.5 rounded-xl bg-amber-600 text-white shadow-3xs group-hover:scale-105 transition">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <span className="text-md sm:text-lg font-extrabold tracking-tight font-display text-amber-950">
              Glow<span className="text-amber-700 font-medium">Tales</span>
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
                    ? "bg-amber-100 text-[#4A2C11] border border-amber-200/50"
                    : "text-[#715E4E] hover:text-[#4A2C11] hover:bg-amber-100/30"
                }`}
                id={`nav-item-${item.id}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Clock timer & helper actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-[11px] font-mono text-amber-700/70 shadow-3xs">
              <Clock className="h-3 w-3" />
              <span>{currentTime || "09:28 UTC"}</span>
            </div>
            <Link
              to="/create"
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-3xs transition active:scale-95"
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
              className="p-2 text-amber-900 hover:text-[#4A2C11] outline-none"
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
            className="md:hidden bg-[#FCFAF7] border-b border-[#EADBCC]"
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
                      ? "bg-amber-100 text-amber-950 font-extrabold"
                      : "text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2.5 border-t border-amber-100 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-700">{currentTime}</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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

      {/* 3. Humble, Clean Wood-accent Footer */}
      <footer className="bg-[#FAF6F0] border-t border-[#EADBCC] py-6 text-center text-xs text-amber-900/60" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-655 fill-amber-500" />
            <span className="font-extrabold text-amber-950 font-display">GlowTales</span>
            <span className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-bold">V1.2.0</span>
            <span>&copy; 2026 Peter's Family Project. All rights reserved.</span>
          </div>
          <div className="flex gap-4 font-bold">
            <Link to="/why-us" className="hover:underline text-amber-800">Why Free</Link>
            <Link to="/how-it-works" className="hover:underline text-amber-800">Methodology</Link>
            <Link to="/about" className="hover:underline text-amber-800">Peter's Backstory</Link>
            <a href="mailto:peteradamj@gmail.com" className="hover:underline text-amber-800">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
