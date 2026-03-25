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

export type AvailabilityStatus = 'available' | 'almost_gone' | 'picked_clean'
export type ScheduleStatus = 'unscheduled' | 'proposed' | 'confirmed' | 'countered'

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
  availability_status: AvailabilityStatus
  created_at: string
  updated_at: string
}

export interface PickupRequest {
  id: string
  listing_id: string
  requester_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'expired'
  proposed_time: string | null
  confirmed_time: string | null
  schedule_status: ScheduleStatus
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

export interface Rating {
  id: string
  pickup_request_id: string
  rater_id: string
  ratee_id: string
  stars: number
  review: string | null
  created_at: string
}

export interface WaitlistEntry {
  id: string
  listing_id: string
  user_id: string
  created_at: string
}

export interface Announcement {
  id: string
  author_id: string
  title: string
  body: string
  city: string | null
  state: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
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

export interface RatingWithDetails extends Rating {
  rater?: User
}

export interface ProfileData {
  id: string
  display_name: string | null
  email: string
  member_since: string
  listings_count: number
  pickups_given: number
  avg_rating: number | null
  rating_count: number
}
