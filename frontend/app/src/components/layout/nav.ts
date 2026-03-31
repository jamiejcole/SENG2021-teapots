import {
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  History,
  UserRound,
  Settings2,
  CircleHelp,
  Shield,
  FileText,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate Invoice', icon: ReceiptText },
  { to: '/validate', label: 'Validate Order', icon: ShieldCheck },
  { to: '/invoices', label: 'Invoice history', icon: History },
]

export const secondaryNav: NavItem[] = [
  { to: '/account', label: 'Account', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export const publicNav: NavItem[] = [
  { to: '/support', label: 'Support', icon: CircleHelp },
  { to: '/privacy', label: 'Privacy policy', icon: Shield },
  { to: '/terms', label: 'Terms', icon: FileText },
]

