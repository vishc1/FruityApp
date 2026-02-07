/**
 * Mock Supabase client for development without API keys
 * This allows you to test the UI without a real database
 */

interface MockUser {
  id: string
  email: string
}

interface MockListing {
  id: string
  user_id: string
  fruit_type: string
  quantity: string
  description: string | null
  city: string
  state: string
  approximate_lat: number
  approximate_lng: number
  available_start: string
  available_end: string
  status: string
  created_at: string
}

// Browser localStorage-based storage (persists between refreshes)
const STORAGE_KEYS = {
  USER: 'fruity_mock_user',
  LISTINGS: 'fruity_mock_listings',
  REQUESTS: 'fruity_mock_requests',
  PROPERTIES: 'fruity_mock_properties',
}

// Helper to get from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Persistent storage using localStorage
const mockStorage = {
  get user() {
    return getFromStorage<MockUser | null>(STORAGE_KEYS.USER, null)
  },
  set user(value: MockUser | null) {
    saveToStorage(STORAGE_KEYS.USER, value)
  },
  get listings() {
    return getFromStorage<MockListing[]>(STORAGE_KEYS.LISTINGS, [])
  },
  set listings(value: MockListing[]) {
    saveToStorage(STORAGE_KEYS.LISTINGS, value)
  },
  get requests() {
    return getFromStorage<any[]>(STORAGE_KEYS.REQUESTS, [])
  },
  set requests(value: any[]) {
    saveToStorage(STORAGE_KEYS.REQUESTS, value)
  },
  get properties() {
    return getFromStorage<any[]>(STORAGE_KEYS.PROPERTIES, [])
  },
  set properties(value: any[]) {
    saveToStorage(STORAGE_KEYS.PROPERTIES, value)
  },
}

export const mockSupabase = {
  auth: {
    getUser: async () => {
      return {
        data: { user: mockStorage.user },
        error: null,
      }
    },
    getSession: async () => {
      return {
        data: { session: mockStorage.user ? { user: mockStorage.user } : null },
        error: null,
      }
    },
    signInWithOtp: async ({ email }: { email: string }) => {
      // Simulate successful OTP send
      console.log(`[MOCK] Magic link sent to: ${email}`)
      console.log(`[MOCK] In real app, check your email. In mock mode, auto-login after 2 seconds...`)

      // Auto-login after 2 seconds in mock mode
      setTimeout(() => {
        mockStorage.user = {
          id: 'mock-user-123',
          email,
        }
      }, 2000)

      return { data: {}, error: null }
    },
    signOut: async () => {
      mockStorage.user = null
      return { error: null }
    },
  },
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'listings') {
            const listings = mockStorage.listings
            const listing = listings.find((l: any) => l[column] === value)
            return { data: listing || null, error: null }
          }
          if (table === 'properties') {
            const properties = mockStorage.properties
            const property = properties.find((p: any) => p[column] === value)
            return { data: property || null, error: null }
          }
          return { data: null, error: null }
        },
        maybeSingle: async () => {
          if (table === 'listings') {
            const listings = mockStorage.listings
            const listing = listings.find((l: any) => l[column] === value)
            return { data: listing || null, error: null }
          }
          return { data: null, error: null }
        },
      }),
      order: (column: string, options: any) => ({
        then: async (resolve: any) => {
          if (table === 'listings') {
            resolve({ data: mockStorage.listings, error: null })
          } else {
            resolve({ data: [], error: null })
          }
        },
      }),
      then: async (resolve: any) => {
        if (table === 'listings') {
          resolve({ data: mockStorage.listings, error: null })
        } else {
          resolve({ data: [], error: null })
        }
      },
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          const newItem = {
            ...data,
            id: `mock-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          if (table === 'listings') {
            const listings = mockStorage.listings
            listings.push(newItem)
            mockStorage.listings = listings
          } else if (table === 'properties') {
            const properties = mockStorage.properties
            properties.push(newItem)
            mockStorage.properties = properties
          }

          console.log(`[MOCK] Created ${table}:`, newItem)
          return { data: newItem, error: null }
        },
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            console.log(`[MOCK] Updated ${table} where ${column} = ${value}:`, data)
            return { data: { ...data, id: value }, error: null }
          },
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => async () => {
        console.log(`[MOCK] Deleted from ${table} where ${column} = ${value}`)
        return { error: null }
      },
    }),
  }),
}

export function createMockClient() {
  return mockSupabase
}
