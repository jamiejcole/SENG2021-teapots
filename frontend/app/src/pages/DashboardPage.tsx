import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Create invoices from UBL Orders and validate payloads.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/generate" className="block">
          <Card className="transition-shadow hover:shadow-sm">
            <CardHeader>
              <CardTitle>Generate Invoice</CardTitle>
              <CardDescription>Paste an Order XML and generate Invoice XML.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/validate" className="block">
          <Card className="transition-shadow hover:shadow-sm">
            <CardHeader>
              <CardTitle>Validate Order</CardTitle>
              <CardDescription>Run UBL XSD validation for an Order XML.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

