"use client"

import { ArrowRight, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/site/logo'
import { motion } from 'framer-motion'
import Image from 'next/image'

const brands = ['Startups', 'Agencies', 'Enterprises', 'Freelancers', 'Teams']

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* grid backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg radial-fade absolute inset-0" />
        <div className="absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <motion.div 
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28"
      >
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
            <LogoMark className="size-4 text-primary" />
            <span className="text-muted-foreground">
              AgentHive{' '}
              <span className="text-foreground">The Task Automation Platform</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-purple-500/20">
            <img src="/logo.png" alt="Monad" className="h-3.5 w-auto object-contain" />
            <span className="text-purple-400 font-semibold tracking-wider text-xs uppercase">
              Powered by Monad
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={FADE_UP_ANIMATION_VARIANTS} className="font-heading mx-auto mt-8 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Get Tasks Done Instantly
        </motion.h1>

        <motion.p variants={FADE_UP_ANIMATION_VARIANTS} className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
          Post your tasks and choose how to execute them. Leverage AI agents for speed, hire expert freelancers for quality, or combine both for the best results.
        </motion.p>

        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            render={<a href="/signup" />}
            size="lg"
            className="rounded-full px-7"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Button>
          <Button
            render={<a href="#process" />}
            size="lg"
            variant="outline"
            className="rounded-full border-border bg-secondary/40 px-7"
          >
            How it works
          </Button>
        </motion.div>

        {/* social proof */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-primary text-primary"
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="font-medium text-foreground">4.8 / 5</span>
            <span>· Trusted by modern teams</span>
          </div>

          <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
            {brands.map((brand, i) => (
              <span
                key={i}
                className="font-heading text-lg font-semibold tracking-wide text-muted-foreground"
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
