import { motion } from 'motion/react'
import type { ToolStep } from '../../state/types'

/* Tool calls resolving in real time.
 *
 * This is what makes AAVA read as an agent rather than a chatbot: before it
 * answers, you watch it go and fetch the things it needs. Each row shows
 * pending -> running -> done with the result it came back with, so "Trust is the
 * currency" is demonstrated rather than asserted. */
export function ToolSteps({ steps, done }: { steps: ToolStep[]; done: number }) {
  return (
    <div className="mb-1 grid gap-[3px]">
      {steps.map((step, i) => {
        const state = i < done ? 'done' : i === done ? 'running' : 'pending'
        if (state === 'pending') return null

        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-[7px]"
            style={{ background: 'var(--wash-2)' }}
          >
            <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
              {state === 'done' ? (
                <span className="text-[10px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
              ) : (
                <span
                  className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent"
                  style={{
                    borderTopColor: 'var(--muted)',
                    borderRightColor: 'var(--muted)',
                    animation: 'tool-spin .7s linear infinite',
                  }}
                />
              )}
            </span>

            <span
              className="min-w-0 flex-1 truncate text-[12px]"
              style={{ color: state === 'done' ? 'var(--text-dim)' : 'var(--muted)' }}
            >
              {step.label}
            </span>

            {state === 'done' ? (
              <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>
                {step.result}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] uppercase tracking-[.13em]" style={{ color: 'var(--muted-deep)' }}>
                {step.source}
              </span>
            )}
          </motion.div>
        )
      })}
      <style>{`@keyframes tool-spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) { @keyframes tool-spin { to { transform: none } } }`}</style>
    </div>
  )
}
