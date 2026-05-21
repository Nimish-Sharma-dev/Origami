'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import {
  Github, FileText, Zap, BarChart3, Map, Star,
  ArrowRight, CheckCircle2, Code2, Layers, Globe,
  ChevronRight, Terminal, Sparkles, TrendingUp, Shield,
} from 'lucide-react'
import BlurText from '@/components/bits/BlurText'
import Dock from '@/components/bits/Dock'
import BounceCards from '@/components/bits/BounceCards'

const features = [
  {
    icon: Github,
    title: 'GitHub Auto Import',
    desc: 'Connect your GitHub and we instantly scan all public repositories, extracting technologies, project complexity, and code quality signals.',
    color: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
  },
  {
    icon: Sparkles,
    title: 'AI Resume Writing',
    desc: 'DeepSeek V3 rewrites weak descriptions into powerful, recruiter-optimized bullet points with action verbs and quantified impact.',
    color: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50',
  },
  {
    icon: Shield,
    title: 'ATS Optimization',
    desc: 'Our scoring engine analyzes keyword density, structure quality, and impact scores — ensuring your resume passes automated filters.',
    color: 'from-emerald-600 to-teal-400',
    light: 'bg-emerald-50',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    desc: 'Receive an AI-generated learning path based on your current skills, market demand, and your target role — interactive and trackable.',
    color: 'from-teal-400 to-emerald-500',
    light: 'bg-teal-50',
  },
  {
    icon: BarChart3,
    title: 'Skill Intelligence',
    desc: 'Visual radar graphs show your depth across Frontend, Backend, AI/ML, DevOps, and Cloud — calculated from real code, not self-reporting.',
    color: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50',
  },
  {
    icon: FileText,
    title: 'LaTeX PDF Export',
    desc: 'Download production-grade LaTeX resumes compiled to PDF. Four professional templates optimized for FAANG, startups, research, and hackathons.',
    color: 'from-teal-600 to-emerald-400',
    light: 'bg-teal-50',
  },
]

const steps = [
  { number: '01', title: 'Login with Google', desc: 'Secure one-click authentication. No passwords needed.', icon: CheckCircle2 },
  { number: '02', title: 'Connect GitHub', desc: 'Link your GitHub account. We analyze public repositories only.', icon: Github },
  { number: '03', title: 'AI Analyzes Repos', desc: 'Our engine scans READMEs, languages, topics, and complexity.', icon: Zap },
  { number: '04', title: 'Resume Generated', desc: 'DeepSeek writes professional bullets for every project.', icon: Sparkles },
  { number: '05', title: 'Download PDF', desc: 'Export LaTeX-compiled PDF ready for applications.', icon: FileText },
]

const stats = [
  { value: '4', label: 'Resume Templates', suffix: '' },
  { value: '20', label: 'Repos Analyzed', suffix: '+' },
  { value: '100', label: 'ATS Score Target', suffix: '' },
  { value: '0', label: 'Manual Input Required', suffix: '%' },
]

const dockItems = [
  { icon: <Github size={20} />, label: 'GitHub', onClick: () => window.open('https://github.com', '_blank') },
  { icon: <FileText size={20} />, label: 'Resume', onClick: () => {} },
  { icon: <BarChart3 size={20} />, label: 'ATS Score', onClick: () => {} },
  { icon: <Map size={20} />, label: 'Roadmap', onClick: () => {} },
  { icon: <Terminal size={20} />, label: 'Terminal', onClick: () => {} },
]

