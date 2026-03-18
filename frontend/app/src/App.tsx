import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { GenerateInvoicePage } from '@/pages/GenerateInvoicePage'
import { ValidateOrderPage } from '@/pages/ValidateOrderPage'
import { InvoiceHistoryPage } from '@/pages/InvoiceHistoryPage'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { AccountPage } from '@/pages/AccountPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route index element={<Navigate to="/auth/sign-in" replace />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/generate" element={<GenerateInvoicePage />} />
        <Route path="/validate" element={<ValidateOrderPage />} />
        <Route path="/invoices" element={<InvoiceHistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
