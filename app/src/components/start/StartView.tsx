import { motion } from 'motion/react'
import type { Task } from '../../state/types'
import { Hero } from './Hero'
import { TaskCard } from './TaskCard'
import { fadeUp } from '../../design/motion'

interface Props {
  tasks: Task[]
  onOpenTask: (id: string) => void
  onViewAllTasks: () => void
  composer: React.ReactNode
}

export function StartView({ tasks, onOpenTask, onViewAllTasks, composer }: Props) {
  return (
    <motion.div
      {...fadeUp(8)}
      className="mx-auto flex min-h-full w-full max-w-[1080px] flex-col justify-center px-8 pb-10 sm:px-10"
    >
      <Hero />

      {/* The full board lives one click away, next to the three it's surfacing —
          not behind an icon in the chrome. */}
      <div className="mb-3 flex justify-end">
        <button
          onClick={onViewAllTasks}
          className="press group flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] hover:bg-[var(--glass)]"
          style={{ color: 'var(--muted)' }}
        >
          View all my tasks
          <svg
            viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
            strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-[2px]"
          >
            <path d="m9.5 5 6.5 7-6.5 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
        {tasks.slice(0, 3).map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
      </div>

      {/* Same max-width and padding as the grid above, so the composer's edges
          line up with the outer edges of the first and last card. */}
      <div className="mt-14">{composer}</div>
    </motion.div>
  )
}
