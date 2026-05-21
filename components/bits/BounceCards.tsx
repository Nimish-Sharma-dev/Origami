'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface BounceCardsProps {
  className?: string
  images?: string[]
  containerWidth?: number
  containerHeight?: number
  animationDelay?: number
  animationStagger?: number
  easeType?: string
  transformStyles?: string[]
  enableHover?: boolean
}

export default function BounceCards({
  className = '',
  images = [],
  containerWidth = 400,
  containerHeight = 250,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ],
  enableHover = true,
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bounce-card',
        { scale: 0 },
        { scale: 1, stagger: animationStagger, ease: easeType, delay: animationDelay }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [animationStagger, easeType, animationDelay])

  const getNoRotationTransform = (transformStr: string) => {
    if (/rotate\([\s\S]*?\)/.test(transformStr)) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)')
    }
    return transformStr === 'none' ? 'rotate(0deg)' : `${transformStr} rotate(0deg)`
  }

  const getPushedTransform = (baseTransform: string, offsetX: number) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/
    const match = baseTransform.match(translateRegex)
    if (match) {
      const currentX = parseFloat(match[1])
      return baseTransform.replace(translateRegex, `translate(${currentX + offsetX}px)`)
    }
    return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`
  }

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover || !containerRef.current) return
    const q = gsap.utils.selector(containerRef)
    images.forEach((_, i) => {
      const target = q(`.bounce-card-${i}`)
      gsap.killTweensOf(target)
      const base = transformStyles[i] || 'none'
      if (i === hoveredIdx) {
        gsap.to(target, { transform: getNoRotationTransform(base), duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' })
      } else {
        const offsetX = i < hoveredIdx ? -160 : 160
        const distance = Math.abs(hoveredIdx - i)
        gsap.to(target, {
          transform: getPushedTransform(base, offsetX),
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay: distance * 0.05,
          overwrite: 'auto',
        })
      }
    })
  }

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return
    const q = gsap.utils.selector(containerRef)
    images.forEach((_, i) => {
      const target = q(`.bounce-card-${i}`)
      gsap.killTweensOf(target)
      gsap.to(target, { transform: transformStyles[i] || 'none', duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' })
    })
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex justify-center items-center ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`bounce-card bounce-card-${idx} absolute w-44 aspect-square border-4 border-white rounded-2xl overflow-hidden shadow-xl`}
          style={{ transform: transformStyles[idx] ?? 'none' }}
          onMouseEnter={() => pushSiblings(idx)}
          onMouseLeave={resetSiblings}
        >
          <img className="w-full h-full object-cover" src={src} alt={`card-${idx}`} />
        </div>
      ))}
    </div>
  )
}
