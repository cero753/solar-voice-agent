import { useState } from 'react'
import { useLeads } from '../context/LeadsContext'
import type { Lead } from '../lib/leads'
import LeadDetails, { StatusBadge } from '../components/LeadDetails'

export default function Leads() {
  const { leads, loading, backend, refresh } = useLeads()
  const [selected, setSelected] = useState<Lead | null>(null)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads</h1>
          <p className="text-sm text-slate-500">
            {leads.length} captured · stored in {backend === 'supabase' ? 'Supabase' : 'this browser'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-10 text-center text-slate-400">
          No leads yet. Have a conversation on the advisor page to capture one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="cursor-pointer bg-slate-900/40 hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 text-slate-100">{l.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{l.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{l.monthlyBill === null ? '—' : `$${l.monthlyBill}`}</td>
                  <td className="px-4 py-3 text-slate-300">{l.appointmentDateTime || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{selected.name || 'Lead'}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-slate-100 hover:bg-slate-600"
              >
                Close
              </button>
            </div>
            <LeadDetails lead={selected} />
          </div>
        </div>
      )}
    </div>
  )
}
