'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  /** Pass server-side user to avoid flash on pages that already know auth state */
  initialUser?: { email?: string; id?: string } | null
}

export default function Nav({ initialUser }: NavProps) {
  const [user, setUser] = useState<any>(initialUser ?? undefined)
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/')
  }

  useEffect(() => {
    // Only fetch client-side if not pre-populated
    if (initialUser !== undefined) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const link = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🍊</span>
            <span className="text-lg font-bold text-orange-600">Fruity</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-5 overflow-x-auto">
            {link('/map', 'Find Fruit')}
            {link('/announcements', 'Community')}
            {link('/leaderboard', 'Leaderboard')}
            {user !== undefined && user !== null ? (
              <>
                {link('/messages', 'Messages')}
                {link('/dashboard', 'Dashboard')}
                <Link
                  href="/listings/new"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                >
                  + Share Fruit
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : user === null ? (
              <Link
                href="/login"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
              >
                Sign In
              </Link>
            ) : null /* loading — render nothing to avoid flash */}
          </nav>
        </div>
      </div>
    </header>
  )
}
