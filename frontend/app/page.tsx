import { Navbar } from '@/components/site/navbar'
import { Hero } from '@/components/site/hero'
import { Intro } from '@/components/site/intro'
import { Services } from '@/components/site/services'
import { Benefits } from '@/components/site/benefits'
import { Process } from '@/components/site/process'
import { Cta } from '@/components/site/cta'
import { Faq } from '@/components/site/faq'
import { Footer } from '@/components/site/footer'
import { TaskBrowser } from '@/components/app/task-browser'
import { SectionHeading } from '@/components/site/section-heading'

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Intro />
        <Services />
        <Benefits />
        <Process />
        <Cta />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
