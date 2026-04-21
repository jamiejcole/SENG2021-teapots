export function LandingBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-15%,hsl(47_100%_94%/0.85),transparent_58%),radial-gradient(ellipse_90%_55%_at_100%_0%,hsl(210_85%_94%/0.45),transparent_52%),radial-gradient(ellipse_70%_50%_at_0%_100%,hsl(28_40%_90%/0.4),transparent_55%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-15%,hsl(222_32%_14%/0.95),transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_0%,hsl(215_55%_22%/0.28),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_100%,hsl(28_30%_16%/0.45),transparent_55%)]" />

      <svg
        className="absolute -right-[10%] top-[8%] h-[min(520px,55vw)] w-[min(520px,55vw)] text-amber-400/20 dark:text-amber-400/[0.14]"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M60 320c80-40 120-120 200-160s120 0 160 80"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M40 200c60 20 100-60 180-40s140 100 200 40"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
        <circle cx="320" cy="80" r="48" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
        <path
          d="M280 120c20-8 36-4 48 12s8 36-8 48"
          stroke="hsl(215 70% 48%)"
          strokeWidth="1"
          strokeOpacity="0.22"
          strokeLinecap="round"
          className="dark:stroke-sky-400/40"
        />
      </svg>

      <svg
        className="absolute -left-[8%] bottom-[5%] h-[min(440px,50vw)] w-[min(440px,50vw)] text-sky-400/18 dark:text-sky-500/[0.12]"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 80h120l20 40h-80l40 200h-60L20 80z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeOpacity="0.45"
        />
        <path d="M180 100h140v24H180z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.32" />
        <path d="M180 140h100v16H180z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.22" />
        <path d="M180 168h120v16H180z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.18" />
        <circle cx="340" cy="300" r="70" stroke="hsl(35 42% 42%)" strokeWidth="1" strokeOpacity="0.18" />
      </svg>

      <div className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-200/25 via-transparent to-sky-200/20 blur-3xl dark:from-amber-900/18 dark:via-transparent dark:to-sky-900/12" />
    </div>
  )
}
