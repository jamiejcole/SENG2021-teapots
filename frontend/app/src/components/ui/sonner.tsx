import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/components/theme/ThemeProvider"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster(props: ToasterProps) {
  const { resolved } = useTheme()
  const theme = resolved === "dark" ? "dark" : "light"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:items-start group-[.toaster]:gap-3 group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:py-4 group-[.toaster]:pl-4 group-[.toaster]:pr-8",
          icon: "!h-auto !w-auto !shrink-0 !self-start !justify-start [&_img]:!h-20 [&_img]:!w-20",
          title: "group-[.toast]:text-left",
          description: "group-[.toast]:text-left group-[.toast]:text-muted-foreground",
          success:
            "!items-center !text-center [&_[data-title]]:!text-center [&_[data-description]]:!text-center [&_[data-icon]]:!self-center",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}
