'use strict';
const {chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767',out=process.argv[2];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(()=>{if(!localStorage.getItem('selection-test-seeded')){localStorage.setItem('skylit.slideshow',JSON.stringify({version:1,options:{collection:'all',style:'collage'}}));localStorage.setItem('selection-test-seeded','yes');}});
  await page.goto(origin+'/?photos=email');await page.waitForFunction(()=>window.SkylitLibrary&&window.SkylitSettingsInteractions);
  assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('skylit.slideshow'));return [s.version,s.options.collection,s.options.maximum,s.options.style]}),[2,'recent',30,'collage']);
  assert.equal(await page.locator('#include-skylight-photos').count(),0);
  await page.evaluate(()=>SkylitApp.openSettings('photo-slideshow'));
  assert.deepEqual(await page.locator('#photo-retention option').evaluateAll(nodes=>nodes.map(n=>n.value)),['12','30','60','90']);
  assert.equal(await page.locator('#photo-count-title').textContent(),'Pictures to include');
  assert.ok((await page.locator('#photo-count-description').textContent()).includes('Keepers'));
  assert.equal(await page.locator('[data-choice-for=photo-retention]').count(),0);
  for(const maximum of [12,60,90,30]){
   await page.locator('#photo-retention').selectOption(String(maximum));
   assert.equal(await page.evaluate(()=>SkylitLibrary.options().maximum),maximum);
  }
  await page.evaluate(()=>{
   const pictures=SkylitDemoPhotos.photos,template=pictures[0];
   for(let i=6;i<=506;i++)pictures.push({...template,id:i.toString(16).padStart(64,'0'),at:Date.now()-i*86400000});
   pictures.push({...template,id:'a'.repeat(64),at:1,keeper:true},{...template,id:'b'.repeat(64),at:2,keeper:true});
   pictures[1].pending=true;Skylit.photoExclude(pictures[0].id,true);SkylitPhotos.refresh();
  });
  const selected=await page.evaluate(()=>({count:SkylitLibrary.playlist().length,keepers:SkylitLibrary.playlist().filter(p=>p.keeper).length,archive:SkylitPhotos.snapshot().state.photos.length}));
  assert.deepEqual(selected,{count:32,keepers:2,archive:508});
  await page.locator('#photo-retention').selectOption('12');
  assert.equal(await page.evaluate(()=>SkylitLibrary.playlist().length),14);assert.equal(await page.evaluate(()=>SkylitPhotos.snapshot().state.photos.length),508);
  const archivedId=(500).toString(16).padStart(64,'0');
  await page.evaluate(id=>{const index=SkylitPhotos.snapshot().state.photos.findIndex(p=>p.id===id);if(index<0)throw Error('Archived fixture missing');SkylitPhotos.open(false,index,false);},archivedId);
  assert.equal(await page.evaluate(()=>SkylitPlayer.status().current),archivedId,'Manual browsing must open an archived picture outside the slideshow count');
  await page.evaluate(()=>SkylitPhotos.close());
  await page.evaluate(()=>SkylitApp.openSettings('photo-slideshow'));
  await page.locator('#photo-retention').selectOption('30');
  for(const [width,height]of [[1280,720],[1920,1080],[390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>SkylitApp.openSettings('photo-slideshow'));await page.locator('#photo-retention').scrollIntoViewIfNeeded();
   assert.ok(await page.locator('#photo-retention').isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,`count-${width}x${height}.png`)});}
  }
  await page.locator('#photo-retention').selectOption('12');
  await page.reload();await page.waitForFunction(()=>window.SkylitLibrary);assert.equal(await page.evaluate(()=>SkylitLibrary.options().maximum),12);
  const older=await browser.newContext({viewport:{width:1280,height:720}}),legacy=await older.newPage();
  await older.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await legacy.addInitScript(()=>{if(!localStorage.getItem('legacy-seeded')){localStorage.setItem('skylit.frame',JSON.stringify({favouritesOnly:true,shuffle:true}));localStorage.setItem('legacy-seeded','1');}});
  await legacy.goto(origin+'/?photos=email');await legacy.waitForFunction(()=>window.SkylitLibrary);
  assert.equal(await legacy.evaluate(()=>SkylitLibrary.options().collection),'recent','Older installations without a saved slideshow must also migrate to latest pictures + Keepers');
  assert.equal(await legacy.evaluate(()=>SkylitLibrary.options().order),'shuffle','Other legacy presentation choices survive');
  await older.close();
  assert.deepEqual(errors,[]);console.log('Photo selection: both legacy migrations, count dropdown, additive Keepers, archive preservation/browsing, reload and three layouts passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
