function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getLiveAvailability({ cropType, region, farms = [] } = {}) {
  const crop = String(cropType || '').trim()
  const targetRegion = String(region || '').trim().toLowerCase()
  const matchingFarms = farms.filter((farm) => {
    const sameCrop = !crop || String(farm.cropType || '').toLowerCase() === crop.toLowerCase()
    const sameRegion = !targetRegion || String(farm.state || '').toLowerCase().includes(targetRegion) || String(farm.district || '').toLowerCase().includes(targetRegion)
    return sameCrop && sameRegion
  })

  return {
    cropType: crop || 'All',
    region: targetRegion || 'All',
    totalFarmers: matchingFarms.length,
    available: matchingFarms.length > 0,
    matchingFarms: matchingFarms.map((farm) => ({
      id: farm.id,
      name: farm.name || 'Farmer',
      village: farm.village || farm.district || 'Local field',
      district: farm.district || 'Unknown',
      state: farm.state || 'India',
      cropType: farm.cropType || crop,
      latitude: safeNumber(farm.latitude),
      longitude: safeNumber(farm.longitude),
      availability: 'live-supply',
    })),
  }
}

function findMatchingFarmers({ cropType, region, farms = [], mandiPrice = 0 } = {}) {
  const targetCrop = String(cropType || '').trim()
  const targetRegion = String(region || '').trim().toLowerCase()
  const basePrice = safeNumber(mandiPrice, 0)

  return farms
    .filter((farm) => {
      const cropMatches = !targetCrop || String(farm.cropType || '').toLowerCase() === targetCrop.toLowerCase()
      const regionMatches = !targetRegion || String(farm.state || '').toLowerCase().includes(targetRegion) || String(farm.district || '').toLowerCase().includes(targetRegion)
      return cropMatches && regionMatches
    })
    .map((farm) => {
      const matchScore = 70 + (String(farm.state || '').toLowerCase() === targetRegion ? 15 : 0) + (String(farm.district || '').toLowerCase().includes(targetRegion) ? 10 : 0) + (safeNumber(farm.areaInAcres, 0) > 5 ? 8 : 0)
      const quotePerTon = Math.max(0, basePrice > 0 ? Math.round(basePrice * 0.92) : 2400)
      return {
        id: farm.id,
        name: farm.name || 'Farmer',
        cropType: farm.cropType || targetCrop,
        district: farm.district || 'Unknown',
        state: farm.state || 'India',
        quotePerTon,
        lockablePrice: quotePerTon,
        matchScore,
        areaInAcres: safeNumber(farm.areaInAcres, 0),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

function calculateDriverAssignment({ distanceKm, loadTons, baseRatePerKm = 18 } = {}) {
  const distance = Math.max(0, safeNumber(distanceKm, 0))
  const load = Math.max(0, safeNumber(loadTons, 0))
  const rate = Math.max(0, safeNumber(baseRatePerKm, 18))
  const basePayout = distance * rate
  const weightAdjustment = load * 80
  const payoutInr = Math.round(basePayout + weightAdjustment)
  const etaMinutes = Math.max(10, Math.round(distance * 1.6 + load * 18))

  return {
    status: 'assigned',
    distanceKm: distance,
    loadTons: load,
    payoutInr,
    etaMinutes,
    driverFeeBreakdown: {
      distanceCharge: Math.round(distance * rate),
      loadCharge: Math.round(weightAdjustment),
    },
  }
}

module.exports = {
  getLiveAvailability,
  findMatchingFarmers,
  calculateDriverAssignment,
}
