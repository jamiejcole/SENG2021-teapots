import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type InvoiceSearchContextValue = {
  invoiceSearch: string
  setInvoiceSearch: (q: string) => void
}

const InvoiceSearchContext = createContext<InvoiceSearchContextValue | null>(null)

export function InvoiceSearchProvider({ children }: { children: ReactNode }) {
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const value = useMemo(() => ({ invoiceSearch, setInvoiceSearch }), [invoiceSearch])
  return <InvoiceSearchContext.Provider value={value}>{children}</InvoiceSearchContext.Provider>
}

export function useInvoiceSearch() {
  const ctx = useContext(InvoiceSearchContext)
  if (!ctx) {
    return { invoiceSearch: '', setInvoiceSearch: () => {} }
  }
  return ctx
}
