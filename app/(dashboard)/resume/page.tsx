'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, FileText, Download, Eye, RefreshCcw, Check,
  ChevronRight, Sparkles, Copy, ExternalLink, AlertCircle,
} from 'lucide-react'
import type { ResumeTemplate } from '@/types'

const TEMPLATES: { id: ResumeTemplate; name: string; target: string; color: string; desc: string }[] = [
  { id: 'faang-classic', name: 'FAANG Classic', target: 'Big Tech Internships', color: 'from-gray-800 to-gray-900', desc: 'Black & white, dense, highly professional. Optimized for Applicant Tracking Systems at top companies.' },
  { id: 'modern-developer', name: 'Modern Developer', target: 'Startups & Scale-ups', color: 'from-emerald-600 to-teal-700', desc: 'Clean spacing, subtle accent colors, modern typography. Perfect for product companies.' },
  { id: 'ai-ml-research', name: 'AI/ML Research', target: 'Research & Academia', color: 'from-teal-600 to-emerald-800', desc: 'Research-oriented with sections for papers, AI projects, and technical depth.' },
  { id: 'hackathon-builder', name: 'Hackathon Builder', target: 'Projects & Open Source', color: 'from-emerald-500 to-teal-500', desc: 'Project-forward structure that showcases what you build. Great for hackathon and OSS portfolios.' },
]

type GenStep = 'idle' | 'collecting' | 'analyzing' | 'writing' | 'compiling' | 'scoring' | 'done' | 'error'

const STEP_LABELS: Record<GenStep, string> = {
  idle: '',
  collecting: 'Collecting your profile data...',
  analyzing: 'Analyzing GitHub repositories...',
  writing: 'DeepSeek is writing your resume...',
  compiling: 'Compiling LaTeX to PDF...',
  scoring: 'Calculating ATS score...',
  done: 'Resume ready!',
  error: 'Generation failed',
}

