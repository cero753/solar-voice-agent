// Netlify serverless function: mints a short-lived ElevenLabs signed URL so the
// browser can start a private-agent conversation without ever seeing the API key.
export default async () => {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.AGENT_ID
  if (!apiKey || !agentId) {
    return Response.json({ error: 'Missing ELEVENLABS_API_KEY or AGENT_ID' }, { status: 500 })
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { 'xi-api-key': apiKey } },
  )

  if (!res.ok) {
    const text = await res.text()
    return Response.json({ error: `ElevenLabs ${res.status}: ${text}` }, { status: res.status })
  }

  const data = (await res.json()) as { signed_url?: string }
  return Response.json({ signedUrl: data.signed_url })
}
