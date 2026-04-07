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
  Package,
  Truck,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const primaryNav: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/generate', label: 'Generate invoice', icon: ReceiptText },
  { to: '/despatch', label: 'Despatch', icon: Truck },
  { to: '/invoices', label: 'Invoice history', icon: History },
  { to: '/validate', label: 'Validate order', icon: ShieldCheck },
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

