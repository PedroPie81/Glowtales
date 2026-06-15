import { motion } from "motion/react";
import { Heart, Landmark, Sparkles } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto py-2 font-sans text-center" id="about-us-page">
      
      {/* Header */}
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6F0] text-amber-800 border border-amber-200/40">
          <Heart className="h-3 w-3 fill-red-500 text-red-500" /> Our Mission & Heart
        </span>
        <h1 className="text-3xl font-extrabold text-amber-950 font-display">The Story of GlowTales</h1>
        <p className="text-sm text-amber-900/60 font-serif max-w-xl mx-auto">
          Born out of a father’s love, built to reassure, celebrate, and inspire unique minds.
        </p>
      </div>

      {/* Main Backstory Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-10 border border-[#EADBCC] shadow-3xs text-left space-y-6"
      >
        <div className="flex items-center gap-4 border-b border-[#EADBCC]/60 pb-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 border border-amber-200/50 flex items-center justify-center text-amber-950 font-extrabold shrink-0 font-display text-lg">
            P
          </div>
          <div>
            <h2 className="text-md font-bold text-amber-950 font-sans">Peter J.</h2>
            <p className="text-xs text-amber-800/70 font-sans">Founder & Loving Father</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#4E3621] leading-relaxed font-serif">
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

        <div className="pt-4 border-t border-[#EADBCC]/60 flex flex-col sm:flex-row items-center gap-4 justify-between font-sans">
          <div className="flex items-center gap-2 text-xs text-amber-800/60">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>Dedicated to all neurodivergent families</span>
          </div>
          <span className="text-xs font-bold text-amber-800">peteradamj@gmail.com</span>
        </div>
      </motion.div>

      {/* Trust factors under matching warm design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-left">
        <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBCC]/65" id="trust-factor-1">
          <Landmark className="h-6 w-6 text-amber-800 mb-2" />
          <h3 className="text-sm font-bold text-amber-950 font-sans mb-1">Pediatric Integrity</h3>
          <p className="text-xs text-amber-900/70 font-serif leading-relaxed">We structure our narratives using calming and linguistic templates written in alignment with pediatric comfort guidelines.</p>
        </div>
        <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBCC]/65" id="trust-factor-2">
          <Sparkles className="h-6 w-6 text-orange-600 mb-2" />
          <h3 className="text-sm font-bold text-amber-950 font-sans mb-1">Single Front Cover Focus</h3>
          <p className="text-xs text-amber-900/70 font-serif leading-relaxed">We generate exactly one beautiful cover illustration, preserving reader focus and avoiding inner-page visual change triggers.</p>
        </div>
      </div>

    </div>
  );
}
