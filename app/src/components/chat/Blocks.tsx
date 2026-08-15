import type { BlockSpec } from '../../state/types'
import { ToolSteps } from './ToolSteps'

interface Props {
  block: BlockSpec
  live: boolean
  prep: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: () => void
  onOpenFile?: (file: string) => void
}

export function Block({ block, live, prep, onAccept, onDismiss, onOpenFile }: Props) {
  if (block.kind === 'prep') return <>{prep}</>

  if (block.kind === 'tools') return <ToolSteps steps={block.steps} done={block.done} />

  if (block.kind === 'coverage') {
    return (
      <div className="mt-3 grid gap-2">
        {block.groups.map((g) => (
          <div key={g.title} className="rounded-[var(--r-md)] p-3"
            style={{
              background: 'var(--glass)',
              border: `1px solid ${g.tone === 'assumed' ? 'rgba(251,191,36,.26)' : 'var(--glass-line)'}`,
            }}>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{ color: g.tone === 'assumed' ? 'var(--warn)' : 'var(--muted)' }}>{g.title}</h4>
            <ul className="grid gap-1.5 text-[13px] leading-[1.5]" style={{ color: 'var(--text-dim)' }}>
              {g.items.map((i) => (
                <li key={i} className="grid grid-cols-[6px_1fr] items-start gap-2.5">
                  <span className="mt-[7px] h-[3px] w-[3px] rounded-full"
                    style={{ background: g.tone === 'assumed' ? 'var(--warn)' : 'var(--muted-deep)' }} />
                  <span className="text-pretty">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (block.kind === 'links') {
    return (
      <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2">
        {block.links.map((l) =>
          /* A file link opens the file in the workspace, so it is a real link —
             underlined, and it goes somewhere. A PR reference has nowhere to go
             in a prototype, so it stays a pill and does not pretend otherwise. */
          l.file ? (
            <button key={l.label} onClick={() => onOpenFile?.(l.file!)}
              className="mono press text-[12px] underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--done)' }}>
              {l.label}
            </button>
          ) : (
            <span key={l.label} className="mono rounded-full px-3 py-1.5 text-[12px]"
              style={{ background: 'rgba(91,157,255,.14)', color: 'var(--done)' }}>{l.label}</span>
          ),
        )}
      </div>
    )
  }

  // confirm
  return (
    <div className="mt-3 rounded-[var(--r-md)] p-3"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
      {block.rows.map((r) => (
        <div key={r.repo} className="mb-2 grid gap-0.5">
          <span className="text-[12px] font-semibold">{r.repo}</span>
          <span className="mono text-[11px]" style={{ color: 'var(--muted)' }}>{r.branch}</span>
          <span className="text-[12px]" style={{ color: 'var(--text-dim)' }}>{r.what}</span>
        </div>
      ))}
      {live && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => { onDismiss(); onAccept(block.acceptBeat) }}
            className="press rounded-full px-3.5 py-2 text-[12px] font-medium"
            style={{ background: 'linear-gradient(140deg, var(--aurora-1), var(--aurora-2))', color: '#fff', minHeight: 'var(--hit)' }}>
            {block.acceptLabel}
          </button>
          <button onClick={onDismiss}
            className="press rounded-full px-3.5 py-2 text-[12px] hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
            style={{ background: 'var(--glass)', color: 'var(--muted)', minHeight: 'var(--hit)', border: '1px solid var(--glass-line-soft)' }}>
            {block.cancelLabel}
          </button>
        </div>
      )}
    </div>
  )
}
