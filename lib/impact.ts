// Environmental impact calculation engine
// Sources: EPA food waste lifecycle data, Water Footprint Network, USDA tree carbon data

// Conservative lb estimates per quantity option (mid-point of range)
export const QUANTITY_LBS: Record<string, number> = {
  'A few pieces': 2,
  '1-2 bags': 8,
  '3-5 bags': 20,
  'Many bags': 50,
  'One tree full': 100,
  'Multiple trees': 250,
}

// lbs CO₂e saved per lb of fruit diverted from landfill.
// Accounts for: avoided landfill methane (anaerobic decomposition) + reduced
// commercial produce demand. Based on EPA WARM model for food waste.
export const CO2_LBS_PER_LB = 0.9

// Gallons of virtual water per lb of fruit (agricultural water footprint).
// Based on Water Footprint Network averages for common backyard fruits.
export const WATER_GALLONS_PER_LB = 100

// A mature street/yard tree sequesters ~48 lbs CO₂/year (USDA Forest Service)
export const CO2_PER_TREE_PER_YEAR = 48

// Average car emits ~0.89 lbs CO₂ per mile (EPA: 404 g CO₂/mile)
export const CO2_PER_CAR_MILE = 0.89

// Average shower uses ~17–20 gallons (EPA WaterSense); we use 17
export const GALLONS_PER_SHOWER = 17

export interface ImpactStats {
  total_lbs: number
  total_co2_lbs: number
  total_water_gallons: number
  completed_pickups: number
  equivalent_car_miles: number
  equivalent_trees_year: number
  equivalent_showers: number
  by_fruit: { fruit_type: string; lbs: number; pickups: number }[]
}

export function calculateImpact(
  completedPickups: { fruit_type: string; quantity: string }[]
): ImpactStats {
  let total_lbs = 0
  const fruitMap: Record<string, { lbs: number; pickups: number }> = {}

  for (const p of completedPickups) {
    const lbs = QUANTITY_LBS[p.quantity] ?? 5
    total_lbs += lbs
    if (!fruitMap[p.fruit_type]) fruitMap[p.fruit_type] = { lbs: 0, pickups: 0 }
    fruitMap[p.fruit_type].lbs += lbs
    fruitMap[p.fruit_type].pickups += 1
  }

  const total_co2_lbs = Math.round(total_lbs * CO2_LBS_PER_LB)
  const total_water_gallons = Math.round(total_lbs * WATER_GALLONS_PER_LB)

  return {
    total_lbs: Math.round(total_lbs),
    total_co2_lbs,
    total_water_gallons,
    completed_pickups: completedPickups.length,
    equivalent_car_miles: Math.round(total_co2_lbs / CO2_PER_CAR_MILE),
    equivalent_trees_year: Math.round((total_co2_lbs / CO2_PER_TREE_PER_YEAR) * 10) / 10,
    equivalent_showers: Math.round(total_water_gallons / GALLONS_PER_SHOWER),
    by_fruit: Object.entries(fruitMap)
      .sort(([, a], [, b]) => b.lbs - a.lbs)
      .map(([fruit_type, data]) => ({ fruit_type, ...data })),
  }
}
