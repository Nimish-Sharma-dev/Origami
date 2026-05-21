'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Github, RefreshCcw, Star, GitFork, Code2,
  ExternalLink, Search, ChevronRight, Zap, BookOpen,
} from 'lucide-react'

interface Repo {
  id: string; repo_name: string; full_name: string; description: string
  languages: Record<string, number>; topics: string[]; stars: number
  forks: number; complexity_score: number; html_url: string; is_pinned: boolean
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-700', JavaScript: 'bg-yellow-100 text-yellow-700',
  Python: 'bg-green-100 text-green-700', Rust: 'bg-orange-100 text-orange-700',
  Go: 'bg-cyan-100 text-cyan-700', Java: 'bg-red-100 text-red-700',
  'C++': 'bg-purple-100 text-purple-700', CSS: 'bg-pink-100 text-pink-700',
  HTML: 'bg-orange-100 text-orange-700', Shell: 'bg-gray-100 text-gray-700',
}

export default function GitHubPage() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [filtered, setFiltered] = useState<Repo[]>([])
  const [search, setSearch] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [totalSkills, setTotalSkills] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase.from('users').select('github_username').eq('id', user.id).single()
      if (profile?.github_username) setGithubUsername(profile.github_username)
      const { data: repoData } = await supabase.from('repositories').select('*').eq('user_id', user.id).order('complexity_score', { ascending: false })
      const { data: skillData } = await supabase.from('skills').select('id').eq('user_id', user.id)
      setRepos(repoData || [])
      setFiltered(repoData || [])
      setTotalSkills(skillData?.length || 0)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(repos.filter(r =>
      r.repo_name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.topics.some(t => t.toLowerCase().includes(q)) ||
      Object.keys(r.languages || {}).some(l => l.toLowerCase().includes(q))
    ))
  }, [search, repos])

  const analyze = async () => {
    if (!userId || !githubUsername) return
    setAnalyzing(true)
    try {
      await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, github_username: githubUsername }),
      })
      const { data } = await supabase.from('repositories').select('*').eq('user_id', userId).order('complexity_score', { ascending: false })
      setRepos(data || [])
      setFiltered(data || [])
    } finally {
      setAnalyzing(false)
    }
  }

  const topLang = (languages: Record<string, number>) => {
    if (!languages) return null
    return Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0]
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glow-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-lg">GitHub Intelligence</h2>
          <p className="text-sm text-gray-400">{repos.length} repositories analyzed • {totalSkills} skills detected</p>
        </div>
        <div className="flex items-center gap-3">
          {githubUsername && (
            <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 border border-gray-100 hover:border-emerald-200 px-3 py-2 rounded-xl transition-all">
              <Github className="w-4 h-4" />@{githubUsername}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={analyze} disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-60">
            <RefreshCcw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Repositories', value: repos.length, icon: Github, color: 'bg-gray-100 text-gray-700' },
          { label: 'Skills Detected', value: totalSkills, icon: Zap, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Total Stars', value: repos.reduce((s, r) => s + r.stars, 0), icon: Star, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Avg Complexity', value: repos.length ? Math.round(repos.reduce((s, r) => s + r.complexity_score, 0) / repos.length) : 0, icon: Code2, color: 'bg-teal-100 text-teal-700' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glow-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search repos by name, language, or topic..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 transition-colors" />
      </div>

      {/* Repositories grid */}
      {repos.length === 0 ? (
        <div className="glow-card p-16 text-center">
          <Github className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No repositories yet</h3>
          <p className="text-sm text-gray-400 mb-5">Connect your GitHub and click Re-analyze to import your repositories.</p>
          <button onClick={analyze} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
            <Github className="w-4 h-4" />Analyze GitHub
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((repo, i) => {
            const primary = topLang(repo.languages)
            const langColor = primary ? (LANG_COLORS[primary] || 'bg-gray-100 text-gray-600') : ''
            return (
              <motion.div key={repo.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glow-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                        className="font-bold text-gray-900 hover:text-emerald-700 transition-colors text-sm flex items-center gap-1 truncate">
                        {repo.repo_name}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      {repo.is_pinned && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pinned</span>}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{repo.description || 'No description'}</p>
                  </div>
                  {/* Complexity ring */}
                  <div className="flex-shrink-0 text-center">
                    <div className="text-lg font-black text-emerald-600">{repo.complexity_score}</div>
                    <div className="text-[10px] text-gray-400">score</div>
                  </div>
                </div>

                {/* Topics */}
                {repo.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {repo.topics.slice(0, 5).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">{t}</span>
                    ))}
                  </div>
                )}

                {/* Languages */}
                {repo.languages && Object.keys(repo.languages).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(repo.languages).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([lang]) => (
                      <span key={lang} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[lang] || 'bg-gray-100 text-gray-600'}`}>{lang}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-1 border-t border-gray-50">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks}</span>
                  {/* Complexity bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <span>Complexity</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1">
                      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1 rounded-full" style={{ width: `${repo.complexity_score}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
