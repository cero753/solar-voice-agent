// End-to-end agent test over the REAL conversation WebSocket (same path the browser
// uses): fetch a signed URL, connect, drive a scripted homeowner, and capture the
// submit_lead client-tool call. Node 24 provides a global WebSocket.
//   node test/ws-conversation.mjs
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = existsSync(join(root, '.env'))
  ? Object.fromEntries(
      readFileSync(join(root, '.env'), 'utf8')
        .split(/\r?\n/)
        .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2]]),
    )
  : {}
const API_KEY = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY
const AGENT_ID = process.env.AGENT_ID || env.AGENT_ID
if (!API_KEY || !AGENT_ID) throw new Error('Need ELEVENLABS_API_KEY and AGENT_ID in .env')

async function signedUrl() {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
    { headers: { 'xi-api-key': API_KEY } },
  )
  if (!res.ok) throw new Error(`get-signed-url ${res.status}: ${await res.text()}`)
  return (await res.json()).signed_url
}

// Info-rich answers; the agent asks one thing at a time, we reply per agent turn.
const PERSONAS = {
  qualified: [
    'Yes, this is the homeowner and I have a minute.',
    'Sure, go ahead and ask.',
    "It's about 240 dollars a month.",
    'Yes, single-family home and I own it, including the roof.',
    'My credit is above 650.',
    'Just one small tree on the west side, nothing major.',
    'My provider is SMUD.',
    'My spouse Taylor is the other decision maker and will be there.',
    "Thursday afternoon works — let's do 3 PM.",
    'No conflicts. My number is 555-771-4820 and email jordan.blake@example.com.',
    'No questions, thanks!',
    'Thanks, bye!',
  ],
  disqualified: [
    'Yes I have a minute.',
    'Okay sure.',
    "Honestly it's only about 65 dollars a month.",
    "It's a condo and I rent — I don't own the roof.",
    "No, I can't really do anything to the roof then.",
    'Okay, thanks anyway. Bye.',
    'Bye.',
  ],
}

function runConversation(lines, { timeoutMs = 90000 } = {}) {
  return new Promise(async (resolve, reject) => {
    const url = await signedUrl()
    const ws = new WebSocket(url)
    const transcript = []
    let captured = null
    let idx = 0
    const timer = setTimeout(() => {
      try { ws.close() } catch {}
      resolve({ transcript, lead: captured, timedOut: true })
    }, timeoutMs)

    const sendNext = () => {
      if (idx < lines.length) {
        const text = lines[idx++]
        ws.send(JSON.stringify({ type: 'user_message', text }))
        transcript.push({ role: 'user', text })
      }
    }

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }))
    })

    ws.addEventListener('message', (ev) => {
      let msg
      try { msg = JSON.parse(ev.data) } catch { return }
      switch (msg.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event?.event_id }))
          break
        case 'agent_response': {
          const text = msg.agent_response_event?.agent_response ?? ''
          transcript.push({ role: 'agent', text })
          // reply on the next tick so we answer one question at a time
          setTimeout(sendNext, 600)
          break
        }
        case 'client_tool_call': {
          const call = msg.client_tool_call
          if (call?.tool_name === 'submit_lead') {
            captured = call.parameters
            ws.send(JSON.stringify({ type: 'client_tool_result', tool_call_id: call.tool_call_id, result: 'saved', is_error: false }))
            clearTimeout(timer)
            setTimeout(() => { try { ws.close() } catch {}; resolve({ transcript, lead: captured, timedOut: false }) }, 400)
          }
          break
        }
      }
    })
    ws.addEventListener('error', (e) => { clearTimeout(timer); reject(new Error('ws error: ' + (e.message || e))) })
  })
}

let failures = 0
const check = (name, cond, detail = '') => {
  const ok = Boolean(cond)
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` — ${detail}` : ''}`)
}

const run = async () => {
  console.log(`E2E conversation test — agent ${AGENT_ID}\n`)

  console.log('Persona A — qualified homeowner:')
  const a = await runConversation(PERSONAS.qualified)
  console.log(`  (${a.transcript.length} turns, submit_lead=${a.lead ? 'yes' : 'no'})`)
  check('submit_lead was called', a.lead)
  check('status = booked', a.lead && /book/i.test(String(a.lead.status)), JSON.stringify(a.lead?.status))
  check('captured a name', a.lead && a.lead.name && a.lead.name.length > 1)
  check('captured an appointment time', a.lead && String(a.lead.appointmentDateTime || '').length > 0)

  console.log('\nPersona B — condo renter, low bill (should be disqualified):')
  const b = await runConversation(PERSONAS.disqualified)
  console.log(`  (${b.transcript.length} turns, submit_lead=${b.lead ? 'yes' : 'no'})`)
  check('submit_lead was called', b.lead)
  check('status = disqualified', b.lead && /disqualif/i.test(String(b.lead.status)), JSON.stringify(b.lead?.status))

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED ✅' : `${failures} CHECK(S) FAILED ❌`}`)
  if (a.lead) console.log('\nSample captured lead (A):\n' + JSON.stringify(a.lead, null, 2))
  process.exit(failures === 0 ? 0 : 1)
}

run().catch((e) => { console.error(e.message); process.exit(1) })
