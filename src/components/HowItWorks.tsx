import { motion } from "motion/react";
import { BookOpen, Compass, Waves, CheckCircle2, Shield, HeartHandshake } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Literal & Concrete Language",
      desc: "For many autistic children, figurative language like 'it is raining cats and dogs' can cause uncertainty or anxiety. Our storyteller uses simple, descriptive, and direct sentence structures that support high cognitive accessibility.",
      icon: <CheckCircle2 className="h-5 w-5 text-amber-700" />
    },
    {
      title: "Strengths-Affirming Integration",
      desc: "We never treat neurodiversity as a problem to be cured. Instead, the story utilizes deep interests (such as steam train schedules, mechanical models, or astronomical maps) as high-order precision tools. The child's natural attention to detail and hyperfocus save the day.",
      icon: <Compass className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Reassuring Rhythms & Pacing",
      desc: "Our storytelling structure operates on predictability. We outline schedules, set up comfortable routines, and resolve any plot gently. We offer custom repetition thresholds to help children find calming safety in recurring phrasing.",
      icon: <Waves className="h-5 w-5 text-[#885B33]" />
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-2 font-sans text-center" id="how-it-works-page">
      
      {/* Header */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6F0] text-amber-800 border border-amber-200/40">
          <BookOpen className="h-3 w-3" /> Our Foundations
        </span>
        <h1 className="text-3xl font-extrabold text-amber-950 font-display">The Science & Heart of GlowTales</h1>
        <p className="text-sm text-amber-900/60 font-serif max-w-xl mx-auto leading-relaxed">
          We combine pediatric psychology research on neurodiversity with elegant prompt-engineering to write stories that feel like safe shelters.
        </p>
      </div>

      {/* Steps Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 text-left">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBCC] shadow-3xs space-y-4"
          >
            <div className="p-2.5 bg-amber-100/50 rounded-lg inline-block">
              {step.icon}
            </div>
            <h3 className="text-md font-bold text-amber-950 font-display">{step.title}</h3>
            <p className="text-xs text-[#5C4531] font-serif leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Sensory tuning card */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl bg-[#FAF6F0] p-6 sm:p-10 border border-[#EADBCC] flex flex-col md:flex-row gap-8 items-start text-left"
      >
        <div className="p-3 bg-amber-100/55 rounded-xl shrink-0">
          <Shield className="h-8 w-8 text-amber-800" />
        </div>
        <div className="space-y-4">
          <h2 className="text-md font-bold text-amber-950 font-display">Sensory Tuning Framework</h2>
          <p className="text-xs sm:text-sm text-[#4E351F] font-serif leading-relaxed">
            Many children experience sensory overwhelm in standard children's stories where conflicts are sudden, characters scream, or landscapes change instantly. GlowTales is fine-tuned to keep the auditory and visual descriptions completely stable. 
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-amber-900">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-700" />
              <span>Low-sensory auditory descriptors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-700" />
              <span>Predictable character responses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-700" />
              <span>Symmetrical visual structures</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-700" />
              <span>Zero hostile or loud imagery</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer quote */}
      <div className="text-center bg-[#FAF6F0] border border-[#EADBCC] p-6 rounded-2xl max-w-xl mx-auto">
        <HeartHandshake className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-xs text-amber-900/80 font-serif italic leading-relaxed">
          "GlowTales was made to treat special interests not as mere hobbies, but as the keys to cognitive comfort, connection, and heroic confidence."
        </p>
      </div>
      
    </div>
  );
}
