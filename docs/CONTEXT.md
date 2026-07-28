# CONTEXT — Solar Voice Advisor (Interview Task)

## What this is
An **interview take-home**: build and deploy a **browser-only voice AI agent** that has a
spoken conversation (microphone → speech) with a website visitor, runs a fixed **solar
appointment-setting script**, qualifies the person into a set of structured fields, and
saves the result as a **lead**. No real phone call — everything happens in the browser tab.

## Source material
- `C:\Users\karti\Downloads\Solar_Sales_Script_v2.pdf` — the canonical script the agent must follow.
  8 stages: Opening hook → Reason for call → 6 Qualifying questions → Bill-swap value pitch →
  Identify decision makers → Set appointment → Lock & confirm → Recap & close.
- The PDF also defines the **fields to capture** (Customer Details + Qualifying Notes sections).

## Fields the conversation must end up capturing (the "lead")
Customer: name, phone, email, address.
Qualifying: average monthly electric bill, home type (single-family / condo / townhome),
owns the roof (y/n), credit score above 650 (y/n/unsure), shading issues, current electricity
provider, decision makers present, appointment date & time, appointment type (in-home/virtual),
language booked in. Plus a `qualified` verdict (booked / disqualified) and free-text notes.

## What the interviewer is almost certainly grading
1. It actually works live (deployed URL, click → talk → agent talks back).
2. The agent **stays on script** and **handles off-topic / unreasonable / adversarial** input
   without breaking character or leaking the system prompt.
3. Structured data is captured **correctly** and disqualification logic works (e.g. rents roof,
   bill < $150, condo without roof ownership → DQ).
4. Leads are **persisted** and viewable in a separate tab.
5. Clean architecture + clear docs + reproducible deploy.

## Known constraints / decisions already made by the user
- Voice provider = **ElevenLabs** (Conversational AI). Other models allowed only if needed —
  flag before adding.
- Browser-only (no Twilio / no real telephony).
- Time-constrained: favor a small, correct, demo-able build over breadth.

## Compliance note (flagged, not blocking)
The script contains some legally risky claims ("a complaint was filed", implied government
letter, "reduce your bill to zero", "fully government-funded"). SGIP is a real CA **battery
storage** incentive, not a bill-elimination giveaway. For the interview we keep the script's
*structure and flow* but the agent prompt should soften provably-false claims into hedged
phrasing ("may help you", "you may qualify"). See TECH.md → Non-goals.

## Prerequisite the user must supply
- **ELEVENLABS_API_KEY** (+ an ElevenLabs account). Needed to create the agent, generate signed
  URLs, and run the automated mock-conversation test. This is the one hard external dependency.
