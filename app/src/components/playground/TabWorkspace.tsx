import { useCallback, useEffect, useRef, useState } from 'react'
import { Actions, DockLocation, Layout, Model, TabNode } from 'flexlayout-react'
import type { Action, IJsonModel } from 'flexlayout-react'
import type { PlaygroundState, Scenario } from '../../state/types'
import { openableTabs, saveTaskLayout, taskLayout, workspaceTabFor, type WorkspaceTab } from '../../state/workspace'
import { useDismiss } from '../../state/useDismiss'
import { TabContentRegistry } from './TabContentRegistry'
import '../../design/flexlayout-theme.css'

/* An empty tabset, not a seeded one. Manually reopening an empty workspace has
   to show an empty workspace — inventing a tab to fill it is the app deciding
   what you wanted to look at. */
function emptyModel(): IJsonModel {
  return {
    global: {
      tabEnableClose: true,
      tabEnableRename: false,
      tabSetEnableMaximize: true,
      /* Splitter thickness is a CSS variable in 0.10 (--flexlayout-splitter-size),
         set in flexlayout-theme.css — it is no longer a model attribute. */
      tabSetMinWidth: 140,
      tabSetMinHeight: 100,
    },
    layout: {
      type: 'row',
      weight: 100,
      children: [{ type: 'tabset', id: 'workspace-root', weight: 100, children: [] }],
    },
  }
}

/* A restored layout still gets a guard — a model this version of FlexLayout
   will not build should cost one tab layout, never the whole panel. */
function modelFor(taskId: string | null): Model {
  const saved = taskId ? taskLayout(taskId) : undefined
  if (saved) {
    try {
      return Model.fromJson(saved)
    } catch {
      /* Discard and start clean rather than take the whole panel down. */
    }
  }
  return Model.fromJson(emptyModel())
}

function countTabs(model: Model): number {
  let tabs = 0
  /* Recursive: after a split, tabsets nest inside rows, so counting only the
     root's children reports zero for a workspace that is visibly full. */
  model.visitNodes((node) => {
    if (node.getType() === 'tab') tabs++
  })
  return tabs
}

interface Props {
  pg: PlaygroundState
  scenario: Scenario | null
  taskId: string | null
  theme: 'dark' | 'light'
  /** True when the right panel is expanded — shortcuts stay dormant otherwise. */
  active: boolean
  onCollapse: () => void
  onToast: (text: string) => void
  onFile: (file: string) => void
  onEdit: (file: string, text: string) => void
}

export function TabWorkspace({
  pg, scenario, taskId, theme, active, onCollapse, onToast, onFile, onEdit,
}: Props) {
  const [model, setModel] = useState<Model>(() => modelFor(taskId))
  const lastOpened = useRef<string | null>(null)
  const prevTask = useRef(taskId)

  /* A workspace arrangement belongs to one task's artefacts. Carrying it into
     another task would restore tabs pointing at files that task never had. */
  useEffect(() => {
    if (prevTask.current === taskId) return
    prevTask.current = taskId
    lastOpened.current = null
    setModel(modelFor(taskId))
  }, [taskId])

  const handleModelChange = useCallback((changed: Model) => {
    if (taskId) saveTaskLayout(taskId, changed.toJson())
    /* Closing the last tab closes the panel — but the model stays exactly as it
       is, and the task is untouched. Reopening finds an empty workspace. */
    if (countTabs(changed) === 0) onCollapse()
  }, [taskId, onCollapse])

  /* Open-or-activate. Identity does the deduplication: the tab id IS
     `${type}:${resource}`, so asking twice for one file lands on the tab that is
     already open, and asking for a different file opens a second one. */
  const openTab = useCallback((tab: WorkspaceTab) => {
    if (model.getNodeById(tab.id)) {
      model.doAction(Actions.selectTab(tab.id))
      return
    }
    /* Never hardcode a tabset id — the one the layout shipped with is gone the
       moment the user closes or splits it. */
    const target = model.getActiveTabset() ?? model.getFirstTabSet()
    if (!target) return
    model.doAction(Actions.addNode(
      { type: 'tab', id: tab.id, name: tab.label, component: tab.id },
      target.getId(),
      DockLocation.CENTER,
      -1,
      true,
    ))
  }, [model])

  /* The scenario says "show the diff now" in its own vocabulary; this is where
     that becomes a workspace tab. Guarded on the resolved id so reopening the
     panel does not re-add a tab the user deliberately closed. */
  useEffect(() => {
    const tab = workspaceTabFor(pg.activeTab, pg, scenario, taskId)
    if (!tab || lastOpened.current === tab.id) return
    lastOpened.current = tab.id
    openTab(tab)
  }, [pg.activeTab, pg.activeFile, pg, scenario, taskId, openTab])

  /* Selecting a source tab tells the rest of the app which file is in view, so
     the copy button and the preview follow the tab bar. */
  const handleAction = useCallback((action: Action) => {
    if (action.type === Actions.SELECT_TAB) {
      const id = String(action.data?.tabNode ?? '')
      if (id.startsWith('file:')) onFile(id.slice('file:'.length))
    }
    return action
  }, [onFile])

  useWorkspaceShortcuts(model, active)

  return (
    <section aria-label="Task workspace" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center px-3 pb-2 pt-3">
        <QuickOpen pg={pg} scenario={scenario} taskId={taskId} onOpen={openTab} />
      </header>

      <div
        className="relative m-[0_12px_12px] min-h-0 flex-1 overflow-hidden rounded-[var(--r-md)]"
        style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line-soft)' }}
      >
        <Layout
          model={model}
          factory={(node: TabNode) => (
            <TabContentRegistry
              tabId={node.getComponent() ?? ''}
              scenario={scenario}
              pg={pg}
              theme={theme}
              onToast={onToast}
              onFile={onFile}
              onEdit={onEdit}
            />
          )}
          onModelChange={handleModelChange}
          onAction={handleAction}
          onTabSetPlaceHolder={() => <WorkspaceEmpty />}
          realtimeResize
        />
      </div>
    </section>
  )
}

