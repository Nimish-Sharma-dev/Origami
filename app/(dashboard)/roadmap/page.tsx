'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Map, RefreshCcw, CheckCircle2, Circle, Lock, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES = {
  completed:    { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-800', icon: CheckCircle2, dot: '#10b981' },
  'in-progress':{ bg: 'bg-teal-50',    border: 'border-teal-400',    text: 'text-teal-800',    icon: Circle,      dot: '#0d9488' },
  recommended:  { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-800',    icon: Sparkles,    dot: '#3b82f6' },
  locked:       { bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-500',    icon: Lock,        dot: '#9ca3af' },
}

const CAT_COLORS: Record<string, string> = {
  Frontend: '#3b82f6', Backend: '#10b981', 'AI/ML': '#8b5cf6',
  DevOps: '#f59e0b', Cloud: '#06b6d4', Other: '#6b7280',
}

function RoadmapNode({ data }: { data: { label: string; description: string; status: string; category: string } }) {
  const style = STATUS_STYLES[data.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.locked
  const Icon = style.icon
  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${style.bg} ${style.border} min-w-[160px] max-w-[180px]`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${style.text}`} />
        <span className={`text-xs font-bold ${style.text} truncate`}>{data.label}</span>
      </div>
      <p className="text-[10px] text-gray-500 line-clamp-2">{data.description}</p>
      <div className="mt-1.5 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[data.category] || '#6b7280' }} />
        <span className="text-[10px] text-gray-400">{data.category}</span>
      </div>
    </div>
  )
}

const nodeTypes = { roadmapNode: RoadmapNode }

const INTERESTS = ['Full-stack Developer', 'AI/ML Engineer', 'DevOps Engineer', 'Mobile Developer', 'Open Source', 'Startup Founder']

export default function RoadmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [generating, setGenerating] = useState(false)
  const [hasRoadmap, setHasRoadmap] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [rawNodes, setRawNodes] = useState<{ id: string; title: string; description: string; status: string; category: string; priority: number }[]>([])
  const supabase = createClient()

  const onConnect = useCallback((params: Connection) => setEdges(es => addEdge(params, es)), [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('roadmap_nodes').select('*').eq('user_id', user.id).order('priority')
      if (data && data.length > 0) {
        setRawNodes(data)
        buildGraph(data)
        setHasRoadmap(true)
      }
    }
    load()
  }, [])

  const buildGraph = (data: { id: string; title: string; description: string; status: string; category: string; priority: number }[]) => {
    const cols: Record<string, number> = {}
    const flowNodes: Node[] = data.map((n, i) => {
      const col = Math.floor(i / 3)
      const row = i % 3
      cols[col] = (cols[col] || 0) + 1
      return {
        id: n.id,
        type: 'roadmapNode',
        position: { x: col * 240, y: row * 140 },
        data: { label: n.title, description: n.description, status: n.status, category: n.category },
      }
    })

    const flowEdges: Edge[] = []
    for (let i = 0; i < data.length - 1; i++) {
      const a = data[i], b = data[i + 1]
      if (b.priority - a.priority <= 2) {
        flowEdges.push({
          id: `e-${a.id}-${b.id}`,
          source: a.id,
          target: b.id,
          style: { stroke: '#d1fae5', strokeWidth: 2 },
          animated: b.status === 'in-progress',
        })
      }
    }

    setNodes(flowNodes)
    setEdges(flowEdges)
  }

  const generate = async () => {
    if (!userId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, interests: selectedInterests }),
      })
      const data = await res.json()
      if (data.roadmap?.nodes) {
        const { data: saved } = await supabase.from('roadmap_nodes').select('*').eq('user_id', userId).order('priority')
        if (saved) { setRawNodes(saved); buildGraph(saved) }
        setHasRoadmap(true)
      }
    } finally {
      setGenerating(false)
    }
  }

  const toggleStatus = async (nodeId: string) => {
    const node = rawNodes.find(n => n.id === nodeId)
    if (!node) return
    const nextStatus = node.status === 'completed' ? 'in-progress' : node.status === 'in-progress' ? 'completed' : node.status === 'recommended' ? 'in-progress' : node.status
    await supabase.from('roadmap_nodes').update({ status: nextStatus }).eq('id', nodeId)
    const updated = rawNodes.map(n => n.id === nodeId ? { ...n, status: nextStatus } : n)
    setRawNodes(updated)
    buildGraph(updated)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Controls */}
      <div className="glow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 mb-1">Career Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button key={interest}
                onClick={() => setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
                  selectedInterests.includes(interest)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'
                }`}>
                {interest}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-60 flex-shrink-0">
          <RefreshCcw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : hasRoadmap ? 'Regenerate' : 'Generate Roadmap'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(STATUS_STYLES).map(([status, style]) => {
          const Icon = style.icon
          return (
            <div key={status} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${style.text}`} />
              <span className="capitalize">{status.replace('-', ' ')}</span>
            </div>
          )
        })}
        <span className="text-gray-300">|</span>
        <span>Click a node to toggle completion status</span>
      </div>

      {/* ReactFlow Graph */}
      {hasRoadmap ? (
        <div className="glow-card overflow-hidden" style={{ height: 520 }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => toggleStatus(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#d1fae5" gap={24} size={1} />
            <Controls className="!border-emerald-100 !shadow-sm" />
            <MiniMap
              nodeColor={n => STATUS_STYLES[(n.data as { status: string }).status as keyof typeof STATUS_STYLES]?.dot || '#9ca3af'}
              className="!border-emerald-100 !rounded-xl overflow-hidden"
            />
          </ReactFlow>
        </div>
      ) : (
        <div className="glow-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Generate Your Career Roadmap</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Select your career interests above and click Generate. DeepSeek will build a personalized learning path based on your current skills.
          </p>
          <button onClick={generate} disabled={generating}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto hover:shadow-md transition-all disabled:opacity-60">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Roadmap'}
          </button>
        </div>
      )}

      {/* Node list */}
      {rawNodes.length > 0 && (
        <div className="glow-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Roadmap Checklist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rawNodes.map(node => {
              const style = STATUS_STYLES[node.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.locked
              const Icon = style.icon
              return (
                <button key={node.id} onClick={() => toggleStatus(node.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${style.bg} ${style.border}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${style.text}`}>{node.title}</p>
                    <p className="text-xs text-gray-400 truncate">{node.category}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
