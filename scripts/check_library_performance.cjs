'use strict';
// Synthetic data only. Work counts are deterministic; timings are diagnostic.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});try{
const page=await browser.newPage({viewport:{width:1280,height:720}});let imageRequests=0,fullPhotoRequests=0;
await page.route('**/demo-photos.js',r=>r.fulfill({body:'',contentType:'application/javascript'}));
await page.route('https://appassets.androidplatform.net/private-photos/**',r=>{imageRequests++;if(!new URL(r.request().url()).pathname.startsWith('/private-photos/thumb/'))fullPhotoRequests++;return r.fulfill({body:'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="#b98"/></svg>',contentType:'image/svg+xml'})});
await page.goto(process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767/?photos=email');await page.waitForFunction(()=>window.SkylitLibrary&&window.SkylitSettingsInteractions);
const hidden=await page.evaluate(()=>{let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0).toString(16).padStart(8,'0')};window.libraryFixture={connected:true,epoch:'synthetic-performance',photos:Array.from({length:300},(_,i)=>({url:'https://appassets.androidplatform.net/private-photos/'+i.toString(16).padStart(64,'0')+'.jpg',at:Date.now()-i*1000,width:1920,height:1080,visual:i<2?'aaaaaaaaaaaaaaaa':random()+random()}))};window.libraryProbe={similar:0,reads:0,paints:0,syncs:0};const similar=SkylitSlideshowModel.similar;SkylitSlideshowModel.similar=(...a)=>{libraryProbe.similar++;return similar(...a)};Skylit.photoStatus=()=>{libraryProbe.reads++;return JSON.stringify(libraryFixture)};Skylit.photoExclude=()=>true;window.addEventListener('skylit-library-paint',()=>libraryProbe.paints++);SkylitPhotos.refresh();Object.assign(libraryProbe,{similar:0,reads:0,paints:0});const t=performance.now();SkylitPhotos.refresh();return {...libraryProbe,ms:performance.now()-t,count:SkylitPhotos.snapshot().state.photos.length}});
assert.equal(hidden.count,300);assert.equal(hidden.similar,0,'Hidden library must not compare pictures');assert.equal(hidden.reads,1,'A refresh must read one authoritative native snapshot');
await page.waitForTimeout(150);assert(imageRequests<30,'Hidden ordering/review must not eagerly fetch the whole library');
await page.evaluate(()=>{const stale=JSON.stringify(libraryFixture),id=libraryFixture.photos[0].url.split('/').pop().slice(0,64);libraryFixture.excluded=[id];SkylitPhotos.receive(stale);if(!SkylitPhotos.snapshot().curated[id]?.hidden)throw Error('Stale callback restored excluded picture');libraryFixture.excluded=[];SkylitPhotos.refresh()});
const java=fs.readFileSync('android/src/com/wesbos/homehq/MainActivity.java','utf8');const notification=java.match(/evaluateJavascript\("([^"\n]*skylit-library-native[^"\n]*)"/)[1];
await page.evaluate(()=>Object.assign(libraryProbe,{reads:0,paints:0}));await page.evaluate(notification);const notify=await page.evaluate(()=>({...libraryProbe}));assert.equal(notify.reads,1);assert.equal(notify.paints,0,'Closed settings must not paint on a library notification');
const renders=await page.evaluate(()=>{
 const counts={};
 for(const [group,key] of [['photos','tiles'],['photos','stack'],['library','grid'],['library','order'],['library','pending'],['library','similar']]){
   const name=group+'.'+key,original=SkylitUI[group][key];counts[name]=0;
   SkylitUI[group][key]=(...args)=>{counts[name]++;return original(...args);};
 }
 SkylitPhotos.setSource('email');SkylitApp.go('overview');
 for(const key of Object.keys(counts))counts[key]=0;
 SkylitPhotos.refresh();
 const unchanged={...counts};
 const [latest]=libraryFixture.photos;
 libraryFixture.photos=libraryFixture.photos.slice(1);
 SkylitPhotos.refresh();
 const changed={...counts};
 SkylitApp.go('photos');
 const caughtUp=document.querySelectorAll('#photo-tiles .photo-tile').length;
 const thumbsOnly=[...document.querySelectorAll('#photo-tiles img')].every(img=>new URL(img.src).pathname.startsWith('/private-photos/thumb/'));
 libraryFixture.photos.unshift(latest);
 SkylitApp.go('overview');SkylitPhotos.refresh();
 return {unchanged,changed,caughtUp,thumbsOnly};
});
assert.ok(Object.values(renders.unchanged).every(n=>n===0),'Unchanged Overview must skip gallery, strip and library renders');
assert.equal(renders.changed['photos.stack'],1);
assert.ok(Object.entries(renders.changed).every(([name,n])=>name==='photos.stack'||n===0),'Changed strip must not paint closed screens');
assert.ok(renders.thumbsOnly,'All gallery images must use the thumbnail route');
assert.equal(fullPhotoRequests,0,'Overview and grid must not request slideshow JPEGs');
assert.equal(renders.caughtUp,299,'Opening Photos immediately renders the latest library');
await page.evaluate(()=>SkylitApp.openSettings('photo-library'));const disclosure=page.locator('#library-similar').locator('..');await disclosure.evaluate(n=>n.open=true);
await page.waitForFunction(()=>document.querySelector('#library-similar button'));const first=await page.evaluate(()=>libraryProbe.similar);assert(first>0);
await page.evaluate(()=>{libraryProbe.similar=0;SkylitPhotos.refresh()});assert.equal(await page.evaluate(()=>libraryProbe.similar),0,'Unchanged signatures must reuse candidate pairs');
await page.evaluate(()=>{libraryFixture.photos=libraryFixture.photos.slice(1);SkylitPhotos.refresh()});await page.waitForFunction(()=>document.querySelector('#library-similar').dataset.busy==='false'&&!document.querySelector('#library-similar button'));assert(await page.evaluate(()=>libraryProbe.similar)>0,'Removal invalidates candidate pairs');
await page.evaluate(()=>SkylitLibrary.openPicture(SkylitPhotos.snapshot().state.photos[0].id));const crop=page.locator('#library-crop-preview').locator('..'),box=await crop.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
const drag=await page.evaluate(({x,y})=>{const sync=SkylitSettingsInteractions.sync;SkylitSettingsInteractions.sync=()=>{libraryProbe.syncs++;sync()};libraryProbe.syncs=0;const n=document.querySelector('#library-crop-preview').parentElement,t=performance.now();for(let i=0;i<32;i++)n.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:x+i,clientY:y+i,bubbles:true}));return {ms:performance.now()-t}}, {x:box.x+box.width/2,y:box.y+box.height/2});
await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.equal(await page.evaluate(()=>libraryProbe.syncs),0,'Crop gesture must not synchronize all Settings');await page.mouse.up();assert(await page.evaluate(()=>SkylitLibrary.isDirty()));assert.notEqual(await page.locator('#library-crop-x').inputValue(),'50','Pointer release flushes the final crop');
await page.locator('#library-save-picture').click();assert.equal(await page.evaluate(()=>SkylitLibrary.isDirty()),false);
// An account reset must release the previous account's photos even on deferred screens.
await page.evaluate(()=>{SkylitApp.closeSettings();SkylitApp.go('overview');libraryFixture.epoch='next-synthetic-account';libraryFixture.photos=[];SkylitPhotos.refresh();});
assert.equal(await page.locator('#photo-tiles img,#library-grid img,#library-order-list img,#overview-photo-stack img').count(),0);
console.log(JSON.stringify({hiddenRefreshMs:hidden.ms,cropDispatchMs:drag.ms,firstSimilarityComparisons:first,notificationReads:notify.reads,notificationPaints:notify.paints}));
console.log('PASS hidden/cached similarity, authoritative refresh, notification fanout, crop/save');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
