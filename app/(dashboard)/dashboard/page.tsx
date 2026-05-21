'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import {
  Github, FileText, Target, TrendingUp, Zap,
  Star, GitFork, ArrowRight, RefreshCcw, BookOpen,
  CheckCircle2, Circle, Clock,
} from 'lucide-react'
import Link from 'next/link'
import type { DashboardStats, SkillRadarData } from '@/types'

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function StatCard({ icon: Icon, label, value, suffix = '', color, delta }: {
  icon: React.ElementType; label: string; value: number | string; suffix?: string; color: string; delta?: string
}) {
  return (
    <motion.div {...fadeIn} className="glow-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {value}<span className="text-emerald-500 text-lg">{suffix}</span>
        </p>
        {delta && <p className="text-xs text-emerald-600 mt-0.5">{delta}</p>}
      </div>
    </motion.div>
  )
}

function ProfileCompletionBanner({ completion }: { completion: number }) {
  if (completion >= 80) return null
  return (
    <motion.div {...fadeIn} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Complete your profile to improve ATS score</p>
          <p className="text-sm text-gray-500">Add education, certifications, and experience for better results</p>
        </div>
      </div>
      <Link
        href="/settings"
        className="flex-shrink-0 text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
      >
        Complete <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  )
}

function GitHubConnectBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div {...fadeIn} className="glow-card p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
        <Github className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 mb-2">Connect Your GitHub</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
        Link your GitHub to analyze repositories and automatically detect your skills.
      </p>
      <button
        onClick={onConnect}
        className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
      >
        <Github className="w-4 h-4" />
        Connect GitHub
      </button>
    </motion.div>
  )
}

const defaultRadarData: SkillRadarData[] = [
  { category: 'Frontend', score: 0, fullMark: 100 },
  { category: 'Backend', score: 0, fullMark: 100 },
  { category: 'AI/ML', score: 0, fullMark: 100 },
  { category: 'DevOps', score: 0, fullMark: 100 },
  { category: 'Cloud', score: 0, fullMark: 100 },
  { category: 'Databases', score: 0, fullMark: 100 },
]

