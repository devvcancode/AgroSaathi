import Link from 'next/link'
import { ArrowLeft, FileCheck2, ShieldAlert } from 'lucide-react'

const requirements = [
  {
    role: 'Individual farmer',
    purpose: 'Confirm identity, cultivated land or lawful cultivation rights, and payout ownership.',
    documents: [
      'Government-issued photo identity and PAN, where required for the service or payment flow.',
      'State land record for the parcel (for example Record of Rights, 7/12 extract, RTC/Pahani, or Patta), or a valid lease/cultivation agreement with landholder consent.',
      'Farm location and parcel details matching the submitted land record; discrepancies need manual review.',
      'Bank account proof in the farmer’s or authorized FPO’s name before payouts.',
    ],
  },
  {
    role: 'FPO or farmer collective',
    purpose: 'Verify the legal entity and the person authorized to act for its members.',
    documents: [
      'Registration/incorporation certificate, PAN, governing documents, and registered address.',
      'CIN and company records for a Producer Company, or the applicable cooperative/society registration.',
      'Current board/member authorization for the named signatory and a member/farm roster with consent.',
      'GSTIN verification when registered or legally required, plus entity bank proof for settlements.',
    ],
  },
  {
    role: 'Buyer',
    purpose: 'Verify the trading entity, authorized buyer, and business-use requirements.',
    documents: [
      'PAN and business constitution proof: incorporation certificate, LLP/partnership deed, or proprietorship evidence as applicable.',
      'GSTIN and legal name/address match when registered or required; validate status on the GST portal.',
      'Authorized-signatory proof, registered/business address, and bank proof for settlement.',
      'FSSAI license/registration when the activity handles food, and any other activity-specific permit required for the stated use.',
    ],
  },
  {
    role: 'Seed seller',
    purpose: 'Verify the seller, lawful sale channel, and traceability/quality of seed lots.',
    documents: [
      'Business constitution, PAN, address proof, authorized-signatory proof, and GSTIN when registered or required.',
      'Applicable State seed-dealer license/registration under the Seeds Act and Seeds (Control) Order; confirm current state requirements.',
      'Manufacturer/distributor authorization and lot-wise source, label, test/germination, and expiry details for listed seed.',
      'Additional fertilizer, pesticide, or food-related licenses only when those regulated products or activities are listed.',
    ],
  },
]

const sources = [
  { label: 'GST portal and taxpayer search', href: 'https://www.gst.gov.in/' },
  { label: 'GST taxpayer search service', href: 'https://services.gst.gov.in/services/searchtp' },
  { label: 'India Code (central legislation)', href: 'https://www.indiacode.nic.in/' },
  { label: 'Small Farmers’ Agribusiness Consortium (FPO resources)', href: 'https://sfacindia.com/' },
  { label: 'FSSAI FoSCoS licensing portal', href: 'https://foscos.fssai.gov.in/' },
  { label: 'UIDAI (identity services and safeguards)', href: 'https://uidai.gov.in/' },
]

export default async function VerificationPage({ searchParams }) {
  const params = await searchParams
  const digilockerStatus = params?.digilocker
  return (
    <main className="min-h-screen bg-[#f3f6f8] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#174a6e] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        <header className="mt-6 border-b-4 border-amber-500 bg-white px-6 py-7 shadow-sm md:px-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#35617e]">AgroSaathi · Account review</p>
          <h1 className="mt-2 text-3xl font-bold text-[#123d5d]">Identity and business verification</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Requirements depend on your legal status, State, trade, and payout activity. The checklist below is an onboarding guide, not legal advice or a government certification.</p>
        </header>

        <section className="mt-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" aria-live="polite">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-bold">Verification is not active in this demo</p><p className="mt-1 leading-6">The current sign-in uses demo credentials and this deployment has no authenticated, private document-upload and review workflow. No documents are collected here, and no account should be treated as KYC-verified. Do not send identity or land records by email or chat.</p></div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-[#173f5b]">DigiLocker authorization</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Connect through DigiLocker consent when the application credentials are configured. This prototype only completes the OAuth authorization handshake; it does not retrieve or retain documents and does not mark an account verified.</p>
          {digilockerStatus && <p role="status" className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{({ authorized: 'DigiLocker authorization completed. KYC review is still pending.', not_configured: 'DigiLocker is not configured for this deployment.', denied: 'DigiLocker authorization was cancelled.', state_error: 'The DigiLocker authorization could not be validated. Please restart the connection.', error: 'DigiLocker authorization could not be completed.' })[digilockerStatus] || 'DigiLocker status updated.'}</p>}
          <a href="/api/verification/digilocker/start" className="mt-4 inline-flex items-center rounded-md bg-[#174a6e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#123d5d]">Connect DigiLocker</a>
        </section>

        <div className="mt-6 space-y-4">
          {requirements.map((item) => (
            <section key={item.role} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-start gap-3"><div className="rounded-md bg-[#e8f1f6] p-2 text-[#174a6e]"><FileCheck2 className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-[#173f5b]">{item.role}</h2><p className="mt-1 text-sm text-slate-600">{item.purpose}</p></div></div>
              <ul className="mt-4 grid gap-2 md:grid-cols-2">{item.documents.map((document) => <li key={document} className="border-l-2 border-emerald-600 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">{document}</li>)}</ul>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-[#173f5b]">Official reference portals</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#17618d] underline underline-offset-2">{source.label}</a></li>)}</ul>
          <p className="mt-4 text-xs leading-5 text-slate-500">A production rollout must confirm current central and State rules with qualified counsel and the relevant licensing authority. Aadhaar-based checks, if used, must go through an authorized provider with informed consent; do not retain Aadhaar numbers or scans without a reviewed lawful basis.</p>
        </section>
      </div>
    </main>
  )
}
