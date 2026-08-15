/* The workspace layer: tab identity, and the one place workspace state lives.
 *
 * Two things live here because they are the two things the workspace owns that
 * the journey reducer deliberately does not. The reducer owns what the *task*
 * is doing — which artefacts exist, what the run produced. This owns how the
 * user has arranged their view of it, which lasts the session and means nothing
 * to the scenario.
 */
import type { IJsonModel } from 'flexlayout-react'
import type { PlaygroundState, Scenario, TabId } from './types'

/* ── Tab identity ───────────────────────────────────────────────────────────
 *
 * `${type}:${resourceId}`. The type picks the renderer, the resource says which
 * one of that kind — so two source files are two tabs, but asking for the same
 * file twice lands on the tab that is already open. Identity IS the dedup: the
 * FlexLayout model is keyed by it, so `getNodeById` answers "is this already
 * open?" without a second registry to keep in sync.
 */
export type WorkspaceTabType =
  | 'file'
  | 'preview'
  | 'tests'
  | 'diff'
  | 'evidence'
  | 'task'
  | 'agent-output'
  | 'workflow'

export interface WorkspaceTab {
  id: string
  type: WorkspaceTabType
  resourceId: string
  label: string
}

export function makeTabId(type: WorkspaceTabType, resourceId: string): string {
  return `${type}:${resourceId}`
}

/** Split on the FIRST colon only — resource ids are free to contain more. */
export function parseTabId(id: string): { type: WorkspaceTabType; resourceId: string } {
  const at = id.indexOf(':')
  if (at === -1) return { type: id as WorkspaceTabType, resourceId: '' }
  return { type: id.slice(0, at) as WorkspaceTabType, resourceId: id.slice(at + 1) }
}

/* The scenario layer still speaks in `TabId` ('code', 'preview', …) because the
   beats are written in it and rewriting the scripts would be churn for nothing.
   This is the seam: one legacy id plus the current playground state resolves to
   exactly one workspace tab. `code` is the interesting case — it resolves to
   whichever FILE is active, which is what makes per-file tabs possible without
   the scenarios knowing anything about them. */
export function workspaceTabFor(
  tab: TabId,
  pg: PlaygroundState,
  scenario: Scenario | null,
  taskId: string | null,
): WorkspaceTab | null {
  const task = taskId ?? 'task'

  if (tab === 'code') {
    const file = pg.activeFile ?? scenario?.fileOrder[0]
    if (!file) return null
    return { id: makeTabId('file', file), type: 'file', resourceId: file, label: file }
  }

  const label: Record<Exclude<TabId, 'code'>, string> = {
    preview: 'Preview',
    tests: 'Unit tests',
    diff: 'Working diff',
    evidence: 'Evidence',
  }
  return { id: makeTabId(tab, task), type: tab, resourceId: task, label: label[tab] }
}

/** Every artefact the quick-open menu can offer, in tab-bar order. */
export function openableTabs(
  pg: PlaygroundState,
  scenario: Scenario | null,
  taskId: string | null,
): { tab: WorkspaceTab; legacy: TabId; locked: boolean; hint?: string }[] {
  const out: { tab: WorkspaceTab; legacy: TabId; locked: boolean; hint?: string }[] = []

  const push = (legacy: TabId, hint?: string) => {
    const tab = workspaceTabFor(legacy, pg, scenario, taskId)
    if (tab) out.push({ tab, legacy, locked: !pg.enabledTabs.includes(legacy), hint })
  }

  push('preview')
  /* Every file in the scenario is separately openable — that is the whole point
     of file-scoped identity, and it is what makes the tab bar the real one. */
  for (const file of scenario?.fileOrder ?? []) {
    out.push({
      tab: { id: makeTabId('file', file), type: 'file', resourceId: file, label: file },
      legacy: 'code',
      locked: !pg.enabledTabs.includes('code'),
    })
  }
  push('tests')
  push('diff')
  push('evidence')

  return out
}

/* ── Session state ────────────────────────────────────────────────
 *
 * In memory, and deliberately not in storage. This is a prototype that gets
 * demoed: a reload has to put the flow back at the very start, so nothing here
 * survives one.
 *
 * Layouts are keyed by task. A workspace arrangement is about the artefacts of
 * one task; restoring another task's tabs — pointing at files that task never
 * had — is worse than starting clean.
 */

/** Panel geometry as react-resizable-panels reports it: panel id → percentage. */
export type PanelLayout = Record<string, number>

/** Identifies a layout by the panels it covers. */
export function panelSetKey(ids: string[]): string {
  return [...ids].sort().join(',')
}

const taskLayouts = new Map<string, IJsonModel>()

export function saveTaskLayout(taskId: string, layout: IJsonModel) {
  taskLayouts.set(taskId, layout)
}

export function taskLayout(taskId: string): IJsonModel | undefined {
  return taskLayouts.get(taskId)
}
