import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mock'

export function createClient() {
  // Use mock client if no API keys are provided
  const hasApiKeys =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your_anon_key')

  if (!hasApiKeys) {
    console.log('🎭 [MOCK MODE] Using mock Supabase client (no API keys detected)')
    return createMockClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
