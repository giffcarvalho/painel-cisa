import { useCallback, useLayoutEffect, useState } from 'react'

const COMPACT_AXIS_WIDTH = 625

export function useResponsiveCategoryAxis() {
  const [container, setContainer] = useState(null)
  const [isCompact, setIsCompact] = useState(false)
  const containerRef = useCallback((node) => setContainer(node), [])

  useLayoutEffect(() => {
    if (!container) return undefined

    const update = (width) => {
      if (width <= 0) return
      const nextIsCompact = width < COMPACT_AXIS_WIDTH
      setIsCompact((current) => current === nextIsCompact ? current : nextIsCompact)
    }

    update(container.getBoundingClientRect().width)

    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [container])

  return { containerRef, isCompact }
}
