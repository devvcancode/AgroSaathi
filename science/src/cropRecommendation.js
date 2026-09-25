// Biostimulant abiotic stress engine — cardinal temperature formulas.

export const CROP_THRESHOLDS = {
  Soybean: { tMaxOpt: 32, tMaxLimit: 45, tMinOpt: 22, tMinLimit: 28, tBase: 10, gddOpt: 1400, pOpt: 6, phOpt: 6.5, nOpt: 100 },
  Corn: { tMaxOpt: 33, tMaxLimit: 44, tMinOpt: 22, tMinLimit: 28, tBase: 10, gddOpt: 1500, pOpt: 6, phOpt: 6.2, nOpt: 150 },
  Cotton: { tMaxOpt: 32, tMaxLimit: 38, tMinOpt: 20, tMinLimit: 25, tBase: 15, gddOpt: 1600, pOpt: 5, phOpt: 6.5, nOpt: 120 },
  Rice: { tMaxOpt: 32, tMaxLimit: 38, tMinOpt: 22, tMinLimit: 28, tBase: 10, gddOpt: 1300, pOpt: 8, phOpt: 6.0, nOpt: 120 },
  Wheat: { tMaxOpt: 25, tMaxLimit: 32, tMinOpt: 15, tMinLimit: 20, tBase: 5, gddOpt: 1100, pOpt: 4, phOpt: 6.8, nOpt: 120 },
};

export const CROP_ECONOMICS = {
  Rice: { yieldTonsPerAcre: 2.2, pricePerTon: 22000, costPerAcre: 28000 },
  Wheat: { yieldTonsPerAcre: 1.8, pricePerTon: 22750, costPerAcre: 23000 },
  Corn: { yieldTonsPerAcre: 2.4, pricePerTon: 21000, costPerAcre: 25000 },
  Cotton: { yieldTonsPerAcre: 0.9, pricePerTon: 65000, costPerAcre: 36000 },
  Soybean: { yieldTonsPerAcre: 0.8, pricePerTon: 46000, costPerAcre: 24000 },
};

export const CROP_LIST = Object.keys(CROP_THRESHOLDS);

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function resolveCrop(crop) {
  if (!crop) return CROP_THRESHOLDS.Rice;
  const key = Object.keys(CROP_THRESHOLDS).find(
    (c) => c.toLowerCase() === String(crop).toLowerCase()
  );
  return CROP_THRESHOLDS[key] || CROP_THRESHOLDS.Rice;
}

function resolveEconomics(crop) {
  const key = Object.keys(CROP_ECONOMICS).find((c) => c.toLowerCase() === String(crop || '').toLowerCase());
  return CROP_ECONOMICS[key] || CROP_ECONOMICS.Rice;
}

export function computeFarmEconomics({ crop, areaInAcres, diagnostic }) {
  const area = Math.max(0.1, Number(areaInAcres) || 1);
  const base = resolveEconomics(crop);
  const scores = diagnostic?.scores || {};
  const drought = diagnostic?.droughtIndex?.value;
  const stressPenalty = Math.min(0.45, ((scores.diurnal || 0) + (scores.night || 0) + (scores.frost || 0)) / 60);
  const droughtPenalty = drought == null ? 0 : Math.min(0.3, Math.max(0, 1 - drought) * 0.2);
  const riskRate = Math.min(0.7, stressPenalty + droughtPenalty);
  const expectedYield = +(base.yieldTonsPerAcre * (1 - riskRate)).toFixed(2);
  const grossRevenue = Math.round(expectedYield * base.pricePerTon * area);
  const totalCost = Math.round(base.costPerAcre * area);
  const netReturn = grossRevenue - totalCost;
  return {
    crop,
    areaInAcres: area,
    expectedYieldTonsPerAcre: expectedYield,
    pricePerTon: base.pricePerTon,
    grossRevenue,
    totalCost,
    netReturn,
    roiPercent: totalCost ? +((netReturn / totalCost) * 100).toFixed(1) : 0,
    riskRate: +(riskRate * 100).toFixed(1),
    source: 'crop economics baseline adjusted by live weather stress and drought',
  };
}

// A. Diurnal Daytime Heat Stress (0..9)
export function diurnalHeatStress(tmax, crop) {
  const t = resolveCrop(crop);
  if (tmax === null || tmax === undefined) return 0;
  if (tmax <= t.tMaxOpt) return 0;
  if (tmax >= t.tMaxLimit) return 9;
  return clamp(9 * ((tmax - t.tMaxOpt) / (t.tMaxLimit - t.tMaxOpt)), 0, 9);
}

