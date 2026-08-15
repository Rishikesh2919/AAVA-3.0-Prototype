import { useEffect, useRef } from 'react'
import type { Chip, Message as Msg } from '../../state/types'
import { Message } from './Message'
import { Chips } from './Chips'

interface Props {
  messages: Msg[]
  chips: Chip[]
  prep: React.ReactNode
  onChip: (sends: string) => void
  onAccept: (beat: string) => void
  onDismiss: (id: string) => void
  onOpenFile?: (file: string) => void
}

export function Thread({ messages, chips, prep, onChip, onAccept, onDismiss, onOpenFile }: Props) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [messages])

  return (
    <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-col">
      {messages.map((m) => (
        <Message key={m.id} msg={m} prep={prep} onAccept={onAccept} onDismiss={onDismiss}
          onOpenFile={onOpenFile} />
      ))}
      <Chips chips={chips} onPick={onChip} />
      <div ref={end} />
    </div>
  )
}
