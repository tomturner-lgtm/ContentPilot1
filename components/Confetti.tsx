'use client'

import { useEffect, useState } from 'react'

interface ConfettiProps {
  show: boolean
  onComplete?: () => void
}

export function Confetti({ show, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    delay: number
    duration: number
  }>>([])

  useEffect(() => {
    if (show) {
      // Générer 50 particules
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }))
      setParticles(newParticles)

      // Appeler onComplete après l'animation
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!show) return null

  const colors = [
    '#8B5CF6', // primary
    '#10B981', // green
    '#3B82F6', // blue
    '#F59E0B', // yellow
    '#EF4444', // red
  ]

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => {
        const color = colors[Math.floor(Math.random() * colors.length)]
        return (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: color,
              animation: `confetti-fall ${particle.duration}s ${particle.delay}s ease-out forwards`,
            }}
          />
        )
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
