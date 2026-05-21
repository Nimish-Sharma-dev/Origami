# 🗂 Origami — AI Resume Builder for Developers

> Turn your GitHub into a professional ATS-optimized resume.  
> Built for students, developers, hackathon builders, and internship seekers.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/origami)

---

## 🚀 What's Built (MVP Complete)

| Feature | Status |
|---|---|
| Landing page (hero, features, how-it-works, templates, CTA) | ✅ Done |
| BlurText, BounceCards, Dock (React Bits components) | ✅ Done |
| Google OAuth + GitHub OAuth (via Supabase) | ✅ Done |
| Auth callback → auto-create user profile | ✅ Done |
| Dashboard layout (sidebar, topbar, mobile-responsive) | ✅ Done |
| Dashboard homepage (stats, skill radar, activity, top repos) | ✅ Done |
| GitHub analyzer (public repos, languages, READMEs, complexity) | ✅ Done |
| Skill extraction from READMEs + topics | ✅ Done |
| Resume builder UI (template picker, custom instructions) | ✅ Done |
| DeepSeek V3 resume generation (LaTeX output) | ✅ Done |
| 4 resume templates (FAANG, Modern, AI/ML, Hackathon) | ✅ Done |
| LaTeXOnline PDF compilation | ✅ Done |
| ATS scoring engine (DeepSeek analysis) | ✅ Done |
| ATS score dashboard (score rings, breakdowns, suggestions) | ✅ Done |
| Skills graph (radar, bar chart, manual add/remove) | ✅ Done |
| Career roadmap (ReactFlow node graph, AI-generated) | ✅ Done |
| Roadmap checklist (click to mark complete) | ✅ Done |
| Export center (PDF, .tex download, copy, Overleaf link) | ✅ Done |
| Settings (profile, education, certifications, experience) | ✅ Done |
| Supabase schema + RLS policies + storage + auth trigger | ✅ Done |
| Green/teal light theme, Tailwind design tokens | ✅ Done |
| Middleware (route protection, auth redirect) | ✅ Done |
| All API routes (GitHub, resume, ATS, roadmap, LaTeX) | ✅ Done |

---

## ⚠️ Remaining Work (Complete Before Launch)

### 1. Install `geist` font package
```bash
npm install geist
```
The `app/layout.tsx` imports `geist/font/sans` and `geist/font/mono`. Either install this package or swap to a Google Font:
```tsx
// Replace in app/layout.tsx:
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })
// Use inter.variable in the html className
```

### 2. Create `.env.local` from `.env.example`
```bash
cp .env.example .env.local
# Fill in all values (see setup steps below)
```

