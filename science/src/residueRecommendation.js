// Residue & Stubble economics engine (Tab 1).

export const DISTRICT_DATA = {
  Patiala: { rate: 1650, buyerDemand: 'High', machineryReadiness: 82, hotspots: 4, state: 'Punjab' },
  Ludhiana: { rate: 1720, buyerDemand: 'High', machineryReadiness: 88, hotspots: 6, state: 'Punjab' },
  Indore: { rate: 1480, buyerDemand: 'Medium', machineryReadiness: 71, hotspots: 2, state: 'Madhya Pradesh' },
  Nagpur: { rate: 1390, buyerDemand: 'Medium', machineryReadiness: 64, hotspots: 3, state: 'Maharashtra' },
  Guntur: { rate: 1550, buyerDemand: 'High', machineryReadiness: 76, hotspots: 3, state: 'Andhra Pradesh' },
};

export function getDistrictData(district) {
  return (
    DISTRICT_DATA[district] || {
      rate: 1500,
      buyerDemand: 'Medium',
      machineryReadiness: 70,
      hotspots: 2,
      state: 'India',
    }
  );
}

const RESIDUE_FACTORS = {
  Rice: 1.7,
  Wheat: 1.5,
  Corn: 2.0,
  Soybean: 0.8,
  Cotton: 1.2,
}

export function computeResidue({ areaInAcres, district, cropType = 'Rice', districtData }) {
  const area = Math.max(0, Number(areaInAcres) || 0);
  const d = districtData || getDistrictData(district);
  const perAcre = RESIDUE_FACTORS[cropType] || RESIDUE_FACTORS.Rice;
  const residueTons = +(area * perAcre).toFixed(2);
  const totalValueINR = Math.round(residueTons * d.rate);
  return {
    district,
    state: d.state,
    cropType,
    residueTons,
    perAcre,
    marketRate: d.rate,
    totalValueINR,
    dataSource: districtData ? 'district market metric plus farmer field inputs' : 'market-rate estimate plus farmer field inputs',
  };
}

export function computeFieldReadiness({ areaInAcres, cropType, residueTons, machinery = [], bookings = [], activeListings = 0, activeOrders = 0, activeOrderQuantity = 0 }) {
  const area = Math.max(0.1, Number(areaInAcres) || 1);
  const requiredMachines = Math.max(1, Math.ceil(area / (cropType === 'Rice' ? 35 : 50)));
  const totalMachines = machinery.length;
  const availableMachines = machinery.filter((item) => item.available !== false).length;
  const activeBookings = bookings.filter((booking) => ['requested', 'confirmed', 'in_progress'].includes(booking.status)).length;
  const machineScore = Math.min(100, (availableMachines / requiredMachines) * 100);
  const bookingPenalty = Math.min(35, activeBookings * 10);
  const readiness = Math.max(0, Math.round(machineScore - bookingPenalty));
  const availableOfftakeTons = Math.max(0, Number(activeOrderQuantity) || 0);
  const demandScore = activeOrderQuantity > 0
    ? Math.min(100, Math.round((availableOfftakeTons / Math.max(1, Number(residueTons) || 1)) * 100))
    : 0;
  const residuePerAcre = Number(residueTons || 0) / area;
  const fieldRiskScore = Math.min(100, Math.round(residuePerAcre * 25 + Math.max(0, 50 - readiness) * 0.6));
  return {
    machineryReadiness: readiness,
    buyerDemand: demandScore ? (demandScore >= 70 ? 'High' : demandScore >= 35 ? 'Medium' : 'Low') : 'No live buyer data',
    buyerDemandScore: demandScore,
    requiredMachines,
    availableMachines,
    activeBookings,
    availableOfftakeTons,
    activeOrderQuantity,
    hotspots: Math.ceil(fieldRiskScore / 20),
    riskScore: fieldRiskScore,
    riskLevel: fieldRiskScore >= 65 ? 'High' : fieldRiskScore >= 35 ? 'Medium' : 'Low',
    activeListings,
    activeOrders,
    dataSource: 'farmer crop and acreage plus live machinery, bookings, listings, and orders',
  };
}
