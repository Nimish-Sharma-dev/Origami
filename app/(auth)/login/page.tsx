'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Layers, Github, Chrome, ArrowLeft, Sparkles, FileText, BarChart3, Map } from 'lucide-react'
import Link from 'next/link'
import BlurText from '@/components/bits/BlurText'

const benefits = [
  { icon: Sparkles, text: 'AI-powered resume writing' },
  { icon: FileText, text: 'ATS-optimized LaTeX export' },
  { icon: BarChart3, text: 'Skill intelligence dashboard' },
  { icon: Map, text: 'Personalized career roadmap' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading('google')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(null)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading('github')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email public_repo',
      },
    })
    if (error) {
      setError(error.message)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />

        {/* Floating cards decoration */}
        <div className="absolute top-32 right-8 w-44 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white/80 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-white/20" />
            <div>
              <div className="h-1.5 bg-white/40 rounded w-16 mb-1" />
              <div className="h-1 bg-white/20 rounded w-10" />
            </div>
          </div>
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-1 bg-white/20 rounded" style={{ width: `${55 + i * 10}%` }} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-8 h-3 rounded-sm bg-emerald-300/40" />
            <span className="text-[10px] text-emerald-200">ATS: 94</span>
          </div>
        </div>

        <div className="absolute bottom-40 left-8 w-40 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3">
          <div className="text-white/60 text-xs mb-1">Skill Detection</div>
          <div className="flex flex-wrap gap-1">
            {['React', 'Node', 'Python', 'Docker', 'AWS'].map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 bg-white/20 text-white/80 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white font-black text-2xl">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Origami
          </Link>
        </div>

        <div className="relative">
          <BlurText
            text="Your GitHub is your resume. We just make it official."
            delay={60}
            animateBy="words"
            direction="top"
            className="text-3xl font-black text-white leading-tight justify-start mb-8"
          />
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-emerald-100"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-emerald-200/60 text-xs">
          Free forever for students and open-source developers.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-xl text-gray-900">Origami</span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              Start building your career
            </h1>
            <p className="text-gray-500 mb-10">
              Connect your account and generate your AI resume in minutes.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 text-gray-700 font-semibold py-4 rounded-2xl transition-all hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5 text-blue-500" />
                )}
                Continue with Google
              </button>

              <button
                onClick={handleGitHubLogin}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-2xl transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === 'github' ? (
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <Github className="w-5 h-5" />
                )}
                Continue with GitHub
              </button>
            </div>

            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-700 text-center">
                <strong>GitHub access required</strong> to analyze your repositories and generate your resume.
                We only read public repo data — never write or modify anything.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
