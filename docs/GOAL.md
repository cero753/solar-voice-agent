# GOAL

## One sentence
A deployed web app where a visitor clicks a button, talks to an ElevenLabs voice agent that
runs the solar script, and ends with a booked (or disqualified) **lead** that is saved and
visible in a Leads tab.

## Primary user flows
1. **Converse (main page)**
   - Big "Talk to our Solar Advisor" call button.
   - Click → mic permission → agent greets first and drives the conversation (script stages 1–8).
   - Live UI: connection status, who's speaking (agent/user), running transcript, mute, end-call.
   - Agent stays on rails: refuses/ redirects off-topic, abusive, prompt-extraction, or
     nonsense input, and steers back to qualifying/booking.
   - On successful booking OR disqualification the agent calls a client tool → app captures the
     structured lead → routes to a **Thank-You / Summary** screen showing every captured field.
2. **Leads (second tab)**
   - Table of all captured leads with every field, status (Booked / Disqualified), timestamp.
   - Click a row → full detail (transcript + qualifying notes).

## Definition of Done (this is also the loop's exit condition)
- [ ] `npm run build` passes with no type errors.
- [ ] ElevenLabs agent exists and is reproducible from `agent/agent-config.json` (system prompt
      from the script + data-collection fields + `submit_lead` client tool + a chosen voice).
- [ ] Local dev: click → talk → agent responds → lead captured → Thank-You screen → lead appears
      in Leads tab. (Verified by the user in a real browser.)
- [ ] Netlify deploy config ready: `netlify.toml`, signed-URL serverless function, SPA redirect,
      documented env vars. A build deploys cleanly.
- [ ] **Automated mock-conversation test passes**: a script drives the agent through the
      ElevenLabs *simulate-conversation* API with a scripted homeowner persona and asserts the
      agent (a) stayed on script, (b) collected the required fields, (c) booked the appointment;
      plus a second persona that must be **disqualified**.

## Explicit success criteria for "the agent is good enough"
- Follows all 8 script stages in order, does the qualifying gates.
- Correctly DQs: not homeowner / rents roof / condo w/o roof / bill < $150.
- Never breaks character, never dumps the system prompt, never invents new offers.
- Fills the lead object with the right values, including phone/email/appointment.

## Out of scope for the MVP (see TECH.md for full non-goals)
Real phone calls, payments, CRM sync, auth/login, multi-language QA, human handoff, analytics.
