import { Heart, MessageCircle, Bike, Code, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AboutSection } from '../../api/about'

const sectionIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  idea: {
    icon: <Code className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  who: {
    icon: <Bike className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  passion: {
    icon: <Heart className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />,
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
}

const defaultIcon = {
  icon: <Code className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />,
  bg: 'bg-stone-50 dark:bg-stone-950/30',
}

export interface AboutMeProps {
  sections?: AboutSection[]
}

export function AboutMe({ sections }: AboutMeProps) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[640px] space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
            <Bike className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Rain or shine on the bike</span>
          </div>
          <h1
            className="text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Hi, I'm Timo
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto leading-relaxed">
            Born in '92, passionate software developer and cyclist. I built Fahrrad Wetter because I needed a solution myself.
          </p>
        </div>

        {/* Story card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {sections?.map((section) => {
              const { icon, bg } = sectionIcons[section.section_key] ?? defaultIcon
              return (
                <section key={section.section_key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{section.title}</h2>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {section.body}
                  </p>
                </section>
              )
            })}
          </div>

          {/* CTA */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              Give feedback
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