const activityTypes = {
  repo_analyzed: { icon: Github, color: 'text-gray-700', bg: 'bg-gray-100' },
  resume_generated: { icon: FileText, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  ats_improved: { icon: Target, color: 'text-teal-700', bg: 'bg-teal-100' },
  skill_added: { icon: Star, color: 'text-amber-700', bg: 'bg-amber-100' },
  certification: { icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-100' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_repos: 0, total_skills: 0, ats_score: 0,
    resume_strength: 0, github_activity_score: 0, profile_completion: 0,
  })
  const [radarData, setRadarData] = useState<SkillRadarData[]>(defaultRadarData)
  const [githubConnected, setGithubConnected] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [activity, setActivity] = useState<{ type: string; title: string; description: string; timestamp: string }[]>([])
  const [topRepos, setTopRepos] = useState<{ repo_name: string; description: string; stars: number; languages: Record<string, number>; complexity_score: number }[]>([])

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: profile }, { data: repos }, { data: skills }, { data: resumes }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('repositories').select('*').eq('user_id', user.id).order('complexity_score', { ascending: false }).limit(5),
        supabase.from('skills').select('*').eq('user_id', user.id),
        supabase.from('resumes').select('ats_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      ])

      if (profile) {
        setGithubConnected(!!profile.github_username)
        setGithubUsername(profile.github_username)
      }

      if (repos) setTopRepos(repos)

      // Build radar data from skills
      if (skills && skills.length > 0) {
        const categoryMap: Record<string, number[]> = {}
        skills.forEach(s => {
          if (!categoryMap[s.category]) categoryMap[s.category] = []
          categoryMap[s.category].push(s.confidence_score)
        })
        const newRadar = defaultRadarData.map(d => ({
          ...d,
          score: categoryMap[d.category]
            ? Math.round(categoryMap[d.category].reduce((a, b) => a + b, 0) / categoryMap[d.category].length)
            : 0,
        }))
        setRadarData(newRadar)
      }

      const completion = [
        !!profile?.college,
        !!profile?.degree,
        !!profile?.graduation_year,
        (skills?.length || 0) > 5,
        (repos?.length || 0) > 0,
      ].filter(Boolean).length * 20

      setStats({
        total_repos: repos?.length || 0,
        total_skills: skills?.length || 0,
        ats_score: resumes?.[0]?.ats_score || 0,
        resume_strength: Math.min(100, (repos?.length || 0) * 8 + (skills?.length || 0) * 3),
        github_activity_score: Math.min(100, (repos?.length || 0) * 5),
        profile_completion: completion,
      })

      // Synthetic activity
      if (repos && repos.length > 0) {
        setActivity([
          { type: 'repo_analyzed', title: 'GitHub Analyzed', description: `${repos.length} repositories scanned`, timestamp: 'Just now' },
          ...(resumes?.[0] ? [{ type: 'resume_generated', title: 'Resume Generated', description: `ATS Score: ${resumes[0].ats_score}`, timestamp: '1 hour ago' }] : []),
          { type: 'skill_added', title: 'Skills Detected', description: `${skills?.length || 0} technical skills found`, timestamp: '2 hours ago' },
        ])
      }
    }
    load()
  }, [])

  const handleAnalyzeGitHub = async () => {
    if (!userId || !githubUsername) return
    setAnalyzing(true)
    try {
      await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, github_username: githubUsername }),
      })
      window.location.reload()
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile completion banner */}
      <ProfileCompletionBanner completion={stats.profile_completion} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Github} label="Repositories" value={stats.total_repos} color="bg-gray-100 text-gray-700" delta={stats.total_repos > 0 ? 'Analyzed' : 'Connect GitHub'} />
        <StatCard icon={Star} label="Skills Detected" value={stats.total_skills} color="bg-emerald-100 text-emerald-700" delta="From GitHub" />
        <StatCard icon={Target} label="ATS Score" value={stats.ats_score || '--'} suffix={stats.ats_score ? '/100' : ''} color="bg-teal-100 text-teal-700" />
        <StatCard icon={FileText} label="Resume Strength" value={stats.resume_strength} suffix="%" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Activity Score" value={stats.github_activity_score} color="bg-teal-50 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Radar */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="lg:col-span-2 glow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900">GitHub Skill Radar</h2>
              <p className="text-sm text-gray-400">Calculated from real code analysis</p>
            </div>
            {githubConnected && (
              <button
                onClick={handleAnalyzeGitHub}
                disabled={analyzing}
                className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Re-analyze'}
              </button>
            )}
          </div>

          {!githubConnected ? (
            <GitHubConnectBanner onConnect={handleAnalyzeGitHub} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#d1fae5" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Radar
                  name="Skills"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '12px' }}
                  formatter={(value: number) => [`${value}%`, 'Skill Level']}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Activity Timeline */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glow-card p-6">
          <h2 className="font-bold text-gray-900 mb-2">Activity</h2>
          <p className="text-sm text-gray-400 mb-5">Your recent platform activity</p>

          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Circle className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No activity yet. Connect GitHub to begin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((event, i) => {
                const actType = activityTypes[event.type as keyof typeof activityTypes] || activityTypes.skill_added
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${actType.bg}`}>
                      <actType.icon className={`w-4 h-4 ${actType.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-[11px] text-gray-300">{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Repositories */}
      {topRepos.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Top Repositories</h2>
              <p className="text-sm text-gray-400">Ranked by complexity score</p>
            </div>
            <Link href="/github" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {topRepos.map((repo, i) => {
              const topLangs = Object.keys(repo.languages || {}).slice(0, 3)
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{repo.repo_name}</p>
                    <p className="text-xs text-gray-400 truncate">{repo.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {topLangs.map(lang => (
                      <span key={lang} className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 hidden sm:block">
                        {lang}
                      </span>
                    ))}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Star className="w-3 h-3" />
                      {repo.stars}
                    </div>
                    <div className="w-12 bg-gray-100 rounded-full h-1.5 hidden md:block">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full"
                        style={{ width: `${repo.complexity_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/resume" className="glow-card p-5 flex items-center gap-4 hover:bg-emerald-50/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Generate Resume</p>
            <p className="text-xs text-gray-400">AI-powered, ATS-optimized</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <Link href="/ats" className="glow-card p-5 flex items-center gap-4 hover:bg-emerald-50/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Check ATS Score</p>
            <p className="text-xs text-gray-400">Analyze your resume</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <Link href="/roadmap" className="glow-card p-5 flex items-center gap-4 hover:bg-emerald-50/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Career Roadmap</p>
            <p className="text-xs text-gray-400">AI growth plan</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
      </motion.div>
    </div>
  )
}
