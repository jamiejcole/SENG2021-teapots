import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: '1. Provision of Service & API License',
    body:
      'Teapot Invoicing grants you a non-exclusive, non-transferable right to access our APIs and PEPPOL Access Point infrastructure. This license is contingent upon your compliance with PEPPOL Authority regulations and the technical specifications outlined in our documentation. You are solely responsible for ensuring your UBL/XML payloads meet the BIS Billing 3.0 or relevant local syntax requirements.',
  },
  {
    title: '2. PEPPOL Network Compliance',
    body:
      'By utilizing our Access Point, you warrant that all Participant IDs (e.g., ABN, VAT, GLN) registered through the Teapot Directory are legally owned by you or your authorized clients. You agree to comply with the PEPPOL Transport Infrastructure Agreements and understand that document delivery is a "four-corner model" process; Teapot is responsible for transmission to the receiving Access Point, but final delivery to the end-receiver is subject to the receiving party’s infrastructure.',
  },
  {
    title: '3. API Security & Integrity',
    body:
      'You are strictly prohibited from: (a) attempting to circumvent API rate limits through distributed requests; (b) injecting malicious scripts into XML metadata; or (c) reverse-engineering the Teapot routing engine. You maintain full liability for all actions performed using your Production API Keys, which must be stored in secure, server-side environments.',
  },
  {
    title: '4. Service Levels & Maintenance',
    body:
      'While Teapot Invoicing aims for 99.9% uptime for our API Gateway, the service is provided "as is" and "as available." Scheduled maintenance windows for our PEPPOL Gateway will be communicated via the Status Page. We are not liable for network-wide PEPPOL outages or delays caused by Central SMP/SML failures outside of our direct control.',
  },
  {
    title: '5. Intellectual Property & Data Processing',
    body:
      'Teapot Invoicing retains all rights to our proprietary schema-mapping logic, API architecture, and branding. You retain ownership of the financial data contained within your documents. By using the service, you grant Teapot a limited license to process, transform, and transmit this data for the sole purpose of executing your API requests and maintaining tax compliance logs.',
  },
  {
    title: '6. Limitation of Liability & Indemnity',
    body:
      'To the maximum extent permitted by law, Teapot Invoicing’s total liability for any claim arising from service interruption or data transmission error shall not exceed the fees paid by you in the 12 months preceding the event. You agree to indemnify Teapot Invoicing against any third-party claims resulting from incorrect financial data or fraudulent invoices transmitted via your account.',
  },
]

export function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Legal Framework
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Master Service Agreement
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          These terms govern the technical and legal relationship between Teapot Invoicing and the entities utilizing our electronic document exchange infrastructure.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Effective Revision: March 31, 2026</p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Enterprise & Custom SLAs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>
            High-volume senders or government entities requiring specific <strong>Data Residency</strong> or <strong>Custom Indemnity</strong> clauses should contact our legal team for a tailored MSA.
          </p>
          <p>
            Contact: <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="mailto:support@teapotinvoicing.app">support@teapotinvoicing.app</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}