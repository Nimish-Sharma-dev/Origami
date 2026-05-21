'use client'

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type SpringOptions,
} from 'framer-motion'
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react'

interface DockItemData {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  className?: string
}

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  mouseX: ReturnType<typeof useMotionValue<number>>
  spring: SpringOptions
  distance: number
  magnification: number
  baseItemSize: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useMotionValue(0)

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize }
    return val - rect.x - baseItemSize / 2
  })

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const size = useSpring(targetSize, spring)

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-xl bg-white border border-emerald-100 shadow-sm cursor-pointer outline-none hover:border-emerald-300 transition-colors ${className}`}
      tabIndex={0}
      role="button"
    >
      {Children.map(children, child => cloneElement(child as React.ReactElement, { isHovered }))}
    </motion.div>
  )
}

function DockLabel({ children, ...rest }: { children: React.ReactNode; isHovered?: ReturnType<typeof useMotionValue<number>> }) {
  const { isHovered } = rest as { isHovered: ReturnType<typeof useMotionValue<number>> }
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isHovered) return
    const unsubscribe = isHovered.on('change', latest => setIsVisible(latest === 1))
    return () => unsubscribe()
  }, [isHovered])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-pre rounded-md border border-emerald-100 bg-white px-2 py-0.5 text-xs text-emerald-700 shadow-sm"
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DockIcon({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center text-emerald-700">{children}</div>
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
}: {
  items: DockItemData[]
  className?: string
  spring?: SpringOptions
  magnification?: number
  distance?: number
  panelHeight?: number
  dockHeight?: number
  baseItemSize?: number
}) {
  const mouseX = useMotionValue(Infinity)
  const isHovered = useMotionValue(0)

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  )
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight])
  const height = useSpring(heightRow, spring)

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="flex items-end">
      <motion.div
        onMouseMove={({ pageX }) => { isHovered.set(1); mouseX.set(pageX) }}
        onMouseLeave={() => { isHovered.set(0); mouseX.set(Infinity) }}
        className={`flex items-end gap-3 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100 px-3 pb-2 shadow-lg shadow-emerald-100/50 ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  )
}
