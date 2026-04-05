'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'left' | 'right'
  delay?: number
  distance?: number
  className?: string
}

export default function ScrollReveal({ children, direction = 'up', delay = 0, distance = 40, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  const translate: Record<string, string> = {
    up: `0, ${distance}px`,
    left: `${distance}px, 0`,
    right: `-${distance}px, 0`,
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const hidden = `translate(${translate[direction] || translate.up})`

    const revealObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.style.opacity = '1'
          el.style.transform = 'translate(0, 0)'
        }
      },
      { threshold: 0.15 }
    )

    const hideObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.style.transitionDelay = '0ms'
          el.style.opacity = '0'
          el.style.transform = hidden
        }
      },
      { threshold: 0 }
    )

    revealObs.observe(el)
    hideObs.observe(el)

    return () => {
      revealObs.disconnect()
      hideObs.disconnect()
    }
  }, [delay, direction, distance])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: `translate(${translate[direction] || translate.up})`,
        transition: 'opacity 0.7s cubic-bezier(0.33, 1, 0.68, 1), transform 0.7s cubic-bezier(0.33, 1, 0.68, 1)',
      }}
    >
      {children}
    </div>
  )
}
