/* Renders website icons and the Open Graph card.
   node scripts/render_site_meta.cjs
   Inputs are committed site assets (favicon.svg, synthetic screenshots) and web/ fonts. */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.SKYLIT_PLAYWRIGHT || 'playwright');
const ROOT = path.resolve(__dirname, '..'), SITE = path.join(ROOT, 'site');
const MIME = { '.ttf': 'font/ttf', '.webp': 'image/webp' };
// Inline assets: a setContent page cannot load file:// URLs.
const url = p => `data:${MIME[path.extname(p)]};base64,` + fs.readFileSync(path.join(ROOT, p)).toString('base64');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.SKYLIT_CHROME ? { executablePath: process.env.SKYLIT_CHROME } : {}), args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.route('**/*', r => r.request().url().startsWith('file://') || r.request().url().startsWith('data:') ? r.continue() : r.abort());
  fs.mkdirSync(path.join(SITE, 'icons'), { recursive: true });
  const svg = fs.readFileSync(path.join(SITE, 'favicon.svg'), 'utf8');

  // Icons: transparent small sizes, warm tile for touch/maskable icons.
  for (const [file, size, tile, pad] of [['icon-32.png', 32, false, 0], ['apple-touch-icon.png', 180, true, .16], ['icon-192.png', 192, true, .14], ['icon-512.png', 512, true, .14], ['icon-maskable-512.png', 512, true, .24]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;width:${size}px;height:${size}px;background:${tile ? '#eee8dd' : 'transparent'};display:grid;place-items:center}svg{width:${(1 - pad * 2) * 100}%;height:auto}</style>${svg}`);
    await page.screenshot({ path: path.join(SITE, 'icons', file), omitBackground: !tile });
  }

  // Open Graph card, 1200×630.
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><style>
    @font-face{font-family:D;src:url('${url('web/clock-display.ttf')}')}
    @font-face{font-family:S;src:url('${url('web/clock-sans.ttf')}')}
    html,body{margin:0;width:1200px;height:630px;overflow:hidden}
    body{position:relative;background:radial-gradient(700px 420px at 15% 10%,rgba(200,100,63,.45),transparent 60%),radial-gradient(600px 420px at 95% 40%,rgba(234,168,100,.35),transparent 60%),#241f1c;color:#f2e7d5;font-family:S}
    .copy{position:absolute;left:70px;top:150px;width:520px}
    .momo{width:150px;margin:-60px 0 6px -8px}
    h1{font:500 112px/1 D;margin:0;letter-spacing:-.02em}
    p{font-size:30px;line-height:1.3;margin:20px 0 0;color:#e7cfae}
    .device{position:absolute;right:-90px;top:96px;width:700px;padding:12px;border-radius:24px;background:linear-gradient(150deg,#4a3b30,#1c1612);box-shadow:0 50px 90px -30px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,226,190,.15);transform:perspective(1600px) rotateY(-20deg) rotateX(6deg)}
    .device img{display:block;width:100%;border-radius:14px}
    .hills{position:absolute;left:0;right:0;bottom:0;height:120px}
  </style>
  <div class="copy"><img class="momo" src="${url('site/img/momo-hello.webp')}"><h1>Skylit</h1><p>Your photo frame is<br>now your home base</p></div>
  <div class="device"><img src="${url('site/img/hero-overview.webp')}"></div>
  <svg class="hills" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 70C220 30 420 20 640 50S1000 20 1200 40V120H0Z" fill="#5a4334"/><path d="M0 100C260 70 520 80 800 96S1080 80 1200 86V120H0Z" fill="#3d4430"/></svg>`);
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode())]));
  await page.screenshot({ path: path.join(SITE, 'og-image.jpg'), type: 'jpeg', quality: 88 });

  await browser.close();
  console.log('Rendered icons and og-image.jpg');
})().catch(e => { console.error(e); process.exit(1); });
