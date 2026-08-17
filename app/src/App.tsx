import { useEffect, useState } from 'react'
import { IconBell, IconMoon, IconSun } from './components/chrome/icons'
import { AnimatePresence } from 'motion/react'
import { AmbientField } from './components/ambient/AmbientField'
import { Sidebar } from './components/chrome/Sidebar'
import { WorkspaceShell } from './components/layout/WorkspaceShell'

import { Composer } from './components/chrome/Composer'
import { StartView } from './components/start/StartView'
import { ConversationView } from './components/chat/ConversationView'
import { PrepList } from './components/chat/PrepList'
import { TabWorkspace } from './components/playground/TabWorkspace'
import { TasksView } from './components/tasks/TasksView'
import { Notifications } from './components/overlays/Notifications'
import { Search } from './components/overlays/Search'
import { Toast } from './components/overlays/Toast'
import { useJourney } from './state/useJourney'
import { useTheme } from './state/useTheme'

/* The two chips in the corner are the same object twice — one shape, one hit
   size — so they read as a pair rather than as two unrelated buttons. */
const CORNER_BTN = 'press relative grid h-[34px] w-[34px] place-items-center rounded-[9px] transition-colors hover:bg-[var(--wash-4)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]'
const CORNER_STYLE = { color: 'var(--muted)', background: 'var(--glass)', border: '1px solid var(--glass-line)' }

