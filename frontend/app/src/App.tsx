import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { DashboardPage } from '@/pages/DashboardPage'
import { GenerateInvoicePage } from '@/pages/GenerateInvoicePage'
import { ValidateOrderPage } from '@/pages/ValidateOrderPage'
import { InvoiceHistoryPage } from '@/pages/InvoiceHistoryPage'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { Verify2FAPage } from '@/pages/auth/Verify2FAPage'
import { AccountPage } from '@/pages/AccountPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuth } from '@/components/auth/AuthContext'

// Protected route wrapper
function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />
  }

  return element
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Root route - redirect based on auth status */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/sign-in" replace />} />

      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-2fa" element={<Verify2FAPage />} />
        <Route index element={<Navigate to="/auth/sign-in" replace />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/generate" element={<ProtectedRoute element={<GenerateInvoicePage />} />} />
        <Route path="/validate" element={<ProtectedRoute element={<ValidateOrderPage />} />} />
        <Route path="/invoices" element={<ProtectedRoute element={<InvoiceHistoryPage />} />} />
        <Route path="/account" element={<ProtectedRoute element={<AccountPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
