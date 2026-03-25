import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/AuthContext'
import { updateUserProfile } from '@/api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function AccountPage() {
  const { user, updateUserProfile: updateUserContext } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const email = user?.email ?? ''
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Sync profile fields when user data changes
  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
    setPhone(user?.phone ?? '')
    setCompany(user?.company ?? '')
  }, [user])

  const passwordMismatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return false
    return newPassword !== confirmPassword
  }, [newPassword, confirmPassword])

  async function handleSaveProfile() {
    if (!firstName.trim()) {
      toast.error('Please enter your first name.')
      return
    }
    if (!lastName.trim()) {
      toast.error('Please enter your last name.')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        company: company.trim(),
      })
      // Update AuthContext and localStorage
      updateUserContext({
        firstName: result.firstName,
        lastName: result.lastName,
        phone: result.phone,
        company: result.company,
      })
      toast.success(`Profile updated! Welcome, ${result.firstName}.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleChangePassword() {
    if (passwordMismatch) {
      toast.error('New password and confirmation do not match.')
      return
    }

    if (!currentPassword || !newPassword) {
      toast.error('Please enter your current and new password.')
      return
    }

    toast.info('Password update endpoint is not wired yet. UI is ready to connect.')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Manage profile details and security preferences.</p>
      </div>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Edit your personal and organization details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="e.g. Jamie"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="e.g. Parker"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+61 400 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Teapots Pty Ltd"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving || !firstName.trim() || !lastName.trim()}
          >
            {isSaving ? 'Saving…' : 'Save profile changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Change password and review authentication safeguards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {passwordMismatch && (
            <p className="text-sm text-red-600 dark:text-red-400">New password and confirmation must match.</p>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleChangePassword}>
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Set defaults for account and communication preferences.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Notification channels, timezone, and default billing preferences can be added here when those APIs are available.
        </CardContent>
      </Card>
    </div>
  )
}

