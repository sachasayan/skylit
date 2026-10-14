/* Regenerates website imagery from the synthetic preview only (scripts/preview.py).
   Usage: python3 scripts/preview.py --port 8791 & node scripts/capture_site.cjs [--port 8791]
   Never point this at a household frame or a page using web/local-config.js. */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.SKYLIT_PLAYWRIGHT || 'playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'site', 'img');
const portArg = process.argv.indexOf('--port');
const BASE = 'http://127.0.0.1:' + (portArg < 0 ? 8767 : process.argv[portArg + 1]);
const launch = { headless: true, ...(process.env.SKYLIT_CHROME ? { executablePath: process.env.SKYLIT_CHROME } : {}) };

async function demo(browser, { width = 1280, height = 720, scale = 1.5, query = '?photos=email', setup } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, timezoneId: 'Europe/London' });
  await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto(BASE + '/' + query, { waitUntil: 'load' });
  if (setup) { await page.evaluate(setup); await page.reload(); }
  await page.waitForFunction(() => window.SkylitDashboard && SkylitApp.status().weatherReady);
  if (!(await page.evaluate(() => typeof demoPhotos !== 'undefined' || !!document.querySelector('script[src="demo.js"]')))) throw new Error('Not the synthetic preview');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  return { page, context };
}

// Encode any PNG/JPEG buffer to WebP with Chrome's canvas encoder.
let encoder;
async function webp(buffer, file, { width, quality = 0.84 } = {}) {
  const mime = buffer[0] === 0x89 ? 'image/png' : 'image/jpeg';
  const data = await encoder.evaluate(async ([b64, mime, width, quality]) => {
    const img = new Image(); img.src = `data:${mime};base64,${b64}`; await img.decode();
    const w = width && img.naturalWidth > width ? width : img.naturalWidth, h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
    return { url: c.toDataURL('image/webp', quality), w, h };
  }, [buffer.toString('base64'), mime, width, quality]);
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data.url.split(',')[1], 'base64'));
  console.log('wrote', file, data.w + '×' + data.h);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(launch);
  encoder = await browser.newPage();

  // Hero carousel: the app's main screens at the frame's 1280×720 viewport, rendered 2×.
  {
    const { page, context } = await demo(browser, { scale: 2 });
    await webp(await page.screenshot(), 'hero-overview.webp', { width: 2200 });
    await page.evaluate(() => { SkylitPhotos.setSource('email'); SkylitApp.go('photos'); }); await page.waitForTimeout(900);
    await webp(await page.screenshot(), 'hero-photos.webp', { width: 2200 });
    await page.evaluate(() => SkylitApp.go('calendar')); await page.waitForTimeout(900);
    await webp(await page.screenshot(), 'hero-calendar.webp', { width: 2200 });
    await page.evaluate(() => SkylitApp.go('weather')); await page.waitForTimeout(700);
    await webp(await page.screenshot(), 'hero-weather.webp', { width: 2200 });
    await context.close();
  }

  // Overview in every palette, light and dark.
  {
    const { page, context } = await demo(browser);
    for (const theme of ['linen', 'sage', 'stone', 'ocean', 'plum', 'contrast']) for (const mode of ['light', 'dark']) {
      await page.evaluate(([theme, mode]) => SkylitApp.setDisplayPreferences({ theme, mode }), [theme, mode]); await page.waitForTimeout(500);
      await webp(await page.screenshot(), `palette-${theme}-${mode}.webp`, { width: 1600, quality: 0.8 });
    }
    await context.close();
  }

  // Live dashboard editor.
  {
    const { page, context } = await demo(browser);
    await page.evaluate(() => SkylitApp.openSettings('dashboard')); await page.waitForTimeout(900);
    await webp(await page.screenshot(), 'dashboard-editor.webp', { width: 1600 });
    await context.close();
  }

  // The four clock styles, full-size module only.
  for (const style of ['classic', 'analog', 'stacked', 'digital']) {
    const { page, context } = await demo(browser, { setup: new Function(`localStorage.setItem('skylit.dashboard', JSON.stringify({ version: 1, modules: [{ type: 'clock', style: '${style}', x: 0, y: 0, w: 12, h: 12 }] }))`) });
    await webp(await page.locator('.dashboard-module[data-module=clock]').screenshot(), `clock-${style}.webp`, { width: 900 });
    await context.close();
  }

  // Slideshow styles without player chrome.
  for (const [file, style] of [['slideshow-prints.webp', 'stack'], ['slideshow-collage.webp', 'collage']]) {
    const { page, context } = await demo(browser);
    await page.evaluate(style => { SkylitPhotos.setSource('email'); SkylitApp.go('photos'); SkylitPhotos.close(); SkylitLibrary.setOptions({ collection: 'recent', style, layout: 'single', transition: 0, order: 'newest', resume: false, motion: false }); SkylitApp.closeSettings(); SkylitPhotos.open(false, 0, true); }, style);
    await page.waitForFunction(() => SkylitPlayer.status().ready);
    await page.addStyleTag({ content: '.photo-player-controls,.photo-player-bar,.photo-player-label{display:none!important}' });
    await page.waitForTimeout(900);
    await webp(await page.screenshot(), file, { width: 1600 });
    await context.close();
  }

  // Momo poses straight from the canvas (transparent), each mid-reaction.
  for (const [file, hat, clicks, weather, wait] of [['momo-hello.webp', 'leaf', 1, '', 700], ['momo-sneeze.webp', 'earmuffs', 6, '', 1300], ['momo-dance.webp', 'party', 7, '', 900], ['momo-rain.webp', 'bucket', 0, 'rain', 600]]) {
    const { page, context } = await demo(browser, { width: 400, height: 300, scale: 2, setup: new Function(`localStorage.setItem('skylit.momo', JSON.stringify({ hat: '${hat}', motion: 'lively', routine: false }))`) });
    if (weather) await page.evaluate(w => { window.MomoRoutine.weather = () => w; }, weather);
    for (let i = 0; i < clicks; i++) { await page.evaluate(() => document.getElementById('momo').click()); await page.waitForTimeout(i < clicks - 1 ? 40 : 0); }
    await page.waitForTimeout(wait);
    const png = await page.evaluate(() => document.getElementById('momo-canvas').toDataURL('image/png'));
    await webp(Buffer.from(png.split(',')[1], 'base64'), file, { quality: 0.9 });
    await context.close();
  }

  // Committed synthetic phone-app review screenshots.
  const phone = path.join(ROOT, 'docs/reviews/2026-10-13-phone-implementation/screenshots');
  for (const name of ['photos-430', 'collections-430', 'slideshow-430', 'editor-430']) await webp(fs.readFileSync(path.join(phone, name + '.png')), `phone-${name.replace('-430', '')}.webp`, { quality: 0.86 });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
