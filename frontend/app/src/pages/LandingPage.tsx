import { FinalCTASection } from '@/components/landing/FinalCTASection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { LandingBackground } from '@/components/landing/LandingBackground'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingSEO } from '@/components/landing/LandingSEO'
import { StatsSection } from '@/components/landing/StatsSection'
import { WhatWeDoSection } from '@/components/landing/WhatWeDoSection'
import { WhyTeapotsSection } from '@/components/landing/WhyTeapotsSection'

export function LandingPage() {
  return (
    <div className="landing-root min-h-screen bg-gradient-to-b from-[hsl(43_78%_97%)] via-white to-[hsl(210_45%_97%)] text-stone-900 antialiased dark:from-slate-950 dark:via-[hsl(222_28%_9%)] dark:to-slate-950 dark:text-amber-50/[0.97]">
      <LandingSEO />
      <LandingBackground />
      <LandingNavbar />
      <main>
        <LandingHero />
        <WhatWeDoSection />
        <HowItWorksSection />
        <FeaturesSection />
        <StatsSection />
        <WhyTeapotsSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
