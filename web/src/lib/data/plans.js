export const plans = [
  {
    id: 'farmer-core',
    name: 'Farmer Core',
    priceInr: 0,
    note: 'Base app access',
    features: ['Basic residue forecast', 'Sowing planner', 'Residue marketplace access'],
    buttonLabel: 'Included',
  },
  {
    id: 'agriloop-pro',
    name: 'AgriLoop Pro',
    priceInr: 999,
    note: 'Popular for active growers',
    features: ['Smart incentives', 'Driver dispatch', 'Mandi-linked pricing'],
    highlight: true,
    buttonLabel: 'Pay ₹999',
  },
  {
    id: 'fleet-plus',
    name: 'Fleet Plus',
    priceInr: 2499,
    note: 'For drivers and sellers',
    features: ['Route tracking', 'Seller + buyer controls', 'Bulk residue booking'],
    buttonLabel: 'Pay ₹2,499',
  },
]