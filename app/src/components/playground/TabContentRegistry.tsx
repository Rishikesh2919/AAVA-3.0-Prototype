import type { PlaygroundState, Scenario } from '../../state/types'
import { parseTabId } from '../../state/workspace'
import { Preview } from './Preview'
import { previewTemplate } from './FeedbackApp'
import { Code } from './Code'
import { Tests } from './Tests'
import { Diff } from './Diff'
import { Evidence } from './Evidence'

/* Resolves a workspace tab id to the thing that renders it.
 *
 * The artefact components are untouched — this decides WHICH one and hands it
 * the slice of state it already expected. Adding a kind of tab is a case here
 * plus a type in state/workspace.ts; it is not a change to TabWorkspace, which
 * is why the workspace can grow without the workspace shell learning about it.
 */
interface Props {
  tabId: string
  scenario: Scenario | null
  pg: PlaygroundState
  theme: 'dark' | 'light'
  onToast: (text: string) => void
  onFile: (file: string) => void
  onEdit: (file: string, text: string) => void
}

export function TabContentRegistry({ tabId, scenario, pg, theme, onToast, onFile, onEdit }: Props) {
  const { type, resourceId } = parseTabId(tabId)

  switch (type) {
    case 'file':
      if (!scenario || !scenario.files[resourceId]) return <EmptySurface />
      return (
        <Padded>
          <Code scenario={scenario} pg={pg} theme={theme} onFile={onFile} onEdit={onEdit} file={resourceId} />
        </Padded>
      )

    case 'preview':
      if (!scenario) return <EmptySurface />
      return (
        <Padded>
          <Preview template={previewTemplate(scenario, pg)} onToast={onToast} />
        </Padded>
      )

    case 'tests':
      return scenario ? <Padded><Tests scenario={scenario} /></Padded> : <EmptySurface />

    case 'diff':
      return scenario ? <Padded><Diff groups={scenario.diff} /></Padded> : <EmptySurface />

    case 'evidence':
      return scenario
        ? <Padded><Evidence scenario={scenario} focused={pg.focusedEvidence} /></Padded>
        : <EmptySurface />

    default:
      return <EmptySurface />
  }
}

/* FlexLayout's tab body is edge-to-edge by design — it has to be, for splitters
   to meet cleanly. The padding belongs to the content, not the frame. */
function Padded({ children }: { children: React.ReactNode }) {
  return <div className="h-full min-h-0 overflow-auto p-3">{children}</div>
}

/* Speaks to the state of the work, never to the state of the prototype. */
export function EmptySurface() {
  return (
    <div className="grid h-full min-h-[220px] place-items-center px-8 text-center">
      <div className="max-w-[280px]">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          Nothing to show here yet
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted-deep)' }}>
          Evidence appears as soon as I produce something you can check.
        </p>
      </div>
    </div>
  )
}
