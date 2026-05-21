import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { scoreResumeATS } from '@/lib/ai/deepseek'
import { compileLaTeX } from '@/lib/latex/compiler'
import type { ResumeTemplate } from '@/types'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

export async function POST(req: NextRequest) {
  const { user_id, template = 'faang-classic', custom_instructions } = await req.json()

  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createAdminClient()

  // Fetch all user data
  const [
    { data: user },
    { data: skills },
    { data: repos },
    { data: certs },
    { data: experiences },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user_id).single(),
    supabase.from('skills').select('*').eq('user_id', user_id).order('confidence_score', { ascending: false }),
    supabase.from('repositories').select('*').eq('user_id', user_id).order('complexity_score', { ascending: false }).limit(10),
    supabase.from('certifications').select('*').eq('user_id', user_id),
    supabase.from('experiences').select('*').eq('user_id', user_id),
  ])

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build the prompt (same logic as non-streaming version)
  const topRepos = (repos || [])
    .sort((a: { complexity_score: number }, b: { complexity_score: number }) => b.complexity_score - a.complexity_score)
    .slice(0, 5)

  const repoDescriptions = topRepos
    .map((r: { repo_name: string; description: string; languages: Record<string, number>; topics: string[]; stars: number; readme_content?: string }) => {
      const langs = Object.keys(r.languages).slice(0, 4).join(', ')
      const readme = r.readme_content ? r.readme_content.slice(0, 400) : ''
      return `Project: ${r.repo_name}\nDescription: ${r.description || 'No description'}\nLanguages: ${langs}\nTopics: ${r.topics.join(', ')}\nStars: ${r.stars}\nREADME excerpt: ${readme}`
    })
    .join('\n---\n')

  const skillsList = (skills || [])
    .sort((a: { confidence_score: number }, b: { confidence_score: number }) => b.confidence_score - a.confidence_score)
    .map((s: { skill_name: string }) => s.skill_name)
    .join(', ')

  const experienceText = (experiences || [])
    .map((e: { role: string; organization: string; duration: string; description: string }) => `${e.role} at ${e.organization} (${e.duration}): ${e.description}`)
    .join('\n')

  const certText = (certs || [])
    .map((c: { title: string; issuer: string; issue_date: string }) => `${c.title} — ${c.issuer} (${c.issue_date})`)
    .join('\n')

  const templateInstructions: Record<string, string> = {
    'faang-classic': 'Use a clean black-and-white FAANG-style resume. Dense information layout.',
    'modern-developer': 'Use a modern developer style with subtle spacing and clean headers.',
    'ai-ml-research': 'Emphasize AI/ML projects, research experience, and technical depth.',
    'hackathon-builder': 'Emphasize projects, hackathon wins, and rapid building ability.',
  }

  const systemPrompt = `You are an expert resume writer and LaTeX typesetter specializing in software engineering resumes. 
You write ATS-optimized, recruiter-approved resumes that highlight technical depth.
You ALWAYS output ONLY valid LaTeX code — no markdown, no explanation, just raw LaTeX starting with \\documentclass.
You use strong action verbs, quantify achievements, and write impactful bullet points.`

  const userPrompt = `Generate a complete, professional LaTeX resume for:

NAME: ${user.name || 'Developer'}
EMAIL: ${user.email}
GITHUB: github.com/${user.github_username || ''}

EDUCATION:
College: ${user.college || 'Not specified'}
Degree: ${user.degree || 'B.Tech'} in ${user.specialization || 'Computer Science'}
Graduation: ${user.graduation_year || '2025'}
CGPA: ${user.cgpa || ''}

TECHNICAL SKILLS:
${skillsList}

EXPERIENCE:
${experienceText || 'No formal experience listed'}

TOP PROJECTS (from GitHub analysis):
${repoDescriptions}

CERTIFICATIONS:
${certText || 'None listed'}

TEMPLATE STYLE: ${templateInstructions[template] || templateInstructions['faang-classic']}

${custom_instructions ? `ADDITIONAL INSTRUCTIONS: ${custom_instructions}` : ''}

Requirements:
1. Write STRONG bullet points for each project using action verbs
2. Quantify achievements where possible
3. Include relevant tech stack keywords for ATS optimization
4. Keep it to ONE page if possible
5. Use the Jake's Resume or a similar clean LaTeX template
6. Output ONLY the LaTeX code, nothing else

Output ONLY valid LaTeX. Start with \\documentclass.`

  // Create SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Step 1: Signal start
        sendEvent('status', { step: 'writing', message: 'DeepSeek is writing your resume...' })

        // Step 2: Stream from DeepSeek
        const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4096,
            stream: true,
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          sendEvent('error', { message: `DeepSeek API error: ${res.status} — ${err}` })
          controller.close()
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          sendEvent('error', { message: 'No response body from DeepSeek' })
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              const json = JSON.parse(trimmed.slice(6))
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                sendEvent('chunk', { content: delta })
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        // Clean the LaTeX content
        const cleanedLatex = fullContent
          .replace(/^```latex\n?/i, '')
          .replace(/^```\n?/, '')
          .replace(/\n?```$/, '')
          .trim()

        sendEvent('status', { step: 'scoring', message: 'Calculating ATS score...' })

        // Step 3: ATS scoring
        const atsScore = await scoreResumeATS(cleanedLatex)

        sendEvent('status', { step: 'compiling', message: 'Compiling LaTeX to PDF...' })

        // Step 4: Try PDF compilation
        let pdfUrl: string | null = null
        const pdfBuffer = await compileLaTeX(cleanedLatex)

        if (pdfBuffer) {
          const fileName = `${user_id}/${Date.now()}_resume.pdf`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            })

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName)
            pdfUrl = urlData.publicUrl
          }
        }

        // Step 5: Save resume
        const { data: savedResume } = await supabase
          .from('resumes')
          .insert({
            user_id,
            template: template as ResumeTemplate,
            latex_content: cleanedLatex,
            pdf_url: pdfUrl,
            ats_score: atsScore.overall,
          })
          .select()
          .single()

        // Step 6: Send final result
        sendEvent('complete', {
          resume_id: savedResume?.id,
          latex_content: cleanedLatex,
          pdf_url: pdfUrl,
          ats_score: atsScore,
        })

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        sendEvent('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