### 3. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy **Project URL** and **anon key** → `.env.local`
3. Copy **service role key** → `.env.local`
4. Go to **SQL Editor** → paste and run `supabase/schema.sql` entirely
5. Go to **Authentication → Providers**:
   - Enable **Google** — add OAuth credentials from [console.cloud.google.com](https://console.cloud.google.com)
   - Enable **GitHub** — add credentials from [github.com/settings/developers](https://github.com/settings/developers)
6. Set redirect URL in Supabase Auth settings:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-app.vercel.app/auth/callback` (production)

### 4. GitHub OAuth App
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Homepage URL: `http://localhost:3000`
3. Callback URL: your Supabase project's OAuth callback (shown in Supabase Auth settings)
4. Copy Client ID and Secret into Supabase's GitHub provider settings

### 5. Google OAuth App
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New Project → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URI: your Supabase project's OAuth callback
4. Copy Client ID and Secret into Supabase's Google provider settings

### 6. DeepSeek API Key
1. Go to [platform.deepseek.com](https://platform.deepseek.com) → API Keys → New Key
2. Add to `.env.local` as `DEEPSEEK_API_KEY`

### 7. Install dependencies and run
```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🔧 Known Issues to Fix

### A. `app/layout.tsx` — geist font import
If you don't want to install the `geist` package, replace the font import:
```tsx
// Remove:
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

// Replace with:
import { Inter, JetBrains_Mono } from 'next/font/google'
const geistSans = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
```

### B. ReactFlow CSS import in `roadmap/page.tsx`
ReactFlow requires its CSS. This import is already in the file:
```tsx
import 'reactflow/dist/style.css'
```
This may cause a warning with Next.js App Router. If so, move it to `app/globals.css`:
```css
@import 'reactflow/dist/style.css';
```
And remove the import from `roadmap/page.tsx`.

### C. `react-flow-renderer` vs `reactflow`
The project uses `reactflow` (v11). Remove `react-flow-renderer` from `package.json` — it's an older package that was listed by mistake:
```bash
npm uninstall react-flow-renderer
```

### D. API routes use `createServiceClient` which reads cookies
The service client in API routes should use the service role key directly without cookie handling. For production, update `lib/supabase/server.ts` to export a second client that doesn't depend on Next.js cookies:
```ts
// Add this to lib/supabase/server.ts for use in API routes:
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
// Then replace createServiceClient() with createAdminClient() in API routes
```

### E. Auth callback route location
The callback route is at `app/auth/callback/route.ts` (outside the `(auth)` group). Make sure this matches your Supabase redirect URL exactly. The URL should be `https://your-domain.com/auth/callback`.

---

## 📦 Features NOT Yet Built (Future Work)

### High Priority
- [ ] **GitHub Connect flow** — After Google login, force GitHub connection before accessing dashboard. Currently both providers work independently. Add a `github-connect` page that prompts users who logged in with Google to also connect GitHub.
- [ ] **Streaming AI generation** — The resume builder currently waits for the full response. Add Server-Sent Events (SSE) or streaming API to show text appearing word-by-word using `stream: true` in DeepSeek API.
- [ ] **Resume live preview** — A real-time rendered preview of the resume as sections are edited. Could use an iframe pointing to the LaTeXOnline compile URL, or a React-based resume renderer.
- [ ] **Resume section editor** — Let users reorder, hide, and edit individual bullet points in the generated resume before downloading.
- [ ] **Repository analysis animation** — Visual scanning animation showing repos being processed one by one with detected skills appearing.

### Medium Priority
- [ ] **Profile completion percentage** — Accurate calculation in the dashboard showing which sections are missing.
- [ ] **Shareable ATS score card** — Generate a social card image (use `@vercel/og` or `satori`) showing "My ATS Score: 94 — built with Origami".
- [ ] **Developer DNA graph** — A unique visual fingerprint card combining skill distribution, GitHub stats, and project types.
- [ ] **Skill recommendations** — Based on current skills and roadmap, suggest 3-5 specific skills to learn next with resources.
- [ ] **Multiple resume versions** — Let users maintain different resumes for different roles (SWE, ML, DevOps) and switch between them.
- [ ] **BounceCards on landing page** — The `BounceCards` component is imported but not rendered. Add it to the hero section with resume template preview images.

### Lower Priority  
- [ ] **Mock interview feature** — AI-powered technical interview prep based on the user's resume and target role.
- [ ] **Recruiter portal** — Separate view where recruiters can browse candidate profiles (future monetization).
- [ ] **Job matching** — Integrate with a jobs API (Adzuna, JSearch) to match user skills to open positions.
- [ ] **Auto portfolio generator** — Generate a deployable portfolio site from GitHub data (separate Vercel project).
- [ ] **Hackathon recommendations** — Suggest hackathons based on skills and interests using Devpost or MLH APIs.
- [ ] **Team finder** — Match users with complementary skills for hackathon teams.
- [ ] **Career evolution timeline** — Track skill growth over time as the user updates their profile and regenerates resumes.
- [ ] **DOCX export** — Export resume as Word document using `docx` npm package.
- [ ] **Dark mode** — The design is currently light-mode only. Add dark mode support via `next-themes`.
- [ ] **Email notifications** — Notify users when ATS score drops or new skill recommendations are available.

---

## 🗂 Project Structure

```
origami/
├── app/
│   ├── (auth)/login/          # Login page (Google + GitHub OAuth)
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── layout.tsx         # Sidebar + navbar
│   │   ├── dashboard/         # Overview with stats + radar
│   │   ├── resume/            # Resume builder + AI generation
│   │   ├── github/            # Repository analysis
│   │   ├── skills/            # Skill radar + management
│   │   ├── ats/               # ATS score dashboard
│   │   ├── roadmap/           # Career roadmap (ReactFlow)
│   │   ├── export/            # Download PDF/LaTeX
│   │   └── settings/          # Profile, education, certs, experience
│   ├── api/
│   │   ├── github/analyze/    # POST: analyze GitHub repos
│   │   ├── resume/generate/   # POST: generate LaTeX resume
│   │   ├── ats/score/         # POST: run ATS analysis
│   │   ├── roadmap/generate/  # POST: generate career roadmap
│   │   └── latex/compile/     # POST: compile LaTeX → PDF
│   ├── auth/callback/         # OAuth callback handler
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Design tokens + animations
├── components/
│   ├── bits/                  # BlurText, BounceCards, Dock
├── lib/
│   ├── supabase/              # Browser + server clients
│   ├── github/                # API calls + README analyzer
│   ├── ai/                    # DeepSeek client + prompts
│   └── latex/                 # LaTeXOnline compiler
├── types/index.ts             # All TypeScript interfaces
├── supabase/schema.sql        # Full database schema + RLS
├── middleware.ts              # Route protection
└── .env.example               # Environment variable template
```

---

## 🚢 Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/yourusername/origami.git
git push -u origin main

# 2. Import to Vercel at vercel.com/new
# 3. Add all environment variables from .env.example
# 4. Deploy!
```

**Required environment variables in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_APP_URL` → set to your Vercel URL

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| Animations | Framer Motion |
| Charts | Recharts |
| Graph | ReactFlow |
| UI Components | React Bits (BlurText, BounceCards, Dock) |
| Auth | Supabase Auth (Google + GitHub OAuth) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI | DeepSeek V3 (chat completions API) |
| LaTeX | LaTeXOnline (free public API) |
| Deployment | Vercel |

---

## 📝 Notes

- **LaTeXOnline** is a free public API with no rate limit guarantees. For production, consider self-hosting a LaTeX compiler on a VPS, or use **Overleaf's API** (requires paid plan).
- **DeepSeek V3** costs approximately $0.001 per resume generation. Very affordable.
- **GitHub API** has a rate limit of 60 requests/hour unauthenticated. Since we use the user's OAuth token from Supabase, you get 5000 requests/hour per user.
- All user data is isolated via Supabase Row Level Security — users can only access their own data.
#   O r i g a m i  
 