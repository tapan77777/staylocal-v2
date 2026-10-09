'use client'
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  as?: 'div' | 'section' | 'article' | 'li'
  className?: string
  style?: CSSProperties
}

export default function Reveal({ children, delay = 0, as = 'div', className, style }: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisible(true)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const Tag = as as 'div'
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
