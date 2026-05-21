import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Origami — Turn Your GitHub Into A Professional Resume',
  description:
    'Generate ATS-optimized resumes, career roadmaps, and skill intelligence directly from your GitHub projects. Built for developers, students, and hackathon builders.',
  keywords: ['resume builder', 'ATS resume', 'GitHub resume', 'developer resume', 'LaTeX resume', 'career roadmap'],
  openGraph: {
    title: 'Origami — AI Resume Builder for Developers',
    description: 'Turn your GitHub into a professional ATS-optimized resume in minutes.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
