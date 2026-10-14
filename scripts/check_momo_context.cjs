/* Synthetic scenes only. No real location or frame data. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const out=process.argv[2]||'docs/reviews/2026-10-13-momo-context';fs.mkdirSync(out+'/momo',{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.SKYLIT_CHROME});const errors=[];
for(const scene of ['camera','calendar','rain','frost','night','still']){
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.addInitScript(({scene})=>{localStorage.setItem('skylit.momo',JSON.stringify({hat:'beret',motion:scene==='still'?'still':'gentle',routine:true}));},{scene});await page.goto(process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8848');await page.waitForFunction(()=>window.Momo&&window.SkylitUI);
if(scene==='night'){await page.evaluate(()=>{const original=MomoRoutine.at;MomoRoutine.at=(...args)=>({...original(...args),period:'night'});Momo.greet();SkylitApp.go('photos');});}
else if(['camera','calendar','still'].includes(scene))await page.evaluate(s=>SkylitApp.go(s==='calendar'?'calendar':'photos'),scene);
else await page.evaluate(s=>{const old=SkylitUI.weather.get();SkylitUI.weather.set({...old,data:{...old.data,fetchedAt:Date.now(),current:{...old.data?.current,temperature_2m:s==='frost'?-4:14,weather_code:61}}});},scene);
await page.waitForTimeout(750);const status=await page.evaluate(()=>Momo.status());assert.equal(status.hat,'beret');if(scene==='night')assert.equal(status.expression,'sleepy');else if(scene==='still')assert.notEqual(status.context,'camera');else assert.equal(status.context,scene);
await page.locator('#momo-canvas').screenshot({path:out+'/momo/'+scene+'.png'});await page.screenshot({path:out+'/momo/'+scene+'-frame.png'});
if(scene==='camera'){await page.evaluate(()=>SkylitApp.go('calendar'));assert.equal((await page.evaluate(()=>Momo.status())).context,'camera');}
if(scene==='still'){const a=await page.evaluate(()=>Momo.status().frames);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>Momo.status().frames),a);}
await page.close();}
assert.deepEqual(errors,[]);await browser.close();console.log('Momo: six scenes, fixed accessory, competing page request, still-mode render bound, no runtime errors.');})().catch(e=>{console.error(e);process.exit(1)});
