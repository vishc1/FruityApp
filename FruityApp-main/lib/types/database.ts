export interface User {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  user_id: string
  address: string
  lat: number
  lng: number
  is_verified: boolean
  detected_at: string
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  user_id: string
  property_id?: string | null
  fruit_type: string
  quantity: string
  description: string | null
  full_address: string
  city: string
  state: string
  zip_code: string
  approximate_lat: number
  approximate_lng: number
  available_start: string
  available_end: string
  pickup_notes: string | null
  status: 'active' | 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PickupRequest {
  id: string
  listing_id: string
  requester_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  pickup_request_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

// Public listing type (without full address)
export type PublicListing = Omit<Listing, 'full_address'>

// Listing with full address (for owners and accepted requests)
export type FullListing = Listing

// Extended types for API responses
export interface ListingWithUser extends Listing {
  users?: User
}

export interface PickupRequestWithDetails extends PickupRequest {
  listings?: Listing
  users?: User
}

export interface MessageWithSender extends Message {
  users?: User
}
