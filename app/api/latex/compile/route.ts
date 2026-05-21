import { NextRequest, NextResponse } from 'next/server'
import { compileLaTeX, generateLatexDownloadUrl, validateLatex } from '@/lib/latex/compiler'

export async function POST(req: NextRequest) {
  try {
    const { latex_content } = await req.json()

    if (!latex_content) {
      return NextResponse.json({ error: 'Missing latex_content' }, { status: 400 })
    }

    const validation = validateLatex(latex_content)
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid LaTeX',
        details: validation.errors,
      }, { status: 400 })
    }

    // Try to compile
    const pdfBuffer = await compileLaTeX(latex_content)

    if (pdfBuffer) {
      const base64 = Buffer.from(pdfBuffer).toString('base64')
      return NextResponse.json({
        success: true,
        pdf_base64: base64,
        download_url: generateLatexDownloadUrl(latex_content),
      })
    }

    // Fallback to direct URL
    return NextResponse.json({
      success: false,
      download_url: generateLatexDownloadUrl(latex_content),
      message: 'Compilation not available, use download URL',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
