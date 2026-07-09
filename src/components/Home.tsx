import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Heart, 
  Brain, 
  EyeOff, 
  BookOpen, 
  Compass, 
  Sparkle, 
  Train, 
  Orbit, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle 
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "GlowTales | Cozy Bedtime Stories for Neurodivergent Kids";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "GlowTales creates personalized, low-stimulation bedtime stories for neurodivergent, autistic, and ADHD children. Celebrate special interests with soothing, literal language and a safe, predictable story pacing."
      );
    }
  }, []);

  const pillars = [
    {
      id: "lit-lang",
      icon: <Brain className="h-6 w-6 text-amber-900" />,
      title: "Literal Language First",
      desc: "Our storyteller uses clear, descriptive, concrete nouns. We strictly avoid confusing metaphor, sarcasm, or complex idioms, supporting seamless and understandable reading."
    },
    {
      id: "spec-int",
      icon: <Sparkles className="h-6 w-6 text-[#E47936]" />,
      title: "Special Interests Highlight",
      desc: "Passions like trains, ticking gears, dinosaurs, or maps become the comforting theme of discovery in their tale. Their intense focus is celebrated as a fantastic superpower!"
    },
    {
      id: "safe-pred",
      icon: <EyeOff className="h-6 w-6 text-[#A56839]" />,
      title: "Low-Sensory Safe Flow",
      desc: "Orderly descriptive pacing and a reassuring, predictable plot. We generate a beautiful Book Cover Illustration to keep things visual while disabling inner-page images."
    }
  ];

  const specialInterests = [
    {
      id: "trains",
      title: "Steam Locomotives & Tracks",
      desc: "The rhythmic chugging, orderly switches, and structured schedules of vintage trains provide comforting predictability.",
      suggestedInterest: "Vintage steam locomotives, railway track switches, and structured train timetables",
      icon: <Train className="h-6 w-6 text-emerald-800" />,
      color: "bg-emerald-50/50 border-emerald-200/50 text-emerald-950 hover:bg-emerald-100/30"
    },
    {
      id: "celestial",
      title: "Celestial Star Charts",
      desc: "Exploring planetary coordinates, repeating orbits, and cosmic distances offers an elegant and soothing sense of peaceful order.",
      suggestedInterest: "Stellar constellations, detailed star charts, and peaceful repeating planetary orbits",
      icon: <Orbit className="h-6 w-6 text-blue-800" />,
      color: "bg-blue-50/50 border-blue-200/50 text-blue-950 hover:bg-blue-100/30"
    },
    {
      id: "clockwork",
      title: "Clockwork & Ticking Gears",
      desc: "The physical mechanics of gears interlocking, clock faces, and rhythmic ticking sounds to settle active, hyper-focused minds.",
      suggestedInterest: "Intricate clockwork gears, interlocking brass mechanics, and soft rhythmic ticking sounds",
      icon: <Settings className="h-6 w-6 text-purple-800" />,
      color: "bg-purple-50/50 border-purple-200/50 text-purple-950 hover:bg-purple-100/30"
    }
  ];

  const faqs = [
    {
      id: "literal-lang",
      question: "Why do autistic and neurodivergent children prefer literal language in stories?",
      answer: "Many neurodivergent children process descriptions literally and may find idioms, sarcasm, or abstract metaphors confusing or cognitively demanding, especially when winding down. Using concrete, literal language reduces the processing load, creating a calm, predictable reading flow that helps them relax and settle for sleep."
    },
    {
      id: "low-sensory",
      question: "What is a low-stimulation or sensory-safe bedtime routine?",
      answer: "A low-stimulation routine aims to lower sensory inputs. GlowTales supports this by keeping story text simple, using comfortable warm-color background themes, avoiding flashy or interactive inner-page animations, and prioritizing soothing storylines that avoid abrupt surprises, scary conflicts, or high-energy plot twists."
    },
    {
      id: "special-interests",
      question: "How does incorporating special interests help with sleep anxiety?",
      answer: "Hyperfocus and deep passions are comforting anchors for neurodivergent minds. Integrating these interests—whether trains, deep-space constellations, or mechanics—into a story transforms the reading experience into a highly rewarding and familiar safe space, replacing bedtime anxiety with quiet comfort."
    },
    {
      id: "is-it-free",
      question: "Is GlowTales truly free and private?",
      answer: "Yes, absolutely. GlowTales is a private, family-centric initiative created by a parent (Peter) to support kids with unique minds. There are no paywalls, hidden tracking tokens, or aggressive cookie popups. Your stories are processed using advanced private AI gateways on request, ensuring a completely safe and cozy environment."
    }
  ];

  return (
    <div className="space-y-16 py-2" id="warm-home-viewport">
      
      {/* 1. Hero Block with terracotta / warm clay tone gradient background */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEFAF4] via-[#F8EDE2] to-[#FAF3EA] p-8 sm:p-14 border border-[#EADBCC]" id="warm-hero-banner">
        
        {/* Amber glowing orb shapes in background */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-100/40 blur-3xl opacity-70" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl opacity-60" />

        <div className="relative max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/60 border border-orange-200/40 px-3.5 py-1 text-xs font-bold text-orange-950"
          >
            <Heart className="h-3.5 w-3.5 fill-orange-850 text-orange-850" />
            Comforting & Low Stimulation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#4A2C11] leading-tight"
          >
            Settle Down with <br />
            <span className="text-[#B95C17]">A Personalized Story</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-amber-900/80 font-serif leading-relaxed"
          >
            Welcome to GlowTales. We weave personalized, gentle storybooks that celebrate how neurodivergent children process the world, placing their passionate interests at the center of cozy, structured adventures.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-3 flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/create"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-98"
              id="cta-create-story"
            >
              <Sparkles className="h-4 w-4 fill-white" />
              Formulate a Tale
            </Link>
            <Link
              to="/examples"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white border border-[#E2D6C5] px-6 py-3 text-sm font-bold text-amber-950 shadow-3xs transition hover:bg-amber-50/50 active:scale-98"
              id="cta-view-examples"
            >
              <BookOpen className="h-4 w-4 text-amber-800" />
              View Example Tales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Three Pillars Section */}
      <section className="space-y-10" id="pillars-section">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/40 px-2.5 py-1 rounded-full">Our Story Philosophy</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-amber-950">Designed for Neurodivergent Readers</h2>
          <p className="text-xs sm:text-sm text-amber-900/70">We prioritize absolute clarity, cognitive predictability, and warm interest-celebration to help your child feel recognized and perfectly safe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#E9DFD0] shadow-3xs transition hover:shadow-xs flex flex-col items-start space-y-4"
              id={`pillar-card-${pillar.id}`}
            >
              <div className="p-3 bg-amber-100/50 rounded-xl">
                {pillar.icon}
              </div>
              <h3 className="text-md font-bold text-amber-950 font-display">{pillar.title}</h3>
              <p className="text-xs text-amber-900/80 font-serif leading-relaxed flex-1">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Explore Themes Section */}
      <section className="space-y-8" id="explore-interests-section">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/40 px-2.5 py-1 rounded-full">Comforting Anchors</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-amber-950">Explore Special Interest Themes</h2>
          <p className="text-xs sm:text-sm text-amber-900/70">Click a special interest below to immediately build a sensory-friendly bedtime adventure featuring these reassuring mechanics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialInterests.map((interest) => (
            <Link
              key={interest.id}
              to="/create"
              state={{ specialInterests: interest.suggestedInterest }}
              className={`flex flex-col text-left p-6 rounded-2xl border border-amber-900/15 bg-gradient-to-br ${interest.color} transition duration-300 hover:scale-[1.02] shadow-3xs hover:shadow-xs cursor-pointer group relative overflow-hidden`}
              id={`explore-card-${interest.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white rounded-xl shadow-3xs">
                  {interest.icon}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100/40 px-2 py-0.5 rounded-md">Try This &rarr;</span>
              </div>
              <h3 className="text-md font-bold text-amber-950 font-display group-hover:text-amber-800 transition">{interest.title}</h3>
              <p className="text-xs text-amber-900/75 font-serif mt-2 leading-relaxed flex-1">{interest.desc}</p>
              
              {/* Decorative sparkle */}
              <Sparkle className="absolute bottom-3 right-3 h-4 w-4 text-amber-400/20 group-hover:text-amber-400/40 group-hover:scale-125 transition duration-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Frequently Asked Questions Section (FAQ Accordion) */}
      <section className="space-y-8 max-w-3xl mx-auto" id="faqs-section">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/40 px-2.5 py-1 rounded-full">Guides & FAQ</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-amber-950">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-amber-900/70">Expert insights on designing a soothing, literal bedtime story ritual for kids with unique minds.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div 
                key={faq.id}
                className="border border-[#E9DFD0] rounded-2xl bg-[#FCFAF7] overflow-hidden transition duration-300"
                id={`faq-item-${faq.id}`}
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-amber-950 font-display hover:bg-[#FAF6F0] transition focus:outline-none"
                >
                  <span className="text-sm sm:text-base inline-flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-amber-700 shrink-0" />
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-amber-700 shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-amber-900/85 font-serif leading-relaxed border-t border-[#E9DFD0]/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Helper callout */}
      <section className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-10 border border-[#E9DFD0]/80 flex flex-col sm:flex-row items-center gap-6 sm:gap-10" id="callout-guide">
        <div className="p-4 bg-[#F5EAD9] rounded-2xl shadow-3xs shrink-0">
          <Compass className="h-10 w-10 text-amber-800" />
        </div>
        <div className="space-y-2 flex-1 text-center sm:text-left">
          <h3 className="text-md font-bold text-amber-950 font-display">New to the Library?</h3>
          <p className="text-xs sm:text-sm text-amber-900/85 font-serif leading-relaxed">
            Everything in GlowTales is crafted to minimize sensory anxiety and maximize deep, quiet connection. Learn about the structure or view a ready-made illustration from the shelf!
          </p>
          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-5 text-xs font-bold text-amber-700 font-sans">
            <Link to="/why-us" className="hover:underline text-amber-800">Why are We Free &rarr;</Link>
            <Link to="/how-it-works" className="hover:underline">Methodology Guide &rarr;</Link>
            <Link to="/about" className="hover:underline">Peter's Backstory &rarr;</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