export default function App() {
  const j = useJourney()
  const { theme, toggle: toggleTheme } = useTheme()
  /* The draft lives here, above the arrangements. The composer renders inside
     whichever column it belongs to, so it remounts when the arrangement
     changes — holding the text here makes that remount invisible. */
  const [draft, setDraft] = useState('')

  const composerFor = () => (
    <Composer onSend={j.send} value={draft} onChange={setDraft} />
  )

  /* Escape unwinds one layer at a time, cheapest first. Closing the workspace
     comes before leaving the task, because leaving the task throws the run
     away and Escape should not be able to do that by surprise. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (j.state.overlay !== 'none') { j.setOverlay('none'); return }
      if (j.state.arrangement === 'tasks') { j.closeTasks(); return }
      if (j.state.activeTaskId && j.state.playground.panelOpen) { j.setPanelOpen(false); return }
      if (j.state.arrangement === 'split') j.closePlayground()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    /* `j` is a new object every render, so depending on it would resubscribe on
       every keystroke. Every value the handler READS is listed instead. */
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [j.state.overlay, j.state.arrangement, j.state.activeTaskId, j.state.playground.panelOpen])

  const prep = j.scenario ? <PrepList steps={j.scenario.prep} onOpenEvidence={j.focusEvidence} /> : null

  /* An offered new thread replaces the task chips — it is the only thing worth
     answering while the question is parked. */
  const stageChips = j.scenario && j.state.chipStage
    ? j.scenario.chips[j.state.chipStage] ?? []
    : []

  /* A chip you have already taken does not come back. Read off the thread's own
     user messages rather than a separate "used" list, so it costs no state and
     parking a thread carries the answered chips with it. */
  const asked = new Set(
    j.state.messages.filter((m) => m.from === 'user').map((m) => m.lines.join(' ')),
  )

  const chips = j.state.pendingTopic
    ? [{ label: 'Start a new thread', sends: 'alright' }]
    : stageChips.filter((c) => !asked.has(c.sends))

  const inTask = !!j.state.activeTaskId
    && (j.state.arrangement === 'conversation' || j.state.arrangement === 'split')

  return (
    <>
      <AmbientField />
      <div className="relative z-10 h-full">
        <WorkspaceShell
          sidebarOpen={j.state.sidebarOpen}
          rightOpen={j.state.playground.panelOpen}
          onSidebarOpenChange={j.setSidebarOpen}
          onRightOpenChange={j.setPanelOpen}
          sidebar={
            <Sidebar
              open={j.state.sidebarOpen}
              threads={j.state.threads}
              tasks={j.state.tasks}
              pinnedIds={j.state.pinnedThreadIds}
              activeThreadId={j.state.activeThreadId}
              activeTaskId={j.state.activeTaskId}
              searchActive={j.state.overlay === 'search'}
              tasksActive={j.state.arrangement === 'tasks'}
              onHome={j.goHome}
              onNewChat={j.goHome}
              onMyTasks={j.showTasks}
              onSearch={() => j.setOverlay('search')}
              onToggle={() => j.setSidebarOpen(!j.state.sidebarOpen)}
              onTogglePin={j.togglePinThread}
              onOpenThread={j.openThread}
              onOpenTask={j.openTask}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
          main={
            <main className="relative min-h-0 flex-1 overflow-y-auto">
              {/* Theme switch and notification bell — the home screen only.
                  Inside a task the top-right corner belongs to the workspace,
                  and an inbox is a standing invitation to leave the thing you
                  just opened. The account menu keeps its own theme entry for
                  the screens this corner does not appear on. */}
              {j.state.arrangement === 'start' && (
                <div className="absolute right-4 top-4 z-[60] flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    onClick={toggleTheme}
                    className={CORNER_BTN}
                    style={CORNER_STYLE}
                  >
                    {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
                  </button>
                  <button
                    type="button"
                    aria-label="Notifications"
                    onClick={() => j.setOverlay(j.state.overlay === 'notifications' ? 'none' : 'notifications')}
                    className={CORNER_BTN}
                    style={CORNER_STYLE}
                  >
                    <IconBell size={15} />
                    {!!j.unreadCount && (
                      <span
                        aria-hidden="true"
                        className="absolute right-[6px] top-[6px] h-[6px] w-[6px] rounded-full"
                        style={{ background: 'var(--danger)', boxShadow: '0 0 0 2px var(--slab)' }}
                      />
                    )}
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {j.state.arrangement === 'start' && (
                  <StartView key="start" tasks={j.state.tasks} onOpenTask={j.openTask}
                    onViewAllTasks={j.showTasks}
                    composer={composerFor()} />
                )}
                {j.state.arrangement === 'tasks' && (
                  <TasksView key="tasks" tasks={j.state.tasks} onOpenTask={j.openTask} />
                )}
                {(j.state.arrangement === 'conversation' || j.state.arrangement === 'split') && (
                  <ConversationView
                    key="conversation"
                    state={j.state}
                    chips={chips}
                    prep={prep}
                    onChip={j.send}
                    onAccept={j.runBeat}
                    onDismiss={j.dismissBlock}
                    onOpenFile={j.openFile}
                    onToggleContext={j.toggleContext}
                    onTogglePanel={j.togglePanel}
                    composer={composerFor()}
                  />
                )}
              </AnimatePresence>
            </main>
          }
          /* Mounted for the whole life of the task, not just while visible —
             collapsing the panel must not take the tab layout with it. */
          right={inTask ? (
            <TabWorkspace
              pg={j.state.playground}
              scenario={j.scenario}
              taskId={j.state.activeTaskId}
              theme={theme}
              active={j.state.playground.panelOpen}
              onCollapse={() => j.setPanelOpen(false)}
              onToast={j.toast}
              onFile={j.setFile}
              onEdit={j.editFile}
            />
          ) : undefined}
        />
      </div>

      <Notifications
        open={j.state.overlay === 'notifications'}
        items={j.notifications}
        onClose={() => j.setOverlay('none')}
        onOpen={(item) => {
          j.readNotification(item.openTaskId)
          j.setOverlay('none')
          j.openTask(item.openTaskId)
        }}
      />
      <Search
        open={j.state.overlay === 'search'}
        hits={j.searchHits}
        onClose={() => j.setOverlay('none')}
        onSelect={(hit) => {
          j.setOverlay('none')
          if (hit.taskId) j.openTask(hit.taskId)
          else if (hit.thread) j.openThread(hit.thread)
        }}
      />
      <Toast text={j.state.toast} />
    </>
  )
}
