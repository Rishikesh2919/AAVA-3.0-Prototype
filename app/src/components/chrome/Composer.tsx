import { useRef } from 'react'

interface Props {
  onSend: (text: string) => void
  /* The draft lives in the parent. The composer now sits inside whichever
     column it belongs to, so it remounts when the arrangement changes — with
     the value held here, that remount is invisible and nothing typed is lost. */
  value: string
  onChange: (v: string) => void
  /** Wrapper classes, so each arrangement can align it to its own column. */
  className?: string
  placeholder?: string
  /** Sits directly under the task-progress panel and shares its edge — no gap,
      no second border, square across the join. */
  joined?: boolean
}

export function Composer({
  onSend, value, onChange, className = '', joined = false,
  placeholder = 'Ask AAVA anything…',
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    onChange('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div className={`w-full ${joined ? '' : 'pb-7 pt-2'} ${className}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="rounded-[var(--r-lg)] px-4 pb-3 pt-3.5 backdrop-blur-[24px]"
        style={{
          /* Joined, this is a card ON the progress surface: flat neutral against
             its wash, curved on every corner, no outline of its own — the wrapper
             already draws one around the pair. Free-standing, it stays glass. */
          background: joined ? 'var(--slab)' : 'var(--glass-strong)',
          border: joined ? 'none' : '1px solid var(--glass-line)',
          boxShadow: joined ? 'none' : 'var(--shadow-composer)',
        }}
      >
        <label htmlFor="prompt" className="sr-only">Message AAVA</label>
        <textarea
          id="prompt" ref={ref} rows={1} value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          className="max-h-[168px] w-full resize-none bg-transparent text-[14px] placeholder:text-[var(--muted)] focus-visible:outline-none"
        />

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="submit" disabled={!value.trim()} aria-label="Send message"
            className="press hit grid place-items-center rounded-full disabled:opacity-35 disabled:active:transform-none"
            style={{ background: 'var(--primary-grad)', color: '#fff' }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path d="M12 19V5.5M12 5.5 6 11.5M12 5.5l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
