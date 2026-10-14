'use strict';
// Synthetic interaction regression: no private frame data or timing-dependent budget.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});try{
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto(process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767/?photos=email');
await page.waitForFunction(()=>window.SkylitDashboard&&window.SkylitSettingsInteractions);
await page.evaluate(()=>{SkylitApp.openSettings('dashboard');window.perfProbe={reads:0,composes:0,events:0};const read=SkylitClock.read,compose=SkylitClock.composeLandscape;SkylitClock.read=(...args)=>{perfProbe.reads++;return read(...args)};SkylitClock.composeLandscape=(...args)=>{perfProbe.composes++;return compose(...args)};window.addEventListener('skylit-dashboard-draft',()=>perfProbe.events++);});
assert.ok(await page.locator('.dashboard-move,.dashboard-resize').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).touchAction==='none')),'Native touch handles must prevent WebView pan/zoom cancellation');
// Generous touch area with the existing small visual mark and accessible delete.
await page.locator('.dashboard-editor-tile[data-module=clock] .dashboard-move').click();
const handle=page.locator('.dashboard-editor-tile[data-module=clock] .corner-se');
assert.deepEqual(await handle.evaluate(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height,mark:n.querySelector('span').getBoundingClientRect().width})),{w:64,h:64,mark:10});
const hit=await handle.boundingBox();
assert.ok(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y).closest('.corner-se'),{x:hit.x+8,y:hit.y+32}),'Finger can hit the invisible area beyond the corner mark');
const trash=await page.locator('.dashboard-editor-tile[data-module=clock] .dashboard-delete').boundingBox();
assert.ok(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y).closest('.dashboard-delete'),{x:trash.x+4,y:trash.y+4}),'Resize target must not cover the delete button');
for(const mode of ['move','resize']){
 const selector='.dashboard-editor-tile[data-module=clock] '+(mode==='move'?'.dashboard-move':'.corner-se');
 const box=await page.locator(selector).boundingBox(),point={x:box.x+box.width/2,y:box.y+box.height/2};
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(200);
 await page.evaluate(({x,y})=>{Object.assign(perfProbe,{reads:0,composes:0,events:0});for(let i=0;i<16;i++)document.dispatchEvent(new PointerEvent('pointermove',{clientX:x+1,clientY:y+1,pointerId:1,buttons:1,bubbles:true}));},point);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.deepEqual(await page.evaluate(()=>perfProbe),{reads:0,composes:0,events:0},mode+': unchanged grid cell must not repaint or refresh Settings');
 await page.evaluate(({x,y})=>document.dispatchEvent(new PointerEvent('pointercancel',{clientX:x,clientY:y,pointerId:1,bubbles:true})),point);await page.mouse.up();
}
// Release before the scheduled frame must commit the newest position; cancel must not.
for(const cancel of [false,true]){
 const saved=await page.evaluate(()=>SkylitDashboard.layout());
 const box=await page.locator('.dashboard-editor-tile[data-module=clock] .corner-se').boundingBox();
 const grid=await page.locator('#dashboard-editor-grid').boundingBox();
 const x=box.x+box.width/2,y=box.y+box.height/2,end=x-grid.width/12;
 await page.mouse.move(x,y);await page.mouse.down();
 await page.evaluate(async({end,y,cancel})=>{
   Object.assign(perfProbe,{reads:0,composes:0,events:0});
   document.dispatchEvent(new PointerEvent('pointermove',{clientX:end,clientY:y,pointerId:1,buttons:1,bubbles:true}));
   if(cancel){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(perfProbe.reads||perfProbe.composes||perfProbe.events)throw new Error('Live resize must reuse rendered contents without clock/Settings updates');const copy=document.querySelector('.dashboard-live-frame').contentDocument.querySelector('[data-module=clock]');if(!copy.style.transform.includes('scale('))throw new Error('Live resize must transform the existing preview');}
   document.dispatchEvent(new PointerEvent(cancel?'pointercancel':'pointerup',{clientX:end,clientY:y,pointerId:1,bubbles:true}));
 },{end,y,cancel});await page.mouse.up();
 const after=await page.evaluate(()=>SkylitDashboard.layout());
 if(cancel)assert.deepEqual(after,saved,'Cancellation must discard queued resize');
 else assert.equal(after.modules.find(m=>m.type==='clock').w,saved.modules.find(m=>m.type==='clock').w-1,'Release must flush queued resize');
 assert.deepEqual(await page.evaluate(()=>SkylitDashboard.draft()),after);
}
await page.evaluate(()=>{SkylitApp.closeSettings();Object.assign(perfProbe,{reads:0,composes:0,events:0});SkylitApp.openSettings('general')});
assert.equal(await page.evaluate(()=>perfProbe.reads),0,'Hidden dashboard must not refresh its clock on Settings navigation');
console.log('PASS unchanged-cell drag/resize and hidden-dashboard work boundaries');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