export default function ResumePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('faang-classic')
  const [customInstructions, setCustomInstructions] = useState('')
  const [step, setStep] = useState<GenStep>('idle')
  const [latexContent, setLatexContent] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [atsScore, setAtsScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pastResumes, setPastResumes] = useState<{ id: string; template: string; ats_score: number; created_at: string }[]>([])
  const streamRef = useRef<HTMLPreElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('resumes')
        .select('id, template, ats_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setPastResumes(data || [])
    }
    load()
  }, [])

  // Auto-scroll streaming content
  useEffect(() => {
    if (streamRef.current && streamingContent) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [streamingContent])

  const generate = async () => {
    if (!userId) return
    setStep('collecting')
    setError(null)
    setLatexContent('')
    setStreamingContent('')
    setPdfUrl(null)
    setAtsScore(null)

    try {
      setStep('analyzing')
      await new Promise(r => setTimeout(r, 400))
      setStep('writing')

      // Use the streaming endpoint
      const res = await fetch('/api/resume/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          template: selectedTemplate,
          custom_instructions: customInstructions,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      // Read SSE stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7)
          } else if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))

              switch (currentEvent) {
                case 'chunk':
                  accumulatedContent += data.content
                  setStreamingContent(accumulatedContent)
                  break
                case 'status':
                  if (data.step === 'scoring') setStep('scoring')
                  else if (data.step === 'compiling') setStep('compiling')
                  break
                case 'complete':
                  setLatexContent(data.latex_content)
                  setPdfUrl(data.pdf_url)
                  setAtsScore(data.ats_score?.overall ?? null)
                  setStep('done')
                  // Reload past resumes
                  const { data: updated } = await supabase
                    .from('resumes')
                    .select('id, template, ats_score, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(5)
                  setPastResumes(updated || [])
                  break
                case 'error':
                  throw new Error(data.message)
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                throw e
              }
            }
          }
        }
      }

      // If we never got a 'complete' event but stream ended, set done
      if (step !== 'done' && step !== 'error' && accumulatedContent) {
        setLatexContent(accumulatedContent)
        setStep('done')
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setStep('error')
    }
  }

  const copyLatex = () => {
    navigator.clipboard.writeText(latexContent || streamingContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadLatex = () => {
    const content = latexContent || streamingContent
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `origami_resume_${selectedTemplate}.tex`
    a.click()
  }

  const isGenerating = ['collecting', 'analyzing', 'writing', 'compiling', 'scoring'].includes(step)
  const displayContent = latexContent || streamingContent

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Template Selection + Controls */}
        <div className="space-y-5">
          {/* Template picker */}
          <div className="glow-card p-6">
            <h2 className="font-bold text-gray-900 mb-1">Choose Template</h2>
            <p className="text-sm text-gray-400 mb-5">All templates are ATS-friendly and single-column</p>

            <div className="grid grid-cols-1 gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Mini preview */}
                  <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${t.color} flex-shrink-0 relative overflow-hidden`}>
                    <div className="absolute inset-1 space-y-0.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-0.5 bg-white/30 rounded" style={{ width: `${50 + i * 8}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      {selectedTemplate === t.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">{t.target}</span>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom instructions */}
          <div className="glow-card p-6">
            <h2 className="font-bold text-gray-900 mb-1">Custom Instructions</h2>
            <p className="text-sm text-gray-400 mb-4">Optional: Tell AI what to emphasize or include</p>
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. Emphasize my ML projects. Include my research paper on NLP. Target SWE internship at a FinTech startup..."
              className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-300 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                {STEP_LABELS[step]}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate AI Resume
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Past resumes */}
          {pastResumes.length > 0 && (
            <div className="glow-card p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Previous Resumes</h3>
              <div className="space-y-2">
                {pastResumes.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs">
                    <div>
                      <span className="font-medium text-gray-700">{r.template}</span>
                      <span className="text-gray-400 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-emerald-600 font-bold">ATS: {r.ats_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview / Output */}
        <div className="space-y-5">
          {/* Generation progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glow-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI is writing your resume</p>
                    <p className="text-sm text-gray-400">{STEP_LABELS[step]}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(['collecting', 'analyzing', 'writing', 'compiling', 'scoring'] as GenStep[]).map((s, i) => {
                    const currentIdx = ['collecting', 'analyzing', 'writing', 'compiling', 'scoring'].indexOf(step)
                    const thisIdx = i
                    const isDone = thisIdx < currentIdx
                    const isCurrent = thisIdx === currentIdx
                    return (
                      <div key={s} className={`flex items-center gap-2 text-sm ${isDone ? 'text-emerald-600' : isCurrent ? 'text-gray-900' : 'text-gray-300'}`}>
                        {isDone ? <Check className="w-4 h-4" /> : isCurrent ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                        {STEP_LABELS[s]}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {step === 'error' && error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Generation failed</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {/* ATS Score card */}
          {step === 'done' && atsScore !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">ATS Score</h3>
                  <p className="text-sm text-gray-400">Your resume&apos;s recruitability score</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${atsScore >= 80 ? 'text-emerald-600' : atsScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                    {atsScore}
                  </div>
                  <div className="text-xs text-gray-400">/ 100</div>
                </div>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${atsScore}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-2 rounded-full ${atsScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : atsScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <a href="/ats" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  Full analysis <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Streaming / LaTeX preview */}
          {(displayContent || (step === 'writing' && streamingContent === '')) && step !== 'idle' && step !== 'error' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glow-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-emerald-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    {step === 'writing' ? 'Generating LaTeX...' : 'LaTeX Source'}
                  </span>
                  {step === 'writing' && (
                    <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse rounded-sm ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {displayContent && (
                    <>
                      <button onClick={copyLatex} className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={downloadLatex} className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50">
                        <Download className="w-3.5 h-3.5" />
                        .tex
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="terminal text-xs text-gray-600 h-64 overflow-y-auto rounded-none scrollbar-hide">
                <pre ref={streamRef} className="whitespace-pre-wrap break-words">
                  {displayContent}
                  {step === 'writing' && <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse ml-0.5 align-text-bottom" />}
                </pre>
              </div>
            </motion.div>
          )}

          {/* PDF download / compile */}
          {step === 'done' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              ) : (
                <a
                  href={`https://latexonline.cc/compile?text=${encodeURIComponent(latexContent)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Compile PDF
                </a>
              )}
              <button
                onClick={downloadLatex}
                className="flex items-center justify-center gap-2 bg-white border-2 border-emerald-100 text-emerald-700 py-3 rounded-xl font-semibold text-sm hover:border-emerald-300 transition-all"
              >
                <Download className="w-4 h-4" />
                Download .tex
              </button>
            </motion.div>
          )}

          {/* Empty state */}
          {step === 'idle' && (
            <div className="glow-card p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Your resume will appear here</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Select a template, add optional instructions, then click Generate. DeepSeek V3 will craft your resume from your GitHub data — you&apos;ll see it stream in word-by-word.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