// B. Nighttime Heat Stress (0..9)
export function nightHeatStress(tmin, crop) {
  const t = resolveCrop(crop);
  if (tmin === null || tmin === undefined) return 0;
  if (tmin < t.tMinOpt) return 0;
  if (tmin >= t.tMinLimit) return 9;
  return clamp(9 * ((tmin - t.tMinOpt) / (t.tMinLimit - t.tMinOpt)), 0, 9);
}

// C. Frost Stress (0..9) — only when TMIN <= 4C
export function frostStress(tmin) {
  if (tmin === null || tmin === undefined) return 0;
  if (tmin > 4) return 0;
  if (tmin <= -3) return 9;
  return clamp(9 * (Math.abs(tmin - 4) / Math.abs(-3 - 4)), 0, 9);
}

// D. Drought Risk Index (DI)
export function droughtIndex(P, E, SM, T) {
  if (T === null || T === undefined || T === 0) return null;
  const di = ((Number(P) || 0) - (Number(E) || 0) + (Number(SM) || 0)) / Number(T);
  let risk = 'Medium Risk';
  if (di > 1) risk = 'No Risk';
  else if (di < 1) risk = 'High Risk';
  return { value: di, risk };
}

// E. Yield Risk Index (YR)
export function yieldRisk({ tmax, tmin, precip, ph, nitrogen, crop }) {
  const t = resolveCrop(crop);
  const maxTemp = Number.isFinite(Number(tmax)) ? Number(tmax) : t.tMaxOpt;
  const minTemp = Number.isFinite(Number(tmin)) ? Number(tmin) : t.tMinOpt;
  const gdd = (maxTemp + minTemp) / 2 - t.tBase;
  const phVal = ph ?? t.phOpt;
  const nVal = nitrogen ?? t.nOpt;
  const yr =
    0.3 * Math.pow(gdd - t.gddOpt, 2) +
    0.3 * Math.pow((precip ?? t.pOpt) - t.pOpt, 2) +
    0.2 * Math.pow(phVal - t.phOpt, 2) +
    0.2 * Math.pow(nVal - t.nOpt, 2);
  return { value: yr, gdd };
}

