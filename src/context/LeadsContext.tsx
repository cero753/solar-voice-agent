import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lead } from '../lib/leads'
import { supabase, supabaseEnabled, leadToRow, rowToLead, type LeadRow } from '../lib/supabase'

const LS_KEY = 'solar_leads'

interface LeadsContextValue {
  leads: Lead[]
  loading: boolean
  backend: 'supabase' | 'local'
  addLead: (lead: Lead) => Promise<void>
  refresh: () => Promise<void>
}

const LeadsContext = createContext<LeadsContextValue | null>(null)

function readLocal(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Lead[]
  } catch {
    return []
  }
}

function writeLocal(leads: Lead[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(leads))
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const backend: 'supabase' | 'local' = supabaseEnabled ? 'supabase' : 'local'

  const refresh = useCallback(async () => {
    setLoading(true)
    if (supabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setLeads((data as LeadRow[]).map(rowToLead))
    } else {
      setLeads(readLocal())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addLead = useCallback(async (lead: Lead) => {
    // Optimistic local update so the UI is instant regardless of backend.
    setLeads((prev) => [lead, ...prev])
    if (supabaseEnabled && supabase) {
      await supabase.from('leads').insert(leadToRow(lead))
    } else {
      writeLocal([lead, ...readLocal()])
    }
  }, [])

  return (
    <LeadsContext.Provider value={{ leads, loading, backend, addLead, refresh }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext)
  if (!ctx) throw new Error('useLeads must be used within a LeadsProvider')
  return ctx
}
