import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type SheetContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: "top" | "bottom" | "left" | "right"
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheet() {
  const ctx = React.useContext(SheetContext)
  if (!ctx) throw new Error("Sheet components must be used within Sheet")
  return ctx
}

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange, side: "left" }}>
      {children}
    </SheetContext.Provider>
  )
}

const sideClasses = {
  top: "inset-x-0 top-0 border-b",
  bottom: "inset-x-0 bottom-0 border-t",
  left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
  right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
} as const

const slideClasses = {
  left: "data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
  right: "data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full",
  top: "data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full",
  bottom: "data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full",
} as const

function SheetContent({
  side = "left",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: keyof typeof sideClasses }) {
  const { open, onOpenChange } = useSheet()

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 transition-opacity"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-300 ease-out",
          sideClasses[side],
          slideClasses[side],
          className
        )}
        {...props}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />
}

export { Sheet, SheetContent, SheetHeader, SheetTitle }
