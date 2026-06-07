import { motion } from "motion/react";
import { Sparkles, Heart, Brain, EyeOff, BookOpen, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const pillars = [
    {
      id: "lit-lang",
      icon: <Brain className="h-6 w-6 text-sky-600" />,
      title: "Literal Language First",
      desc: "We write using clean, concrete phrasing. We completely avoid confusing metaphors, double-meanings, or sarcastic expressions so everything remains clear and reassuring."
    },
    {
      id: "spec-int",
      icon: <Sparkles className="h-6 w-6 text-pink-500" />,
      title: "Special Interests Weaved In",
      desc: "Passions like trains, stellar coordinate charts, or dinosaurs become the main character's discovery. Their hyperfocus is celebrated as an empowering, joyful superpower."
    },
    {
      id: "safe-pred",
      icon: <EyeOff className="h-6 w-6 text-violet-500" />,
      title: "Safe & Predictable Flows",
      desc: "Low-sensory pacing, reassuring repetition, and a guaranteed peaceful ending. No sudden surprises, no scary cliffhangers, and no sensory overload."
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-sky-100/50 to-indigo-50/50 p-8 sm:p-14 border border-sky-100/40" id="hero-banner">
        {/* Soft floating ambient shapes */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-pink-100/40 blur-3xl opacity-60" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl opacity-60" />

        <div className="relative max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-4 py-1.5 text-xs font-semibold text-sky-800"
          >
            <Heart className="h-3.5 w-3.5 fill-sky-800 text-sky-800" />
            Nurturing & Gentle
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-medium tracking-tight text-slate-800 leading-tight"
          >
            Calm, Personalized Stories <br />
            <span className="text-sky-600">For Your Unique Child</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed"
          >
            GlowTales creates gentle full-stack storybooks that celebrate how autistic and neurodivergent children process the world, weaving their deepest passions into soothing heroic adventures.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-98 cursor-pointer"
              id="cta-create-story"
            >
              <Sparkles className="h-4 w-4" />
              Create a Story Now
            </Link>
            <Link
              to="/examples"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200/80 px-6 py-3.5 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-98 cursor-pointer"
              id="cta-view-examples"
            >
              <BookOpen className="h-4 w-4 text-slate-500" />
              Browse Example Tales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="space-y-10" id="pillars-section">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded">Our Methodology</span>
          <h2 className="text-2xl sm:text-3xl font-medium text-slate-800 font-sans">Designed for Neurodivergent Comfort</h2>
          <p className="text-sm text-slate-600 font-sans">We prioritize safety, order, and quiet celebration to help your child feel recognized, happy, and fully relaxed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs transition hover:shadow-md flex flex-col items-start space-y-4"
              id={`pillar-card-${pillar.id}`}
            >
              <div className="p-3 bg-slate-50 rounded-xl">
                {pillar.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-800 font-sans">{pillar.title}</h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed flex-1">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comforting Quick Guide Callout */}
      <section className="bg-indigo-50/60 rounded-3xl p-6 sm:p-10 border border-indigo-100/40 flex flex-col sm:flex-row items-center gap-6 sm:gap-10" id="callout-guide">
        <div className="p-4 bg-white rounded-2xl shadow-xs shrink-0">
          <Compass className="h-10 w-10 text-indigo-500" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-medium text-indigo-950 font-sans">New to GlowTales?</h3>
          <p className="text-xs sm:text-sm text-indigo-900/80 font-sans leading-relaxed">
            Discover how Peter designed this for his own family, or check how Willow Creek Station functions for Leo. Everything is modeled to reduce sensory noise and increase joy.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-indigo-600 font-sans">
            <Link to="/why-us" className="hover:underline font-bold text-sky-600 cursor-pointer">Why We are Free &rarr;</Link>
            <Link to="/how-it-works" className="hover:underline cursor-pointer">Explore the Methodology &rarr;</Link>
            <Link to="/about" className="hover:underline cursor-pointer">Read Peter's Story &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
