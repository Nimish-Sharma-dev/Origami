import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
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
