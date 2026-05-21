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
      // Upsert user profile
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture || null,
          github_username:
            data.user.user_metadata?.user_name ||
            data.user.user_metadata?.preferred_username || null,
          github_connected: data.user.app_metadata?.provider === 'github',
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
