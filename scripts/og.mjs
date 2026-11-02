// Renders public/og.jpg, the 1200×630 link preview, from the page's own assets, colours and texts.
// Run after changing the hero title, the logo or the colours in src/brand.js: npm run og
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { BRAND } from '../src/brand.js'
import { STRINGS } from '../src/strings.js'

const asset = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url)).toString('base64')
const font = (file) => `data:font/woff2;base64,${asset(`fonts/${file}`)}`
const others = ['de', 'id', 'km'].map((l) => `<span lang="${l}">${STRINGS[l]['hero.title']}</span>`).join(' · ')

// Everything that matters sits in the centre 630 px square: WhatsApp crops small previews to it.
const html = `<!doctype html><html><head><style>
@font-face { font-family: 'Figtree'; src: url(${font('Figtree-Latin.woff2')}); font-weight: 300 900; }
@font-face { font-family: 'Noto Sans Khmer'; src: url(${font('NotoSansKhmer.woff2')}); font-weight: 100 900; }
html, body { margin: 0; }
body { width: 1200px; height: 630px; position: relative; overflow: hidden; color: #fff;
  font-family: 'Figtree', 'Noto Sans Khmer', Arial, sans-serif; background: ${BRAND.gradient}; }
.rings { position: absolute; width: 900px; height: 900px; right: -420px; top: -330px; border-radius: 50%;
  background: repeating-radial-gradient(circle, transparent 0 70px, rgb(255 255 255 / 0.1) 70px 73px);
  mask: radial-gradient(circle, #000 25%, transparent 70%); }
main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.bar { display: flex; align-items: center; gap: 14px; margin-bottom: 36px; }
.bar img { width: 60px; }
.bar span { font-weight: 800; font-size: 40px; }
h1 { margin: 0; font-weight: 900; font-size: 92px; line-height: 1; }
p { margin: 26px 0 0; font-weight: 700; font-size: 30px; line-height: 1.6; color: ${BRAND.colors.accent}; }
</style></head><body>
<div class="rings"></div>
<main>
  <div class="bar"><img src="data:image/svg+xml;base64,${asset('logo.svg')}"><span>${STRINGS.en.product}</span></div>
  <h1>${STRINGS.en['hero.title']}</h1>
  <p>${others}</p>
</main>
</body></html>`

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: fileURLToPath(new URL('../public/og.jpg', import.meta.url)), type: 'jpeg', quality: 86 })
await browser.close()
console.log('Wrote public/og.jpg')
