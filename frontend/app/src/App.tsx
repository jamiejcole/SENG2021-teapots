import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { GenerateInvoicePage } from '@/pages/GenerateInvoicePage'
import { ValidateOrderPage } from '@/pages/ValidateOrderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/generate" element={<GenerateInvoicePage />} />
        <Route path="/validate" element={<ValidateOrderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
