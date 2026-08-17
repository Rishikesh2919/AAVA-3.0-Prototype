import type { BlockSpec } from '../../state/types'
import { ToolSteps } from './ToolSteps'

interface Props {
  block: BlockSpec
  live: boolean
  prep: React.ReactNode
  /** The running app, for the `app` card's thumbnail. Injected the same way
      `prep` is — the conversation never reaches into the playground itself. */
  preview: React.ReactNode
  onAccept: (beat: string) => void
  onDismiss: () => void
  onOpenFile?: (file: string) => void
  onOpenPreview?: () => void
}

export function Block({ block, live, prep, preview, onAccept, onDismiss, onOpenFile, onOpenPreview }: Props) {
  if (block.kind === 'prep') return <>{prep}</>

  if (block.kind === 'tools') return <ToolSteps steps={block.steps} done={block.done} />

  /* What was generated: the thing itself on top, named underneath, with the way
     in beside the name. The thumbnail is the running app rendered small and
     inert — not a screenshot — so an edit in the workspace shows up here too. */
  if (block.kind === 'app') {
    return (
      /* Capped: a card is an object you can take in at a glance, and stretching
         it to a 880px reading column turns it into a banner. */
      <div className="mt-3 w-full max-w-[440px] overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)' }}>
        {preview && (
          <div className="relative h-[150px] overflow-hidden" style={{ background: 'var(--preview-bg)' }}>
            {/* Scaled from the top-left and widened to match, so the miniature
                fills the card rather than sitting in a third of it. */}
            <div aria-hidden="true" className="pointer-events-none origin-top-left select-none"
              style={{ transform: 'scale(.62)', width: '161%' }}>
              {preview}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-3.5 py-3"
          style={{ borderTop: preview ? '1px solid var(--glass-line-soft)' : undefined }}>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-[13px] font-semibold">{block.name}</span>
            <span className="mono truncate text-[11px]" style={{ color: 'var(--muted)' }}>{block.status}</span>
          </div>
          <button onClick={onOpenPreview}
            className="press rounded-full px-3.5 py-1.5 text-[12px] font-medium hover:bg-[var(--wash-4)] hover:text-[var(--text-dim)]"
            style={{ background: 'var(--glass)', color: 'var(--muted)', minHeight: 'var(--hit)', border: '1px solid var(--glass-line-soft)' }}>
            Open
          </button>
        </div>
      </div>
    )
  }

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
