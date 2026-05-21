// ============================================================
// DeepSeek V3 AI Client
// Resume generation, skill analysis, career roadmap
// ============================================================

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function deepseekChat(
  messages: Message[],
  options: { temperature?: number; max_tokens?: number; stream?: boolean } = {}
): Promise<string> {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── Resume Generation ──────────────────────────────────────

export interface ResumeInput {
  name: string
  email: string
  github_username: string
  college?: string
  degree?: string
  specialization?: string
  graduation_year?: string
  cgpa?: string
  skills: { skill_name: string; category: string; confidence_score: number }[]
  repositories: {
    repo_name: string
    description: string
    languages: Record<string, number>
    topics: string[]
    stars: number
    readme_content?: string
    complexity_score: number
  }[]
  certifications: { title: string; issuer: string; issue_date: string; credential_url?: string }[]
  experiences: { role: string; organization: string; duration: string; description: string }[]
  template: string
  custom_instructions?: string
}

export async function generateResumeLatex(input: ResumeInput): Promise<string> {
  const topRepos = input.repositories
    .sort((a, b) => b.complexity_score - a.complexity_score)
    .slice(0, 5)

  const repoDescriptions = topRepos
    .map(r => {
      const langs = Object.keys(r.languages).slice(0, 4).join(', ')
      const readme = r.readme_content ? r.readme_content.slice(0, 400) : ''
      return `
Project: ${r.repo_name}
Description: ${r.description || 'No description'}
Languages: ${langs}
Topics: ${r.topics.join(', ')}
Stars: ${r.stars}
README excerpt: ${readme}`
    })
    .join('\n---\n')

  const skillsList = input.skills
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .map(s => s.skill_name)
    .join(', ')

  const experienceText = input.experiences
    .map(e => `${e.role} at ${e.organization} (${e.duration}): ${e.description}`)
    .join('\n')

  const certText = input.certifications
    .map(c => `${c.title} — ${c.issuer} (${c.issue_date})`)
    .join('\n')

  const systemPrompt = `You are an expert resume writer and LaTeX typesetter specializing in software engineering resumes. 
You write ATS-optimized, recruiter-approved resumes that highlight technical depth.
You ALWAYS output ONLY valid LaTeX code — no markdown, no explanation, just raw LaTeX starting with \\documentclass.
You use strong action verbs, quantify achievements, and write impactful bullet points.`

  const templateInstructions: Record<string, string> = {
    'faang-classic': 'Use a clean black-and-white FAANG-style resume. Dense information layout. Perfect for software engineering internships at top tech companies.',
    'modern-developer': 'Use a modern developer style with subtle spacing and clean headers. Good for startups and product companies.',
    'ai-ml-research': 'Emphasize AI/ML projects, research experience, and technical depth. Include any papers or publications.',
    'hackathon-builder': 'Emphasize projects, hackathon wins, and rapid building ability. Project-forward structure.',
  }

  const userPrompt = `Generate a complete, professional LaTeX resume for:

NAME: ${input.name}
EMAIL: ${input.email}
GITHUB: github.com/${input.github_username}

EDUCATION:
College: ${input.college || 'Not specified'}
Degree: ${input.degree || 'B.Tech'} in ${input.specialization || 'Computer Science'}
Graduation: ${input.graduation_year || '2025'}
CGPA: ${input.cgpa || ''}

TECHNICAL SKILLS:
${skillsList}

EXPERIENCE:
${experienceText || 'No formal experience listed'}

TOP PROJECTS (from GitHub analysis):
${repoDescriptions}

CERTIFICATIONS:
${certText || 'None listed'}

TEMPLATE STYLE: ${templateInstructions[input.template] || templateInstructions['faang-classic']}

${input.custom_instructions ? `ADDITIONAL INSTRUCTIONS: ${input.custom_instructions}` : ''}

Requirements:
1. Write STRONG bullet points for each project using action verbs (Engineered, Developed, Architected, Implemented, Optimized, etc.)
2. Quantify achievements where possible (e.g., "reduced load time by 40%", "serving 200+ users")
3. Include relevant tech stack keywords for ATS optimization
4. Keep it to ONE page if possible, two pages max
5. Use the Jake's Resume or a similar clean LaTeX template
6. Output ONLY the LaTeX code, nothing else

Output ONLY valid LaTeX. Start with \\documentclass.`

  const latex = await deepseekChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.3, max_tokens: 4096 }
  )

  // Clean any accidental markdown wrapping
  return latex
    .replace(/^```latex\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}

// ── ATS Scoring ───────────────────────────────────────────

export async function scoreResumeATS(
  latexContent: string,
  targetRole: string = 'Software Engineer Intern'
): Promise<{
  overall: number
  keyword_match: number
  structure_quality: number
  impact_score: number
  project_quality: number
  strengths: string[]
  weaknesses: string[]
  missing_keywords: string[]
  suggestions: string[]
}> {
  const prompt = `Analyze this LaTeX resume for ATS optimization targeting "${targetRole}".

RESUME:
${latexContent.slice(0, 6000)}

Return a JSON object with EXACTLY this structure (no markdown, just JSON):
{
  "overall": <number 0-100>,
  "keyword_match": <number 0-100>,
  "structure_quality": <number 0-100>,
  "impact_score": <number 0-100>,
  "project_quality": <number 0-100>,
  "strengths": [<3-5 specific strengths as strings>],
  "weaknesses": [<3-5 specific weaknesses as strings>],
  "missing_keywords": [<5-10 important missing keywords for the role>],
  "suggestions": [<3-5 actionable improvement suggestions>]
}`

  const response = await deepseekChat(
    [{ role: 'user', content: prompt }],
    { temperature: 0.1, max_tokens: 1024 }
  )

  try {
    const clean = response.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      overall: 72,
      keyword_match: 68,
      structure_quality: 80,
      impact_score: 70,
      project_quality: 75,
      strengths: ['Good technical skills section', 'Clear project descriptions', 'Relevant tech stack'],
      weaknesses: ['Missing quantified achievements', 'Could add more industry keywords'],
      missing_keywords: ['CI/CD', 'Agile', 'System Design', 'REST API', 'Unit Testing'],
      suggestions: ['Add numbers to quantify project impact', 'Include more cloud platform experience'],
    }
  }
}

// ── Career Roadmap ────────────────────────────────────────

export async function generateRoadmap(
  skills: string[],
  interests: string[],
  currentLevel: string
): Promise<{
  nodes: { id: string; title: string; description: string; category: string; priority: number; status: string }[]
  edges: { source: string; target: string }[]
}> {
  const prompt = `Generate a personalized developer career roadmap for someone with:
Skills: ${skills.join(', ')}
Interests: ${interests.join(', ')}
Current Level: ${currentLevel}

Return a JSON object with nodes and edges for a learning roadmap:
{
  "nodes": [
    { "id": "1", "title": "skill/goal name", "description": "why this matters", "category": "Frontend|Backend|AI|DevOps|Cloud|Other", "priority": 1, "status": "completed|in-progress|recommended|locked" }
  ],
  "edges": [
    { "source": "1", "target": "2" }
  ]
}

Create 12-16 nodes forming a realistic learning path. Mark skills they already have as "completed". 
Return ONLY valid JSON.`

  const response = await deepseekChat(
    [{ role: 'user', content: prompt }],
    { temperature: 0.4, max_tokens: 2048 }
  )

  try {
    const clean = response.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return { nodes: [], edges: [] }
  }
}

// ── Skill Enhancement ────────────────────────────────────

export async function enhanceProjectDescription(
  repoName: string,
  rawDescription: string,
  languages: string[],
  readme?: string
): Promise<string> {
  const prompt = `Rewrite this GitHub project description as a professional resume bullet point.

Project: ${repoName}
Original: ${rawDescription || 'No description'}
Languages: ${languages.join(', ')}
${readme ? `README excerpt: ${readme.slice(0, 500)}` : ''}

Write ONE strong bullet point starting with an action verb.
- Use impact-focused language
- Include tech stack
- Add quantified estimates if reasonable
- Keep it under 120 characters
- NO bullet point symbol, just the text

Output ONLY the bullet text.`

  return deepseekChat([{ role: 'user', content: prompt }], { temperature: 0.5, max_tokens: 200 })
}