/* Shown when every tab is closed. Names the way back rather than apologising. */
function WorkspaceEmpty() {
  return (
    <div className="grid h-full place-items-center px-8 text-center">
      <div className="max-w-[300px]">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-dim)' }}>
          No open artifacts
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: 'var(--muted-deep)' }}>
          Use <span className="mono">Open</span> above to bring the source, preview,
          tests or evidence back into the workspace.
        </p>
      </div>
    </div>
  )
}

/* §23: ONE tab bar. The artefacts used to sit in a permanent row of buttons that
   looked like tabs directly above the actual tabs — so this is a quick-open
   menu instead. It opens things; the tab strip below navigates them. Locked
   entries stay listed, because knowing the diff exists and why it is not ready
   beats it silently missing. */
function QuickOpen({ pg, scenario, taskId, onOpen }: {
  pg: PlaygroundState
  scenario: Scenario | null
  taskId: string | null
  onOpen: (tab: WorkspaceTab) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(open, root, useCallback(() => setOpen(false), []))

  const entries = openableTabs(pg, scenario, taskId)

  return (
    <div ref={root} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open an artifact"
        title="Open an artifact"
        className="press grid h-7 w-7 place-items-center rounded-[8px] transition-colors hover:bg-[var(--wash-3)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        style={{ color: open ? 'var(--text-dim)' : 'var(--muted)', background: open ? 'var(--wash-3)' : 'transparent' }}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[32px] z-50 w-[240px] overflow-hidden rounded-[10px] p-1 shadow-lg"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
        >
          {entries.map(({ tab, locked, hint }) => (
            <button
              key={tab.id}
              role="menuitem"
              disabled={locked}
              title={locked ? hint : undefined}
              onClick={() => { onOpen(tab); setOpen(false) }}
              className="press flex w-full items-baseline gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] hover:bg-[var(--glass)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ color: locked ? 'var(--muted-deep)' : 'var(--text-dim)' }}
            >
              <span className={tab.type === 'file' ? 'mono truncate text-[11.5px]' : 'truncate'}>
                {tab.label}
              </span>
              {locked && (
                <span className="ml-auto shrink-0 text-[10px]" style={{ color: 'var(--muted-deep)' }}>
                  Locked
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* Cmd/Ctrl+W and Cmd/Ctrl+Tab belong to the browser and are left alone. These
   three are the safe neighbours, and they stay dormant unless the workspace is
   actually on screen — a shortcut that fires into a collapsed panel is a
   shortcut that appears to do nothing.
   `e.code` rather than `e.key`: Shift+] only produces '}' on some layouts. */
function useWorkspaceShortcuts(model: Model, active: boolean) {
  useEffect(() => {
    if (!active) return

    const cycle = (delta: number) => {
      const tabset = model.getActiveTabset() ?? model.getFirstTabSet()
      if (!tabset) return
      const children = tabset.getChildren()
      const selected = tabset.getSelected()
      if (selected === -1 || children.length < 2) return
      const next = (selected + delta + children.length) % children.length
      model.doAction(Actions.selectTab(children[next].getId()))
    }

    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return

      if (e.altKey && e.code === 'KeyW') {
        const node = model.getActiveTabset()?.getSelectedNode()
        if (!node) return
        e.preventDefault()
        model.doAction(Actions.deleteTab(node.getId()))
        return
      }
      if (!e.shiftKey || e.altKey) return
      if (e.code === 'BracketRight') { e.preventDefault(); cycle(1) }
      else if (e.code === 'BracketLeft') { e.preventDefault(); cycle(-1) }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [model, active])
}
