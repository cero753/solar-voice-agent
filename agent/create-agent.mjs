// Idempotent ElevenLabs agent provisioner.
//   node agent/create-agent.mjs
// Reads ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID from .env, builds the Solar Voice Advisor
// agent (system prompt + submit_lead client tool + voice), creates it (or updates if AGENT_ID
// is already set), and writes AGENT_ID back into .env.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')

function parseEnv(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}
const env = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {}
const API_KEY = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || env.ELEVENLABS_VOICE_ID
let AGENT_ID = process.env.AGENT_ID || env.AGENT_ID
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY missing (.env)')

const systemPrompt = readFileSync(join(root, 'agent', 'system-prompt.md'), 'utf8')

const leadProps = (o) => ({ type: 'string', description: o })
const submitLeadTool = {
  type: 'client',
  name: 'submit_lead',
  description:
    'Call once at the very end of the call with every field collected. Use empty strings for unknowns.',
  expects_response: true,
  response_timeout_secs: 5,
  parameters: {
    type: 'object',
    properties: {
      name: leadProps("Homeowner's full name"),
      phone: leadProps('Best contact phone number'),
      email: leadProps('Email for the confirmation'),
      address: leadProps('Home address'),
      monthlyBill: leadProps('Approx monthly electricity bill in dollars, e.g. "240"'),
      homeType: leadProps('single-family, condo, or townhome'),
      ownsRoof: leadProps('yes or no — do they own the roof'),
      creditAbove650: leadProps('yes, no, or unsure'),
      shading: leadProps('Notes about roof shading / trees'),
      utilityProvider: leadProps('Current electricity provider'),
      decisionMakers: leadProps('Other decision makers who should attend'),
      appointmentDateTime: leadProps('Scheduled date & time (only if booked)'),
      appointmentType: leadProps('in-home or virtual'),
      languageBookedIn: leadProps('Language the call was conducted in'),
      status: leadProps('booked or disqualified'),
      disqualReason: leadProps('Short reason if disqualified'),
      notes: leadProps('Any useful color: motivation, objections, etc.'),
    },
    required: ['status'],
  },
}

const conversationConfig = {
  agent: {
    prompt: {
      prompt: systemPrompt,
      llm: 'gpt-4o-mini',
      tools: [submitLeadTool],
    },
    first_message:
      "Hi there, this is Alex — I'm reaching out to a few homeowners in your neighborhood about lowering electricity costs. Do you have a quick minute?",
    language: 'en',
  },
  tts: {
    voice_id: VOICE_ID,
    model_id: 'eleven_flash_v2',
    stability: 0.5,
    speed: 1,
  },
  turn: { turn_timeout: 10 },
  asr: { provider: 'scribe_realtime' },
}

async function call(method, path, body) {
  const res = await fetch(`https://api.elevenlabs.io${path}`, {
    method,
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}\n${text}`)
  return text ? JSON.parse(text) : {}
}

const run = async () => {
  let agentId = AGENT_ID
  if (agentId) {
    console.log(`Updating existing agent ${agentId}…`)
    await call('PATCH', `/v1/convai/agents/${agentId}`, { conversation_config: conversationConfig })
  } else {
    console.log('Creating agent…')
    const created = await call('POST', '/v1/convai/agents/create', {
      name: 'Solar Voice Advisor',
      conversation_config: conversationConfig,
    })
    agentId = created.agent_id || created.agentId
    console.log('Created agent_id:', agentId)
  }

  // Persist AGENT_ID + a public client id for the browser.
  let envText = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const set = (k, v) =>
    new RegExp(`^${k}=.*$`, 'm').test(envText)
      ? (envText = envText.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`))
      : (envText += `\n${k}=${v}\n`)
  set('AGENT_ID', agentId)
  set('VITE_ELEVENLABS_AGENT_ID', agentId)
  set('VITE_USE_SIGNED_URL', 'true')
  writeFileSync(envPath, envText)

  writeFileSync(
    join(root, 'agent', 'agent-config.json'),
    JSON.stringify({ name: 'Solar Voice Advisor', agent_id: agentId, conversation_config: conversationConfig }, null, 2),
  )
  console.log('Wrote AGENT_ID to .env and agent/agent-config.json')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
