import { useMemo } from 'react'
import { pickGreeting } from '../../data/greetings'

export function Hero() {
  const greeting = useMemo(() => pickGreeting(), [])

  return (
    <section className="mb-10">
      <h1 className="text-[44px] font-medium leading-[1.05] tracking-[-.038em] text-balance">
        {greeting}
      </h1>
      <p className="mt-3 max text-[15px] leading-relaxed text-pretty" style={{ color: 'var(--muted)' }}>
        I have worked on a couple of your tasks. Would you like to review these?
      </p>
    </section>
  )
}
