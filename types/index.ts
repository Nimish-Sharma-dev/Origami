// ============================================================
// ORIGAMI — Global Type Definitions
// ============================================================

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  github_username?: string
  github_connected: boolean
  college?: string
  degree?: string
  specialization?: string
  cgpa?: string
  graduation_year?: string
  created_at: string
}

export interface Repository {
  id: string
  user_id: string
  repo_name: string
  full_name: string
  description?: string
  languages: Record<string, number>
  topics: string[]
  stars: number
  forks: number
  readme_content?: string
  complexity_score: number
  is_pinned: boolean
  html_url: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  user_id: string
  skill_name: string
  category: SkillCategory
  confidence_score: number // 0-100
  source: 'github' | 'manual' | 'ai_detected'
}

export type SkillCategory =
  | 'Frontend'
  | 'Backend'
  | 'AI/ML'
  | 'DevOps'
  | 'Cloud'
  | 'Databases'
  | 'Mobile'
  | 'Languages'
  | 'Tools'
  | 'Other'

export interface Certification {
  id: string
  user_id: string
  title: string
  issuer: string
  issue_date: string
  credential_url?: string
  created_at: string
}

export interface Experience {
  id: string
  user_id: string
  role: string
  organization: string
  duration: string
  description: string
  is_current: boolean
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  template: ResumeTemplate
  latex_content: string
  pdf_url?: string
  ats_score: number
  created_at: string
}

export type ResumeTemplate =
  | 'faang-classic'
  | 'modern-developer'
  | 'ai-ml-research'
  | 'hackathon-builder'

export interface ATSScore {
  overall: number
  keyword_match: number
  structure_quality: number
  impact_score: number
  project_quality: number
  strengths: string[]
  weaknesses: string[]
  missing_keywords: string[]
  suggestions: string[]
}

export interface RoadmapNode {
  id: string
  user_id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'locked' | 'recommended'
  priority: number
  category: string
  parent_id?: string
  resources?: string[]
}

export interface GitHubStats {
  total_repos: number
  total_stars: number
  total_forks: number
  languages: Record<string, number>
  top_topics: string[]
  contribution_count: number
  pinned_repos: Repository[]
}

export interface SkillRadarData {
  category: string
  score: number
  fullMark: number
}

export interface ProfileCompletion {
  total: number
  sections: {
    name: string
    completed: boolean
    points: number
  }[]
}

export interface ResumeSection {
  id: string
  type: 'education' | 'experience' | 'projects' | 'skills' | 'certifications' | 'achievements'
  visible: boolean
  order: number
}

export interface GenerateResumeRequest {
  user_id: string
  template: ResumeTemplate
  sections?: ResumeSection[]
  custom_instructions?: string
}

export interface GenerateResumeResponse {
  latex_content: string
  pdf_url?: string
  ats_score: ATSScore
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  created_at: string
}

export interface GitHubUser {
  login: string
  name: string
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  location: string | null
  blog: string | null
  company: string | null
}

export interface ActivityEvent {
  id: string
  type: 'certification' | 'repo_analyzed' | 'resume_generated' | 'ats_improved' | 'skill_added'
  title: string
  description: string
  timestamp: string
}

export interface DashboardStats {
  total_repos: number
  total_skills: number
  ats_score: number
  resume_strength: number
  github_activity_score: number
  profile_completion: number
}
