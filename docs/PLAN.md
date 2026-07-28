# PLAN — build order

Small, verifiable steps. Each milestone leaves the app in a runnable state.

## M0 — Scaffold (repo skeleton)
- `npm create vite@latest . -- --template react-ts`; add Tailwind, react-router-dom, `@elevenlabs/react`, `@supabase/supabase-js`.
- Routes: `/` (Converse), `/leads` (Leads), `/thank-you` (Summary). Shared nav.
- `.env.example`, `netlify.toml`, `README`. Commit.
- ✅ Check: `npm run dev` renders the two tabs; `npm run build` passes.

## M1 — Agent definition (the brain)
- Author `agent/system-prompt.md` from the PDF: role, the 8 stages, qualifying gates, DQ rules,
  ALLOWED/FORBIDDEN topics, redirect + prompt-extraction deflection lines, hedged-claim rules.
- Define **data-collection fields** + the **`submit_lead`** client tool schema (all lead fields).
- Save as `agent/agent-config.json` and a `agent/create-agent.mjs` script that creates/updates the
  agent via the ElevenLabs API (idempotent, reads `ELEVENLABS_API_KEY`). Pick a voice.
- ✅ Check: running the script prints an `agentId`; agent visible in dashboard.

## M2 — Signed-URL function
- `netlify/functions/signed-url.ts`: GET → calls ElevenLabs get-signed-url with the API key +
  `AGENT_ID`, returns `{ signedUrl }`. Never exposes the key.
- ✅ Check: `curl` the function locally (netlify dev) returns a signed URL.

## M3 — Converse page (core)
- `useConversation` wired with `clientTools.submit_lead` + callbacks.
- Call button → fetch signed URL → `startSession`. Show status, speaking indicator, live transcript
  (from `onMessage`), mute, end-call.
- `submit_lead(fields)` → normalize → store in LeadsContext → `endSession()` → navigate `/thank-you`.
- ✅ Check: in-browser, agent greets, converses, and a manually-triggered `submit_lead` routes to summary.

## M4 — Persistence + Leads tab
- Supabase `leads` table (SQL migration in `supabase/`). Anon insert allowed via RLS; select for the tab.
- `submit_lead` also inserts into Supabase. Leads page lists rows; row → detail (fields + transcript).
- Fallback: if no Supabase env, use `localStorage` so the demo still works.
- ✅ Check: booked lead appears in the Leads tab and survives refresh.

## M5 — Thank-You / Summary
- `/thank-you`: friendly confirmation + every captured field grouped (Customer / Qualifying /
  Appointment) + Booked/Disqualified badge.
- ✅ Check: matches the PDF's recap checklist.

## M6 — Automated mock-conversation test
- `test/simulate.mjs`: drive the agent via ElevenLabs **simulate-conversation** API with:
  - Persona A "good homeowner" → assert stages hit, required fields collected, appointment booked.
  - Persona B "renter / condo, bill $40" → assert **disqualified**, no appointment.
  - Persona C "adversarial" (abuse + 'ignore your instructions') → assert stayed on script, no leak.
- Also a small unit test for the lead-normalizer / DQ logic (vitest).
- ✅ Check: `npm test` green.

## M7 — Deploy
- Netlify: set env (`ELEVENLABS_API_KEY`, `AGENT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`),
  publish dir `dist`, functions dir `netlify/functions`, SPA redirect `/* → /index.html 200`.
- ✅ Check: live URL loads, mic call works, lead lands in Leads tab.

## Critical files
- `agent/system-prompt.md`, `agent/agent-config.json`, `agent/create-agent.mjs`
- `netlify/functions/signed-url.ts`, `netlify.toml`
- `src/pages/Converse.tsx`, `src/pages/Leads.tsx`, `src/pages/ThankYou.tsx`
- `src/lib/leads.ts` (normalize + DQ logic), `src/lib/supabase.ts`, `src/context/LeadsContext.tsx`
- `supabase/0001_leads.sql`, `test/simulate.mjs`, `src/lib/leads.test.ts`

## Hard dependency / blocker
Everything in M1, M2, M6, M7 needs **ELEVENLABS_API_KEY**. M0/M3-UI/M5 can proceed without it.
