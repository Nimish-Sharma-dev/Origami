'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Target, CheckCircle2, AlertCircle, TrendingUp, RefreshCcw, ChevronRight, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import type { ATSScore } from '@/types'

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const progress = ((score / 100) * circ)
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0fdf4" strokeWidth={10} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - progress }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
      />
    </svg>
  )
}

function ScoreBar({ label, value, color = 'emerald' }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-400 to-orange-400',
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-purple-500 to-pink-500',
  }
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-900">{value}<span className="text-gray-400 font-normal">/100</span></span>
      </div>
      <div className="bg-gray-100 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-2 rounded-full bg-gradient-to-r ${colors[color] || colors.emerald}`}
        />
      </div>
    </div>
  )
}

export default function ATSPage() {
  const [latestResume, setLatestResume] = useState<{ id: string; latex_content: string; ats_score: number } | null>(null)
  const [atsData, setAtsData] = useState<ATSScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [targetRole, setTargetRole] = useState('Software Engineer Intern')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('resumes').select('id, ats_score, latex_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      if (data) setLatestResume(data)
    }
    load()
  }, [])

  const runAnalysis = async () => {
    if (!userId || !latestResume) return
    setLoading(true)
    try {
      const res = await fetch('/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, resume_id: latestResume.id, target_role: targetRole }),
      })
      const data = await res.json()
      if (data.ats_score) setAtsData(data.ats_score)
    } finally {
      setLoading(false)
    }
  }

  const score = atsData?.overall ?? latestResume?.ats_score ?? 0
  const grade = score >= 90 ? 'Outstanding' : score >= 80 ? 'Excellent' : score >= 70 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Work'
  const gradeColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500'

  if (!latestResume) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glow-card p-16 text-center">
          <Target className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No resume to analyze</h3>
          <p className="text-sm text-gray-400 mb-5">Generate a resume first, then come back to see your ATS score.</p>
          <Link href="/resume" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            Build Resume <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header controls */}
      <div className="glow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-1">Target Role</label>
          <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 transition-colors" />
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-60">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Run ATS Analysis'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score overview */}
        <div className="glow-card p-6 flex flex-col items-center text-center">
          <h2 className="font-bold text-gray-900 mb-6">Overall ATS Score</h2>
          <div className="relative">
            <ScoreRing score={score} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${gradeColor}`}>{score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div className={`mt-4 text-lg font-bold ${gradeColor}`}>{grade}</div>
          <p className="text-xs text-gray-400 mt-1">
            {score >= 80 ? 'Your resume is highly optimized for ATS systems.' :
             score >= 60 ? 'Good foundation. A few improvements could boost your score.' :
             'Several improvements needed. Check suggestions below.'}
          </p>
        </div>

        {/* Sub-scores */}
        <div className="lg:col-span-2 glow-card p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Score Breakdown</h2>
          {atsData ? (
            <>
              <ScoreBar label="Keyword Match" value={atsData.keyword_match} color="emerald" />
              <ScoreBar label="Structure Quality" value={atsData.structure_quality} color="blue" />
              <ScoreBar label="Impact Score" value={atsData.impact_score} color="purple" />
              <ScoreBar label="Project Quality" value={atsData.project_quality} color="amber" />
            </>
          ) : (
            <div className="space-y-5">
              {['Keyword Match', 'Structure Quality', 'Impact Score', 'Project Quality'].map((label, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300">—</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2" />
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pt-2">Run ATS Analysis to see detailed breakdown</p>
            </div>
          )}
        </div>
      </div>

      {atsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="glow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {atsData.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {atsData.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Missing keywords */}
          <div className="glow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900">Missing Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {atsData.missing_keywords.map((kw, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full">
                  + {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="glow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900">Suggestions</h3>
            </div>
            <ul className="space-y-2">
              {atsData.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
