import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Data Collection & API Usage',
    body:
      'We collect developer account credentials, API keys, and technical metadata (including IP addresses and user-agent strings) required to authenticate requests to the Teapot Invoicing API. For PEPPOL processing, we collect business identifiers (e.g., ABN, VAT, GLN), endpoint metadata, and the raw XML/UBL content of invoices and orders submitted through our endpoints.',
  },
  {
    title: 'PEPPOL Network & Processing',
    body:
      'Teapot Invoicing acts as a PEPPOL Access Point. We process document data specifically to validate, transform, and transmit electronic invoices and orders via the PEPPOL eDelivery network. This includes routing data to appropriate four-corner model participants and maintaining the required transmission logs for network compliance.',
  },
  {
    title: 'How We Use Your Data',
    body:
      'Data is used to facilitate B2B document exchange, provide real-time status webhooks, and maintain our dev-first API infrastructure. We use aggregated, anonymized transaction telemetry to optimize our routing logic and ensure high availability of the Teapot network.',
  },
  {
    title: 'Data Sharing & Sub-processors',
    body:
      'We do not sell data. We share transaction data only with the designated PEPPOL Receiving Access Point as dictated by your API calls. Technical sub-processors include our SOC2-compliant cloud infrastructure providers and security logging services. We may disclose data when required by PEPPOL Authority regulations or legal mandate.',
  },
  {
    title: 'Retention & Archival',
    body:
      'In line with global tax and e-invoicing regulations, we retain transmission logs and document archives for the period required by law (typically 7 years in many jurisdictions) or as defined by your specific subscription tier settings. API request logs are typically purged after 30 days.',
  },
  {
    title: 'Security Architecture',
    body:
      'Our infrastructure is built for high-sensitivity financial data. We employ TLS 1.3 for all API transit, AES-256 encryption at rest, and strict API key scoping. As a developer, you are responsible for the secure management of your `SECRET_KEY` and ensuring your webhook endpoints verify Teapot signatures.',
  },
  {
    title: 'Your Rights & Control',
    body:
      'You maintain full control over your PEPPOL Directory presence through our API. You may request the deletion of your developer account or the rotation of credentials at any time. For data subject access requests related to specific invoices, we assist our customers (the Data Controllers) in fulfilling these obligations.',
  },
]

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Infrastructure Privacy
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Privacy and Data Handling
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          This policy outlines how Teapot Invoicing handles API metadata and PEPPOL document transmission for our developer community and enterprise partners.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Last Updated: March 31, 2026</p>
        
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Contact & Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>Questions regarding our PEPPOL Access Point certification or data processing? Reach out to <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="mailto:support@teapotinvoicing.app">support@teapotinvoicing.app</a>.</p>
          <p>
            Technical issues? Check our <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="https://api.teapotinvoicing.app/api/docs" target="_blank" rel="noreferrer">API Documentation</a>.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}