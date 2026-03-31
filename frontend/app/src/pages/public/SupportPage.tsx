import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const supportItems = [
  {
    title: 'Email support',
    body: 'Send product, billing, or access questions to support@teapotinvoicing.app. We aim to respond within 1-2 business days.',
  },
  {
    title: 'Account issues',
    body: 'If you cannot sign in, use the password reset page to request a magic link or check that your 2FA verification is complete.',
  },
  {
    title: 'Invoice generation',
    body: 'If invoice creation or email delivery fails, include the invoice number, time of the issue, and any error text in your message so we can investigate faster.',
  },
  {
    title: 'Security concerns',
    body: 'Report suspected account compromise or privacy issues immediately so we can review the activity and secure the account.',
  },
]

export function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Support
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Help and contact
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Use this page to reach the team, report issues, and find the quickest route for common account problems.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {supportItems.map((item) => (
          <Card key={item.title} className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {item.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>
            General support: <a className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" href="mailto:support@teapotinvoicing.app">support@teapotinvoicing.app</a>
          </p>
          <p>
            Review the <Link className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300" to="/privacy">privacy policy</Link> or reset your password from the sign-in page if needed.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}