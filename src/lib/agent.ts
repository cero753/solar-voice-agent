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

/** The 8 stages Alex works through, mirrored in the UI so you can follow the call. */
export const SCRIPT_STAGES: { title: string; detail: string }[] = [
  { title: 'Opening', detail: 'Neighborhood outreach — confirms it’s the owner of the home' },
  { title: 'Reason for the call', detail: 'Rate increases in the area and the SGIP program' },
  { title: 'Qualifying', detail: 'Bill · home type & roof · credit · shading · provider · existing solar' },
  { title: 'The bill swap', detail: 'Swaps the utility bill for a locked-in solar payment' },
  { title: 'Decision makers', detail: 'Anyone else who needs to be on the appointment' },
  { title: 'Set the appointment', detail: 'Engineer visit — 10–15 min evaluation, 10–15 min walkthrough' },
  { title: 'Lock & confirm', detail: 'Conflicts, attendees, best phone and email' },
  { title: 'Recap & close', detail: 'Time, address, bring your latest bill, questions' },
]

// Condensed version of the 8-stage script for the mock playthrough.
export const MOCK_SCRIPT: MockLine[] = [
  { role: 'agent', text: "Hey, how's it going? This is just Alex — we're working right in the corner of your neighborhood. Am I speaking with the owner of the home?" },
  { role: 'user', text: 'Yeah, this is me.' },
  { role: 'agent', text: "Great. We're working with a few of your neighbors about the rate increases in your area — a lot of homes around here are getting hit with hikes and outages. We're checking who qualifies for a program called SGIP." },
  { role: 'user', text: 'Okay, go ahead.' },
  { role: 'agent', text: "I'm assuming you're paying more than $150 a month on electricity, right? What's your average bill?" },
  { role: 'user', text: "Yeah, it's around $240." },
  { role: 'agent', text: "Oh wow, that's high — you're exactly who this program is for. Is this a single-family home, and do you own the roof?" },
  { role: 'user', text: 'Yes, single-family, we own it.' },
  { role: 'agent', text: 'Any large trees shading the roof, who’s your provider, and do you already have solar?' },
  { role: 'user', text: 'One tree on the west side, SMUD, and no solar yet.' },
  { role: 'agent', text: "Perfect. So see how you're paying $240 every month to SMUD? This program is designed to swap that for a locked-in payment that doesn't climb with inflation." },
  { role: 'user', text: 'That sounds interesting.' },
  { role: 'agent', text: "Let's get one of our engineers out — about 10 to 15 minutes to evaluate, another 10 to 15 to walk you through it. Morning or afternoon?" },
  { role: 'user', text: 'Thursday afternoon works.' },
  { role: 'agent', text: "You're all set for Thursday at 3. Have your most recent electricity bill ready and make sure all decision makers are there. Thanks so much!" },
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
      alreadyHasSolar: 'no',
      roofCondition: 'HOA-managed, not theirs to modify',
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
    alreadyHasSolar: 'no',
    roofCondition: 'Roof re-shingled about 4 years ago',
    decisionMakers: 'Spouse — Taylor Blake',
    appointmentDateTime: 'Thursday, Aug 6 at 3:00 PM',
    appointmentType: 'in-home',
    languageBookedIn: 'English',
    notes: 'Qualified. Spouse will be present. Wants to lower bill before winter.',
  }
}
