import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function CountUp({ value, decimals = 0, suffix = '', prefix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView || reduce) return
    const controls = animate(0, value, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [isInView, value, reduce])

  const raw = reduce ? (isInView ? value : 0) : display

  const formatted =
    decimals > 0
      ? raw.toFixed(decimals)
      : Math.round(raw).toLocaleString('en-AU')

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
