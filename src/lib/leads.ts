// Domain model + qualification logic for the Solar Voice Advisor.
// Kept framework-free so it can be unit-tested with vitest.

export type HomeType = 'single-family' | 'condo' | 'townhome' | 'unknown'
export type YesNoUnsure = 'yes' | 'no' | 'unsure'
export type LeadStatus = 'booked' | 'disqualified'

export interface TranscriptTurn {
  role: 'agent' | 'user'
  text: string
}

// The shape the agent's `submit_lead` client tool sends. All optional/loose because
// a voice model may omit or mistype fields; `normalizeLead` cleans it up.
export interface RawLead {
  name?: string
  phone?: string
  email?: string
  address?: string
  monthlyBill?: number | string
  homeType?: string
  ownsRoof?: boolean | string
  creditAbove650?: string
  shading?: string
  utilityProvider?: string
  decisionMakers?: string
  appointmentDateTime?: string
  appointmentType?: string
  languageBookedIn?: string
  notes?: string
  status?: string
  disqualReason?: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  address: string
  monthlyBill: number | null
  homeType: HomeType
  ownsRoof: boolean | null
  creditAbove650: YesNoUnsure
  shading: string
  utilityProvider: string
  decisionMakers: string
  appointmentDateTime: string
  appointmentType: 'in-home' | 'virtual' | ''
  languageBookedIn: string
  status: LeadStatus
  disqualReason: string
  notes: string
  transcript: TranscriptTurn[]
  createdAt: string
}

const MIN_MONTHLY_BILL = 150

function toBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['yes', 'y', 'true', 'own', 'owner'].includes(s)) return true
    if (['no', 'n', 'false', 'rent', 'renter'].includes(s)) return false
  }
  return null
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.]/g, ''))
    return Number.isNaN(n) ? null : n
  }
  return null
}

function toHomeType(v: unknown): HomeType {
  const s = String(v ?? '').toLowerCase()
  if (s.includes('single')) return 'single-family'
  if (s.includes('condo')) return 'condo'
  if (s.includes('town')) return 'townhome'
  return 'unknown'
}

function toCredit(v: unknown): YesNoUnsure {
  const s = String(v ?? '').toLowerCase()
  if (s.startsWith('y')) return 'yes'
  if (s.startsWith('n')) return 'no'
  return 'unsure'
}

/**
 * Apply the script's qualifying gates. Returns a disqualification reason, or ''
 * if the homeowner passes. Credit < 650 is a soft flag (engineer verifies), not a hard DQ.
 */
export function evaluateQualification(l: {
  ownsRoof: boolean | null
  homeType: HomeType
  monthlyBill: number | null
}): string {
  if (l.ownsRoof === false) return 'Does not own the roof / not the homeowner'
  if ((l.homeType === 'condo' || l.homeType === 'townhome') && l.ownsRoof !== true) {
    return 'Condo/townhome without roof ownership'
  }
  if (l.monthlyBill !== null && l.monthlyBill < MIN_MONTHLY_BILL) {
    return `Monthly bill $${l.monthlyBill} is below the $${MIN_MONTHLY_BILL} threshold`
  }
  return ''
}

let idCounter = 0
// Deterministic id (Math.random/Date.now are unavailable in some sandboxes; the
// caller can override via createdAt). Uniqueness within a session is enough for the demo.
function makeId(seed: string): string {
  idCounter += 1
  return `lead_${seed}_${idCounter}`
}

export function normalizeLead(raw: RawLead, opts?: { createdAt?: string; transcript?: TranscriptTurn[] }): Lead {
  const createdAt = opts?.createdAt ?? new Date().toISOString()
  const ownsRoof = toBool(raw.ownsRoof)
  const homeType = toHomeType(raw.homeType)
  const monthlyBill = toNumber(raw.monthlyBill)

  const autoDQ = evaluateQualification({ ownsRoof, homeType, monthlyBill })
  const explicitDQ = String(raw.status ?? '').toLowerCase().startsWith('disq')
  const status: LeadStatus = autoDQ || explicitDQ ? 'disqualified' : 'booked'

  const appointmentType = String(raw.appointmentType ?? '').toLowerCase()

  return {
    id: makeId(createdAt.replace(/[^0-9]/g, '').slice(-8) || '0'),
    name: (raw.name ?? '').trim(),
    phone: (raw.phone ?? '').trim(),
    email: (raw.email ?? '').trim(),
    address: (raw.address ?? '').trim(),
    monthlyBill,
    homeType,
    ownsRoof,
    creditAbove650: toCredit(raw.creditAbove650),
    shading: (raw.shading ?? '').trim(),
    utilityProvider: (raw.utilityProvider ?? '').trim(),
    decisionMakers: (raw.decisionMakers ?? '').trim(),
    appointmentDateTime: (raw.appointmentDateTime ?? '').trim(),
    appointmentType: appointmentType === 'virtual' ? 'virtual' : appointmentType === 'in-home' || appointmentType === 'in home' ? 'in-home' : '',
    languageBookedIn: (raw.languageBookedIn ?? '').trim(),
    status,
    disqualReason: autoDQ || (raw.disqualReason ?? '').trim(),
    notes: (raw.notes ?? '').trim(),
    transcript: opts?.transcript ?? [],
    createdAt,
  }
}
