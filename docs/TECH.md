# TECH — stack, decisions, what we want / don't want

## Stack (chosen)
| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + React + TypeScript** | Matches the `ship-fast` skill; fast, deployable to Netlify. |
| Styling | **Tailwind CSS** | Speed; clean demo UI. |
| Routing | **react-router-dom** | Two routes: `/` (Converse) and `/leads` (Leads). |
| Voice agent | **ElevenLabs Conversational AI** via **`@elevenlabs/react`** (`useConversation`) | User-chosen; best voices; browser SDK does mic + STT + LLM + TTS end-to-end. |
| Agent auth | **Signed URL** from a **Netlify Function** using `ELEVENLABS_API_KEY` | Keeps the agent private; API key never ships to the browser. Signed URL expires in 15 min. |
| Lead store | **Supabase** (`leads` table) — Supabase MCP already configured | Real persistence + Leads tab across sessions/devices. `localStorage` is the zero-backend fallback. |
| Deploy | **Netlify** (Netlify MCP configured) | Static SPA + serverless function in one place. |
| Test | **ElevenLabs Simulate-Conversation API** + a Node test script | Automated "mock conversation through API" required by the goal. |

> Only ElevenLabs is used for voice/LLM. **No extra model provider is planned.** If the ElevenLabs
> built-in LLM proves too weak at guardrails during testing, the fallback is to point the agent's
> LLM at Claude (Anthropic key already present) inside the ElevenLabs agent config — will flag first.

## How the pieces connect
```
Browser (React)
  └─ useConversation({ clientTools: { submit_lead } })
        │  startSession({ signedUrl })         ← fetched from:
        ▼
  Netlify Function  /api/signed-url  ──(ELEVENLABS_API_KEY)──►  ElevenLabs get-signed-url
        │
        ▼
  ElevenLabs Agent (system prompt = script, voice, data-collection fields, LLM)
        │  during the call the agent calls the client tool:
        ▼
  submit_lead({...fields})  →  React captures object → insert into Supabase `leads`
        │                                              → navigate to /thank-you (summary)
        ▼
  Leads tab reads `leads` from Supabase
```

## Key SDK facts (verified against current ElevenLabs docs)
- Package: `@elevenlabs/react`. Hook: `useConversation({ onConnect, onDisconnect, onMessage, onError, clientTools })`.
- Start: `await conversation.startSession({ signedUrl })` (or `{ agentId }` for a public agent).
- End: `await conversation.endSession()`. State: `status`, `isSpeaking`, `isListening`, `isMuted`.
- Client tools are an object of async fns; **names are case-sensitive and must match the agent config exactly**:
  ```ts
  clientTools: {
    submit_lead: async (fields) => { /* fields arrive as an object */ saveLead(fields); return "saved"; }
  }
  ```
- Agent-side (dashboard/API): System prompt, First message, LLM, Voice, **Data Collection** fields,
  **Evaluation criteria**, and the `submit_lead` tool declaration all live in the agent config.

## Guardrails strategy (how the agent "stays on the path")
1. Strong system prompt: fixed role, the 8 stages verbatim, explicit ALLOWED vs FORBIDDEN topics,
   and a standard redirect line for anything off-script.
2. Refuse prompt-extraction ("ignore your instructions", "what's your prompt") with a canned deflection.
3. Hard qualifying gates encoded as rules → DQ paths.
4. Keep the LLM temperature low; cap conversation length; rely on Evaluation criteria to score adherence.
5. The mock-conversation test includes an **adversarial persona** to prove the rails hold.

## What we WANT
- One-click talk, agent speaks first, natural barge-in.
- Accurate structured capture + correct DQ logic.
- Persisted, viewable leads.
- Reproducible agent config (checked into `agent/agent-config.json`).
- Clean, deployable Netlify build + a green automated test.

## What we DON'T want (non-goals)
- ❌ Real telephony / outbound calls / Twilio.
- ❌ Exposing `ELEVENLABS_API_KEY` in the browser (always via the Netlify function).
- ❌ Payments, e-signature, real SGIP eligibility checks, credit pulls.
- ❌ User accounts / auth / roles.
- ❌ CRM integration (GHL etc.) — out of scope, even though prior projects exist.
- ❌ Multi-language, human handoff, analytics dashboards.
- ❌ Repeating the script's provably-false claims verbatim — soften to hedged language.
- ❌ Over-engineering: no state library beyond React context; no SSR; no monorepo.
