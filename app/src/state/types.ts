/** `tasks` is the board on the main screen — it used to be a drawer overlay. */
export type Arrangement = 'start' | 'conversation' | 'split' | 'tasks'
export type TaskStatus = 'wip' | 'clarify' | 'pending' | 'done'
export type TabId = 'evidence' | 'preview' | 'code' | 'tests' | 'diff'
export type RunKind = 'prep' | 'live' | 'shipped'

/* The five states a task can be in, as the user experiences them.
 * `status` groups tasks into board columns (whose turn is it); `tag` says
 * precisely WHY. Three tasks can all need you for three different reasons. */
export type TaskTag = 'review' | 'input' | 'blocked' | 'working' | 'done'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  tag: TaskTag
  est: string
  dep: string
  recommended?: boolean
  /** Second status line. Under 10 words — a specific observation, not a label. */
  note: string
  /** When the task last moved. Relative, because nothing here has a real clock. */
  updated: string
  /** What AAVA opens with when this task is picked up. */
  opening: string[]
  context: TaskContext
}

export interface Thread {
  /** Stable identity — pinning needs something to key on. */
  id: string
  kind: 'chat' | 'task'
  title: string
  when: string
  /** Set on task threads, so the sidebar can reopen a task that was never parked. */
  taskId?: string
}

export interface CoverageGroup {
  title: string
  items: string[]
  tone?: 'assumed'
}

export interface ConfirmRow {
  repo: string
  branch: string
  what: string
}

/** One tool call AAVA makes while answering — shown resolving in real time. */
export interface ToolStep {
  label: string
  source: string
  result: string
  /** How long this call takes, from `T` in state/timing.ts. */
  ms: number
}

export type BlockSpec =
  | { kind: 'prep' }
  | { kind: 'coverage'; groups: CoverageGroup[] }
  | { kind: 'confirm'; rows: ConfirmRow[]; acceptLabel: string; cancelLabel: string; acceptBeat: string }
  /** `file` makes a link openable — it opens that source file in the workspace.
      Without one the link is a flat reference (a raised PR, say). */
  | { kind: 'links'; links: { label: string; file?: string }[] }
  | { kind: 'tools'; steps: ToolStep[]; done: number }
  /** The thing that was just generated, with a way in. Open puts the preview
      tab in front — the same artefact the workspace already renders. */
  | { kind: 'app'; name: string; status: string }

export interface Message {
  id: string
  from: 'user' | 'aava'
  lines: string[]
  block?: BlockSpec
  typing?: boolean
  /** Set false once the confirm block has been accepted or dismissed. */
  live?: boolean
  /** True while the text is still revealing, so it streams once and never re-streams. */
  stream?: boolean
}

export type Effect =
  | { type: 'say'; lines: string[]; block?: BlockSpec; stream?: boolean }
  /** Show tool calls resolving one by one before the answer arrives. */
  | { type: 'tools'; steps: ToolStep[] }
  /** Advance the newest tools block to `done` completed steps. */
  | { type: 'toolProgress'; done: number }
  | { type: 'showTab'; tab: TabId }
  | { type: 'enableTab'; tab: TabId; badge?: number }
  | { type: 'runState'; kind: RunKind; label: string }
  | { type: 'codeVersion'; file: string; version: number }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'chips'; stage: string }
  | { type: 'wait'; ms: number }

export interface PrepStep {
  key: string
  label: string
  result: string
  detail: string
  pending?: boolean
  
}

export interface EvidenceBlock {
  name: string
  source: string
  /** Rendered by Evidence.tsx. `figma` gets the SVG frame treatment. */
  body: { kind: 'kv'; pairs: [string, string][] }
      | { kind: 'text'; text: string }
      | { kind: 'columns'; found: string[]; missing: string[]; lead: string }
      | { kind: 'figma'; caption: string }
}

export interface DiffGroup {
  repo: string
  branch: string
  files: string[]
  lines?: { tone: 'ctx' | 'del' | 'add'; text: string }[]
}

export interface Chip { label: string; sends: string }

/* Everything the task-context pane shows, grouped the way it renders.
 *
 * Most sections are optional on purpose. A task AAVA has barely started has
 * almost nothing to show, and that emptiness is information — it says exactly
 * how far it got before it stopped. A pane that always looked full would be
 * lying about the ones that are blocked. */
