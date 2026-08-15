import { useCallback, useRef, useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Task, TaskTag, Thread } from '../../state/types'
import { TAG_META, threadIdForTask } from '../../state/reducer'


import { BrandMark, IconChat, IconChevron, IconFilter, IconMoon, IconPanel, IconPinned, IconPlus, IconSearch, IconSun, IconTasks } from './icons'
import { USER } from '../../data/user'
import { useDismiss } from '../../state/useDismiss'

/* One list, not two lanes — the filter narrows it, it does not switch it. */
type Filter = 'all' | 'tasks' | 'chat'

/* Whose turn is it, descending. With the status headings gone, order is what
   replaces them — anything waiting on you is at the top, finished work sinks. */
const BY_TURN: Record<TaskTag, number> = { input: 0, blocked: 1, review: 2, working: 3, done: 4 }

/* The sidebar dot answers one question: is it moving, or is it waiting on you.
   Five colours down a narrow column is a legend to memorise; two is a glance.
   The board still carries the full state in its tags. */
const DOT: Partial<Record<TaskTag, string>> = {
  working: 'var(--done)',
  input: 'var(--warn)',
}

interface Props {
  open: boolean
  threads: Thread[]
  tasks: Task[]
  pinnedIds: string[]
  activeThreadId: string | null
  activeTaskId: string | null
  searchActive?: boolean
  tasksActive?: boolean
  onHome: () => void
  onNewChat: () => void
  onMyTasks: () => void
  onSearch: () => void
  onToggle: () => void
  onOpenThread: (thread: Thread) => void
  onOpenTask: (taskId: string) => void
  onTogglePin: (threadId: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void


}


const tipClass = 'z-[80] rounded-[7px] px-2.5 py-1.5 text-[12px] leading-none shadow-lg'

const tipStyle = {
  background: 'var(--slab-raised)',
  border: '1px solid var(--glass-line)',
  color: 'var(--text-dim)',
}

/* Tooltips only earn their keep while the labels are hidden. Once the sidebar
   is open the row says what it does, so the tip would just be noise. */
function Tip({ label, muted, children }: { label: string; muted: boolean; children: React.ReactNode }) {
  if (muted) return <>{children}</>
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={10} className={tipClass} style={tipStyle}>
          {label}
          <Tooltip.Arrow width={9} height={4} style={{ fill: 'var(--slab-raised)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function NavRow({
  label, open, onClick, active, children,
}: {
  label: string
  open: boolean
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Tip label={label} muted={open}>
      <button
        onClick={onClick}
        aria-label={label}
        aria-current={active ? 'true' : undefined}
        className="press relative flex w-full items-center gap-2 rounded-[11px] pr-2.5 text-left hover:bg-[var(--wash-3)] hover:text-[var(--text-dim)]"
        style={{
          color: active ? 'var(--text)' : 'var(--muted)',
          background: active ? 'var(--wash-4)' : 'transparent',
        }}
      >
        <span className="hit grid shrink-0 place-items-center">{children}</span>
        <span
          className="truncate text-[12.5px] transition-opacity duration-200"
          style={{ opacity: open ? 1 : 0 }}
          aria-hidden="true"
        >
          {label}
        </span>
        {active && (
          <span
            aria-hidden="true"
            className="absolute -left-[11px] top-1/2 h-[16px] w-[2px] -translate-y-1/2 rounded-full"
            style={{ background: 'var(--text)' }}
          />
        )}
      </button>
    </Tip>
  )
}

/* One row for both kinds. The leading icon is what tells a task from a chat now
   that they share a list; on a task it also carries the state colour, so the old
   separate dot column is gone. `task` is set only for task rows. */
function ThreadRow({
  thread, task, pinned, active, onOpen, onTogglePin,
}: {
  thread: Thread
  task?: Task
  pinned: boolean
  active: boolean
  onOpen: (t: Thread) => void
  onTogglePin: (id: string) => void
}) {
  return (
    <div className="group relative">
      <button
        onClick={() => onOpen(thread)}
        aria-current={active ? 'true' : undefined}
        aria-label={task ? `${thread.title} — ${TAG_META[task.tag].label}` : undefined}
        title={active ? 'Open now' : thread.when}
        className="press flex w-full items-center gap-2 rounded-[var(--r-sm)] py-[7px] pl-2.5 pr-9 text-left hover:bg-[var(--glass)]"
        style={active ? { background: 'var(--wash-4)' } : undefined}
      >
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ color: task ? DOT[task.tag] ?? 'var(--muted)' : 'var(--muted-deep)' }}
        >
          {thread.kind === 'task' ? <IconTasks size={14} /> : <IconChat size={14} />}
        </span>
        <span
          className="min-w-0 flex-1 truncate text-[12.5px] leading-tight"
          style={{ color: active ? 'var(--text)' : 'var(--text-dim)' }}
        >
          {thread.title}
        </span>
        {task?.tag === 'input' && (
          <span
            aria-hidden="true"
            className="shrink-0 rounded-full px-1.5 py-[3px] text-[9.5px] font-semibold uppercase leading-none tracking-[.07em]"
            style={{ background: TAG_META[task.tag].bg, color: TAG_META[task.tag].fg }}
          >
            Needs you
          </span>
        )}
      </button>

      {/* Pin lives on hover, the way chat apps do it — always-on pins would add
          a column of noise to every row. Focus-visible keeps it keyboard-reachable. */}
      <button
        onClick={() => onTogglePin(thread.id)}
        aria-label={pinned ? `Unpin ${thread.title}` : `Pin ${thread.title}`}
        aria-pressed={pinned}
        className={`press absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-[7px] transition-opacity hover:bg-[var(--glass-strong)] focus-visible:opacity-100 ${
          pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ color: pinned ? 'var(--brand)' : 'var(--muted-deep)' }}
      >
        <IconPinned size={14} />
      </button>
    </div>
  )
}


/* A disclosure section. `depth` only shifts the indent — Recents nests Chats and
   Tasks inside itself, and the indent is what makes that legible. */
function Section({
  label, count, open, onOpenChange, depth = 0, children,
}: {
  label: string
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  depth?: number
  children: React.ReactNode
}) {
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange}>
      <Collapsible.Trigger
        className="press group flex w-full items-center gap-1 rounded-[var(--r-sm)] py-1.5 pr-2 hover:bg-[var(--glass)]"
        style={{ paddingLeft: 6 + depth * 10, color: 'var(--muted-deep)' }}
      >
        <IconChevron
          size={14}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <span className={`truncate ${depth === 0
          ? 'text-[10px] font-semibold uppercase tracking-[.15em]'
          : 'text-[11px] font-medium uppercase tracking-[.1em]'}`}>
          {label}
        </span>
        <span className="mono ml-auto text-[10px]">{count}</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[sb-up_180ms_ease-in] data-[state=open]:animate-[sb-down_200ms_ease-out]">
        <div style={{ paddingLeft: depth * 8 }}>{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 py-2 text-[11.5px] leading-snug" style={{ color: 'var(--muted-deep)' }}>
      {children}
    </p>
  )
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'chat', label: 'Chats' },
]

/* The Recents header: the word, and the filter on the right of it. The control
   is a plain menu rather than a segmented pill because All is the resting state
   — the choice is worth one click when you want it and no width the rest of the
   time. The button stays outlined while a filter is on, so a narrowed list is
   never mistaken for an empty one. */
function RecentsHeader({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const [menu, setMenu] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const on = value !== 'all'

  useDismiss(menu, root, useCallback(() => setMenu(false), []))

  return (
    <div ref={root} className="relative flex items-center gap-2 px-2.5 py-1.5">
      <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Recents</span>

      <button
        type="button"
        aria-label={on ? `Filter recents — ${FILTERS.find((f) => f.id === value)?.label}` : 'Filter recents'}
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => setMenu((v) => !v)}
        className="press ml-auto grid h-7 w-7 place-items-center rounded-[8px] hover:bg-[var(--glass)]"
        style={{
          color: on || menu ? 'var(--brand)' : 'var(--muted)',
          boxShadow: on || menu ? '0 0 0 1px var(--brand)' : undefined,
        }}
      >
        <IconFilter size={15} />
      </button>

      {menu && (
        <div
          role="menu"
          className="absolute right-0 top-[34px] z-50 w-[132px] overflow-hidden rounded-[10px] p-1 shadow-lg"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="menuitemradio"
              aria-checked={value === f.id}
              onClick={() => { onChange(f.id); setMenu(false) }}
              className="press flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] hover:bg-[var(--glass)]"
              style={{ color: value === f.id ? 'var(--text)' : 'var(--text-dim)' }}
            >
              <span aria-hidden="true" className="w-3 shrink-0" style={{ color: 'var(--brand)' }}>
                {value === f.id ? '✓' : ''}
              </span>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function Profile({ open, theme, onToggleTheme }: { open: boolean; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const [menu, setMenu] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useDismiss(menu, root, useCallback(() => setMenu(false), []))

  return (
    <div ref={root} className="relative">
      <Tip label={`${USER.name} — account`} muted={open}>
        <button
          type="button"
          aria-label={`${USER.name} — account`}
          aria-expanded={menu}
          aria-haspopup="dialog"
          onClick={() => setMenu((v) => !v)}
          className="press flex w-full items-center gap-2.5 rounded-[11px] pr-2.5 text-left"
        >
          <span
            className="relative grid h-[var(--hit)] w-[var(--hit)] shrink-0 place-items-center rounded-full"
            style={{
              background: 'linear-gradient(145deg, rgba(255,122,198,.18), rgba(167,139,250,.14), rgba(91,157,255,.16))',
              boxShadow: menu
                ? '0 0 0 1px var(--wash-5), 0 0 0 3px rgba(167,139,250,.18)'
                : '0 0 0 1px var(--wash-5)',
            }}
          >
            <span
              className="grid h-[30px] w-[30px] place-items-center rounded-full text-[11.5px] font-semibold tracking-[-.01em]"
              style={{ background: 'var(--slab-raised)', color: 'var(--text-dim)' }}
            >
              {USER.initials}
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-[1px] right-[1px] h-[8px] w-[8px] rounded-full"
              style={{ background: 'var(--ok)', boxShadow: '0 0 0 2px var(--ground)' }}
            />
          </span>
          <span
            className="min-w-0 flex-1 transition-opacity duration-200"
            style={{ opacity: open ? 1 : 0 }}
            aria-hidden="true"
          >
            <span className="block truncate text-[12.5px] font-semibold leading-tight">{USER.name}</span>
            <span className="block truncate text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>
              {USER.role} · {USER.org}
            </span>
          </span>
        </button>
      </Tip>

      {menu && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute bottom-0 left-[calc(100%+12px)] z-[70] w-[220px] rounded-[var(--r-lg)] p-3 shadow-xl"
          style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }}
        >
          <div className="mb-2.5 flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(145deg, rgba(255,122,198,.22), rgba(91,157,255,.18))',
                color: 'var(--text)',
              }}
            >
              {USER.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-tight">{USER.name}</p>
              <p className="truncate text-[11.5px] leading-tight" style={{ color: 'var(--muted)' }}>
                {USER.role} · {USER.org}
              </p>
            </div>
          </div>
          <div
            className="rounded-[var(--r-sm)] px-2.5 py-2 text-[11.5px] leading-snug"
            style={{ background: 'var(--glass)', color: 'var(--muted)' }}
          >
            Signed in · {USER.org} workspace
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="press mt-2 flex w-full items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-2 text-left text-[11.5px] transition-colors hover:bg-[var(--glass)]"
            style={{ color: 'var(--muted)' }}
          >
            <span className="grid h-[18px] w-[18px] place-items-center" style={{ color: 'var(--text-dim)' }}>
              {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
            </span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* One sidebar, two widths, one list. Open it is brand, the three primary
   actions, Pinned — which holds whatever you pinned, task or chat — and then
   Recents: tasks and chats interleaved newest-first, told apart by the leading
   icon, narrowed by the filter pill above them.
   Collapsed it is the icon rail, and the main column takes the width back. */
export function Sidebar({
  open, threads, tasks, pinnedIds, activeThreadId, activeTaskId, searchActive, tasksActive,
  onHome, onNewChat, onMyTasks, onSearch, onToggle, onOpenThread, onOpenTask, onTogglePin,

  theme, onToggleTheme,
}: Props) {

  /* Which filter and which sections are expanded is the user's own arrangement
     of the panel, and the sidebar never unmounts, so it holds here rather than
     in journey state. */
  const [filter, setFilter] = useState<Filter>('all')
  const [pinnedOpen, setPinnedOpen] = useState(true)

  const taskById = new Map(tasks.map((t) => [t.id, t]))

  /* `threads` is already the timeline — the reducer unshifts a task's thread the
     moment it is opened. A task you have never opened has no thread yet, so it
     gets a stand-in row so the list is the full picture, ordered by whose turn
     it is and sitting under the real history. */
  const unopened: Thread[] = tasks
    .filter((t) => !threads.some((th) => th.id === threadIdForTask(t.id)))
    .sort((a, b) => BY_TURN[a.tag] - BY_TURN[b.tag])
    .map((t) => ({
      id: threadIdForTask(t.id),
      kind: 'task',
      taskId: t.id,
      title: t.title,
      when: TAG_META[t.tag].label,
    }))

  const all = [...threads, ...unopened]
  const pinned = all.filter((t) => pinnedIds.includes(t.id))
  const recents = all
    .filter((t) => !pinnedIds.includes(t.id))
    .filter((t) => filter === 'all' || (filter === 'tasks' ? t.kind === 'task' : t.kind === 'chat'))

  // A task row reopens the task, not the parked thread — that is what restores
  // the split view and its playground.
  const open_ = (t: Thread) => (t.taskId ? onOpenTask(t.taskId) : onOpenThread(t))

  const rows = (list: Thread[], empty: string) =>
    list.length === 0 ? <Empty>{empty}</Empty> : (
      /* minmax(0,1fr): grid items default to min-width:auto, so a long title
         would blow the column past the sidebar and defeat truncate. */
      <div className="grid grid-cols-[minmax(0,1fr)] gap-0.5 px-0.5">
        {list.map((t) => (
          <ThreadRow
            key={t.id}
            thread={t}
            task={t.taskId ? taskById.get(t.taskId) : undefined}
            pinned={pinnedIds.includes(t.id)}
            active={t.taskId ? t.taskId === activeTaskId : t.id === activeThreadId}
            onOpen={open_}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    )

  return (
    <Tooltip.Provider delayDuration={320} skipDelayDuration={140}>
      <nav
        aria-label="Primary"
        /* No width transition here: react-resizable-panels owns the geometry
           and a CSS transition on width fights it during a drag (§19). */
        className="h-full shrink-0 overflow-hidden backdrop-blur-[14px]"
        style={{
          width: '100%',
          background: 'var(--wash-1)',
          borderRight: '1px solid var(--glass-line-soft)',
        }}
      >
        <style>{`
          @keyframes sb-down { from { height: 0 } to { height: var(--radix-collapsible-content-height) } }
          @keyframes sb-up   { from { height: var(--radix-collapsible-content-height) } to { height: 0 } }
        `}</style>

        {/* Fixed inner width so nothing reflows mid-transition — the nav clips it. */}
        <div className="flex h-full w-[var(--sidebar-w)] flex-col px-[15px] py-4">
          <div className="mb-3 flex items-center gap-2">
            <Tip label="AAVA home" muted={open}>
              {/* No tile behind the mark: the logo is already a disc, and a rounded
                  square around it reads as a badge on a badge. */}
              <button
                onClick={onHome}
                aria-label="AAVA home"
                className="press hit grid shrink-0 place-items-center rounded-full transition-shadow hover:shadow-[0_0_0_3px_var(--wash-5)]"
              >
                <BrandMark size={30} />
              </button>
            </Tip>




















            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              aria-expanded={open}
              tabIndex={open ? 0 : -1}
              className="press ml-auto grid h-7 w-7 place-items-center rounded-[7px] transition-opacity duration-200 hover:bg-[var(--glass)]"
              style={{ color: 'var(--muted)', opacity: open ? 1 : 0 }}
            >
              <IconPanel size={16} />
            </button>
          </div>

          <div className="grid gap-1.5">
            {!open && (
              <NavRow label="Expand sidebar" open={open} onClick={onToggle}>
                <IconPanel />
              </NavRow>
            )}
            <NavRow label="New Session" open={open} onClick={onNewChat}>
              <IconPlus />
            </NavRow>
            <NavRow label="My Tasks" open={open} onClick={onMyTasks} active={tasksActive}>
              <IconTasks />
            </NavRow>
            <NavRow label="Search" open={open} onClick={onSearch} active={searchActive}>
              <IconSearch />
            </NavRow>
          </div>

          {/* Lists only exist in the open state — a 70px rail cannot show a title,
              and a column of anonymous dots is worse than nothing. */}
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            {/* Pinned sits above Recents and holds whatever you pinned, task or
                chat. Capped, so a long pin list cannot squeeze Recents out. */}
            {open && (
              <div className="max-h-[40%] shrink-0 overflow-y-auto">
                <Section label="Pinned" count={pinned.length} open={pinnedOpen} onOpenChange={setPinnedOpen}>
                  {rows(pinned, 'Nothing pinned yet — hover a task or a chat and hit the pin.')}
                </Section>
              </div>
            )}

            {/* The header sits directly on top of the list it names and narrows. */}
            {open && (
              <div className="shrink-0 pt-1">
                <RecentsHeader value={filter} onChange={setFilter} />
              </div>
            )}

            {open && (
              <div className="min-h-0 flex-1 overflow-y-auto pb-2">
                {rows(
                  recents,
                  filter === 'tasks' ? 'No tasks assigned to you.'
                    : filter === 'chat' ? 'No chats yet — ask something to start one.'
                      : 'Nothing here yet — ask something to start.',
                )}
              </div>
            )}
          </div>

          <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>
            <div className="pt-3">

              <Profile open={open} theme={theme} onToggleTheme={onToggleTheme} />
            </div>
          </div>
        </div>
      </nav>
    </Tooltip.Provider>
  )
}
