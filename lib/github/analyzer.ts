// ============================================================
// README & Repository Analyzer
// Extracts tech stack, project type, and skill signals
// ============================================================

export interface AnalysisResult {
  technologies: string[]
  projectType: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  deploymentStack: string[]
  highlights: string[]
}

const TECH_PATTERNS: Record<string, RegExp> = {
  // Frontend
  'React': /\breact(\.js)?\b/i,
  'Next.js': /next\.js/i,
  'Vue.js': /\bvue(\.js)?\b/i,
  'Angular': /\bangular\b/i,
  'Svelte': /\bsvelte\b/i,
  'Tailwind CSS': /tailwind/i,
  'TypeScript': /typescript/i,
  'JavaScript': /javascript/i,

  // Backend
  'Node.js': /node\.js/i,
  'Express': /\bexpress\b/i,
  'FastAPI': /fastapi/i,
  'Django': /\bdjango\b/i,
  'Flask': /\bflask\b/i,
  'Spring Boot': /spring boot/i,
  'NestJS': /nestjs/i,

  // AI/ML
  'TensorFlow': /tensorflow/i,
  'PyTorch': /pytorch/i,
  'OpenAI': /openai/i,
  'LangChain': /langchain/i,
  'Hugging Face': /hugging.?face/i,
  'scikit-learn': /scikit.learn/i,

  // Databases
  'PostgreSQL': /postgresql|postgres/i,
  'MongoDB': /mongodb/i,
  'MySQL': /\bmysql\b/i,
  'Redis': /\bredis\b/i,
  'Supabase': /supabase/i,
  'Prisma': /\bprisma\b/i,

  // Cloud/DevOps
  'Docker': /\bdocker\b/i,
  'Kubernetes': /kubernetes|k8s/i,
  'AWS': /\baws\b|\bamazon web services\b/i,
  'GCP': /\bgcp\b|\bgoogle cloud\b/i,
  'Azure': /\bazure\b/i,
  'Vercel': /\bvercel\b/i,
  'GitHub Actions': /github.?actions/i,

  // Auth
  'Clerk': /\bclerk\b/i,
  'NextAuth': /next.?auth/i,
  'Auth0': /auth0/i,

  // Other
  'GraphQL': /graphql/i,
  'REST API': /rest.?api/i,
  'Stripe': /\bstripe\b/i,
  'WebSocket': /websocket/i,
}

const PROJECT_TYPE_PATTERNS: Record<string, RegExp[]> = {
  'Full-stack Web App': [/next\.js/i, /fullstack|full.stack/i, /frontend.*backend/i],
  'AI/ML Project': [/machine learning|deep learning|neural network|llm|gpt|ai.?powered/i],
  'API/Backend Service': [/\bapi\b/, /\bmicroservice\b/i, /\brest\b/i, /\bgraphql\b/i],
  'CLI Tool': [/\bcli\b/i, /command.?line/i, /\bterminal\b/i],
  'Mobile App': [/\bmobile\b/i, /\bflutter\b/i, /\breact native\b/i],
  'DevOps/Infrastructure': [/\bdocker\b/i, /\bkubernetes\b/i, /\binfrastructure\b/i],
  'Data Science': [/\bpandas\b/i, /\banalysis\b/i, /\bvisualization\b/i, /\bjupyter\b/i],
  'Open Source Library': [/\bnpm package\b/i, /\bpypi\b/i, /\blibrary\b/i],
}

const DEPLOYMENT_PATTERNS: Record<string, RegExp> = {
  'Vercel': /vercel/i,
  'Netlify': /netlify/i,
  'Railway': /railway/i,
  'Render': /\brender\.com\b/i,
  'AWS': /\baws\b|\bec2\b|\blambda\b/i,
  'GCP': /\bgcp\b|\bcloud run\b/i,
  'Docker': /\bdocker\b/i,
  'Heroku': /heroku/i,
}

export function analyzeReadme(readme: string): AnalysisResult {
  if (!readme) {
    return { technologies: [], projectType: 'Unknown', complexity: 'beginner', deploymentStack: [], highlights: [] }
  }

  const technologies: string[] = []
  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(readme)) {
      technologies.push(tech)
    }
  }

  let projectType = 'General Project'
  for (const [type, patterns] of Object.entries(PROJECT_TYPE_PATTERNS)) {
    if (patterns.some(p => p.test(readme))) {
      projectType = type
      break
    }
  }

  const deploymentStack: string[] = []
  for (const [service, pattern] of Object.entries(DEPLOYMENT_PATTERNS)) {
    if (pattern.test(readme)) {
      deploymentStack.push(service)
    }
  }

  // Complexity heuristic
  const wordCount = readme.split(/\s+/).length
  const complexity =
    technologies.length >= 8 || wordCount > 1000
      ? 'advanced'
      : technologies.length >= 4 || wordCount > 300
      ? 'intermediate'
      : 'beginner'

  // Extract highlights (lines with key achievements)
  const highlights: string[] = []
  const lines = readme.split('\n')
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, '').trim()
    if (clean.length > 20 && clean.length < 120 && /✨|🚀|⚡|feat|feature|highlight|built|created|designed/i.test(line)) {
      highlights.push(clean)
      if (highlights.length >= 3) break
    }
  }

  return { technologies, projectType, complexity, deploymentStack, highlights }
}

export function extractSkillsFromTopics(topics: string[]): string[] {
  const knownSkillTopics = new Set([
    'react', 'nextjs', 'typescript', 'javascript', 'python', 'nodejs',
    'django', 'fastapi', 'mongodb', 'postgresql', 'redis', 'docker',
    'kubernetes', 'aws', 'gcp', 'tensorflow', 'pytorch', 'graphql',
    'tailwindcss', 'vue', 'angular', 'rust', 'golang', 'java',
    'machine-learning', 'deep-learning', 'nlp', 'computer-vision',
    'full-stack', 'backend', 'frontend', 'devops', 'web-scraping',
    'open-source', 'api', 'cli', 'automation', 'data-science',
  ])

  return topics
    .map(t => t.toLowerCase())
    .filter(t => knownSkillTopics.has(t))
    .map(t => t.charAt(0).toUpperCase() + t.slice(1))
}
