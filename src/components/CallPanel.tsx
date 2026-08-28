import { useEffect, useRef, type ReactNode } from 'react'
import type { TranscriptTurn } from '../lib/leads'
import { SCRIPT_STAGES } from '../lib/agent'

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
        <h1 className="text-3xl font-semibold text-white">Solar Consultation Call</h1>
        <p className="mt-2 text-slate-400">
          Click the button and allow your microphone. Alex runs the full consultation script — checks
          whether your home qualifies for the SGIP program and books a free engineer evaluation.
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

      {/* The script the advisor is working through, so you can follow along live. */}
      <section className="w-full">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          What the advisor covers
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {SCRIPT_STAGES.map((s, i) => (
            <li
              key={s.title}
              className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-100">
                {i + 1}. {s.title}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">{s.detail}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Alex is an AI voice assistant and will tell you so if you ask. It never asks for a Social
          Security number, bank or card details — credit is self-reported only. Say &ldquo;take me off
          your list&rdquo; at any point and the call ends immediately.
        </p>
      </section>
    </div>
  )
}
