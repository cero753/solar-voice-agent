import { Link, useLocation } from 'react-router-dom'
import type { Lead } from '../lib/leads'
import LeadDetails, { StatusBadge } from '../components/LeadDetails'

export default function ThankYou() {
  const location = useLocation()
  const lead = (location.state as { lead?: Lead } | null)?.lead

  if (!lead) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">No recent conversation</h1>
        <p className="mt-2 text-slate-400">Start a call to capture a lead.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-white">
          Back to advisor
        </Link>
      </div>
    )
  }

  const booked = lead.status === 'booked'
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold text-white">
          {booked ? 'You’re all set 🎉' : 'Thanks for your time'}
        </h1>
        <p className="mt-2 text-slate-400">
          {booked
            ? `We’ve booked your free evaluation${lead.appointmentDateTime ? ` for ${lead.appointmentDateTime}` : ''}. A confirmation will follow.`
            : 'Based on what you shared, this program isn’t the right fit right now — but thanks for chatting with us.'}
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={lead.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
        <LeadDetails lead={lead} />
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-600">
          New conversation
        </Link>
        <Link to="/leads" className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-400">
          View all leads
        </Link>
      </div>
    </div>
  )
}
