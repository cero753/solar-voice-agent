import { useEffect, useRef, type ReactNode } from 'react'
import type { TranscriptTurn } from '../lib/leads'

export interface CallPanelProps {
  mode: 'real' | 'mock'
  status: string
  isSpeaking: boolean
  muted: boolean
  transcript: TranscriptTurn[]
  error?: string | null
  onStart: () => void
  onStop: () => void
  onToggleMute: () => void
  devActions?: ReactNode
}

const ACTIVE = new Set(['connected', 'connecting'])

export default function CallPanel(props: CallPanelProps) {
  const { mode, status, isSpeaking, muted, transcript, error, onStart, onStop, onToggleMute, devActions } = props
  const active = ACTIVE.has(status)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcript])

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white">Talk to our Solar Advisor</h1>
        <p className="mt-2 text-slate-400">
          Click the button, allow your microphone, and have a quick conversation about lowering your
          electricity bill. We&apos;ll see if your home qualifies and book a free evaluation.
        </p>
      </div>

      {/* Orb */}
      <button
        type="button"
        onClick={active ? onStop : onStart}
        className={[
          'relative flex h-40 w-40 items-center justify-center rounded-full text-lg font-semibold transition',
          active
            ? 'bg-red-500/90 text-white shadow-[0_0_60px_-5px] shadow-red-500/60'
            : 'bg-emerald-500 text-white shadow-[0_0_60px_-5px] shadow-emerald-500/60 hover:bg-emerald-400',
        ].join(' ')}
      >
        <span
          className={[
            'absolute inset-0 rounded-full',
            isSpeaking ? 'animate-ping bg-emerald-400/30' : '',
          ].join(' ')}
        />
        <span className="relative">{active ? 'End call' : 'Start call'}</span>
      </button>

      <div className="flex items-center gap-3 text-sm">
        <span
          className={[
            'rounded-full px-3 py-1',
            status === 'connected' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-300',
          ].join(' ')}
        >
          {status}
        </span>
        <span className="rounded-full bg-slate-700/60 px-3 py-1 text-slate-300">
          {isSpeaking ? 'Advisor speaking…' : active ? 'Listening…' : 'Idle'}
        </span>
        {active && (
          <button
            type="button"
            onClick={onToggleMute}
            className="rounded-full bg-slate-700/60 px-3 py-1 text-slate-200 hover:bg-slate-600"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-300">{mode} mode</span>
      </div>

      {error && (
        <div className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="h-72 w-full overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/60 p-4"
      >
        {transcript.length === 0 ? (
          <p className="text-center text-slate-500">The conversation transcript will appear here.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {transcript.map((t, i) => (
              <li key={i} className={t.role === 'user' ? 'text-right' : 'text-left'}>
                <span
                  className={[
                    'inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    t.role === 'user'
                      ? 'bg-indigo-500/80 text-white'
                      : 'bg-slate-700/80 text-slate-100',
                  ].join(' ')}
                >
                  <span className="mb-0.5 block text-[10px] uppercase tracking-wide opacity-60">
                    {t.role === 'user' ? 'You' : 'Advisor'}
                  </span>
                  {t.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {devActions && <div className="flex flex-wrap items-center justify-center gap-3">{devActions}</div>}
    </div>
  )
}
