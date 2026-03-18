import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AccountPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Profile and organization settings (placeholder).</p>
      </div>
      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Wire this to real auth/user data later.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No data connected.</CardContent>
      </Card>
    </div>
  )
}

