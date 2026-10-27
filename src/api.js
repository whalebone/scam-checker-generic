// The Scam-Check backend (github.com/whalebone/scam-check, api/swagger.yml): POST /v1/scam-check and
// POST /v1/feedback. VITE_API_URL turns it on (see .env.example); without it the page only knows the example.
// Calls go through the backend's front door (wb-auth-proxy): the integration token goes raw into
// Authorization (no "Bearer"), and every answer brings a fresh one in Wb-Token for the next call.

const API_URL = import.meta.env.VITE_API_URL ?? ''
export const live = Boolean(API_URL)

// For local testing only: a build puts it into the public JavaScript. Production needs a token source.
const TOKEN = import.meta.env.VITE_API_TOKEN ?? ''
let token = TOKEN // then the one from Wb-Token, which lasts 15 minutes

export const MAX_LENGTH = 4000 // the backend refuses longer messages
// The backend takes one image of up to 5 MB. Less here: as base64 it grows by a third, and Netlify
// refuses a request to its function above 6 MB. image.js sends far less anyway.
export const MAX_IMAGE = 4 * 1024 * 1024

// The backend's threat types that match one of the page's seven (SCAM_TYPES in scenes.js).
// Romance, tech support and the fake bank adviser have no threat type yet; the others get the plain Trickser.
const TYPES = {
  parcel_delivery: 'parcel_scam',
  credential_phishing: 'account_phishing',
  banking_phishing: 'account_phishing',
  family_emergency: 'family_impersonation',
  investment_crypto: 'fake_profit',
}
export const scamType = (threatType) => TYPES[threatType] ?? null

// A failed call, as the page words it (strings.js error.*): quota (the user's daily checks are used up),
// busy (a rate limit) or failed (anything else: offline, timeout, token, server).
export class CheckError extends Error {
  constructor(kind, detail) {
    super(detail)
    this.kind = kind
  }
}

async function post(path, body, timeout) {
  let res
  try {
    res = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: token }) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    })
  } catch (error) {
    throw new CheckError('failed', error.name) // offline, timeout, or blocked by CORS
  }
  if (res.status === 401 && token !== TOKEN) {
    token = TOKEN // the page sat idle longer than the refreshed token lasts: start over once
    return post(path, body, timeout)
  }
  token = res.headers.get('Wb-Token') || token
  if (res.ok) return res.json()

  // The service answers in a JSON envelope with an error_code; the front door's 401 and 429 are plain text.
  const reply = await res.text()
  let code = ''
  try {
    code = JSON.parse(reply).error_code ?? ''
  } catch {}
  const kind = res.status !== 429 ? 'failed' : code === 'QUOTA_EXCEEDED' ? 'quota' : 'busy'
  throw new CheckError(kind, `${res.status} ${code || reply}`)
}

// The text, the screenshot ({ mime_type, data } from image.js) or both; the answer comes in the page's language.
// The backend answers within 5 s (a model failure or an overrun is a caution answer with fallback: true);
// the rest is for the network, and a screenshot takes longer to send from a phone.
export const checkMessage = (text, language, image = null) =>
  post('/v1/scam-check', { ...(text && { message: text }), language, ...(image && { image }) }, image ? 25000 : 15000)

// One after the other: the backend keeps the last rating, so the reason must not overtake the bare "Nein".
// Not worth bothering the user about: a lost rating is only logged.
let feedbackSent = Promise.resolve()
export function sendFeedback(feedback) {
  feedbackSent = feedbackSent
    .then(() => post('/v1/feedback', feedback, 10000))
    .catch((error) => console.warn('POST /v1/feedback failed', error.message))
}
