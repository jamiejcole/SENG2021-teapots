import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Information we collect',
    body:
      'We collect account details such as your name, email address, profile information, invoice data, uploaded order or invoice files, and technical metadata generated when you use the service. We may also collect support requests and product feedback you send us.',
  },
  {
    title: 'How we use information',
    body:
      'We use information to provide the invoicing platform, create and email invoices, verify accounts, deliver support, improve the product, detect abuse, and comply with legal or accounting obligations.',
  },
  {
    title: 'Sharing and disclosure',
    body:
      'We do not sell personal information. We may share data with service providers such as hosting, email delivery, analytics, or security vendors when they help us operate the platform. We may disclose information if required by law or to protect users and the service.',
  },
  {
    title: 'Data retention',
    body:
      'We keep account and invoice records for as long as needed to provide the service, support your account, resolve disputes, and meet legal, tax, or audit obligations. Where possible, data is deleted or anonymised when it is no longer needed.',
  },
  {
    title: 'Security',
    body:
      'We use reasonable technical and organisational safeguards, but no online system is completely secure. You are responsible for protecting your account credentials and notifying us of any suspected compromise.',
  },
  {
    title: 'Cookies and local storage',
    body:
      'The application may use cookies, local storage, or similar technologies to keep you signed in, remember preferences, and improve the experience. Browser settings may limit these features.',
  },
  {
    title: 'Your rights',
    body:
      'Depending on your location, you may have rights to access, correct, delete, or restrict certain personal information, and to object to some processing activities. Contact support if you want to make a request.',
  },
  {
    title: 'Policy updates',
    body:
      'We may update this policy from time to time as the service changes. If the updates are material, we will take reasonable steps to notify users through the site or email.',
  },
]

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Privacy policy
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Privacy and data handling
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          This is a generic SaaS privacy policy template for Teapots Invoicing. It should be reviewed and adapted to your business, jurisdiction, and actual data handling practices before production use.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Effective date: March 31, 2026</p>
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
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>If you have questions about this policy, contact <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="mailto:privacy@teapotinvoicing.app">privacy@teapotinvoicing.app</a>.</p>
          <p>
            Need product help? Visit the <Link className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" to="/support">support page</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}