import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const isGitHub = data.user.app_metadata?.provider === 'github'
      const githubUsername = isGitHub
        ? (data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username || null)
        : null

      // Check existing connection from database
      const { data: existingUser } = await supabase
        .from('users')
        .select('github_connected, github_username')
        .eq('id', data.user.id)
        .single()

      const hasGitHub = isGitHub || !!existingUser?.github_connected || !!existingUser?.github_username

      // Upsert user profile
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture || null,
          github_username: githubUsername || existingUser?.github_username || null,
          github_connected: hasGitHub,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )

      let redirectUrl = next
      if (!hasGitHub) {
        redirectUrl = '/github-connect'
      }

      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
