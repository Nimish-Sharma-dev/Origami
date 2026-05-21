'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Plus, X, Check, Star, Zap } from 'lucide-react'
import type { Skill, SkillCategory } from '@/types'

const CATEGORIES: SkillCategory[] = ['Frontend', 'Backend', 'AI/ML', 'DevOps', 'Cloud', 'Databases', 'Mobile', 'Languages', 'Tools']
const CAT_COLORS: Record<string, string> = {
  Frontend: 'bg-blue-100 text-blue-700 border-blue-200',
  Backend: 'bg-green-100 text-green-700 border-green-200',
  'AI/ML': 'bg-purple-100 text-purple-700 border-purple-200',
  DevOps: 'bg-orange-100 text-orange-700 border-orange-200',
  Cloud: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Databases: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Mobile: 'bg-pink-100 text-pink-700 border-pink-200',
  Languages: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Tools: 'bg-gray-100 text-gray-700 border-gray-200',
}

const SUGGESTED_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Docker',
  'PostgreSQL', 'MongoDB', 'AWS', 'GraphQL', 'TensorFlow', 'Kubernetes',
  'Redis', 'FastAPI', 'Go', 'Rust', 'Vue.js', 'Tailwind CSS',
]

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [newSkill, setNewSkill] = useState('')
  const [newCategory, setNewCategory] = useState<SkillCategory>('Tools')
  const [adding, setAdding] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('skills').select('*').eq('user_id', user.id).order('confidence_score', { ascending: false })
      setSkills(data || [])
    }
    load()
  }, [])

  const filtered = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory)

  // Radar data
  const radarData = CATEGORIES.slice(0, 6).map(cat => {
    const catSkills = skills.filter(s => s.category === cat)
    const avg = catSkills.length ? catSkills.reduce((a, b) => a + b.confidence_score, 0) / catSkills.length : 0
    return { category: cat, score: Math.round(avg), fullMark: 100 }
  })

  // Top skills bar chart
  const topSkills = [...skills].sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 8)

  const addSkill = async () => {
    if (!userId || !newSkill.trim()) return
    setAdding(true)
    const { data } = await supabase.from('skills').insert({
      user_id: userId,
      skill_name: newSkill.trim(),
      category: newCategory,
      confidence_score: 70,
      source: 'manual',
    }).select().single()
    if (data) setSkills(prev => [data, ...prev])
    setNewSkill('')
    setAdding(false)
  }

  const removeSkill = async (id: string) => {
    await supabase.from('skills').delete().eq('id', id)
    setSkills(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Radar */}
        <div className="lg:col-span-3 glow-card p-6">
          <h2 className="font-bold text-gray-900 mb-1">Skill Radar</h2>
          <p className="text-sm text-gray-400 mb-4">Confidence scores calculated from GitHub analysis</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#d1fae5" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Radar name="Skills" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '12px', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, 'Confidence']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top skills bar */}
        <div className="lg:col-span-2 glow-card p-6">
          <h2 className="font-bold text-gray-900 mb-1">Top Skills</h2>
          <p className="text-sm text-gray-400 mb-4">By confidence score</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSkills} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="skill_name" tick={{ fontSize: 10, fill: '#4b5563' }} width={72} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Confidence']}
                contentStyle={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '10px', fontSize: 12 }} />
              <Bar dataKey="confidence_score" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Add skill */}
      <div className="glow-card p-5">
        <h3 className="font-bold text-gray-900 mb-3 text-sm">Add Skill Manually</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="e.g. Kubernetes, Svelte, LangChain..."
            className="flex-1 min-w-48 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 transition-colors" />
          <select value={newCategory} onChange={e => setNewCategory(e.target.value as SkillCategory)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 transition-colors">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addSkill} disabled={adding || !newSkill.trim()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" />{adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 mr-1">Suggestions:</span>
          {SUGGESTED_SKILLS.filter(s => !skills.find(sk => sk.skill_name === s)).slice(0, 10).map(s => (
            <button key={s} onClick={() => setNewSkill(s)}
              className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full hover:bg-emerald-100 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-emerald-200'
            }`}>
            {cat}
            {cat !== 'All' && <span className="ml-1 opacity-60">({skills.filter(s => s.category === cat).length})</span>}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((skill, i) => (
          <motion.div key={skill.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
            className="glow-card p-4 group relative">
            <button onClick={() => removeSkill(skill.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[skill.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {skill.category}
              </span>
              {skill.source === 'github' && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
              {skill.source === 'manual' && <Check className="w-3.5 h-3.5 text-teal-400" />}
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-2">{skill.skill_name}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Confidence</span>
                <span className="text-emerald-600 font-medium">{skill.confidence_score}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${skill.confidence_score}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && skills.length === 0 && (
        <div className="glow-card p-12 text-center">
          <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">No skills yet</h3>
          <p className="text-sm text-gray-400">Analyze your GitHub to auto-detect skills, or add them manually above.</p>
        </div>
      )}
    </div>
  )
}