export interface TaskContext {
  ticket: string
  ticketSource: string
  description: string
  /** `note` explains an unmet criterion — why, not just that. */
  criteria: { text: string; met: boolean; note?: string }[]
  capabilities?: string[]
  related?: { id: string; title: string }[]
  connected?: {
    kind: 'file' | 'design' | 'api' | 'git'
    label: string
    source: string
    /** Reached for and refused — shown struck through, in danger. */
    denied?: boolean
  }[]
  run: {
    agent: string
    golden: boolean
    certified?: string
    accepts?: number
    branch?: string
    tokens?: string
    cost?: string
    /** Why the run stopped short of finishing, when it did. */
    halted?: string
  }
}

export interface Scenario {
  prep: PrepStep[]
  evidence: Record<string, EvidenceBlock>
  files: Record<string, { versions: string[] }>
  fileOrder: string[]
  tests: { specs: string[]; coveragePct: number; gatePct: number }
  diff: DiffGroup[]
  beats: Record<string, Effect[]>
  router: { match: RegExp; beat: string }[]
  chips: Record<string, Chip[]>
  fallback: string[]
}

export interface PlaygroundState {
  taskId: string | null
  activeTab: TabId
  enabledTabs: TabId[]
  runState: { kind: RunKind; label: string }
  focusedEvidence: string | null
  fileVersions: Record<string, number>
  /** What the user typed in the editor, per file. Overrides the scripted
   *  version for that file — the preview reads from here too. */
  edits: Record<string, string>
  activeFile: string | null
  diffBadge: number | null
  /** Task-context pane. Collapsed by default so the default split is unchanged. */
  contextOpen: boolean
  /** Artefact panel. Collapses to a spine rather than disappearing. */
  panelOpen: boolean
  /** Bumped every time something explicitly asks for a tab — a beat, a link, the
   *  Open button. The workspace opens on the change, so asking twice for the same
   *  tab works even after the user closed it. Incidental re-renders do not bump,
   *  which is what keeps a closed tab closed. */
  openRequest: number
}

/** Everything that makes a thread itself, parked while you work in another one. */
export interface ThreadSnapshot {
  arrangement: Arrangement
  activeTaskId: string | null
  messages: Message[]
  playground: PlaygroundState
  chipStage: string | null
}

export type Overlay =
  | 'none'
  | 'notifications'
  | 'search'

export interface AppState {
  arrangement: Arrangement
  activeTaskId: string | null
  tasks: Task[]
  messages: Message[]
  threads: Thread[]
  playground: PlaygroundState
  toast: string | null
  overlay: Overlay
  /** Unread count for the topbar bell. Cleared when the notifications panel opens. */
  /** Task ids whose notification has been opened. Everything else reads as new. */
  readNotifications: string[]
  chipStage: string | null
  /** Sidebar. Open by default; collapses to an icon rail and pushes content back. */
  sidebarOpen: boolean
  /** Ids of threads the user pinned to the top of the sidebar. */
  pinnedThreadIds: string[]
  /** Which thread the conversation on screen belongs to. */
  activeThreadId: string | null
  /** Parked threads, by id. Leaving a thread never throws its state away. */
  stashed: Record<string, ThreadSnapshot>
  /** An off-topic question waiting on "yes, start a new thread". */
  pendingTopic: string | null
}

export type Action =
  | { type: 'GO_HOME' }
  /** My Tasks — the board, as a destination. Leaves the live thread untouched. */
  | { type: 'SHOW_TASKS' }
  /** Back off the board, into whatever was underneath it. */
  | { type: 'CLOSE_TASKS' }
  | { type: 'USER_SAY'; text: string }
  | { type: 'TYPING' }
  | { type: 'OPEN_TASK'; taskId: string; scenario: Scenario | null }
  | { type: 'CLOSE_PLAYGROUND' }
  | { type: 'APPLY'; effect: Effect }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_FILE'; file: string }
  | { type: 'EDIT_FILE'; file: string; text: string }
  | { type: 'FOCUS_EVIDENCE'; key: string }
  | { type: 'DISMISS_BLOCK'; messageId: string }
  | { type: 'OVERLAY'; overlay: Overlay }
  | { type: 'READ_NOTIFICATION'; taskId: string }
  | { type: 'TOAST'; text: string | null }
  | { type: 'TOGGLE_CONTEXT' }
  | { type: 'TOGGLE_PANEL' }
  /** Explicit set, for the panel library reporting geometry back as intent. */
  | { type: 'SET_PANEL_OPEN'; open: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'TOGGLE_PIN_THREAD'; threadId: string }
  /** Off-topic question parked until the user accepts a new thread. */
  | { type: 'PENDING_TOPIC'; text: string | null }
  /** Park the current thread, open a fresh chat carrying `text`. */
  | { type: 'NEW_THREAD'; text: string }
  | { type: 'RESUME_THREAD'; threadId: string }
