import { formatInr } from '../../../shared/advisory.js'

function escapePdfText(value) { return String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '?') }

export function createWhatsAppText(report = {}) {
  const yieldRange = report.yieldRange || 'insufficient data'
  return [`AgroVani farm summary`, `${report.crop || 'Crop'} | ${report.market || 'Market not set'}`, `Predicted yield: ${yieldRange}`, `Estimated revenue gain: ${formatInr(report.estimatedRevenueGain)}`, `Product cost: ${formatInr(report.productCost)}`, `Net profit estimate: ${formatInr(report.netProfitEstimate)}`, `MSP comparison: ${report.mspComparison || 'insufficient data'}`, `Data: ${report.dataTimestamp || 'timestamp unavailable'}`, `Model note: observational estimate, not proof of treatment effect.`].join('\n')
}

export function buildFarmReportPdf(report = {}) {
  const lines = [
    'AgroVani Farm and Commodity Summary',
    `Farm: ${report.farmName || 'Unnamed farm'}`,
    `Crop: ${report.crop || 'insufficient data'}    Area: ${report.areaInAcres || 'insufficient data'} acres`,
    `Predicted yield range: ${report.yieldRange || 'insufficient data'}`,
    `Estimated revenue gain: ${formatInr(report.estimatedRevenueGain)}`,
    `Product cost: ${formatInr(report.productCost)}`,
    `Net profit estimate: ${formatInr(report.netProfitEstimate)}`,
    `MSP comparison: ${report.mspComparison || 'insufficient data'}`,
    `Data source timestamp: ${report.dataTimestamp || 'timestamp unavailable'}`,
    'Assumptions:',
    ...(report.assumptions || ['No assumptions provided.']),
    'Disclaimer: Model-based observational estimate, not causal attribution or financial advice.',
  ]
  const stream = ['BT', '/F1 11 Tf', '50 760 Td', ...lines.flatMap((line, index) => [index ? '0 -20 Td' : '', `(${escapePdfText(line)}) Tj`]), 'ET'].filter(Boolean).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}