// Floating resume card preview
function ResumeCard({ delay = 0, rotation = 0, x = 0, y = 0 }: { delay?: number; rotation?: number; x?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      style={{ rotate: rotation, x, y }}
      className="absolute w-48 bg-white border border-emerald-100 rounded-2xl shadow-xl shadow-emerald-100/40 p-4 pointer-events-none"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
        <div className="space-y-1">
          <div className="h-2 bg-emerald-100 rounded w-20" />
          <div className="h-1.5 bg-gray-100 rounded w-14" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 bg-emerald-50 rounded w-full" />
        <div className="h-1.5 bg-gray-100 rounded w-4/5" />
        <div className="h-1.5 bg-gray-100 rounded w-full" />
        <div className="h-1.5 bg-emerald-50 rounded w-3/4" />
        <div className="h-1.5 bg-gray-100 rounded w-full" />
      </div>
      <div className="mt-3 flex gap-1">
        {['React', 'Node', 'SQL'].map(tag => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// Animated score badge
function ScoreBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="absolute -bottom-6 -right-6 bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm">
        94
      </div>
      <div>
        <div className="text-xs text-gray-500">ATS Score</div>
        <div className="text-sm font-bold text-emerald-700">Excellent ✨</div>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">Origami</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="#features" className="hover:text-emerald-700 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-emerald-700 transition-colors">How it Works</Link>
            <Link href="#templates" className="hover:text-emerald-700 transition-colors">Templates</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl hover:shadow-md hover:shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-70" />

        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-emerald-100/60 to-transparent rounded-full blur-3xl" />

        {/* Floating cards */}
        <div className="absolute top-32 left-[8%] hidden xl:block">
          <ResumeCard delay={0.8} rotation={-6} />
        </div>
        <div className="absolute top-40 right-[8%] hidden xl:block">
          <ResumeCard delay={1.0} rotation={4} />
          <ScoreBadge />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by DeepSeek V3
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>

          {/* Main heading with BlurText */}
          <BlurText
            text="Turn Your GitHub Into A Professional AI Resume"
            delay={80}
            animateBy="words"
            direction="top"
            className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6 justify-center"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Generate ATS-optimized resumes, career roadmaps, and skill intelligence
            directly from your projects. No more blank-page paralysis.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-emerald-200 transition-all hover:-translate-y-1"
            >
              Generate Resume
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 bg-white border-2 border-emerald-100 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <Star className="w-5 h-5 text-emerald-500" />
              See How It Works
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-8 text-sm text-gray-400"
          >
            Free to start • No credit card required • Built for students & developers
          </motion.p>

          {/* Interactive Resume Previews with BounceCards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-14 flex justify-center"
          >
            <BounceCards
              images={[
                '/images/resume_faang.png',
                '/images/resume_modern.png',
                '/images/resume_ai.png',
              ]}
              containerWidth={500}
              containerHeight={320}
              transformStyles={[
                'rotate(-8deg) translate(-140px, 15px)',
                'rotate(0deg) translate(0px, -15px)',
                'rotate(8deg) translate(140px, 15px)',
              ]}
            />
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="relative max-w-4xl mx-auto mt-20 px-6"
        >
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-sm shadow-emerald-50">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-gray-900">
                  {stat.value}<span className="text-emerald-500">{stat.suffix}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <BlurText
              text="Everything You Need to Land the Role"
              delay={60}
              animateBy="words"
              direction="top"
              className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight justify-center mb-4"
            />
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              One platform to analyze, build, optimize, and export your developer story.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onHoverStart={() => setHoveredFeature(i)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="glow-card flowing-border p-6 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>

                {hoveredFeature === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-1 text-sm text-emerald-600 font-medium"
                  >
                    Learn more <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <BlurText
              text="From GitHub to Hired in 5 Steps"
              delay={60}
              animateBy="words"
              direction="top"
              className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight justify-center mb-4"
            />
            <p className="text-lg text-gray-500">The entire pipeline runs automatically. You just download.</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-200 via-teal-300 to-emerald-100 hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 z-10 relative">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-emerald-50 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-emerald-400 font-mono">{step.number}</span>
                      <h3 className="font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Templates preview */}
      <section id="templates" className="py-24 bg-gradient-to-b from-emerald-50/40 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <BlurText
              text="4 Templates, Every Career Path"
              delay={60}
              animateBy="words"
              direction="top"
              className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight justify-center mb-4"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'FAANG Classic', target: 'Big Tech Internships', color: 'from-gray-800 to-gray-900', badge: '⭐ Most Popular' },
              { name: 'Modern Developer', target: 'Startups & Scale-ups', color: 'from-emerald-600 to-teal-700', badge: '🚀 Trending' },
              { name: 'AI/ML Research', target: 'Research & Academia', color: 'from-teal-600 to-emerald-800', badge: '🧠 Specialized' },
              { name: 'Hackathon Builder', target: 'Projects & Open Source', color: 'from-emerald-500 to-teal-500', badge: '⚡ Creative' },
            ].map((template, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glow-card p-5"
              >
                {/* Mini resume preview */}
                <div className={`rounded-xl bg-gradient-to-br ${template.color} p-4 mb-4 aspect-[3/4] flex flex-col gap-2`}>
                  <div className="h-2 bg-white/30 rounded w-2/3" />
                  <div className="h-1.5 bg-white/20 rounded w-1/2" />
                  <div className="mt-2 space-y-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-1 bg-white/15 rounded" style={{ width: `${60 + Math.random() * 35}%` }} />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-3 w-10 bg-white/25 rounded-full" />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-emerald-600 font-medium mb-1">{template.badge}</div>
                <h3 className="font-bold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-400">{template.target}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <BlurText
            text="Start Building Your Future Today"
            delay={60}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-5xl font-black text-white tracking-tight justify-center mb-6"
          />
          <p className="text-emerald-100 text-lg mb-10">
            Join developers who turned their GitHub into career opportunities.
            Your story deserves a professional resume.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Github className="w-6 h-6" />
            Connect GitHub & Generate Resume
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-6 text-emerald-200 text-sm">Free • No credit card • Instant generation</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-50 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-gray-900">Origami</span>
          </div>
          <p className="text-sm text-gray-400">Turn your code into your career.</p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Get Started</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Floating Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Dock items={dockItems} panelHeight={60} baseItemSize={44} magnification={60} />
      </div>
    </div>
  )
}
