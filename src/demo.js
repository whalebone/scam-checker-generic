// The example message and the answer the backend would give for it, in the backend's own shape
// (POST /v1/scam-check, see api.js), so the example and real messages run through the same page code.
// The example keeps this answer when the real backend is on, too.
// Each language gets the parcel scam of its own market: German customs (zoll.de), Indonesian customs
// (beacukai.go.id), Cambodian customs (customs.gov.kh). English stays international, so it names no real site.

const DOMAIN = 'parcel-fee.info'

// The link gets its own line, so the domain isn't split across lines.
export const EXAMPLES = {
  en: `Your parcel is being held at customs. Please pay the $2.99 fee today or it will be returned:\nhttps://${DOMAIN}/c/8K2P`,
  de: `Ihr Paket wird beim Zoll festgehalten. Bitte zahlen Sie heute 2,99 € Gebühr, sonst wird es zurückgeschickt:\nhttps://${DOMAIN}/c/8K2P`,
  id: `Paket Anda tertahan di Bea Cukai. Silakan bayar biaya Rp15.000 hari ini, jika tidak paket akan dikembalikan:\nhttps://${DOMAIN}/c/8K2P`,
  km: `កញ្ចប់អីវ៉ាន់របស់អ្នកត្រូវបានឃាត់ទុកនៅគយ។ សូមបង់ថ្លៃសេវា $2.99 នៅថ្ងៃនេះ បើមិនដូច្នោះទេ វានឹងត្រូវបញ្ជូនត្រឡប់វិញ៖\nhttps://${DOMAIN}/c/8K2P`,
}

// What every answer shares: a parcel scam (scamType() in api.js maps the threat type).
const SCAM = { verdict: 'scam', threat_type: 'parcel_delivery' } // verdict: scam | caution | legit

const ANSWERS = {
  en: {
    ...SCAM,
    impersonated_entity: 'Customs',
    summary: 'Steer clear. This is a scam.',
    // It names the scam domain and, where there is one, the official one; the page marks both.
    explanation: `The link leads to ${DOMAIN}, not to a real customs website. The $2.99 fee is just bait for your card details.`,
    official_domains: [],
    what_to_do: ['Don’t tap the link.', 'Delete the text.'],
    if_already_happened: ['Already entered your details? Call your bank straight away to block your card.'],
  },
  de: {
    ...SCAM,
    impersonated_entity: 'Zoll',
    summary: 'Finger weg. Das ist Betrug.',
    explanation: `Der Link führt zu ${DOMAIN}, nicht zum echten zoll.de. Die 2,99 € sind nur der Köder für deine Kartendaten.`,
    official_domains: ['zoll.de'],
    what_to_do: ['Tipp nicht auf den Link.', 'Lösch die SMS.'],
    if_already_happened: ['Schon Daten eingegeben? Lass deine Karte sperren: 116 116'],
  },
  id: {
    ...SCAM,
    impersonated_entity: 'Bea Cukai',
    summary: 'Abaikan saja. Ini penipuan.',
    explanation: `Link-nya mengarah ke ${DOMAIN}, bukan ke situs resmi beacukai.go.id. Biaya Rp15.000 itu cuma umpan untuk data kartumu.`,
    official_domains: ['beacukai.go.id'],
    what_to_do: ['Jangan klik link-nya.', 'Hapus SMS-nya.'],
    if_already_happened: ['Telanjur memasukkan data kartu? Segera hubungi bankmu untuk memblokir kartu.'],
  },
  km: {
    ...SCAM,
    impersonated_entity: 'គយ',
    summary: 'ចៀសឆ្ងាយ។ នេះជាការបោក⁠ប្រាស់។',
    explanation: `តំណនេះនាំទៅ ${DOMAIN} មិនមែនគេហទំព័រផ្លូវការ customs.gov.kh ទេ។ ថ្លៃ $2.99 គ្រាន់តែជានុយសម្រាប់ព័ត៌មានកាតរបស់អ្នក។`,
    official_domains: ['customs.gov.kh'],
    what_to_do: ['កុំចុចតំណ។', 'លុប SMS នេះចោល។'],
    if_already_happened: ['បានបញ្ចូលព័ត៌មានរួច⁠ហើយ? សូមទូរស័ព្ទទៅធនាគាររបស់អ្នកភ្លាមៗ ដើម្បីបិទកាត។'],
  },
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The demo recognises the example by its link, so small edits still work.
export const isExample = (text) => text.includes(DOMAIN)

export async function checkMessage(text, language) {
  await wait(5000) // the backend's deadline; it usually answers in 2–3 s
  return {
    answer_id: `sc_${crypto.randomUUID()}`,
    answer: { ...ANSWERS[language], language },
    fallback: false,
    // Not in the backend yet (asked for): the domains in the message and Whalebone's threat-intelligence
    // signal for each (strong · weak · none · trusted). strong = on the blocklist the protection uses.
    links: [{ domain: DOMAIN, signal: 'strong' }],
  }
}

// POST /v1/feedback, only logged for the example.
export function sendFeedback(feedback) {
  console.info('POST /v1/feedback', feedback)
}
