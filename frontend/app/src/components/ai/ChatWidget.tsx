import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, MessageSquare, Send, X, ChevronDown } from 'lucide-react'
import { streamChat, type ChatMessage, type ChatNavSuggestion } from '@/api/ai'

const WELCOME = `Hi! I'm your Teapots AI assistant. I can help you with:

• Checking invoice and order summaries
• Finding specific invoices or orders
• Explaining PEPPOL / UBL concepts
• Answering questions about your data

How can I help you today?`

type UiMessage = ChatMessage & { pending?: boolean; navigation?: ChatNavSuggestion[] }

function isOnRoute(pathname: string, to: string): boolean {
  if (pathname === to) return true
  if (to === '/') return false
  return pathname.startsWith(`${to}/`)
}

function Bubble({
  msg,
  pathname,
  onGoTo,
}: {
  msg: UiMessage
  pathname: string
  onGoTo: (to: string) => void
}) {
  const isUser = msg.role === 'user'
  const navItems =
    !isUser && msg.navigation?.length
      ? msg.navigation.filter((n) => !isOnRoute(pathname, n.to))
      : []

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Bot className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
      )}
      <div className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={[
            'rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'rounded-tr-sm bg-amber-400 text-slate-900'
              : 'rounded-tl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
            msg.pending ? 'animate-pulse opacity-70' : '',
          ].join(' ')}
        >
          {msg.content || (msg.pending ? '…' : '')}
        </div>
        {navItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-0.5">
            {navItems.map((n) => (
              <button
                key={n.to}
                type="button"
                onClick={() => onGoTo(n.to)}
                className="rounded-lg border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-950 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50"
              >
                Go to {n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatWidget() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingContentRef = useRef('')

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    setInput('')
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setStreaming(true)
    streamingContentRef.current = ''

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    await streamChat(
      nextMessages,
      (chunk) => {
        streamingContentRef.current += chunk
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: streamingContentRef.current,
            navigation: last?.navigation,
          }
          return copy
        })
      },
      () => {
        setStreaming(false)
      },
      (err) => {
        setStreaming(false)
        setError(err.message)
        setMessages((prev) => prev.slice(0, -1))
      },
      (items) => {
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = {
              ...last,
              navigation: items,
            }
          }
          return copy
        })
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    setInput('')
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        onClick={() => setOpen((v) => !v)}
        className={[
          'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all',
          'bg-amber-400 text-slate-900 hover:bg-amber-500',
          'md:bottom-8 md:right-8',
          open ? 'rotate-0' : '',
        ].join(' ')}
      >
        {open ? <ChevronDown className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={[
            'fixed bottom-22 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col',
            'overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-2xl',
            'dark:border-amber-800/40 dark:bg-slate-900',
            'md:bottom-24 md:right-8',
          ].join(' ')}
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Bot className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Teapots AI</p>
                <p className="text-xs text-muted-foreground">Ask about your invoices &amp; orders</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-amber-100 hover:text-foreground dark:hover:bg-amber-900/40"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-amber-100 hover:text-foreground dark:hover:bg-amber-900/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Message list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <Bubble
                msg={{ role: 'assistant', content: WELCOME }}
                pathname={pathname}
                onGoTo={(to) => {
                  navigate(to)
                  setOpen(false)
                }}
              />
            )}
            {messages.map((m, i) => (
              <Bubble
                key={i}
                msg={m}
                pathname={pathname}
                onGoTo={(to) => {
                  navigate(to)
                  setOpen(false)
                }}
              />
            ))}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-amber-100 bg-white p-3 dark:border-amber-900/40 dark:bg-slate-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                disabled={streaming}
                rows={1}
                className={[
                  'flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400',
                  'disabled:opacity-60',
                  'max-h-24 overflow-y-auto',
                ].join(' ')}
                style={{ lineHeight: '1.5' }}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || streaming}
                aria-label="Send message"
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  input.trim() && !streaming
                    ? 'bg-amber-400 text-slate-900 hover:bg-amber-500'
                    : 'cursor-not-allowed bg-amber-100 text-amber-300 dark:bg-amber-900/30 dark:text-amber-700',
                ].join(' ')}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  )
}
