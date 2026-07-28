# Solar Voice Advisor

A browser-only **voice AI agent** that runs a solar appointment-setting script, qualifies the
caller into structured fields, and saves the result as a **lead** — with a Leads tab to review them.

**Live:** https://solar-voice-advisor.netlify.app

- **Advisor page** — click *Start call*, allow the mic, and talk to the agent. It follows the
  8-stage script, stays on-topic (refuses off-script / adversarial input), qualifies the home,
  and books a free evaluation (or disqualifies). On completion it shows a Thank-You summary.
- **Leads page** — every captured lead with full detail (customer, qualifying answers,
  appointment, transcript), stored in Supabase.

## Stack
Vite + React + TypeScript + Tailwind · ElevenLabs Conversational AI (`@elevenlabs/react`) ·
Netlify (static + serverless signed-URL function) · Supabase (`leads` table).

The agent connects via a **signed URL** minted by a Netlify function, so the ElevenLabs API key
never reaches the browser. When no agent/keys are configured the UI falls back to a scripted
**mock** so it's always demoable.

## Run locally
```bash
npm install
cp .env.example .env          # fill in the values (see below)
node agent/create-agent.mjs   # creates the ElevenLabs agent, writes AGENT_ID to .env
netlify dev                   # serves the app + the signed-url function on :8888
```
`npm run dev` alone runs the app in mock mode (no serverless function). Use `netlify dev` for the
real voice flow locally.

### Environment (`.env`)
| Var | Where | Purpose |
|---|---|---|
| `ELEVENLABS_API_KEY` | server only | create agent, mint signed URLs (never shipped to browser) |
| `ELEVENLABS_VOICE_ID` | server only | the agent's TTS voice |
| `AGENT_ID` | server only | created agent id (function reads it) |
| `VITE_USE_SIGNED_URL` | build | `true` to use the secure signed-URL flow |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | build | leads persistence |

## Tests
```bash
npm test          # unit tests: lead normalization + disqualification gates (vitest)
npm run test:e2e  # real end-to-end conversation over the ElevenLabs WebSocket:
                  #   qualified persona -> booked, condo renter -> disqualified,
                  #   asserts the submit_lead tool fires with correct fields
```

## How it works
The agent's system prompt (`agent/system-prompt.md`) encodes the script, guardrails, and
disqualification gates, and declares a `submit_lead` client tool. At the end of a call the agent
calls `submit_lead(...)`; the browser normalizes the fields (`src/lib/leads.ts`), writes them to
Supabase, and routes to the Thank-You summary. See `docs/` for CONTEXT / GOAL / TECH / PLAN / LOOP.

> Note: the script's persuasive claims are intentionally softened in the prompt (hedged language,
> no false "government complaint / bill to zero" promises) for compliance.
