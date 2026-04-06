import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import { calculateImpact } from '@/lib/impact'
import { FRUIT_EMOJIS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ImpactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('pickup_requests')
    .select(`listings:listing_id (fruit_type, quantity)`)
    .eq('status', 'completed')

  const pickups = (data || [])
    .map((r: any) => r.listings)
    .filter(Boolean) as { fruit_type: string; quantity: string }[]

  const stats = calculateImpact(pickups)
  const hasData = stats.completed_pickups > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Nav initialUser={user} />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            🌍 Community Environmental Impact
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Every Pickup Counts
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            When neighbors share fruit instead of letting it rot, they prevent methane emissions,
            save water, and reduce demand for commercially grown produce.
            Here&apos;s what our community has accomplished together.
          </p>
        </div>

        {/* Big Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-green-100 text-center">
            <div className="text-5xl mb-2">🍎</div>
            <div className="text-4xl font-bold text-green-600 mb-1">
              {hasData ? stats.total_lbs.toLocaleString() : '—'}
            </div>
            <div className="text-sm font-semibold text-gray-700">lbs of fruit shared</div>
            <div className="text-xs text-gray-500 mt-1">rescued from waste</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-green-100 text-center">
            <div className="text-5xl mb-2">💨</div>
            <div className="text-4xl font-bold text-green-600 mb-1">
              {hasData ? stats.total_co2_lbs.toLocaleString() : '—'}
            </div>
            <div className="text-sm font-semibold text-gray-700">lbs of CO₂ avoided</div>
            <div className="text-xs text-gray-500 mt-1">landfill methane prevented</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-blue-100 text-center">
            <div className="text-5xl mb-2">💧</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {hasData ? stats.total_water_gallons.toLocaleString() : '—'}
            </div>
            <div className="text-sm font-semibold text-gray-700">gallons of water saved</div>
            <div className="text-xs text-gray-500 mt-1">virtual water footprint</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100 text-center">
            <div className="text-5xl mb-2">🤝</div>
            <div className="text-4xl font-bold text-orange-600 mb-1">
              {stats.completed_pickups.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-700">pickups completed</div>
            <div className="text-xs text-gray-500 mt-1">neighbor connections made</div>
          </div>
        </div>

        {/* What that means */}
        {hasData && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">What That Means</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">🚗</div>
                <div className="text-3xl font-bold mb-1">{stats.equivalent_car_miles.toLocaleString()}</div>
                <div className="text-green-100 text-sm">miles of driving avoided<br />(CO₂ equivalent)</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🌳</div>
                <div className="text-3xl font-bold mb-1">{stats.equivalent_trees_year}</div>
                <div className="text-green-100 text-sm">trees&apos; worth of annual<br />carbon sequestration</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🚿</div>
                <div className="text-3xl font-bold mb-1">{stats.equivalent_showers.toLocaleString()}</div>
                <div className="text-green-100 text-sm">showers worth of water<br />(17 gal/shower avg)</div>
              </div>
            </div>
          </div>
        )}

        {/* By Fruit Type */}
        {stats.by_fruit.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Impact by Fruit Type</h2>
            <div className="space-y-5">
              {stats.by_fruit.map(({ fruit_type, lbs, pickups }) => {
                const maxLbs = stats.by_fruit[0].lbs
                const pct = Math.max(4, Math.round((lbs / maxLbs) * 100))
                return (
                  <div key={fruit_type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{FRUIT_EMOJIS[fruit_type] || '🌳'}</span>
                        <span className="font-medium text-gray-800">{fruit_type}</span>
                        <span className="text-sm text-gray-400">
                          {pickups} pickup{pickups !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="font-semibold text-green-700">{lbs} lbs</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100 mb-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">The journey starts here</h3>
            <p className="text-gray-500 mb-6">
              Complete the first fruit pickup to see our community&apos;s environmental impact.
            </p>
            <Link
              href="/map"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Find Fruit Near You
            </Link>
          </div>
        )}

        {/* Why food waste matters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Food Waste Matters</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">♻️</span>
              <div>
                <p className="font-semibold text-gray-800 mb-1">8% of Global Emissions</p>
                <p>Food waste is responsible for ~8% of global greenhouse gas emissions — more than the entire aviation industry.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">🌊</span>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Hidden Water Cost</p>
                <p>Agriculture uses 70% of the world&apos;s freshwater. When fruit rots unused, all that water is wasted too.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">🏘️</span>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Local Action, Real Impact</p>
                <p>Backyard fruit trees are micro-farms. Connecting them to neighbors who want the fruit is a zero-emission, zero-mile distribution system.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">Methodology & Sources</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>CO₂ estimate (0.9 lbs CO₂e / lb fruit):</strong> Based on the EPA WARM model for food waste.
              Fruit decomposing in landfill produces methane, a greenhouse gas 28× more potent than CO₂ over 100 years.
              Figure also accounts for reduced demand for commercially grown produce.
            </p>
            <p>
              <strong>Water estimate (100 gal / lb fruit):</strong> Virtual water footprint based on Water Footprint
              Network averages for common backyard fruits (apples ~83 gal/lb, oranges ~45 gal/lb, grapes ~132 gal/lb).
            </p>
            <p>
              <strong>Car miles (0.89 lbs CO₂ / mile):</strong> EPA average — 404 g CO₂ per mile for a typical passenger vehicle.
            </p>
            <p>
              <strong>Tree sequestration (48 lbs CO₂ / year):</strong> USDA Forest Service estimate for a mature urban/suburban tree.
            </p>
            <p>
              <strong>Fruit weights:</strong> Estimated from listing quantity descriptions (e.g. &quot;1-2 bags&quot; ≈ 8 lbs).
              Actual weights may vary.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
