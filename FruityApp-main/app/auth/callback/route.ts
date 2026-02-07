import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }

      if (data?.session) {
        // Get user to check if profile exists
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if user profile exists
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single()

          // Create profile if it doesn't exist
          if (!profile) {
            await supabase.from('users').insert({
              id: user.id,
              email: user.email!,
              display_name: user.email?.split('@')[0] || 'User'
            })
          }
        }

        // Redirect to dashboard with session
        const response = NextResponse.redirect(`${origin}/dashboard`)

        // Set long-lasting session cookies (7 days)
        const cookieStore = request.cookies
        cookieStore.getAll().forEach(cookie => {
          if (cookie.name.startsWith('sb-')) {
            response.cookies.set(cookie.name, cookie.value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: '/',
            })
          }
        })

        return response
      }
    } catch (err) {
      console.error('Unexpected auth error:', err)
      return NextResponse.redirect(`${origin}/login?error=unexpected`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
