'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Github, Layers, ArrowRight, CheckCircle2,
  Code2, GitBranch, BarChart3, Sparkles, Shield, AlertCircle,
} from 'lucide-react'
import BlurText from '@/components/bits/BlurText'

const whyConnect = [
  { icon: Code2, title: 'Repository Scanning', desc: 'We analyze your public repos to extract languages, frameworks, and project complexity.' },
  { icon: BarChart3, title: 'Skill Detection', desc: 'Automatically detect 40+ technologies from your code, READMEs, and topics.' },
  { icon: Sparkles, title: 'AI Resume Writing', desc: 'DeepSeek uses your real projects to write powerful, recruiter-ready bullet points.' },
  { icon: GitBranch, title: 'Career Roadmap', desc: 'Get a personalized learning path based on your actual skill profile.' },
]

export default function GitHubConnectPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if user already has GitHub connected
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user already has github connected
      const { data: profile } = await supabase
        .from('users')
        .select('github_connected, github_username')
        .eq('id', user.id)
        .single()

      if (profile?.github_connected && profile?.github_username) {
        // Already connected — go to dashboard
        router.push('/dashboard')
        return
      }

      setChecking(false)
    }
    check()
  }, [])

  const handleConnectGitHub = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: 'read:user user:email public_repo',
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-emerald-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">Origami</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now →
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 shadow-xl shadow-gray-300/30"
            >
              <Github className="w-10 h-10 text-white" />
            </motion.div>

            <BlurText
              text="Connect Your GitHub Account"
              delay={60}
              animateBy="words"
              direction="top"
              className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight justify-center mb-4"
            />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-500 max-w-xl mx-auto"
            >
              Origami needs access to your public repositories to analyze your code
              and generate your AI-powered resume. We never write or modify anything.
            </motion.p>
          </div>

          {/* Why connect cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
          >
            {whyConnect.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="glow-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <button
              onClick={handleConnectGitHub}
              disabled={loading}
              className="w-full group flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
              ) : (
                <Github className="w-6 h-6" />
              )}
              Connect GitHub Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Security note */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-800 font-semibold">Read-only access</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  We only request <code className="bg-emerald-100 px-1 rounded">read:user</code> and <code className="bg-emerald-100 px-1 rounded">public_repo</code> scopes.
                  Your private repos remain private. We cannot push, delete, or modify any code.
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">What happens after connecting:</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
                {[
                  'Repos scanned',
                  'Skills detected',
                  'Resume generated',
                  'ATS scored',
                ].map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {step}
                    {i < 3 && <ArrowRight className="w-3 h-3 text-gray-300 mx-1" />}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
