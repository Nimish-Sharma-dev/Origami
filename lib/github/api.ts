import type { GitHubUser, GitHubRepo } from '@/types'

const GITHUB_API = 'https://api.github.com'

export async function getGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch GitHub user')
  return res.json()
}

export async function getPublicRepos(username: string, token?: string): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed&type=public`,
    { headers }
  )
  if (!res.ok) throw new Error('Failed to fetch repositories')
  return res.json()
}

export async function getRepoLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number>> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers })
  if (!res.ok) return {}
  return res.json()
}

export async function getReadme(
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

export async function getPinnedRepos(username: string): Promise<string[]> {
  // GitHub GraphQL for pinned repos
  const query = `
    query {
      user(login: "${username}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
            }
          }
        }
      }
    }
  `
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data?.user?.pinnedItems?.nodes?.map((n: { name: string }) => n.name) ?? []
  } catch {
    return []
  }
}

export function calculateComplexityScore(
  repo: GitHubRepo,
  languages: Record<string, number>,
  hasReadme: boolean
): number {
  let score = 0

  // Stars & forks
  score += Math.min(repo.stargazers_count * 5, 25)
  score += Math.min(repo.forks_count * 3, 15)

  // Language diversity
  const langCount = Object.keys(languages).length
  score += Math.min(langCount * 5, 20)

  // Has README
  if (hasReadme) score += 15

  // Topics / tags
  score += Math.min(repo.topics.length * 3, 15)

  // Code size (approximated from total language bytes)
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)
  if (totalBytes > 50000) score += 10

  return Math.min(score, 100)
}

export function aggregateLanguages(repos: Array<{ languages: Record<string, number> }>): Record<string, number> {
  const total: Record<string, number> = {}
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      total[lang] = (total[lang] ?? 0) + bytes
    }
  }
  return total
}

export function mapLanguagesToSkillCategories(
  languages: Record<string, number>
): Record<string, number> {
  const categoryMap: Record<string, string[]> = {
    Frontend: ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Svelte'],
    Backend: ['Python', 'Go', 'Rust', 'Java', 'C#', 'PHP', 'Ruby', 'Kotlin'],
    'AI/ML': ['Jupyter Notebook', 'R', 'MATLAB'],
    DevOps: ['Shell', 'Dockerfile', 'HCL'],
    Mobile: ['Swift', 'Dart', 'Objective-C', 'Kotlin'],
    Databases: ['PLSQL', 'TSQL'],
    Languages: ['C', 'C++', 'Haskell', 'Scala', 'Elixir'],
  }

  const scores: Record<string, number> = {
    Frontend: 0,
    Backend: 0,
    'AI/ML': 0,
    DevOps: 0,
    Mobile: 0,
    Databases: 0,
    Languages: 0,
    Cloud: 0,
  }

  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)
  if (totalBytes === 0) return scores

  for (const [lang, bytes] of Object.entries(languages)) {
    for (const [category, langs] of Object.entries(categoryMap)) {
      if (langs.includes(lang)) {
        scores[category] += (bytes / totalBytes) * 100
      }
    }
  }

  return scores
}
