// ============================================================
// LaTeXOnline Compiler
// Converts LaTeX source → PDF via latexonline.cc
// ============================================================

const LATEX_ONLINE_URL = 'https://latexonline.cc/compile'

export async function compileLaTeX(latexSource: string): Promise<ArrayBuffer | null> {
  try {
    const url = new URL(LATEX_ONLINE_URL)
    url.searchParams.set('text', latexSource)
    url.searchParams.set('force', 'true')

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
    })

    if (!res.ok) {
      console.error('LaTeXOnline error:', res.status, await res.text())
      return null
    }

    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('pdf')) {
      console.error('LaTeXOnline returned non-PDF:', contentType)
      return null
    }

    return await res.arrayBuffer()
  } catch (err) {
    console.error('LaTeX compilation failed:', err)
    return null
  }
}

export async function compileLaTeXViaPost(latexSource: string): Promise<ArrayBuffer | null> {
  // Alternative: POST method for larger files
  try {
    const formData = new FormData()
    const blob = new Blob([latexSource], { type: 'text/plain' })
    formData.append('file', blob, 'resume.tex')

    const res = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

// Fallback: if LaTeXOnline is down, store raw LaTeX and show download link
export function generateLatexDownloadUrl(latexSource: string): string {
  const encoded = encodeURIComponent(latexSource)
  return `https://latexonline.cc/compile?text=${encoded}`
}

// Validate basic LaTeX structure
export function validateLatex(source: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!source.includes('\\documentclass')) {
    errors.push('Missing \\documentclass declaration')
  }
  if (!source.includes('\\begin{document}')) {
    errors.push('Missing \\begin{document}')
  }
  if (!source.includes('\\end{document}')) {
    errors.push('Missing \\end{document}')
  }
  if (source.includes('$') && (source.match(/\$/g) || []).length % 2 !== 0) {
    errors.push('Unmatched $ in math mode')
  }

  return { valid: errors.length === 0, errors }
}
