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
| M0 Scaffold | TODO | `npm run build` | |
| M1 Agent config | BLOCKED (needs API key) | create-agent script prints agentId | |
| M2 Signed-URL fn | BLOCKED (needs API key) | curl returns signedUrl | |
| M3 Converse page | TODO | in-browser + mocked submit_lead | UI mockable w/o key |
| M4 Persistence + Leads | TODO | lead survives refresh | localStorage fallback |
| M5 Thank-You | TODO | matches PDF recap | |
| M6 Mock test | BLOCKED (needs API key) | `npm test` green | simulate-conversation |
| M7 Deploy | BLOCKED (needs API key) | live URL works | Netlify |

## HOW TO RUN THIS LOOP
- Manual: work milestone-by-milestone, updating PROGRESS.
- Automated: `/loop build the next TODO milestone in docs/PLAN.md per docs/LOOP.md, verify its
  check, update PROGRESS; stop when GOAL STATE is met or a STOP condition triggers`.
