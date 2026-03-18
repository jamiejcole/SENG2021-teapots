import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Application preferences (placeholder).</p>
      </div>
      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Theme toggle is available in the top bar.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">More settings can go here.</CardContent>
      </Card>
    </div>
  )
}

