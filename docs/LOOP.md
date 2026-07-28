# LOOP — self-driving build loop

Purpose: give the agent (me) a repeatable loop with clear exit conditions so I can build
autonomously between check-ins, and stop cleanly when the goal is met.

## GOAL STATE (loop exits when ALL true)
1. `npm run build` passes (no TS errors).
2. `npm test` passes — includes the ElevenLabs **simulate-conversation** mock test
   (good persona → booked, DQ persona → disqualified, adversarial persona → stays on script).
3. In-browser flow works end-to-end locally: click → talk → capture → Thank-You → Leads tab.
4. Netlify deploy config is ready (`netlify.toml`, signed-url function, SPA redirect, env list)
   AND a deploy succeeds to a live URL.
5. All five docs current; README documents run + deploy + env.

## LOOP BODY (repeat until GOAL STATE)
For the current milestone in PLAN.md (M0 → M7):
1. **Build** the milestone's files.
2. **Verify** its ✅ check (run build / test / curl / simulate as applicable).
3. If check fails → **debug** (systematic: reproduce → isolate → fix → re-verify). Max 3
   attempts per milestone; if still red, log to `docs/BLOCKERS.md` and move to the next
   independent milestone.
4. If check passes → mark the milestone done in this file's PROGRESS table, advance.
5. Re-run the full GOAL STATE check. If all green → **stop and report**.

## STOP / ASK-THE-USER conditions (pause the loop, surface to user)
- **Missing `ELEVENLABS_API_KEY`** → blocks M1/M2/M6/M7. Do M0 + M3-UI + M5 (mockable) first,
  then pause and request the key.
- A destructive or costly action (creating paid ElevenLabs/Supabase resources, real deploy).
- ElevenLabs LLM fails guardrails after 3 tuning attempts → propose switching agent LLM to Claude.
- Any ambiguity that changes scope vs GOAL.md.

## NON-NEGOTIABLES while looping
- Never put `ELEVENLABS_API_KEY` in client code or commit secrets.
- Keep the app runnable at every milestone (no half-broken commits).
- Prefer mocks so UI milestones don't hard-block on the API key.
- Update the PROGRESS table + BLOCKERS.md every iteration.

## PROGRESS
| Milestone | State | Verified by | Notes |
|---|---|---|---|
| M0 Scaffold | DONE | `npm run build` green | Vite+React+TS+Tailwind+router |
| M1 Agent config | DONE | agent_4001kymtnsfaf7wb4hdz4xq1sx1g created | prompt+voice+submit_lead tool |
| M2 Signed-URL fn | DONE | signed-url endpoint returns 200 | netlify/functions/signed-url.ts |
| M3 Converse page | DONE | E2E WS test drives real agent | real + mock modes |
| M4 Persistence + Leads | DONE | Supabase anon insert/select OK | RLS policies applied |
| M5 Thank-You | DONE | summary renders all fields | |
| M6 E2E test | DONE | `npm run test:e2e` all pass | real WebSocket (simulate API was deprecated/500) |
| M7 Deploy | DONE | https://solar-voice-advisor.netlify.app live | Netlify + env vars set |

> Note: the deprecated `simulate-conversation` API 500'd, so M6 uses a stronger **real WebSocket**
> conversation test (the same path the browser uses). Remaining: final redeploy so the production
> build picks up the env vars (signed-URL mode + Supabase) — env vars didn't persist on the first
> deploy attempt (a `newVarScopes` quirk in the Netlify MCP), now fixed.

## HOW TO RUN THIS LOOP
- Manual: work milestone-by-milestone, updating PROGRESS.
- Automated: `/loop build the next TODO milestone in docs/PLAN.md per docs/LOOP.md, verify its
  check, update PROGRESS; stop when GOAL STATE is met or a STOP condition triggers`.
