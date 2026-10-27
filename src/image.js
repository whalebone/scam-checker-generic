// A picked or pasted screenshot, made ready for the backend (api.js): one JPEG on white, as plain base64.
// Drawing it anew means anything the browser can show works (HEIC on an iPhone, GIF), the declared
// type always matches the bytes, location data (EXIF) stays on the phone, and the request stays small.
import { MAX_IMAGE } from './api.js'

const MAX_PIXELS = 4_000_000 // a phone screenshot (3–4.5 megapixels) keeps almost all of its detail

export async function readImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode() // fails for anything the browser can't show
    const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (img.naturalWidth * img.naturalHeight)))
    const canvas = Object.assign(document.createElement('canvas'), {
      width: Math.round(img.naturalWidth * scale),
      height: Math.round(img.naturalHeight * scale),
    })
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff' // or a transparent PNG turns black
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? ''
    if (!data || (data.length * 3) / 4 > MAX_IMAGE) throw new Error(`${canvas.width}×${canvas.height} px gave no image that fits`)
    return { mime_type: 'image/jpeg', data }
  } finally {
    URL.revokeObjectURL(url)
  }
}
