import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateResumeLatex, scoreResumeATS } from '@/lib/ai/deepseek'
import { compileLaTeX } from '@/lib/latex/compiler'
import type { ResumeTemplate } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { user_id, template = 'faang-classic', custom_instructions } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch all user data in parallel
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate LaTeX
    const latex = await generateResumeLatex({
      name: user.name || 'Developer',
      email: user.email,
      github_username: user.github_username || '',
      college: user.college,
      degree: user.degree,
      specialization: user.specialization,
      graduation_year: user.graduation_year,
      cgpa: user.cgpa,
      skills: skills || [],
      repositories: repos || [],
      certifications: certs || [],
      experiences: experiences || [],
      template,
      custom_instructions,
    })

    // Score the resume
    const atsScore = await scoreResumeATS(latex)

    // Try to compile PDF
    let pdfUrl: string | null = null
    const pdfBuffer = await compileLaTeX(latex)

    if (pdfBuffer) {
      // Upload PDF to Supabase Storage
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

    // Save resume to database
    const { data: savedResume, error: saveError } = await supabase
      .from('resumes')
      .insert({
        user_id,
        template: template as ResumeTemplate,
        latex_content: latex,
        pdf_url: pdfUrl,
        ats_score: atsScore.overall,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Resume save error:', saveError)
    }

    return NextResponse.json({
      success: true,
      resume_id: savedResume?.id,
      latex_content: latex,
      pdf_url: pdfUrl,
      ats_score: atsScore,
    })
  } catch (err: unknown) {
    console.error('Resume generation error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resumes })
}
