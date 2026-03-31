import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Using the service',
    body:
      'You may use Teapots Invoicing only for lawful business purposes and in accordance with these terms, applicable laws, and any customer agreements you enter into.',
  },
  {
    title: 'Accounts and security',
    body:
      'You are responsible for the accuracy of the information in your account, maintaining the confidentiality of your credentials, and all activity that occurs under your account.',
  },
  {
    title: 'Acceptable use',
    body:
      'You must not misuse the platform, attempt unauthorised access, introduce malicious code, or use the service in a way that disrupts other users or the underlying infrastructure.',
  },
  {
    title: 'Service availability',
    body:
      'We aim to keep the service available, but the platform is provided on an availability basis and may be updated, suspended, or modified for maintenance, security, or operational reasons.',
  },
  {
    title: 'Intellectual property',
    body:
      'The service, branding, and software remain our property or the property of our licensors. You retain rights to the content you upload or generate, subject to the rights you grant us to operate the service.',
  },
  {
    title: 'Liability',
    body:
      'To the extent permitted by law, we are not liable for indirect or consequential losses. Any service-specific limits or exclusions should be reviewed to match your commercial and legal requirements.',
  },
]

export function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Terms and conditions
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Terms of use
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          This is a generic SaaS terms template for Teapots Invoicing. It should be reviewed and tailored to your commercial terms, liabilities, and legal obligations before use.
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
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Questions or exceptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>Need a commercial agreement or a custom enterprise setup? Contact <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="mailto:support@teapotinvoicing.app">support@teapotinvoicing.app</a>.</p>
          <p>
            See the <Link className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" to="/privacy">privacy policy</Link> or <Link className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" to="/support">support page</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}