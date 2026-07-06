'use client'
import { useState, useEffect } from 'react'

export function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const steps = 20
    const increment = value / steps
    const intervalMs = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, value)
      setDisplay(Math.round(current))
      if (current >= value) clearInterval(timer)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [value, duration])

  return <>{display}</>
}
