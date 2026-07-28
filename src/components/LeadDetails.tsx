import type { Lead } from '../lib/leads'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-slate-100">{value || '—'}</span>
    </div>
  )
}

export function StatusBadge({ status }: { status: Lead['status'] }) {
  const booked = status === 'booked'
  return (
    <span
      className={[
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        booked ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300',
      ].join(' ')}
    >
      {booked ? 'Booked' : 'Disqualified'}
    </span>
  )
}

export default function LeadDetails({ lead }: { lead: Lead }) {
  const money = lead.monthlyBill === null ? '' : `$${lead.monthlyBill}/mo`
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Customer</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={lead.name} />
          <Field label="Phone" value={lead.phone} />
          <Field label="Email" value={lead.email} />
          <Field label="Address" value={lead.address} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Qualifying</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly bill" value={money} />
          <Field label="Home type" value={lead.homeType} />
          <Field label="Owns roof" value={lead.ownsRoof === null ? '' : lead.ownsRoof ? 'Yes' : 'No'} />
          <Field label="Credit > 650" value={lead.creditAbove650} />
          <Field label="Utility provider" value={lead.utilityProvider} />
          <Field label="Shading" value={lead.shading} />
          <Field label="Decision makers" value={lead.decisionMakers} />
          <Field label="Language" value={lead.languageBookedIn} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Appointment</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date & time" value={lead.appointmentDateTime} />
          <Field label="Type" value={lead.appointmentType} />
        </div>
      </section>

      {lead.disqualReason && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Disqualified:</strong> {lead.disqualReason}
        </div>
      )}

      {lead.notes && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Notes</h3>
          <p className="text-slate-200">{lead.notes}</p>
        </section>
      )}

      {lead.transcript.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Transcript</h3>
          <ul className="flex flex-col gap-1 text-sm text-slate-300">
            {lead.transcript.map((t, i) => (
              <li key={i}>
                <span className="text-slate-500">{t.role === 'user' ? 'You: ' : 'Advisor: '}</span>
                {t.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
