import { motion } from 'motion/react';
import { Phone, ExternalLink, PlayCircle, FileText, HeartPulse } from 'lucide-react';

export default function Resources() {
  const articles = [
    { title: "Managing Academic Anxiety", readTime: "5 min read", category: "Anxiety" },
    { title: "Sleep Hygiene for Students", readTime: "7 min read", category: "Wellness" },
    { title: "Building Resilience", readTime: "4 min read", category: "Growth" },
  ];

  const exercises = [
    { title: "4-7-8 Breathing Technique", duration: "3 mins", type: "Calming" },
    { title: "Grounding Exercise (5-4-3-2-1)", duration: "5 mins", type: "Anxiety Relief" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-serif text-dark mb-2">Self-Help Resources</h1>
        <p className="text-dark/60">Tools, articles, and exercises to support your wellbeing.</p>
      </header>

      {/* Crisis Banner */}
      <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-3xl p-6 md:p-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <Phone className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h2 className="text-rose-900 font-bold text-lg mb-1">Need immediate help?</h2>
          <p className="text-rose-700/80 mb-4 text-sm md:text-base">If you are experiencing a crisis, please reach out to immediate support services.</p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:988" className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all hover:bg-rose-700 shadow-sm flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4" /> Call 988 (Lifeline)
            </a>
            <a href="sms:741741" className="bg-white text-rose-700 border border-rose-200 px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all hover:bg-rose-50 shadow-sm text-sm">
              Text HOME to 741741
            </a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <HeartPulse className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl font-medium text-dark">Guided Exercises</h2>
          </div>
          <div className="grid gap-4">
            {exercises.map((ex, i) => (
              <div key={i} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent mb-1 block">{ex.type}</span>
                  <h3 className="font-medium text-dark group-hover:text-primary transition-colors">{ex.title}</h3>
                  <p className="text-sm text-dark/50 mt-1">{ex.duration}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <PlayCircle className="w-5 h-5 text-dark/40 group-hover:text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl font-medium text-dark">Articles</h2>
          </div>
          <div className="grid gap-4">
            {articles.map((art, i) => (
              <div key={i} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-1 block">{art.category}</span>
                  <h3 className="font-medium text-dark group-hover:text-primary transition-colors">{art.title}</h3>
                  <p className="text-sm text-dark/50 mt-1">{art.readTime}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-dark/20 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
