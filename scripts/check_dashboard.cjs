/* Rendered modular-dashboard acceptance. Use only scripts/preview.py synthetic assets. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const capture=process.argv.indexOf('--capture'),output=capture<0?null:path.resolve(process.argv[capture+1]),screens=[],checks=[],errors=[];
if(output)fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 async function load(){await page.goto('http://127.0.0.1:8767/?photos=email',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.SkylitDashboard&&SkylitApp.status().weatherReady);await page.evaluate(()=>{SkylitApp.go('overview');const mark=document.createElement('div');mark.textContent='SYNTHETIC PREVIEW · OCT 11, 2026';mark.style.cssText='position:fixed;right:12px;bottom:7px;padding:3px 7px;background:var(--panel);color:var(--ink);font:11px system-ui;border-radius:4px;z-index:1000;pointer-events:none';document.body.append(mark);});}
 const settings=()=>page.evaluate(()=>SkylitApp.openSettings('dashboard'));
 const state=()=>page.evaluate(()=>SkylitDashboard.draft());
 async function snap(id,title){if(!output)return;await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'screenshots',id+'.jpg'),type:'jpeg',quality:86});screens.push({id,title,file:'screenshots/'+id+'.jpg',viewport:await page.evaluate(()=>[innerWidth,innerHeight])});}
 async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
 async function drag(locator,dx,dy){await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:16});await page.mouse.up();}
 await load();await snap('default','Default modules · 1280×720');await settings();await snap('editor','Settings · dashboard editor');await page.locator('#dashboard-gallery').scrollIntoViewIfNeeded();await snap('gallery','Settings · module gallery');await page.locator('#dashboard-editor-grid').scrollIntoViewIfNeeded();await page.evaluate(()=>SkylitApp.setDisplayPreferences({theme:'ocean',mode:'dark'}));await snap('editor-dark','Settings · dashboard editor · Ocean dark');await page.evaluate(()=>SkylitApp.setDisplayPreferences({theme:'linen',mode:'light'}));
 await check('Pointer resize, keyboard movement, collision rejection and explicit Save',async()=>{
  const saved=await page.evaluate(()=>SkylitDashboard.layout()),box=await page.locator('#dashboard-editor-grid').boundingBox();
  await drag(page.locator('[data-module=clock] .dashboard-resize'),-box.width/4,0);assert.equal((await state()).modules.find(x=>x.type==='clock').w,3);
  const move=page.locator('[data-module=clock] .dashboard-move');await move.focus();await page.keyboard.press('Shift+ArrowUp');await page.keyboard.press('ArrowDown');
  const clock=(await state()).modules.find(x=>x.type==='clock');assert.equal(clock.h,3);assert.equal(clock.y,1);
  await drag(move,box.width/4,0);assert.equal((await state()).modules.find(x=>x.type==='clock').x,3);
  await drag(move,box.width/3,0);assert.equal((await state()).modules.find(x=>x.type==='clock').x,3);
  assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),saved);await page.locator('#dashboard-save').click();assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),await state());
 });
 await check('Reload persistence, discard, undo and all nine gallery modules',async()=>{
  const saved=await page.evaluate(()=>SkylitDashboard.layout());await load();assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),saved);await settings();
  await page.locator('#overview-preset').selectOption('photos');await page.locator('#dashboard-discard').click();assert.deepEqual(await state(),saved);
  await page.locator('[data-type=note]').click();assert.equal((await state()).modules.length,5);await page.locator('#dashboard-undo').click();assert.deepEqual(await state(),saved);
  for(const type of ['forecast','note','shopping','countdowns','timers'])await page.locator('[data-type='+type+']').click();assert.equal((await state()).modules.length,9);await page.locator('#dashboard-save').click();
  await page.evaluate(()=>SkylitApp.openSettings('household'));await page.locator('#household-note-input').fill('Please water the herbs after breakfast.');await page.locator('#household-note-save').click();await page.locator('#countdown-title').fill('Weekend picnic');await page.locator('#countdown-date').fill('2026-10-17');await page.locator('#countdown-form button').click();await page.evaluate(()=>SkylitApp.go('household'));await page.locator('#shopping-input').fill('Apples');await page.locator('#shopping-add button').click();await page.locator('#timer-add button').click();await page.evaluate(()=>SkylitApp.go('overview'));
  assert.match(await page.locator('.dashboard-note').innerText(),/water the herbs/);assert.equal(await page.locator('.dashboard-shopping').count(),1);await page.locator('.dashboard-shopping').click();assert.equal(await page.locator('.dashboard-shopping').count(),0);assert.match(await page.locator('.dashboard-countdown').innerText(),/Weekend picnic/);assert.match(await page.locator('[data-dashboard-timer]').innerText(),/\d+:\d+/);await snap('nine-modules','Nine modules · shared local data');
 });
 await check('Gallery drag, automatic scroll, empty dashboard and storage-failure preservation',async()=>{
  await settings();while((await state()).modules.length)await page.locator('#dashboard-remove').click();await page.locator('#dashboard-save').click();await page.evaluate(()=>SkylitApp.closeSettings());assert.equal(await page.locator('.dashboard-empty').isVisible(),true);await settings();
  const handle=page.locator('.dashboard-gallery-card').filter({has:page.locator('[data-type=note]')}).locator('.dashboard-gallery-drag');await handle.scrollIntoViewIfNeeded();let rect=await handle.boundingBox();await page.mouse.move(rect.x+22,rect.y+22);await page.mouse.down();const scroll=await page.locator('.settings-content').boundingBox();await page.mouse.move(scroll.x+scroll.width/2,scroll.y+10,{steps:10});await page.waitForTimeout(1400);
  const grid=await page.locator('#dashboard-editor-grid').boundingBox();assert.ok(grid.y<scroll.y+scroll.height);await page.mouse.move(grid.x+grid.width/6,Math.max(scroll.y+50,grid.y+grid.height/6),{steps:15});await page.mouse.up();assert.equal((await state()).modules.some(x=>x.type==='note'),true);
  await page.evaluate(()=>{window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,...args){if(key==='skylit.dashboard')throw Error('Synthetic full storage');return window.originalStorageSet.call(this,key,...args);};});await page.locator('#dashboard-save').click();assert.match(await page.locator('#dashboard-editor-status').innerText(),/Could not save/);assert.equal((await page.evaluate(()=>SkylitDashboard.layout())).modules.length,0);await page.evaluate(()=>Storage.prototype.setItem=window.originalStorageSet);await page.locator('#dashboard-save').click();
 });
 await check('Resize cancellation and invalid numeric inputs preserve the draft',async()=>{
  const before=await state(),resize=page.locator('[data-module=note] .dashboard-resize');await resize.scrollIntoViewIfNeeded();const r=await resize.boundingBox();await page.mouse.move(r.x+22,r.y+22);await page.mouse.down();await page.mouse.move(r.x+80,r.y+40,{steps:4});await page.dispatchEvent('body','pointercancel',{pointerId:1});await page.mouse.up();assert.deepEqual(await state(),before);await page.locator('#dashboard-width').fill('1');await page.locator('#dashboard-width').dispatchEvent('change');assert.deepEqual(await state(),before);
 });
 await settings();await page.locator('#overview-preset').selectOption('balanced');await page.locator('#dashboard-save').click();
 const all=await page.evaluate(()=>SkylitDashboardModel.arrange({modules:SkylitDashboardModel.catalog.map(x=>({type:x.type}))}));
 for(const [width,height] of [[960,540],[1024,640],[1280,720],[1280,800],[1440,900],[1600,900],[1920,1080],[1920,1200],[390,844]])for(const profile of ['standard','large']){
  await check('Nine-module geometry '+width+'×'+height+' '+profile,async()=>{
   await page.setViewportSize({width,height});await page.evaluate(([all,profile])=>{localStorage.setItem('skylit.dashboard',JSON.stringify(all));const frame=JSON.parse(localStorage.getItem('skylit.frame')||'{}');frame.text=profile;localStorage.setItem('skylit.frame',JSON.stringify(frame));},[all,profile]);await load();await page.waitForTimeout(150);
   const geometry=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,modules:Array.from(document.querySelectorAll('.dashboard-module:not([hidden])')).map(n=>({type:n.dataset.module,width:n.clientWidth,scroll:n.scrollWidth,rect:n.getBoundingClientRect().toJSON()}))}));assert.ok(geometry.pageWidth<=width+1);if(width>=800)assert.ok(geometry.pageHeight<=height+1);assert.equal(geometry.modules.length,9);for(const module of geometry.modules){assert.ok(module.scroll<=module.width+1,module.type);assert.ok(module.rect.width>0&&module.rect.height>0);if(width>=800)assert.ok(module.rect.bottom<=height+1);}
   if(profile==='standard'||width===960)await snap('modules-'+width+'x'+height+'-'+profile,'Nine modules · '+width+'×'+height+' · '+profile);await settings();assert.ok(await page.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  });
 }
 await check('Every module at its minimum and full size, in varied positions',async()=>{
  await page.setViewportSize({width:1280,height:720});for(const definition of await page.evaluate(()=>SkylitDashboardModel.catalog))for(const big of [false,true]){
   await page.evaluate(([d,big])=>localStorage.setItem('skylit.dashboard',JSON.stringify({version:1,modules:[{type:d.type,x:big?0:8,y:big?0:7,w:big?12:d.minW,h:big?12:d.minH}]})),[definition,big]);await load();await page.waitForTimeout(100);const module=page.locator('.dashboard-module[data-module='+definition.type+']');assert.ok(await module.evaluate(n=>n.scrollWidth<=n.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));await snap(definition.type+'-'+(big?'large':'small'),definition.name+' · '+(big?'full dashboard':'minimum size'));
  }
 });
 assert.deepEqual(errors,[]);await browser.close();if(output)fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify({date:'2026-10-11',version:'2.14.0',synthetic:true,checks,runtimeErrors:errors,screenshots:screens},null,2));console.log(JSON.stringify({checks:checks.length,screenshots:screens.length,runtimeErrors:errors.length}));
})().catch(error=>{console.error(error);process.exitCode=1;setTimeout(()=>process.exit(1),500);});
