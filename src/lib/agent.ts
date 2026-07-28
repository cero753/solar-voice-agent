// Agent wiring: real ElevenLabs config + a scripted mock so the UI is demoable
// before/without a working API key. See docs/TECH.md.
import type { RawLead, TranscriptTurn } from './leads'

const PUBLIC_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined

// Real mode is available when we can start a session: either a public agent id is
// exposed to the client, or a signed-url backend endpoint exists (checked at runtime).
export const hasPublicAgent = Boolean(PUBLIC_AGENT_ID)

export function getPublicAgentId(): string | undefined {
  return PUBLIC_AGENT_ID
}

// Use the signed-url backend when explicitly enabled (agent is private).
export const signedUrlMode = import.meta.env.VITE_USE_SIGNED_URL === 'true'

// Real voice mode is available once an agent is reachable one way or another.
// Until then the app runs the scripted mock so it's always demoable.
export const realModeAvailable = hasPublicAgent || signedUrlMode

/** Fetch a short-lived signed WebSocket URL from our Netlify function (keeps the API key server-side). */
export async function fetchSignedUrl(): Promise<string> {
  const res = await fetch('/api/signed-url')
  if (!res.ok) throw new Error(`signed-url endpoint returned ${res.status}`)
  const data = (await res.json()) as { signedUrl?: string }
  if (!data.signedUrl) throw new Error('signed-url endpoint did not return a signedUrl')
  return data.signedUrl
}

// ---- Mock conversation (used when no agent is configured) ----------------------

export interface MockLine {
  role: TranscriptTurn['role']
  text: string
}

// Condensed version of the 8-stage script (docs/CONTEXT.md) for the mock playthrough.
export const MOCK_SCRIPT: MockLine[] = [
  { role: 'agent', text: "Hi, is this the homeowner? This is Alex — we're working right in your neighborhood this week." },
  { role: 'user', text: 'Yeah, this is me.' },
  { role: 'agent', text: "Great. We're helping a few neighbors look at rising electricity rates and whether their home may qualify for the SGIP savings program. Mind if I ask a couple quick questions?" },
  { role: 'user', text: 'Sure, go ahead.' },
  { role: 'agent', text: 'Roughly, is your monthly electric bill above $150?' },
  { role: 'user', text: "Yeah, it's around $240." },
  { role: 'agent', text: 'And is this a single-family home that you own?' },
  { role: 'user', text: 'Yes, we own it.' },
  { role: 'agent', text: "Perfect. The program may reduce that bill significantly with no cost to look. Let's get an engineer out to evaluate — does a weekday afternoon work?" },
  { role: 'user', text: 'Thursday afternoon works.' },
  { role: 'agent', text: "You're all set. I'll capture your details and send a confirmation. Thanks so much!" },
]

export function sampleRawLead(persona: 'qualified' | 'disqualified'): RawLead {
  if (persona === 'disqualified') {
    return {
      name: 'Sam Rivera',
      phone: '(555) 233-9910',
      email: 'sam.rivera@example.com',
      address: '88 Maple Ct, Unit 4, Fresno, CA',
      monthlyBill: 65,
      homeType: 'condo',
      ownsRoof: 'no',
      creditAbove650: 'unsure',
      shading: 'Shared roof, N/A',
      utilityProvider: 'PG&E',
      decisionMakers: 'Self',
      appointmentDateTime: '',
      appointmentType: '',
      languageBookedIn: 'English',
      notes: 'Condo, does not own roof and low bill — not eligible.',
    }
  }
  return {
    name: 'Jordan Blake',
    phone: '(555) 771-4820',
    email: 'jordan.blake@example.com',
    address: '1427 Sunridge Ave, Sacramento, CA',
    monthlyBill: 240,
    homeType: 'single-family',
    ownsRoof: 'yes',
    creditAbove650: 'yes',
    shading: 'One tree on the west side, minor',
    utilityProvider: 'SMUD',
    decisionMakers: 'Spouse — Taylor Blake',
    appointmentDateTime: 'Thursday, Aug 6 at 3:00 PM',
    appointmentType: 'in-home',
    languageBookedIn: 'English',
    notes: 'Qualified. Spouse will be present. Wants to lower bill before winter.',
  }
}
