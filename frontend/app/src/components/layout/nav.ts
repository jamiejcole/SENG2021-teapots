import {
  LayoutDashboard,
  History,
  UserRound,
  Settings2,
  CircleHelp,
  Shield,
  FileText,
  Package,
  Truck,
  FilePenLine,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const primaryNav: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/invoice-studio', label: 'Invoice Studio', icon: FilePenLine, badge: 'BETA' },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/despatch', label: 'Despatches', icon: Truck },
  // { to: '/generate', label: 'Invoices', icon: ReceiptText },
  { to: '/invoices', label: 'Invoices', icon: History },
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

