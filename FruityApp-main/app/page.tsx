import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-4xl">🍊</span>
              <h1 className="text-2xl font-bold text-orange-600">Fruity</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/map"
                className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
              >
                Find Fruit
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

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
