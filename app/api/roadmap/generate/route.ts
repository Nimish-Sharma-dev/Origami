import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/ai/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { user_id, interests = [] } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: skills } = await supabase
      .from('skills')
      .select('skill_name, confidence_score')
      .eq('user_id', user_id)
      .order('confidence_score', { ascending: false })
      .limit(20)

    const skillNames = (skills || []).map(s => s.skill_name)
    const avgConfidence = skills?.length
      ? skills.reduce((sum, s) => sum + s.confidence_score, 0) / skills.length
      : 30

    const level =
      avgConfidence >= 70 ? 'Senior' : avgConfidence >= 50 ? 'Mid-level' : 'Junior/Student'

    const roadmap = await generateRoadmap(skillNames, interests, level)

    // Save roadmap nodes to database
    if (roadmap.nodes.length > 0) {
      // Clear existing nodes
      await supabase.from('roadmap_nodes').delete().eq('user_id', user_id)

      const nodeInserts = roadmap.nodes.map(node => ({
        id: `${user_id}_${node.id}`,
        user_id,
        title: node.title,
        description: node.description,
        status: node.status,
        priority: node.priority,
        category: node.category,
      }))

      await supabase.from('roadmap_nodes').insert(nodeInserts)
    }

    return NextResponse.json({
      success: true,
      roadmap,
    })
  } catch (err: unknown) {
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

  const supabase = createAdminClient()
  const { data: nodes } = await supabase
    .from('roadmap_nodes')
    .select('*')
    .eq('user_id', user_id)
    .order('priority')

  return NextResponse.json({ nodes: nodes || [] })
}
