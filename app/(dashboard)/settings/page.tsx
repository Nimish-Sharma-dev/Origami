'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { User, GraduationCap, Github, Plus, X, Check, Save, Trash2 } from 'lucide-react'

interface Cert { id: string; title: string; issuer: string; issue_date: string; credential_url?: string }
interface Exp { id: string; role: string; organization: string; duration: string; description: string }

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', college: '', degree: '', specialization: '', graduation_year: '', cgpa: '', github_username: '' })
  const [certs, setCerts] = useState<Cert[]>([])
  const [exps, setExps] = useState<Exp[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [addingCert, setAddingCert] = useState(false)
  const [addingExp, setAddingExp] = useState(false)
  const [newCert, setNewCert] = useState({ title: '', issuer: '', issue_date: '', credential_url: '' })
  const [newExp, setNewExp] = useState({ role: '', organization: '', duration: '', description: '' })
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: p }, { data: c }, { data: e }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('certifications').select('*').eq('user_id', user.id),
        supabase.from('experiences').select('*').eq('user_id', user.id),
      ])
      if (p) setProfile({ name: p.name || '', college: p.college || '', degree: p.degree || '', specialization: p.specialization || '', graduation_year: p.graduation_year || '', cgpa: p.cgpa || '', github_username: p.github_username || '' })
      setCerts(c || [])
      setExps(e || [])
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    await supabase.from('users').update(profile).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addCert = async () => {
    if (!userId || !newCert.title) return
    const { data } = await supabase.from('certifications').insert({ user_id: userId, ...newCert }).select().single()
    if (data) setCerts(prev => [...prev, data])
    setNewCert({ title: '', issuer: '', issue_date: '', credential_url: '' })
    setAddingCert(false)
  }

  const removeCert = async (id: string) => {
    await supabase.from('certifications').delete().eq('id', id)
    setCerts(prev => prev.filter(c => c.id !== id))
  }

  const addExp = async () => {
    if (!userId || !newExp.role) return
    const { data } = await supabase.from('experiences').insert({ user_id: userId, ...newExp }).select().single()
    if (data) setExps(prev => [...prev, data])
    setNewExp({ role: '', organization: '', duration: '', description: '' })
    setAddingExp(false)
  }

  const removeExp = async (id: string) => {
    await supabase.from('experiences').delete().eq('id', id)
    setExps(prev => prev.filter(e => e.id !== id))
  }

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 focus:bg-white transition-all" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile */}
      <div className="glow-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-400">Used for resume header and contact details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={profile.name} onChange={v => setProfile(p => ({ ...p, name: v }))} placeholder="Jane Doe" />
          <Field label="GitHub Username" value={profile.github_username} onChange={v => setProfile(p => ({ ...p, github_username: v }))} placeholder="janedoe" />
        </div>
      </div>

      {/* Education */}
      <div className="glow-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Education</h2>
            <p className="text-xs text-gray-400">Your academic background</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="College / University" value={profile.college} onChange={v => setProfile(p => ({ ...p, college: v }))} placeholder="MIT, IIT Delhi, NIT Trichy..." />
          </div>
          <Field label="Degree" value={profile.degree} onChange={v => setProfile(p => ({ ...p, degree: v }))} placeholder="B.Tech, B.E., B.Sc..." />
          <Field label="Specialization" value={profile.specialization} onChange={v => setProfile(p => ({ ...p, specialization: v }))} placeholder="Computer Science, ECE..." />
          <Field label="Graduation Year" value={profile.graduation_year} onChange={v => setProfile(p => ({ ...p, graduation_year: v }))} placeholder="2025" type="text" />
          <Field label="CGPA" value={profile.cgpa} onChange={v => setProfile(p => ({ ...p, cgpa: v }))} placeholder="8.5 / 10" />
        </div>
      </div>

      {/* Save profile */}
      <button onClick={saveProfile} disabled={saving}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-md transition-all disabled:opacity-60">
        {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? <><Save className="w-4 h-4 animate-pulse" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
      </button>

      {/* Certifications */}
      <div className="glow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Certifications</h2>
          <button onClick={() => setAddingCert(v => !v)}
            className="text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add
          </button>
        </div>

        {addingCert && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newCert.title} onChange={e => setNewCert(p => ({ ...p, title: e.target.value }))} placeholder="Certificate name *" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 sm:col-span-2" />
              <input value={newCert.issuer} onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))} placeholder="Issuer (e.g. Coursera, AWS)" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300" />
              <input type="month" value={newCert.issue_date} onChange={e => setNewCert(p => ({ ...p, issue_date: e.target.value }))} className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300" />
              <input value={newCert.credential_url} onChange={e => setNewCert(p => ({ ...p, credential_url: e.target.value }))} placeholder="Credential URL (optional)" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 sm:col-span-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={addCert} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">Add</button>
              <button onClick={() => setAddingCert(false)} className="text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}

        {certs.length === 0 && !addingCert && <p className="text-sm text-gray-400">No certifications added yet.</p>}
        {certs.map(c => (
          <div key={c.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 text-sm">{c.title}</p>
              <p className="text-xs text-gray-400">{c.issuer} • {c.issue_date}</p>
              {c.credential_url && <a href={c.credential_url} target="_blank" className="text-xs text-emerald-600 hover:underline">View credential</a>}
            </div>
            <button onClick={() => removeCert(c.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Experience */}
      <div className="glow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Experience</h2>
          <button onClick={() => setAddingExp(v => !v)}
            className="text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add
          </button>
        </div>

        {addingExp && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newExp.role} onChange={e => setNewExp(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title *" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300" />
              <input value={newExp.organization} onChange={e => setNewExp(p => ({ ...p, organization: e.target.value }))} placeholder="Organization" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300" />
              <input value={newExp.duration} onChange={e => setNewExp(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (e.g. Jun 2024 – Aug 2024)" className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 sm:col-span-2" />
              <textarea value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of responsibilities and achievements..." className="sm:col-span-2 px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-300 resize-none h-16" />
            </div>
            <div className="flex gap-2">
              <button onClick={addExp} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">Add</button>
              <button onClick={() => setAddingExp(false)} className="text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}

        {exps.length === 0 && !addingExp && <p className="text-sm text-gray-400">No experience added yet.</p>}
        {exps.map(e => (
          <div key={e.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 text-sm">{e.role}</p>
              <p className="text-xs text-gray-500">{e.organization} • {e.duration}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{e.description}</p>
            </div>
            <button onClick={() => removeExp(e.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
