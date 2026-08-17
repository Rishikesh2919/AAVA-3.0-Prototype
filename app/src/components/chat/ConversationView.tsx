import { motion } from 'motion/react'
import type { AppState, Chip } from '../../state/types'
import { Thread } from './Thread'
import { ContextPane } from '../playground/ContextPane'
import { IconFolder, IconRightPanel } from '../chrome/icons'
import { prefersReducedMotion } from '../../state/timing'

interface Props {
  state: AppState
  chips: Chip[]
  prep: React.ReactNode
  preview: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
  onOpenPreview?: () => void
  onToggleContext?: () => void
  onTogglePanel?: () => void
  composer: React.ReactNode
}

/* The centre column: the conversation, and — when a task is open — the task
 * context beside it. Context sits left of the discussion because the ticket
 * detail belongs next to the talk about it, not behind a tab in the workspace.
 *
 * This is now the only conversation surface. It used to have a twin (SplitView)
 * that existed solely to bolt the artefact panel onto the right; the panel is a
 * region of the shell now, so the twin had nothing left to do.
 */
export function ConversationView({
  state, chips, prep, preview, onChip, onAccept, onDismiss, onOpenFile, onOpenPreview, composer, onToggleContext, onTogglePanel,
}: Props) {
  const task = state.activeTaskId ? state.tasks.find((t) => t.id === state.activeTaskId) : null
  const contextOpen = state.playground.contextOpen
  const panelOpen = state.playground.panelOpen
  const reduced = prefersReducedMotion()

  /* The reading column widens when the workspace folds away. Not unbounded —
     prose past ~110 characters is hard to track back to the next line. */
  const colMax = task ? (panelOpen ? 620 : 880) : 760
  const colStyle = {
    maxWidth: colMax,
    transition: reduced ? undefined : 'max-width 320ms cubic-bezier(.16,1,.3,1)',
  }

  return (
    <motion.div className="flex h-full min-h-0 w-full">
      {task && <ContextPane open={contextOpen} ctx={task.context} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {task && (
          <div className="flex shrink-0 items-center px-6 pt-4">
            <EdgeToggle
              on={contextOpen}
              onClick={onToggleContext}
              label={contextOpen ? 'Hide task context' : 'Show task context'}
            >
              <IconFolder size={15} />
            </EdgeToggle>

            {/* The task names itself here rather than only in the sidebar — this
                is the one header the conversation has. */}
            <h2 className="ml-2 min-w-0 truncate text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
              {task.title}
            </h2>

            {/* Right edge, for the region it controls. Collapsing the workspace
                from inside it leaves no way back in — this is that way back. */}
            <EdgeToggle
              on={panelOpen}
              onClick={onTogglePanel}
              label={panelOpen ? 'Hide workspace' : 'Show workspace'}
              className="ml-auto"
            >
              <IconRightPanel size={15} />
            </EdgeToggle>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-3">
          <div className="mx-auto w-full" style={colStyle}>
            <Thread messages={state.messages} chips={chips} prep={prep} preview={preview}
              onChip={onChip} onAccept={onAccept} onDismiss={onDismiss} onOpenFile={onOpenFile}
              onOpenPreview={onOpenPreview} />
          </div>
        </div>

        {/* px-8 outside the max-width, exactly as the thread above — with the
            padding inside it, the composer came out 64px narrower. */}
        <div className="px-8">
          <div className="mx-auto w-full" style={colStyle}>{composer}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* The two region toggles that frame the conversation. Same button, same
   pressed treatment — they control mirror images of each other. */
function EdgeToggle({ on, onClick, label, className = '', children }: {
  on: boolean
  onClick?: () => void
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`press grid h-8 w-8 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${className}`}
      style={{
        color: on ? 'var(--text-dim)' : 'var(--muted)',
        background: on ? 'var(--wash-3)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}
