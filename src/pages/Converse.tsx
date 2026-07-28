import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import CallPanel from '../components/CallPanel'
import { useLeads } from '../context/LeadsContext'
import { normalizeLead, type RawLead, type TranscriptTurn } from '../lib/leads'
import {
  realModeAvailable,
  hasPublicAgent,
  getPublicAgentId,
  fetchSignedUrl,
  MOCK_SCRIPT,
  sampleRawLead,
} from '../lib/agent'

/** Shared: normalize the raw lead from the agent, persist it, go to the summary. */
function useCaptureLead() {
  const { addLead } = useLeads()
  const nav = useNavigate()
  return useCallback(
    async (raw: RawLead, transcript: TranscriptTurn[]) => {
      const lead = normalizeLead(raw, { transcript })
      await addLead(lead)
      nav('/thank-you', { state: { lead } })
    },
    [addLead, nav],
  )
}

// ---------------- Real ElevenLabs mode ----------------

function RealConverseInner({
  transcript,
  error,
  setError,
}: {
  transcript: TranscriptTurn[]
  error: string | null
  setError: (v: string | null) => void
}) {
  const conv = useConversation()
  const [connecting, setConnecting] = useState(false)

  const start = async () => {
    setError(null)
    setConnecting(true)
    try {
      const opts = hasPublicAgent
        ? { agentId: getPublicAgentId() as string }
        : { signedUrl: await fetchSignedUrl() }
      await Promise.resolve(conv.startSession(opts))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setConnecting(false)
    }
  }

  return (
    <CallPanel
      mode="real"
      status={connecting ? 'connecting' : conv.status}
      isSpeaking={conv.isSpeaking}
      muted={conv.isMuted}
      transcript={transcript}
      error={error}
      onStart={start}
      onStop={() => conv.endSession()}
      onToggleMute={() => conv.setMuted(!conv.isMuted)}
    />
  )
}

function RealConverse() {
  const capture = useCaptureLead()
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([])
  const [error, setError] = useState<string | null>(null)
  const transcriptRef = useRef<TranscriptTurn[]>([])
  transcriptRef.current = transcript

  const clientTools = useMemo(
    () => ({
      // Agent calls this at the end of a call (or on DQ) with all collected fields.
      submit_lead: async (params: Record<string, unknown>) => {
        await capture(params as RawLead, transcriptRef.current)
        return 'Lead captured'
      },
    }),
    [capture],
  )

  const onMessage = useCallback((m: { message?: string; source?: string }) => {
    if (!m?.message) return
    setTranscript((prev) => [...prev, { role: m.source === 'user' ? 'user' : 'agent', text: m.message as string }])
  }, [])

  return (
    <ConversationProvider
      clientTools={clientTools}
      onMessage={onMessage}
      onError={(e: unknown) => setError(e instanceof Error ? e.message : String(e))}
    >
      <RealConverseInner transcript={transcript} error={error} setError={setError} />
    </ConversationProvider>
  )
}

// ---------------- Mock mode (no API key needed) ----------------

function speak(text: string, onEnd: () => void) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return onEnd()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05
    u.onend = onEnd
    synth.speak(u)
  } catch {
    onEnd()
  }
}

function MockConverse() {
  const capture = useCaptureLead()
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([])
  const [status, setStatus] = useState('disconnected')
  const [speaking, setSpeaking] = useState(false)
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    window.speechSynthesis?.cancel()
  }

  const start = () => {
    clear()
    setTranscript([])
    setStatus('connected')
    MOCK_SCRIPT.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setTranscript((prev) => [...prev, line])
        if (line.role === 'agent') {
          setSpeaking(true)
          speak(line.text, () => setSpeaking(false))
        }
      }, i * 2000)
      timers.current.push(t)
    })
  }

  const stop = () => {
    clear()
    setSpeaking(false)
    setStatus('disconnected')
  }

  const finish = async (persona: 'qualified' | 'disqualified') => {
    clear()
    setSpeaking(false)
    await capture(sampleRawLead(persona), transcript)
  }

  const devActions = (
    <>
      <button
        type="button"
        onClick={() => finish('qualified')}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400"
      >
        Finish → qualified lead
      </button>
      <button
        type="button"
        onClick={() => finish('disqualified')}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400"
      >
        Finish → disqualified lead
      </button>
    </>
  )

  return (
    <CallPanel
      mode="mock"
      status={status}
      isSpeaking={speaking}
      muted={false}
      transcript={transcript}
      onStart={start}
      onStop={stop}
      onToggleMute={() => {}}
      devActions={devActions}
    />
  )
}

export default function Converse() {
  return realModeAvailable ? <RealConverse /> : <MockConverse />
}
