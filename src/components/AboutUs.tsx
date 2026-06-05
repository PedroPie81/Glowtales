import { motion } from "motion/react";
import { Heart, Landmark, Sparkles } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto" id="about-us-page">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded">Our Mission</span>
        <h1 className="text-3xl font-medium text-slate-800 font-sans">The Story of GlowTales</h1>
        <p className="text-base text-slate-500 font-sans max-w-xl mx-auto">
          Born out of a father’s love, built to reassure and inspire unique minds.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold shrink-0">
            P
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 font-sans">Peter J.</h2>
            <p className="text-xs text-slate-500 font-sans">Founder & Father</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
          <p>
            Hello. My name is Peter. GlowTales is not just an application for me — it is a tool born from a deep, broad history of neurodivergence and autism within my own family. We have a rich family network of unique minds, including my cousin, my nephew, and two of my second cousins who are autistic. My own son is on the spectrum as well, and though he has never been formally diagnosed, we understand and celebrate his beautiful perspective daily.
          </p>
          <p>
            Over the years, I noticed how traditional bedtime stories often made neurodivergent children restless or anxious. Sometimes abstract metaphors confused my son and other youngsters in our family, or sudden plot twists made them feel like their world was unstable. They would close their eyes, but their minds were still trying to resolve the noise.
          </p>
          <p>
            One evening, I started telling him a story where he was a helper at a train depot. He knew the steam train schedules by heart. Instead of treating his preoccupation with numbers and track schedules as an eccentricity, our story made his exact count of the wheel nuts the key to stopping a train derailment. His eyes lit up. He sat up, totally involved, feeling secure, capable, and profoundly understood.
          </p>
          <p>
            For neurodivergent children, <strong>special interests are not mere hobbies; they are beautiful coping anchors</strong>. They provide islands of safety, structure, and intense joy in a world that can often feel chaotic and overwhelming.
          </p>
          <p>
            I made GlowTales so every parent and teacher can instantly shape personalized adventure books that treat their child’s special passions as real, celebrated superpowers. Our children's minds are not broken — they are beautiful, precise, and uniquely sparkled.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <span>Dedicated to all neurodivergent families</span>
          </div>
          <span className="text-xs font-semibold text-sky-600 font-sans">peteradamj@gmail.com</span>
        </div>
      </motion.div>

      {/* Trust factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-center">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/60" id="trust-factor-1">
          <Landmark className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 font-sans mb-1">Pediatric Integrity</h3>
          <p className="text-xs text-slate-500 font-sans">We write using clinical and linguistic structures that reflect calming therapeutic principles.</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/60" id="trust-factor-2">
          <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 font-sans mb-1">Built Sequentially</h3>
          <p className="text-xs text-slate-500 font-sans">Dynamic illustrations load one by one, giving children a comforting visual anticipation.</p>
        </div>
      </div>
    </div>
  );
}