// F. Product Matching Engine. This is a candidate catalog, not a prescription.
// Final product, crop, dose, and timing must follow the current India label.
export const PRODUCT_CATALOG = [
  { name: 'Actara', type: 'Insecticide', composition: 'Thiamethoxam 25% WG', targets: 'Aphids, whiteflies, thrips, and jassids', category: 'insecticide' },
  { name: 'Ampligo', type: 'Insecticide', composition: 'Chlorantraniliprole 10% + Lambda-cyhalothrin 5% ZC', targets: 'Caterpillars and stem borers', category: 'insecticide' },
  { name: 'Alika', type: 'Insecticide', composition: 'Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC', targets: 'Sucking and chewing insects', category: 'insecticide' },
  { name: 'Virtako', type: 'Insecticide', composition: 'Chlorantraniliprole + Thiamethoxam', targets: 'Rice stem borers and leaf folders', category: 'insecticide', crops: ['Rice'] },
  { name: 'Chess', type: 'Insecticide', composition: 'Pymetrozine 50% WG', targets: 'Rice plant hoppers and other sucking pests', category: 'insecticide', crops: ['Rice'] },
  { name: 'Pegasus', type: 'Insecticide', composition: 'Diafenthiuron 50% WP', targets: 'Mites, whiteflies, and diamondback moths', category: 'insecticide' },
  { name: 'Evicent', type: 'Insecticide', composition: 'VISIQ technology', targets: 'Caterpillar outbreaks', category: 'insecticide' },
  { name: 'Minecto Xtra', type: 'Insecticide', composition: 'Cyantraniliprole + Lufenuron', targets: 'Chewing pests and reproduction-cycle suppression', category: 'insecticide' },
  { name: 'Matador', type: 'Insecticide', composition: 'Lambda-cyhalothrin', targets: 'Beetles and flea beetles', category: 'insecticide' },
  { name: 'Fortenza', type: 'Seed treatment', composition: 'Cyantraniliprole', targets: 'Early root protection from cutworms and wireworms', category: 'seedcare' },
  { name: 'Amistar', type: 'Fungicide', composition: 'Azoxystrobin 25% SC', targets: 'Rusts, powdery mildew, and late blight', category: 'fungicide' },
  { name: 'Amistar Top', type: 'Fungicide', composition: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC', targets: 'Leaf spots and blast diseases', category: 'fungicide' },
  { name: 'Ridomil Gold', type: 'Fungicide', composition: 'Mefenoxam + Mancozeb', targets: 'Oomycetes, downy mildew, and late blight', category: 'fungicide' },
  { name: 'Score', type: 'Fungicide', composition: 'Difenoconazole 25% EC', targets: 'Scab, fruit rot, and early blights', category: 'fungicide' },
  { name: 'Kavach / Kavach Flo', type: 'Fungicide', composition: 'Chlorothalonil / Mancozeb-based formulations', targets: 'External fungal protection and spore germination', category: 'fungicide' },
  { name: 'Folio Gold', type: 'Fungicide', composition: 'Metalaxyl-M 3.3% + Chlorothalonil 33.1% SC', targets: 'Early foundational fungal protection', category: 'fungicide' },
  { name: 'Miravis / Miravis Duo', type: 'Fungicide', composition: 'Adepidyn technology (Pydiflumetofen)', targets: 'Leaf spots, powdery mildew, botrytis, and fusarium', category: 'fungicide' },
  { name: 'Revus', type: 'Fungicide', composition: 'Mandipropamid', targets: 'Oomycete pathogens', category: 'fungicide' },
  { name: 'Topas', type: 'Fungicide', composition: 'Penconazole', targets: 'Grape and berry powdery mildew', category: 'fungicide' },
  { name: 'Dual Gold', type: 'Herbicide', composition: 'S-Metolachlor', targets: 'Annual grasses and selected broadleaf weeds', category: 'herbicide' },
  { name: 'Acuron', type: 'Herbicide', composition: 'Atrazine + Bicyclopyrone + Mesotrione + S-Metolachlor', targets: 'Annual and glyphosate-resistant weeds in corn', category: 'herbicide', crops: ['Corn'] },
  { name: 'Axial', type: 'Herbicide', composition: 'Pinoxaden', targets: 'Wild oats and canary grass in wheat and barley', category: 'herbicide', crops: ['Wheat'] },
  { name: 'Rifit', type: 'Herbicide', composition: 'Pretilachlor', targets: 'Early weeds in flooded rice nurseries', category: 'herbicide', crops: ['Rice'] },
  { name: 'Calisto', type: 'Herbicide', composition: 'Mesotrione', targets: 'Pre- and post-emergence weeds in corn', category: 'herbicide', crops: ['Corn'] },
  { name: 'Fusilade Forte', type: 'Herbicide', composition: 'Fluazifop-P-butyl', targets: 'Annual and perennial grasses in broadleaf crops', category: 'herbicide' },
  { name: 'Cruiser', type: 'Seed treatment', composition: 'Thiamethoxam', targets: 'Early-season sucking pests in maize, cotton, and cereals', category: 'seedcare' },
  { name: 'Vibrance', type: 'Seed treatment', composition: 'Sedaxane', targets: 'Rhizoctonia and root-health support', category: 'seedcare' },
  { name: 'Celest', type: 'Seed treatment', composition: 'Fludioxonil', targets: 'Seed-borne and soil-borne fungal rots', category: 'seedcare' },
  { name: 'Tymirium', type: 'Seed treatment', composition: 'Cyclobutrifluram technology', targets: 'Nematodes and soil rots', category: 'seedcare' },
  { name: 'Isabion', type: 'Biostimulant', composition: 'Amino acids + nutrient peptides', targets: 'Frost, heat, drought, and flowering/fruit-set support', category: 'biostimulant', dosage: { rateMlPerLitre: 2, waterLitresPerAcre: 60, applicationsPerSeason: 2, intervalDays: 10, applicationsPerDay: 1, timing: 'Apply as a foliar spray when foliage is dry; repeat after 10 days only if stress persists.' } },
  { name: 'Cultar', type: 'Plant growth regulator', composition: 'Paclobutrazol 23% SC', targets: 'Vegetative growth control and mango flowering', category: 'pgr', crops: ['Mango'] },
  { name: 'Quantis', type: 'Biostimulant', composition: 'Potassium, calcium, and organic carbon', targets: 'Photosynthesis support during heat stress', category: 'biostimulant', dosage: { rateMlPerLitre: 2, waterLitresPerAcre: 60, applicationsPerSeason: 2, intervalDays: 10, applicationsPerDay: 1, timing: 'Apply as a foliar spray in a cool, low-wind period; repeat after 10 days only if heat stress persists.' } },
]

const REGION_GUIDANCE = {
  Punjab: { label: 'Punjab', waterAdjustment: 1, timing: 'Prefer early morning or late afternoon; avoid spraying in strong wind or peak heat.' },
  Maharashtra: { label: 'Maharashtra', waterAdjustment: 1, timing: 'Prefer early morning or late afternoon; avoid spraying before rain or during peak heat.' },
  India: { label: 'India', waterAdjustment: 1, timing: 'Spray only in a cool, low-wind period with dry foliage; follow the product label.' },
}

function resolveRegion(state) {
  return REGION_GUIDANCE[state] || REGION_GUIDANCE.India
}

function formatQuantity(value, unit) {
  return `${Number(value.toFixed(2))} ${unit}`
}

function productCandidates(category, crop, areaInAcres, state) {
  const region = resolveRegion(state)
  return PRODUCT_CATALOG
    .filter((product) => product.category === category)
    .filter((product) => !product.crops || product.crops.includes(crop))
    .map(({ name, type, composition, targets, dosage }) => ({
      name,
      type,
      composition,
      use: `${targets}. Confirm the pest, disease, weed, crop registration, and dose on the current India label before use.`,
      dosage: dosage ? {
        ...dosage,
        region: region.label,
        waterLitres: +(dosage.waterLitresPerAcre * Math.max(0.1, Number(areaInAcres) || 1) * region.waterAdjustment).toFixed(1),
        productMl: +(dosage.rateMlPerLitre * dosage.waterLitresPerAcre * Math.max(0.1, Number(areaInAcres) || 1) * region.waterAdjustment).toFixed(1),
      } : null,
      dosageGuidance: dosage
        ? `${dosage.rateMlPerLitre} ml/L × ${dosage.waterLitresPerAcre} L water/acre. Quantity for this field: ${formatQuantity(dosage.rateMlPerLitre * dosage.waterLitresPerAcre * Math.max(0.1, Number(areaInAcres) || 1) * region.waterAdjustment, 'ml')} product in ${formatQuantity(dosage.waterLitresPerAcre * Math.max(0.1, Number(areaInAcres) || 1) * region.waterAdjustment, 'L')} water. Apply ${dosage.applicationsPerDay} time per day, up to ${dosage.applicationsPerSeason} spray events ${dosage.intervalDays ? `at ${dosage.intervalDays}-day intervals` : ''}. ${region.timing}`
        : 'Dose is not shown until a registered crop and target are confirmed. Do not apply this candidate from weather data alone.',
    }))
}

export function recommendProduct({ diurnal, night, frost, di, crop, areaInAcres, state }) {
  const diVal = di?.value ?? 0
  if (diurnal > 4 || night > 4 || frost > 0) {
    const stressProduct = frost > 0 || night > 4 ? 'Isabion' : 'Quantis'
    return {
      product: stressProduct,
      brand: 'Syngenta biostimulant candidate',
      rationale: 'Elevated heat, night heat, drought, or frost stress detected. This is a stress-support candidate, not a chemical spray prescription.',
      options: productCandidates('biostimulant', crop, areaInAcres, state).filter((option) => option.name === stressProduct),
      category: 'stress',
      confidence: 'weather-signal',
      requiresConfirmation: true,
    };
  }
  if (diurnal <= 4 && night <= 4 && diVal >= 1) {
    return {
      product: 'No stress product needed',
      brand: 'Monitor and maintain the crop',
      rationale:
        'Current weather signals do not justify a blanket spray. Maintain nutrition and scout before selecting a product.',
      options: [],
      category: 'monitor',
      confidence: 'weather-signal',
      requiresConfirmation: false,
    };
  }
  return {
    product: 'Scout before spraying',
    brand: 'Syngenta crop-protection candidates after diagnosis',
    rationale: 'Conditions are moderate. Confirm the pest, disease, or weed first; do not apply an insecticide, fungicide, herbicide, or seed treatment from weather data alone.',
    options: [],
    category: 'scout',
    confidence: 'insufficient-for-treatment',
    requiresConfirmation: true,
  };
}

// Smart Pump-Count Dosing Calculator
export function computeDosing(acres, state = 'India') {
  const a = Math.max(1, Math.round(Number(acres) || 1));
  const region = resolveRegion(state)
  return {
    acres: a,
    region: region.label,
    message: `Application quantities are calculated only after a product and target are confirmed. This field has ${a} acres in ${region.label}; weather alone cannot select an insecticide, fungicide, herbicide, or seed treatment.`,
  };
}

// Full diagnostic — combine everything.
export function computeStressDiagnostic({ weather, crop, areaInAcres, soilPh, nitrogenKgPerHa, state }) {
  const { tmax, tmin, precip, soilMoisturePct, evaporation, tavg } = weather;
  const diurnal = +diurnalHeatStress(tmax, crop).toFixed(2);
  const night = +nightHeatStress(tmin, crop).toFixed(2);
  const frost = +frostStress(tmin).toFixed(2);
  const di = droughtIndex(precip ?? 0, evaporation ?? 0, soilMoisturePct ?? 0, tavg ?? 0);
  const yr = yieldRisk({ tmax, tmin, precip, ph: soilPh, nitrogen: nitrogenKgPerHa, crop });
  const product = recommendProduct({ diurnal, night, frost, di, crop, areaInAcres, state });
  const dosing = computeDosing(areaInAcres, state);
  return {
    crop,
    tmax,
    tmin,
    tavg,
    precip,
    soilMoisturePct,
    evaporation,
    scores: { diurnal, night, frost },
    droughtIndex: di,
    yieldRisk: yr,
    product,
    dosing,
  };
}
