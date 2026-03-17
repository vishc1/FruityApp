'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (error) {
          toast.error(error.message)
        } else if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            // Session established - user can log in immediately
            // Create user profile
            const { error: insertError } = await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email!,
              display_name: data.user.email?.split('@')[0] || 'User'
            })

            if (insertError) {
              console.error('Profile creation error:', insertError)
              // Profile might already exist, that's okay
            }

            toast.success('Account created! Redirecting...')

            // Keep loading state to prevent form resubmission
            // Force a full page reload to dashboard
            console.log('Setting up redirect to dashboard after signup...')
            setTimeout(() => {
              console.log('Redirecting to dashboard now...')
              window.location.replace('/dashboard')
            }, 1000)

            // Don't set loading to false
            return
          } else {
            // No session - email confirmation required
            toast.success('Account created! Please check your email to confirm your account before signing in.')
            setIsSignUp(false) // Switch to sign-in mode
            setPassword('') // Clear password field
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log('Sign in response:', { data, error })

        if (error) {
          console.error('Sign in error:', error)
          // Provide more helpful error messages
          if (error.message.includes('Email not confirmed')) {
            toast.error('Please confirm your email before signing in. Check your inbox for the confirmation link.')
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Incorrect email or password. Please try again.')
          } else {
            toast.error(error.message)
          }
          return
        }

        // Check if we got a user back
        if (!data.user) {
          console.error('No user in response')
          toast.error('Sign in failed. Please try again.')
          return
        }

        console.log('Sign in successful, user:', data.user.email)

        // Ensure user profile exists
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!profile || profileError?.code === 'PGRST116') {
            // Create profile if it doesn't exist
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email!,
              display_name: data.user.email?.split('@')[0] || 'User'
            })
          }
        } catch (err) {
          console.error('Profile check/create error:', err)
          // Continue anyway - profile creation isn't critical for login
        }

        toast.success('Welcome back!')

        // Keep loading state to prevent form resubmission
        // Don't set loading to false - we're redirecting

        // Force a full page reload to dashboard
        console.log('Setting up redirect to dashboard...')
        setTimeout(() => {
          console.log('Redirecting to dashboard now...')
          window.location.replace('/dashboard')
        }, 1000)

        // Don't execute finally block
        return
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-green-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-bold text-orange-600 mb-2">🍊 Fruity</h1>
          </Link>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder={isSignUp ? 'Choose a strong password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {isSignUp
                ? 'By signing up, you agree to share fruit with your neighbors!'
                : 'Secure password authentication'}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-orange-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
