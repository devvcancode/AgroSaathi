export const dynamic = 'force-static'

export default function manifest() {
  return {
    name: 'AgroVani Farmer Operations',
    short_name: 'AgroVani',
    description: 'Residue-first crop planning, marketplace and driver dispatch for farmers.',
    start_url: '/login?source=install',
    display: 'standalone',
    background_color: '#102b2b',
    theme_color: '#006a42',
    orientation: 'portrait-primary',
    lang: 'en-IN',
    categories: ['agriculture', 'business', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }
}
