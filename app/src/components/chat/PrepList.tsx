import * as Collapsible from '@radix-ui/react-collapsible'
import type { PrepStep } from '../../state/types'

/* One dropdown, not ten. The sequence is a summary line until you want the
   detail; opening a step is not the point — seeing its evidence is, so a row
   click goes straight to the evidence pane. */
export function PrepList({ steps, onOpenEvidence }: {
  steps: PrepStep[]
  onOpenEvidence: (key: string) => void
}) {
  const done = steps.filter((s) => !s.pending).length

  return (
    <Collapsible.Root className="group mt-4 overflow-hidden rounded-[var(--r-sm)]"
      style={{ background: 'var(--wash-2)' }}>
      <Collapsible.Trigger className="flex w-full items-center gap-3 px-3.5 py-[11px] text-left transition-colors hover:bg-[var(--wash-3)]"
        style={{ minHeight: 'var(--hit)' }}>
        <span className="flex-1 text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
          Sequence of steps
        </span>
        <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--muted-deep)' }}>
          {done} of {steps.length} done
        </span>
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"
          className="shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90"
          style={{ color: 'var(--muted-deep)' }}>
          <path d="m9.5 5 6.5 7-6.5 7" fill="none" stroke="currentColor" strokeWidth="1.9"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Collapsible.Trigger>

      {/* grid-cols-1 (minmax(0,1fr)) — a plain auto column sizes to max-content,
          which pushed the rows past the panel and clipped the result column. */}
      <Collapsible.Content className="grid grid-cols-1 gap-[3px] px-1 pb-1">
        {steps.map((step, i) => (
          /* The row only expands. Evidence is a deliberate second click. */
          <Collapsible.Root key={step.key} className="group/step min-w-0 rounded-[var(--r-sm)]"
            style={{ background: 'var(--wash-1)' }}>
            <Collapsible.Trigger className="flex w-full min-w-0 items-center gap-3 rounded-[var(--r-sm)] px-2.5 py-[9px] text-left transition-colors hover:bg-[var(--wash-4)]">
              <span className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full text-[9px] leading-none"
                style={step.pending ? undefined : { background: 'rgba(74,222,128,.15)', color: 'var(--ok)' }}>
                {step.pending ? '' : '✓'}
              </span>

              <span className="mono w-[15px] shrink-0 text-right text-[10.5px] tabular-nums"
                style={{ color: 'var(--muted-deep)' }}>{i + 1}</span>

              <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
                {step.label}
              </span>

              <span className="mono shrink-0 truncate text-[11px]" style={{ color: 'var(--muted-deep)' }}>
                {step.result}
              </span>

              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"
                className="shrink-0 transition-transform duration-200 group-data-[state=open]/step:rotate-90"
                style={{ color: 'var(--muted-deep)' }}>
                <path d="m9.5 5 6.5 7-6.5 7" fill="none" stroke="currentColor" strokeWidth="1.9"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Collapsible.Trigger>

            <Collapsible.Content className="overflow-hidden pb-3 pl-[50px] pr-3.5 pt-0.5">
              <p className="max-w-[52ch] text-[12.5px] leading-[1.6] text-pretty" style={{ color: 'var(--muted)' }}>
                {step.detail}
              </p>
              <button onClick={() => onOpenEvidence(step.key)}
                className="press mt-2 rounded-full px-3 py-2 text-[12px] hover:bg-[var(--wash-4)]"
                style={{ background: 'var(--wash-3)', color: 'var(--text-dim)', minHeight: 'var(--hit)' }}>
                Open evidence →
              </button>
            </Collapsible.Content>
          </Collapsible.Root>
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
