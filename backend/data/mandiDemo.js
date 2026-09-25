const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export const MANDI_SOURCE = {
  name: 'Agmarknet 2.0 style demo data',
  url: process.env.AGMARKNET_SOURCE_URL || 'https://agmarknet.gov.in/',
  official: false,
  label: 'Demo seed data shaped like an Agmarknet record. Replace with the official feed before production use.',
}

export const MSP_DATA = {
  Rice: { value: 2300, season: 'Kharif 2025-26', unit: 'INR/quintal', source: 'Government of India MSP announcement; verify current season.' },
  Wheat: { value: 2585, season: 'Rabi 2026-27', unit: 'INR/quintal', source: 'Government of India MSP announcement; verify current season.' },
  Cotton: { value: 7710, season: 'Kharif 2025-26', unit: 'INR/quintal', source: 'Government of India MSP announcement; verify current season.' },
  Soybean: { value: 5328, season: 'Kharif 2025-26', unit: 'INR/quintal', source: 'Government of India MSP announcement; verify current season.' },
}

export const MANDI_PRICES = [
  ...['Patiala', 'Ludhiana', 'Amritsar', 'Karnal', 'Indore', 'Nagpur'].flatMap((market, marketIndex) => [
    { commodity: 'Rice', state: marketIndex < 4 ? 'Punjab' : marketIndex === 4 ? 'Madhya Pradesh' : 'Maharashtra', market, modalPrice: 2280 + marketIndex * 25, arrivals: 118 + marketIndex * 7, observedAt: hoursAgo(5 + marketIndex) },
    { commodity: 'Wheat', state: marketIndex < 4 ? 'Punjab' : marketIndex === 4 ? 'Madhya Pradesh' : 'Maharashtra', market, modalPrice: 2610 + marketIndex * 18, arrivals: 94 + marketIndex * 5, observedAt: hoursAgo(7 + marketIndex) },
  ]),
  { commodity: 'Soybean', state: 'Madhya Pradesh', market: 'Indore', modalPrice: 5260, arrivals: 76, observedAt: hoursAgo(9) },
  { commodity: 'Cotton', state: 'Maharashtra', market: 'Nagpur', modalPrice: 7580, arrivals: 51, observedAt: hoursAgo(11) },
]
