/* Focused regressions for the repository review. Use only scripts/preview.py synthetic assets. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),checks=[],errors=[],captures=[];
const captureAt=process.argv.indexOf('--capture'),output=captureAt<0?null:path.resolve(process.argv[captureAt+1]);
if(output)fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});
 async function open({brokenSettings=false,expired=false}={}){
  const context=await browser.newContext({viewport:{width:1280,height:720},timezoneId:'Europe/London'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1')return route.abort();
   if(url.pathname==='/demo.js'){
    let body=fs.readFileSync(path.join(root,'tests/fixtures/demo.js'),'utf8');
    if(brokenSettings)body=body.replace("const RealDate=Date,now=", "localStorage.setItem('skylit.settings',JSON.stringify({city:null,clock:'invalid',idle:999}));\nconst RealDate=Date,now=");
    if(expired){body=body.replace('const hour=3600,base=now/1000;', 'const hour=3600,base=now/1000-7*86400;');body=body.replace(/\}\)\(\);\s*$/, "\nweather.fetchedAt=now-7*86400000;localStorage.setItem('skylit.weather.51.51,-0.13.celsius',JSON.stringify(weather));window.fetch=(url,options)=>String(url).startsWith('https://api.open-meteo.com/v1/forecast?')?Promise.reject(Error('Synthetic offline')):realFetch(url,options);\n"+"})();");} 
    return route.fulfill({body,contentType:'application/javascript'});
   }
   return route.continue();
  });
  await page.addInitScript(()=>{
   const set=window.setInterval,clear=window.clearInterval;window.photoTimers=new Map();
   window.setInterval=(callback,milliseconds,...args)=>{const id=set(callback,milliseconds,...args);if(milliseconds===8000)photoTimers.set(id,callback);return id;};
   window.clearInterval=id=>{photoTimers.delete(id);clear(id);};
  });
  await page.goto('http://127.0.0.1:8767/?photos=email',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.SkylitWorkspace&&window.SkylitDashboard&&window.SkylitPhotos);
  if(output)await page.evaluate(()=>{const label=document.createElement('div');label.textContent='SYNTHETIC PREVIEW · REVIEW FIXES';label.style='position:fixed;bottom:4px;right:4px;padding:3px 6px;background:#faf7f0;color:#352f29;z-index:99999;font:10px sans-serif;pointer-events:none';document.body.append(label);});
  return {context,page};
 }
 async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
 async function snap(page,id){if(!output)return;await page.screenshot({path:path.join(output,'screenshots',id+'.jpg'),type:'jpeg',quality:88});captures.push({id,file:'screenshots/'+id+'.jpg'});}
 const normal=await open(),page=normal.page;
 await check('Slideshow starts advancing when a second photo arrives, and stops on one/zero photos',async()=>{
  await page.evaluate(()=>{window.allPhotos=SkylitDemoPhotos.photos.slice();SkylitDemoPhotos.photos.splice(1);SkylitPhotos.refresh();SkylitPhotos.open(false);});
  assert.equal(await page.evaluate(()=>photoTimers.size),0);
  await page.evaluate(()=>{SkylitDemoPhotos.photos.push(allPhotos[1]);SkylitPhotos.refresh();});
  assert.equal(await page.evaluate(()=>photoTimers.size),1);assert.equal(await page.locator('#photo-counter').innerText(),'1 / 2');
  await page.evaluate(()=>[...photoTimers.values()][0]());assert.equal(await page.locator('#photo-counter').innerText(),'2 / 2');await snap(page,'slideshow-refreshed');
  await page.locator('#photo-pause').click();assert.equal(await page.evaluate(()=>photoTimers.size),0);
  await page.evaluate(()=>{SkylitDemoPhotos.photos.push(allPhotos[2]);SkylitPhotos.refresh();});assert.equal(await page.evaluate(()=>photoTimers.size),0);
  await page.locator('#photo-pause').click();assert.equal(await page.evaluate(()=>photoTimers.size),1);
  await page.evaluate(()=>{SkylitDemoPhotos.photos.splice(1);SkylitPhotos.refresh();});assert.equal(await page.evaluate(()=>photoTimers.size),0);
  await page.evaluate(()=>{SkylitDemoPhotos.photos.splice(0);SkylitPhotos.refresh();});assert.equal(await page.evaluate(()=>SkylitPhotos.isOpen()),false);
  await page.evaluate(()=>{SkylitDemoPhotos.photos.push(...allPhotos);SkylitPhotos.refresh();});
 });
 await check('Clock and preset drafts stay unsaved until Save; discard and reopening retain truthful feedback',async()=>{
  await page.evaluate(()=>SkylitApp.openSettings('dashboard'));const saved=await page.evaluate(()=>SkylitDashboard.layout());
  await page.locator('#dashboard-clock-style').selectOption('analog');assert.match(await page.locator('#settings-feedback').innerText(),/Unsaved/);assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),saved);await snap(page,'dashboard-unsaved');
  await page.evaluate(()=>{SkylitApp.closeSettings();SkylitApp.openSettings('dashboard');});assert.match(await page.locator('#settings-feedback').innerText(),/Unsaved/);
  await page.locator('#dashboard-discard').click();assert.match(await page.locator('#settings-feedback').innerText(),/Saved/);
  await page.locator('#overview-preset').selectOption('photos');assert.match(await page.locator('#settings-feedback').innerText(),/Unsaved/);
  await page.locator('#dashboard-save').click();assert.match(await page.locator('#settings-feedback').innerText(),/Saved/);assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),await page.evaluate(()=>SkylitDashboard.draft()));
  await page.evaluate(()=>SkylitApp.closeSettings());
 });
 for(const tab of ['overview','photos','calendar']){await page.evaluate(tab=>SkylitApp.go(tab),tab);await snap(page,tab);}
 await normal.context.close();
 const expired=await open({expired:true});
 await check('Expired saved forecast shows no stale Now/Today labels',async()=>{
  await expired.page.evaluate(()=>SkylitApp.go('weather'));
  assert.match(await expired.page.locator('#weather-label').innerText(),/SAVED CONDITIONS/);assert.match(await expired.page.locator('#updated').innerText(),/Oct/);assert.match(await expired.page.locator('#hourly').innerText(),/expired/);assert.doesNotMatch(await expired.page.locator('#daily').innerText(),/Today/);
  assert.match(await expired.page.locator('#daily').innerText(),/Oct/);await snap(expired.page,'weather-expired');
 });await expired.context.close();
 const broken=await open({brokenSettings:true});
 await check('Malformed saved city and scalar preferences recover to usable setup',async()=>{
  assert.equal(await broken.page.evaluate(()=>SkylitApp.setupState().city),false);assert.match(await broken.page.locator('#clock').innerText(),/\d/);
  await broken.page.evaluate(()=>SkylitApp.openSettings('weather'));assert.equal(await broken.page.locator('#clock-format').inputValue(),'12');await snap(broken.page,'settings-recovered');
 });await broken.context.close();await browser.close();assert.deepEqual(errors,[]);
 if(output)fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify({synthetic:true,version:'2.14.2',checks,captures,errors},null,2));
 console.log(checks.length+' focused browser checks passed; no runtime errors');
})().catch(error=>{console.error(error);process.exit(1);});
