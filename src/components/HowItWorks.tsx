import { motion } from "motion/react";
import { BookOpen, Compass, Waves, CheckCircle2, Shield, HeartHandshake } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Literal & Concrete Language",
      desc: "For many autistic children, figurative language like 'it is raining cats and dogs' can cause uncertainty or anxiety. Our engine uses simple, descriptive, and direct sentence structures that support high cognitive accessibility.",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    },
    {
      title: "Strengths-Affirming Integration",
      desc: "We never treat neurodiversity as a problem to be cured. Instead, the story utilizes deep interests (such as steam train schedules, mechanical models, or astronomical maps) as high-order precision tools. The child's natural attention to detail and hyperfocus save the day.",
      icon: <Compass className="h-5 w-5 text-sky-500" />
    },
    {
      title: "Reassuring Rhythms & Pacing",
      desc: "Our storytelling structure operates on predictability. We outline schedules, set up comfortable routines, and resolve any plot gently. We offer custom repetition thresholds to help children find calming safety in recurring phrasing.",
      icon: <Waves className="h-5 w-5 text-indigo-500" />
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto" id="how-it-works-page">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded">Our Foundations</span>
        <h1 className="text-3xl font-medium text-slate-800 font-sans">The Science & Heart of GlowTales</h1>
        <p className="text-base text-slate-600 font-sans max-w-2xl mx-auto">
          We combine pediatric psychology research on neurodiversity with elegant prompt-engineering to write stories that feel like safe shelters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4"
          >
            <div className="p-2.5 bg-slate-50 rounded-lg inline-block">
              {step.icon}
            </div>
            <h3 className="text-base font-semibold text-slate-800 font-sans">{step.title}</h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl bg-sky-50 p-6 sm:p-10 border border-sky-100 flex flex-col md:flex-row gap-8 items-start"
      >
        <div className="p-3 bg-white rounded-xl shrink-0">
          <Shield className="h-8 w-8 text-sky-600" />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-800 font-sans">Sensory Tuning Framework</h2>
          <p className="text-sm text-slate-600 font-sans leading-relaxed">
            Many children experience sensory overwhelm in standard children's stories where conflicts are sudden, characters scream, or landscapes change instantly. GlowTales is fine-tuned to keep the auditory and visual descriptions completely stable. 
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Low-sensory auditory descriptors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Predictable character responses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Symmetrical visual structures</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Zero hostile or loud imagery</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="text-center bg-white border border-slate-100 p-6 rounded-2xl max-w-xl mx-auto">
        <HeartHandshake className="h-6 w-6 text-pink-500 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-sans italic">
          "GlowTales was made to treat special interests not as distractions, but as the keys to cognitive comfort, connection, and heroic confidence."
        </p>
      </div>
    </div>
  );
}
