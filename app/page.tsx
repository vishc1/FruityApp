import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import LocationDetect from '@/components/LocationDetect'
import { calculateImpact } from '@/lib/impact'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch live impact stats for the hero counter
  const { data: completedData } = await supabase
    .from('pickup_requests')
    .select('listings:listing_id (fruit_type, quantity)')
    .eq('status', 'completed')

  const pickups = (completedData || [])
    .map((r: any) => r.listings)
    .filter(Boolean) as { fruit_type: string; quantity: string }[]

  const impact = calculateImpact(pickups)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
      <Nav initialUser={user} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Share fruit. <br />
            <span className="text-orange-600">Reduce waste.</span> <br />
            Build community.
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Connect with neighbors to share excess fruit from backyard trees.
            Free, local, and sustainable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings/new"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              🌳 Share Your Fruit
            </Link>
            <Link
              href="/map"
              className="bg-white hover:bg-gray-50 text-orange-600 font-semibold px-8 py-4 rounded-lg text-lg border-2 border-orange-600 transition-colors shadow-lg hover:shadow-xl"
            >
              🗺️ Find Free Fruit
            </Link>
          </div>
          <LocationDetect />
          <div className="mt-4">
            <Link
              href="/property/setup"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
            >
              🏠 Set up your property to list fruit
            </Link>
          </div>
        </div>
      </section>

      {/* Live Impact Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Our Community&apos;s Environmental Impact</h3>
          <p className="text-green-100 mb-8 text-sm">Updated in real time as pickups are completed</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl font-bold">{impact.total_lbs > 0 ? impact.total_lbs.toLocaleString() : '0'}</div>
              <div className="text-green-100 text-sm mt-1">lbs of fruit rescued</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{impact.total_co2_lbs > 0 ? impact.total_co2_lbs.toLocaleString() : '0'}</div>
              <div className="text-green-100 text-sm mt-1">lbs of CO₂ prevented</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{impact.total_water_gallons > 0 ? impact.total_water_gallons.toLocaleString() : '0'}</div>
              <div className="text-green-100 text-sm mt-1">gallons of water saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{impact.completed_pickups.toLocaleString()}</div>
              <div className="text-green-100 text-sm mt-1">pickups completed</div>
            </div>
          </div>
          <Link
            href="/impact"
            className="inline-block mt-6 bg-white text-green-700 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-green-50 transition-colors"
          >
            View Full Impact Report →
          </Link>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h3>
          <p className="text-gray-500 text-lg">A full platform for sharing fruit with your neighborhood</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">🗺️</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Live Fruit Map</h4>
              <p className="text-sm text-gray-600">Browse all available fruit near you on an interactive map. Filter by type and search by distance.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">🔒</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Privacy First</h4>
              <p className="text-sm text-gray-600">Your exact address is never shown. Only a fuzzy location (±500m) appears on the map until a pickup is accepted.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">💬</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">In-App Messaging</h4>
              <p className="text-sm text-gray-600">Chat directly with neighbors to coordinate pickup times without sharing personal contact info.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">⭐</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Ratings & Reviews</h4>
              <p className="text-sm text-gray-600">Rate each pickup and leave reviews. Build trust in your community through a public reputation system.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">📅</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Pickup Scheduling</h4>
              <p className="text-sm text-gray-600">Propose, confirm, or counter pickup times. Everyone stays on the same page with no back-and-forth confusion.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">🏆</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Community Leaderboard</h4>
              <p className="text-sm text-gray-600">See who's sharing the most fruit. Earn a Verified Neighbor badge and climb the neighborhood rankings.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">📋</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Waitlist System</h4>
              <p className="text-sm text-gray-600">Listing already picked clean? Join the waitlist and get notified when more fruit is available.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">📢</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Community Board</h4>
              <p className="text-sm text-gray-600">Post announcements about big harvests, seasonal fruit, or anything your neighborhood should know.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex gap-4">
            <span className="text-3xl shrink-0">📸</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Photo Listings</h4>
              <p className="text-sm text-gray-600">Add a photo of your tree or fruit so neighbors know exactly what they're picking up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">🍋</div>
            <h4 className="text-xl font-bold mb-3 text-gray-900">1. List Your Fruit</h4>
            <p className="text-gray-600">
              Have extra fruit? Create a free listing with your fruit type, quantity, and pickup details.
              Your exact address stays private.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">📍</div>
            <h4 className="text-xl font-bold mb-3 text-gray-900">2. Browse & Request</h4>
            <p className="text-gray-600">
              Find fruit near you on the map. Send a pickup request with a message.
              The address is revealed only when accepted.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">🤝</div>
            <h4 className="text-xl font-bold mb-3 text-gray-900">3. Coordinate & Pick Up</h4>
            <p className="text-gray-600">
              Chat in-app to arrange pickup. Pick up the fruit at their convenience.
              It's that simple!
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-8 text-center">Why Fruity?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <span className="text-3xl">✓</span>
              <div>
                <h4 className="font-bold text-lg mb-1">100% Free</h4>
                <p className="text-orange-50">No payments, no tipping. Just sharing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">✓</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Safe & Private</h4>
                <p className="text-orange-50">Addresses hidden until you accept.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">✓</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Reduce Waste</h4>
                <p className="text-orange-50">Stop fruit from going to waste.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">✓</span>
              <div>
                <h4 className="font-bold text-lg mb-1">Build Community</h4>
                <p className="text-orange-50">Connect with neighbors nearby.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon / Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            Roadmap
          </span>
          <h3 className="text-3xl font-bold text-gray-900">Coming Soon</h3>
          <p className="text-gray-500 mt-2">Features we're actively working on</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Discovery & Map */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">🗺️</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Discovery & Map</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Radius search — listings within X miles</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Availability badges — Available / Almost Gone / Picked Clean</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Harvest season windows with auto-expiry</li>
            </ul>
          </div>

          {/* Listing Enhancements */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">📸</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Listing Enhancements</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Photo uploads of the tree or fruit</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Access notes — gate codes, pickup instructions</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Waitlist if a listing is already claimed</li>
            </ul>
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">📅</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Pickup Scheduling</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Propose a time slot; owner confirms or counters</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Request history — completed, declined, expired</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Expiry reminders for stale listings</li>
            </ul>
          </div>

          {/* Social & Trust */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">⭐</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Social & Trust</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Ratings & reviews after each pickup</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Neighbor profiles with listing history</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Verified neighbor badge</li>
            </ul>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">🔔</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Notifications</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Email alerts for new requests & acceptances</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Subscribe to fruit types nearby</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Reminders to update or remove old listings</li>
            </ul>
          </div>

          {/* Community */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-3xl mb-3">🏘️</div>
            <h4 className="text-lg font-bold text-gray-900 mb-3">Community</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Neighborhood leaderboard — most fruit shared</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Announcements board for local harvests</li>
              <li className="flex gap-2"><span className="text-orange-400 mt-0.5">◦</span> Invite codes for trusted neighbor networks</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6 text-gray-900">Ready to get started?</h3>
        <p className="text-xl text-gray-600 mb-8">Join your community in reducing food waste.</p>
        <Link
          href="/map"
          className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-10 py-4 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Explore the Map
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="font-medium text-orange-600 mb-2">🍊 Fruity</p>
            <p className="text-sm">
              A free community platform for sharing excess fruit and reducing food waste.
            </p>
            <p className="text-xs mt-4 text-gray-500">
              Made with love for a healthier planet 🌍
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
