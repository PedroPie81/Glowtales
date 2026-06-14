import { useState, useEffect } from "react";
import { Sparkles, Compass, BookOpen, Clock, Heart, Menu, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
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
    { id: "home", label: "Home", path: "/" },
    { id: "create", label: "Create a Story", path: "/create" },
    { id: "examples", label: "Example Tales", path: "/examples" },
    { id: "how-it-works", label: "How It Works", path: "/how-it-works" },
    { id: "about", label: "About Us", path: "/about" },
    { id: "why-us", label: "Why Us", path: "/why-us" }
  ];

  // Derive the activeTab ID from the current pathname
  const activeTab = menuItems.find(item => {
    if (item.path === "/") return pathname === "/";
    return pathname.startsWith(item.path);
  })?.id || "home";

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col antialiased selection:bg-sky-100 selection:text-sky-900" id="glowtales-root">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand ID */}
          <Link 
            to="/"
            className="flex items-center gap-2 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-400 to-violet-400 text-white shadow-xs group-hover:scale-105 transition">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-sans text-slate-800">
              Glow<span className="text-sky-500 font-medium">Tales</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-routing-nav">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition active:scale-95 ${
                  activeTab === item.id
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                }`}
                id={`nav-item-${item.id}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Clock timer & helper actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-400 shadow-3xs">
              <Clock className="h-3 w-3" />
              <span>{currentTime || "09:28 UTC"}</span>
            </div>
            <Link
              to="/create"
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95"
              id="header-cta-create"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create
            </Link>
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
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium block ${
                    activeTab === item.id
                      ? "bg-sky-50 text-sky-600 font-bold"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{currentTime}</span>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  <Sparkles className="h-3 w-3" />
                  Create
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

      {/* 3. Humble, clean footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-sky-400 fill-sky-400" />
            <span className="font-semibold text-slate-600">GlowTales</span>
            <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded text-[10px] font-bold">v1.1.1</span>
            <span>&copy; 2026 Peter's Family Project.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/why-us" className="hover:underline font-semibold text-sky-600">Why Us (Free)</Link>
            <Link to="/how-it-works" className="hover:underline">Methodology</Link>
            <Link to="/about" className="hover:underline">About Peter</Link>
            <a href="mailto:peteradamj@gmail.com" className="hover:underline">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
