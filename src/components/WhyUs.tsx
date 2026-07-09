import { motion } from "motion/react";
import { 
  UserX, 
  Coins, 
  Search, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Globe, 
  Check, 
  Sparkles,
  Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface SEOKeyword {
  phrase: string;
  volume: string;
  intent: "Informational" | "Transactional" | "Navigational";
  description: string;
}

export default function WhyUs() {
  const [activeKeywordFilter, setActiveKeywordFilter] = useState<string>("All");

  useEffect(() => {
    document.title = "Pure Accessibility & Free Bedtime Stories for Kids | GlowTales";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Compare GlowTales to typical commercialized book generator apps. Discover our pure accessibility promise: no subscriptions, no ads, 100% free forever, and complete privacy."
      );
    }
  }, []);

  const seoPhrases: SEOKeyword[] = [
    {
      phrase: "free personalized stories for autistic children",
      volume: "High",
      intent: "Informational",
      description: "Helping families find tailored visual narratives for neurodivergent kids without fee barriers."
    },
    {
      phrase: "no signup custom storybook generator",
      volume: "Medium-High",
      intent: "Transactional",
      description: "Direct access to storytelling tools instantly without creating accounts or risking privacy."
    },
    {
      phrase: "sensory friendly bedtime stories free",
      volume: "High",
      intent: "Informational",
      description: "Calm, low-sensory literature designed to help overstimulated children unwind at night."
    },
    {
      phrase: "autism spectrum interest based reading tools",
      volume: "Medium",
      intent: "Informational",
      description: "Leveraging special interests (like trains, math, stars) as supportive cognitive blocks."
    },
    {
      phrase: "completely free custom child storybooks",
      volume: "High",
      intent: "Transactional",
      description: "Ensuring pediatric aids are accessible to all income brackets with zero subscription tiers."
    },
    {
      phrase: "sensory predictable reading apps",
      volume: "Medium",
      intent: "Informational",
      description: "Stories lacking sudden, alarming plot changes, written strictly with concrete language."
    }
  ];

  const comparisons = [
    {
      feature: "Upfront Cost",
      glowtales: "100% Free Forever",
      others: "Free trial, then $9.99 - $19.99/mo"
    },
    {
      feature: "Signup / Registration",
      glowtales: "None. Instant creation in 1 Click",
      others: "Required (Email, Phone, or Google Social Login)"
    },
    {
      feature: "Paywalls / Locked Features",
      glowtales: "Zero limits. Create as many tales as you want",
      others: "Locked premium templates, limited daily outputs"
    },
    {
      feature: "User/Child Data Privacy",
      glowtales: "Full client session isolated. No email tracking",
      others: "Track behavioral telemetry and email lists"
    },
    {
      feature: "Ad Distractions & Popups",
      glowtales: "Absolutely zero ads. Pure sensory safe-space",
      others: "Flashing banners, newsletter prompt overlays"
    },
    {
      feature: "Autistic Comfort Standard",
      glowtales: "Built upon pediatric speech and literal rules",
      others: "Generic AI chatbots with chaotic plot curves"
    }
  ];

  const filteredKeywords = activeKeywordFilter === "All" 
    ? seoPhrases 
    : seoPhrases.filter(k => k.intent === activeKeywordFilter);

  return (
    <div className="space-y-16 max-w-5xl mx-auto py-2 font-sans text-center" id="why-us-seo-page">
      
      {/* Dynamic Header */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6F0] text-amber-800 border border-amber-200/40">
          The Pure Accessibility Promise
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-extrabold text-amber-950 font-display tracking-tight leading-tight">
          Why Choose GlowTales?
        </h1>
        <p className="text-sm sm:text-base text-amber-900/60 font-serif leading-relaxed">
          Completely free. No accounts needed. Just immediate, peaceful, personalized storybooks for your child.
        </p>
      </div>

      {/* Direct Value Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left" id="why-us-core-values">
        
        {/* Value 1: Zero Sign-up */}
        <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#EADBCC] shadow-[#623010]/5 shadow-3xs hover:shadow-2xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-250/30 flex items-center justify-center text-amber-800">
              <UserX className="h-6 w-6" />
            </div>
            <h3 className="text-md font-bold text-amber-950 font-display">No Registration Needed</h3>
            <p className="text-xs text-[#5D4632] font-serif leading-relaxed">
              We do not ask for your email, phone, or child's surname. We believe pediatric aids should be accessed instantly, without forcing families to give up personal data.
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700/60 font-sans uppercase tracking-wider">
              100% Privacy Secure
            </span>
          </div>
        </div>

        {/* Value 2: 100% Free Forever */}
        <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#EADBCC] shadow-[#623010]/5 shadow-3xs hover:shadow-2xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-250/30 flex items-center justify-center text-amber-800">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-md font-bold text-amber-950 font-display">Absolutely Zero Cost</h3>
            <p className="text-xs text-[#5D4632] font-serif leading-relaxed">
              While other sites hide customized story paths behind monthly subscriptions or credits, Peter's family project is free for parents, educators, and developmental therapists everywhere.
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700/60 font-sans uppercase tracking-wider">
              No Paywalls / No Ads
            </span>
          </div>
        </div>

        {/* Value 3: Autism Centric design */}
        <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#EADBCC] shadow-[#623010]/5 shadow-3xs hover:shadow-2xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-250/30 flex items-center justify-center text-amber-800">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-md font-bold text-amber-950 font-display">Autism-Friendly Pacing</h3>
            <p className="text-xs text-[#5D4632] font-serif leading-relaxed">
              Traditional AI models write generic stories with alarming twists, loud adjectives, and complicated metaphors. Our layout and structure enforces literal grammar, sensory stability, and highly predictable happy conclusions.
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700/60 font-sans uppercase tracking-wider">
              Pediatrically Grounded
            </span>
          </div>
        </div>
      </section>

      {/* Feature Side-By-Side Comparison */}
      <section className="bg-[#FAF6F0] rounded-3xl border border-[#EADBCC] p-6 sm:p-10 shadow-3xs space-y-6 text-left" id="comparison-section">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Transparent Comparison</span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-amber-950">
            How GlowTales Compares to Commercial Platforms
          </h2>
          <p className="text-xs text-[#5D4632] font-serif max-w-xl leading-relaxed">
            We put access first. Here is the literal difference between our family-first approach and typical commercialized reading generators.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#EADBCC] font-sans">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-amber-100/50 text-amber-950 font-bold border-b border-[#EADBCC]">
                <th className="p-4">Advantage / Feature</th>
                <th className="p-4 text-amber-900 bg-amber-100/10">GlowTales</th>
                <th className="p-4">Commercial AI Generators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBCC]/60 text-amber-900/90 font-medium">
              {comparisons.map((comp, idx) => (
                <tr key={idx} className="hover:bg-amber-100/10 transition">
                  <td className="p-4 font-bold text-amber-950">{comp.feature}</td>
                  <td className="p-4 text-amber-950 bg-amber-100/5 font-semibold">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800">
                      <Check className="h-4 w-4 shrink-0 text-emerald-700 stroke-[2.5]" />
                      {comp.glowtales}
                    </span>
                  </td>
                  <td className="p-4 text-amber-900/50 font-serif italic">{comp.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEO keywords section in matching warm card block */}
      <section className="bg-gradient-to-br from-[#FAF6F0] to-[#F1E4D5] rounded-3xl p-6 sm:p-10 border border-[#EDCDBB] shadow-[#623010]/3 shadow-3xs space-y-8 text-left relative overflow-hidden" id="seo-inspector-section">
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-orange-150/10 blur-3xl opacity-40" />

        <div className="relative flex flex-col md:flex-row gap-8 justify-between items-start md:items-center border-b border-[#E5CCA8]/80 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1 bg-amber-105 text-amber-900 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-250/30">
              <Search className="h-3.5 w-3.5" />
              SEO & Accessibility Transparency
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-amber-950">
              Helping Parents Find Safe Literature Instantly
            </h2>
            <p className="text-xs text-amber-900/80 leading-relaxed font-serif">
              When parents query helpful tools for their children, they shouldn't find paid paywalls or intrusive trackers. This page maps rich search patterns to make it easy for search engine crawlers to catalog this free project.
            </p>
          </div>

          <div className="flex gap-2 bg-[#F3E6D8] border border-[#DECFBE] p-1 rounded-xl scale-95 origin-left">
            {["All", "Informational", "Transactional"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveKeywordFilter(filter)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeKeywordFilter === filter ? "bg-amber-600 text-white" : "text-amber-900 hover:text-amber-950"
                }`}
                id={`seo-filter-${filter}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredKeywords.map((k, idx) => (
            <div 
              key={idx} 
              className="bg-[#FCFAF7] border border-[#ECD9C5] rounded-2xl p-4 space-y-2 hover:border-amber-600/40 transition"
            >
              <div className="flex items-center justify-between gap-2.5">
                <span className="font-mono text-amber-950 text-xs font-bold block truncate">
                  "{k.phrase}"
                </span>
                <span className="bg-amber-100 text-[#6B421A] text-[9px] font-bold px-2 py-0.5 rounded tracking-wide shrink-0 uppercase">
                  {k.intent}
                </span>
              </div>
              <p className="text-amber-800/80 text-[11px] leading-relaxed font-serif">{k.description}</p>
            </div>
          ))}
        </div>

        <div className="relative bg-[#FCFAF7]/40 border border-[#ECD9C5]/50 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-amber-800" />
            <h4 className="text-xs sm:text-sm font-bold text-amber-950">Robots Indexing Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] sm:text-[11px] font-serif leading-relaxed text-amber-900/80">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 uppercase font-bold block font-sans mb-1">JSON-LD Schema</span>
              <p className="italic">"Registered as a free licensed Pediatric learning resource, allowing Rich Snippets."</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 uppercase font-bold block font-sans mb-1">Adaptive Rendering</span>
              <p className="itallc">"Dynamic responsive views pass Google Core-Web-Vitals accessibility checks instantly."</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 uppercase font-bold block font-sans mb-1 font-sans">Full Crawler Access</span>
              <p>"No password obstructions. Search engine crawlers catalog templates directly, spreading keyword power."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Message from Peter */}
      <section className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-10 border border-[#EADBCC] flex flex-col md:flex-row gap-6 sm:gap-8 items-center text-left" id="peter-accessibility-quote">
        <div className="relative h-12 w-12 rounded-full bg-amber-600 border border-amber-700 text-white font-extrabold inline-flex items-center justify-center shrink-0 shadow-xs">
          P
          <div className="absolute -bottom-1.5 -right-1.5 bg-green-600 rounded-full p-0.5 text-white border border-white">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-md font-bold text-amber-950 font-sans">A Father's Dedication</h3>
          <p className="text-xs sm:text-sm text-[#46311E] leading-relaxed font-serif italic">
            "With a broad history of neurodivergence and autism in our family—running through my cousin, my nephew, two second cousins, and my own son on the spectrum—I have seen firsthand the endless flood of commercial services requiring monthly fees. Understanding a child's mind shouldn't come with a payment gateway. GlowTales is free, private, and requires no sign-up because pediatric accessibility is a necessity, not a commodity."
          </p>
          <p className="text-xs font-bold text-amber-800 tracking-wide">— Peter Adam J. (peteradamj@gmail.com)</p>
        </div>
      </section>

      {/* Primary CTA */}
      <div className="pt-4">
        <Link
          to="/create"
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-sm font-bold shadow-md transition active:scale-95"
          id="cta-whyus-start"
        >
          <span>Craft a Tale Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
