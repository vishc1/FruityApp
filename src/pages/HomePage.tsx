import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/map" className="text-gray-700 hover:text-orange-600 font-medium">
                    Find Fruit
                  </Link>
                  <Link to="/dashboard" className="text-gray-700 hover:text-orange-600 font-medium">
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="text-8xl mb-8">🍊🍎🍐🍇</div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Share Fresh Fruit<br />with Your Community
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Got extra fruit from your trees? Share it with neighbors! Looking for fresh, local fruit? Find it nearby.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/map"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors"
            >
              🗺️ Find Fruit Near You
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors"
              >
                📊 My Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors"
              >
                🚀 Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🌳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Harvest</h3>
            <p className="text-gray-600">
              List fruit from your trees and help reduce food waste while connecting with your community.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Discover Local Fruit</h3>
            <p className="text-gray-600">
              Find fresh, free fruit from your neighbors on an interactive map. No API keys needed!
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Coordination</h3>
            <p className="text-gray-600">
              Message fruit sharers directly to arrange pickups at a time that works for both of you.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">1️⃣</div>
              <h4 className="font-bold text-lg mb-2">Sign Up</h4>
              <p className="text-gray-600 text-sm">Create a free account in seconds</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">2️⃣</div>
              <h4 className="font-bold text-lg mb-2">Browse or List</h4>
              <p className="text-gray-600 text-sm">Find fruit or share your own</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">3️⃣</div>
              <h4 className="font-bold text-lg mb-2">Send a Request</h4>
              <p className="text-gray-600 text-sm">Message the fruit owner</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">4️⃣</div>
              <h4 className="font-bold text-lg mb-2">Pick Up</h4>
              <p className="text-gray-600 text-sm">Coordinate and enjoy fresh fruit!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>🍊 Fruity - Sharing fresh fruit, building community</p>
        </div>
      </footer>
    </div>
  )
}
