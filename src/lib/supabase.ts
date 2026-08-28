import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from './leads'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = Boolean(url && anon)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anon as string)
  : null

// Row shape in the `leads` table (snake_case). See supabase/0001_leads.sql.
export interface LeadRow {
  id: string
  created_at: string
  status: string
  name: string
  phone: string
  email: string
  address: string
  monthly_bill: number | null
  home_type: string
  owns_roof: boolean | null
  credit_above_650: string
  shading: string
  utility_provider: string
  already_has_solar: boolean | null
  roof_condition: string
  decision_makers: string
  appointment_datetime: string
  appointment_type: string
  language_booked_in: string
  disqual_reason: string
  notes: string
  transcript: unknown
}

export function leadToRow(l: Lead): LeadRow {
  return {
    id: l.id,
    created_at: l.createdAt,
    status: l.status,
    name: l.name,
    phone: l.phone,
    email: l.email,
    address: l.address,
    monthly_bill: l.monthlyBill,
    home_type: l.homeType,
    owns_roof: l.ownsRoof,
    credit_above_650: l.creditAbove650,
    shading: l.shading,
    utility_provider: l.utilityProvider,
    already_has_solar: l.alreadyHasSolar,
    roof_condition: l.roofCondition,
    decision_makers: l.decisionMakers,
    appointment_datetime: l.appointmentDateTime,
    appointment_type: l.appointmentType,
    language_booked_in: l.languageBookedIn,
    disqual_reason: l.disqualReason,
    notes: l.notes,
    transcript: l.transcript,
  }
}

export function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    createdAt: r.created_at,
    status: r.status === 'disqualified' ? 'disqualified' : 'booked',
    name: r.name ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    address: r.address ?? '',
    monthlyBill: r.monthly_bill,
    homeType: (r.home_type as Lead['homeType']) ?? 'unknown',
    ownsRoof: r.owns_roof,
    creditAbove650: (r.credit_above_650 as Lead['creditAbove650']) ?? 'unsure',
    shading: r.shading ?? '',
    utilityProvider: r.utility_provider ?? '',
    alreadyHasSolar: r.already_has_solar ?? null,
    roofCondition: r.roof_condition ?? '',
    decisionMakers: r.decision_makers ?? '',
    appointmentDateTime: r.appointment_datetime ?? '',
    appointmentType: (r.appointment_type as Lead['appointmentType']) ?? '',
    languageBookedIn: r.language_booked_in ?? '',
    disqualReason: r.disqual_reason ?? '',
    notes: r.notes ?? '',
    transcript: Array.isArray(r.transcript) ? (r.transcript as Lead['transcript']) : [],
  }
}
