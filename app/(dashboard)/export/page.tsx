'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Download, FileText, ExternalLink, Copy, Check, Code2, Share2, Clock } from 'lucide-react'
import Link from 'next/link'

interface Resume { id: string; template: string; ats_score: number; created_at: string; latex_content: string; pdf_url: string | null }

export default function ExportPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selected, setSelected] = useState<Resume | null>(null)
  const [copied, setCopied] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setResumes(data || [])
      if (data?.[0]) setSelected(data[0])
    }
    load()
  }, [])

  const copyLatex = () => {
    if (!selected) return
    navigator.clipboard.writeText(selected.latex_content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadLatex = () => {
    if (!selected) return
    const blob = new Blob([selected.latex_content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `origami_${selected.template}_${new Date(selected.created_at).toISOString().split('T')[0]}.tex`
    a.click()
    URL.revokeObjectURL(url)
  }

  const compilePDF = async () => {
    if (!selected) return
    setCompiling(true)
    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex_content: selected.latex_content }),
      })
      const data = await res.json()
      if (data.download_url) window.open(data.download_url, '_blank')
      else if (data.pdf_base64) {
        const bytes = atob(data.pdf_base64)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        const blob = new Blob([arr], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resume_${selected.template}.pdf`
        a.click()
      }
    } finally {
      setCompiling(false)
    }
  }

  const shareATS = () => {
    if (!selected) return
    const text = `My resume ATS Score: ${selected.ats_score}/100 — Generated with Origami ✨`
    if (navigator.share) {
      navigator.share({ title: 'My Origami Resume Score', text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glow-card p-16 text-center">
          <Download className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No resumes to export</h3>
          <p className="text-sm text-gray-400 mb-5">Generate a resume first.</p>
          <Link href="/resume" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            Build Resume
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resume list */}
        <div className="glow-card p-5 space-y-2">
          <h2 className="font-bold text-gray-900 mb-3">Your Resumes</h2>
          {resumes.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                selected?.id === r.id ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 hover:border-emerald-100 hover:bg-gray-50'
              }`}>
              <div className="w-8 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 capitalize truncate">{r.template.replace(/-/g, ' ')}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-emerald-600 font-medium">ATS: {r.ats_score}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Export options */}
        {selected && (
          <div className="lg:col-span-2 space-y-5">
            <div className="glow-card p-6">
              <h2 className="font-bold text-gray-900 mb-1">Export Options</h2>
              <p className="text-sm text-gray-400 mb-5">
                Template: <span className="text-gray-700 font-medium capitalize">{selected.template.replace(/-/g, ' ')}</span>
                {' · '}ATS Score: <span className="text-emerald-600 font-medium">{selected.ats_score}/100</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={compilePDF} disabled={compiling}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-60">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    {compiling ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{compiling ? 'Compiling...' : 'Download PDF'}</div>
                    <div className="text-xs text-white/70">Via LaTeXOnline compiler</div>
                  </div>
                </button>

                <button onClick={downloadLatex}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Download .tex</div>
                    <div className="text-xs text-gray-400">Raw LaTeX source</div>
                  </div>
                </button>

                <button onClick={copyLatex}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 hover:border-emerald-200 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{copied ? 'Copied!' : 'Copy LaTeX'}</div>
                    <div className="text-xs text-gray-400">Paste into Overleaf</div>
                  </div>
                </button>

                <a href="https://www.overleaf.com/latex/templates" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 hover:border-emerald-200 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Open in Overleaf</div>
                    <div className="text-xs text-gray-400">Edit & compile online</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Share ATS Score */}
            <div className="glow-card p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Share Your ATS Score</h3>
                <p className="text-xs text-gray-400">Show off your optimized resume score</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-emerald-600">{selected.ats_score}</div>
                <button onClick={shareATS}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Share2 className="w-4 h-4" />Share
                </button>
              </div>
            </div>

            {/* LaTeX preview */}
            <div className="glow-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-emerald-50">
                <span className="font-semibold text-gray-900 text-sm">LaTeX Preview</span>
                <span className="text-xs text-gray-400">{selected.latex_content.split('\n').length} lines</span>
              </div>
              <pre className="terminal text-xs text-gray-600 h-52 overflow-y-auto rounded-none scrollbar-hide whitespace-pre-wrap break-words">
                {selected.latex_content.slice(0, 3000)}{selected.latex_content.length > 3000 ? '\n...(truncated)' : ''}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
