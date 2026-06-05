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
  HelpCircle,
  Sparkles,
  Heart
} from "lucide-react";
import { useState } from "react";

// For search engine optimizer transparency and semantic clarity
interface SEOKeyword {
  phrase: string;
  volume: string;
  intent: "Informational" | "Transactional" | "Navigational";
  description: string;
}

export default function WhyUs({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [activeKeywordFilter, setActiveKeywordFilter] = useState<string>("All");

  // Rich SEO Target Phrases requested by user for search visibility
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
    <div className="space-y-16 max-w-5xl mx-auto" id="why-us-seo-page">
      
      {/* Dynamic Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
          The Pure Accessibility Promise
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-sans font-medium text-slate-800 tracking-tight leading-tight">
          Why Choose GlowTales?
        </h1>
        <p className="text-base sm:text-lg text-slate-500 font-sans max-w-2xl mx-auto">
          Completely free. No memberships. No account creation. Just immediate, peaceful, therapeutic storybooks for your child.
        </p>
      </div>

      {/* Direct Value Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8" id="why-us-core-values">
        {/* Value 1: Zero Sign-up */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-3xs hover:shadow-xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-500">
              <UserX className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 font-sans">No Registration Needed</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              We do not ask for your email, phone number, or child's surname. We believe pediatric tools should be accessed instantly, without forcing families to give up personal data.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              100% Privacy Secure
            </span>
          </div>
        </div>

        {/* Value 2: 100% Free Forever */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-3xs hover:shadow-xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-500">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 font-sans">Absolutely Zero Cost</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              While other sites hide customized story paths behind monthly subscriptions or credits, Peter's family project is free for parents, educators, and developmental therapists everywhere.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              No Paywalls / No Ads
            </span>
          </div>
        </div>

        {/* Value 3: Autism Centric design */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-3xs hover:shadow-xs transition space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-150 flex items-center justify-center text-sky-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 font-sans">Autism-Friendly Pacing</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              Traditional AI models write generic stories with alarming twists, loud adjectives, and complicated metaphors. Our layout and structure enforces literal grammar, sensory stability, and highly predictable happy conclusions.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              Pediatrically Grounded
            </span>
          </div>
        </div>
      </section>

      {/* Feature Side-By-Side Comparison */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-3xs space-y-6" id="comparison-section">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Clear Transparent Comparison</span>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-slate-800">
            How GlowTales Compares to Commercial Platforms
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            We put access first. Here is the literal difference between our non-profit approach and typical commercialized reading generators.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 font-sans">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="p-4">Advantage / Feature</th>
                <th className="p-4 text-sky-700 bg-sky-50/50">GlowTales</th>
                <th className="p-4">Paid / Social Sign-Up Alternatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {comparisons.map((comp, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30">
                  <td className="p-4 font-semibold text-slate-700">{comp.feature}</td>
                  <td className="p-4 text-sky-800 bg-sky-50/20 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600 stroke-[2.5]" />
                      {comp.glowtales}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{comp.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive SEO Inspector & Key Phrases block */}
      <section className="bg-gradient-to-tr from-slate-900 to-slate-850 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-lg space-y-8 relative overflow-hidden" id="seo-inspector-section">
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl opacity-60" />
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl opacity-60" />

        <div className="relative flex flex-col md:flex-row gap-8 justify-between items-start md:items-center border-b border-slate-800 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1 bg-sky-500/15 text-sky-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-sky-500/20">
              <Search className="h-3.5 w-3.5" />
              SEO Engine & Search Transparency
            </div>
            <h2 className="text-xl sm:text-2xl font-sans font-medium text-slate-100">
              Why We Optimize for Human Visibility First
            </h2>
            <p className="text-xs sm:text-sm text-white leading-relaxed">
              When parents query Google for accessible neurodivergent resources, they shouldn't find paid walls. This page is optimized with precise search phrases to make it easy for search engine bots (like Googlebot, Bing, and DuckDuckGo) to discover, crawl, and rank this free sanctuary. Check out our dynamic keyword indicators:
            </p>
          </div>

          {/* Dynamic tabs filter for SEO intent */}
          <div className="flex gap-2 bg-slate-800 p-1 rounded-xl scrollbar-none scale-95 origin-left">
            {["All", "Informational", "Transactional"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveKeywordFilter(filter)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeKeywordFilter === filter ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                id={`seo-filter-${filter}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic target list */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredKeywords.map((k, idx) => (
            <div 
              key={idx} 
              className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-sky-500/45 transition"
            >
              <div className="flex items-center justify-between gap-2.5">
                <span className="font-mono text-emerald-400 text-xs font-semibold block truncate">
                  "{k.phrase}"
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded tracking-wide font-sans shrink-0 uppercase">
                  {k.intent}
                </span>
              </div>
              <p className="text-slate-450 text-[11px] leading-relaxed font-sans">{k.description}</p>
            </div>
          ))}
        </div>

        {/* Structured SEO Scheme Card */}
        <div className="relative bg-slate-850/50 border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-sky-400" />
            <h4 className="text-xs sm:text-sm font-semibold text-slate-200">Semantic & Technical Robots Indexing</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] font-mono leading-normal text-slate-350">
            <div className="space-y-1">
              <span className="text-[10px] text-sky-400 uppercase font-bold block mb-1">JSON-LD Schema</span>
              <p className="text-slate-400 italic">"Licensed as a free Educational Pediatric web utility under Creative Commons, enabling rich Google snippets."</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-sky-400 uppercase font-bold block mb-1">Mobile Friendly Code</span>
              <p className="text-slate-400">"Tailwind responsive layout passes Google's Core Web Vitals checks for immediate mobile indexation."</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-sky-400 uppercase font-bold block mb-1">No Login Obstacle</span>
              <p className="text-slate-400">"Zero authentication barriers. Bots can crawl our core templates instantly, increasing page authority."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Quote From Peter */}
      <section className="bg-sky-50/50 rounded-3xl p-6 sm:p-10 border border-sky-100 flex flex-col md:flex-row gap-6 sm:gap-8 items-center" id="peter-accessibility-quote">
        <div className="relative h-12 w-12 rounded-full bg-sky-600 text-white font-bold inline-flex items-center justify-center shrink-0 shadow-xs">
          P
          <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 text-white border border-white">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-slate-800 font-sans">A Message from a Father</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans italic">
            "With a broad history of neurodivergence and autism in our family—running through my cousin, my nephew, two second cousins, and my own son on the spectrum—I have seen firsthand the endless flood of commercial services requiring monthly fees. Understanding a child's mind shouldn't come with a payment gateway. GlowTales is free, private, and requires no sign-up because pediatric accessibility is a necessity, not a commodity."
          </p>
          <p className="text-[11px] font-bold text-sky-600 font-sans tracking-wide">— Peter Adam J. (peteradamj@gmail.com)</p>
        </div>
      </section>

      {/* Dynamic CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate("create")}
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 text-sm font-semibold shadow-sm transition active:scale-95"
          id="cta-whyus-start"
        >
          <span>Create an Adventure Instantly</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
