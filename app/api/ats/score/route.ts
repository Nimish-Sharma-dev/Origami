import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreResumeATS } from '@/lib/ai/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { user_id, resume_id, target_role } = await req.json()

    if (!user_id || !resume_id) {
      return NextResponse.json({ error: 'Missing user_id or resume_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', user_id)
      .single()

    if (error || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const atsScore = await scoreResumeATS(resume.latex_content, target_role)

    // Update resume with new score
    await supabase
      .from('resumes')
      .update({ ats_score: atsScore.overall })
      .eq('id', resume_id)

    return NextResponse.json({ success: true, ats_score: atsScore })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
