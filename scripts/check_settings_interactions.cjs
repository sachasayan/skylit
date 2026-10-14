/* Synthetic acceptance for task-based Settings. Never connects to external services. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const root=process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767';
const arg=process.argv.indexOf('--capture'),output=arg<0?null:path.resolve(process.argv[arg+1]),checks=[],screens=[],errors=[];
if(output)fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>new URL(r.request().url()).origin===root?r.continue():r.abort());
 const open=id=>page.evaluate(id=>SkylitApp.openSettings(id),id);
 async function check(title,fn){await fn();checks.push(title);console.log('PASS '+title);}
 async function snap(id,title){if(!output)return;await page.waitForTimeout(140);await page.screenshot({path:path.join(output,'screenshots',id+'.jpg'),type:'jpeg',quality:88});screens.push({id,title,file:'screenshots/'+id+'.jpg',viewport:await page.evaluate(()=>[innerWidth,innerHeight])});}
 async function sectionSnap(id,title,selector){await page.locator(selector).scrollIntoViewIfNeeded();await snap(id,title);}
 await page.goto(root+'/?photos=email');await page.waitForFunction(()=>window.SkylitSettingsInteractions&&SkylitApp.status().weatherReady);await page.evaluate(()=>document.fonts.ready);
 await check('Settings has nine task destinations and removes numeric dashboard controls',async()=>{
  await open('general');assert.deepEqual(await page.locator('.settings-category-button').allTextContents(),['General','Dashboard','Appearance','Navigation','Photos','Calendars','Apps','Frame','Help & maintenance']);
  for(const id of ['dashboard-column','dashboard-row','dashboard-width','dashboard-height','dashboard-arrange','dashboard-expand','dashboard-preview-screen'])assert.equal(await page.locator('#'+id).count(),0);
  assert.equal(await page.locator('.appearance-preview').count(),0);
 });
 await check('Visible display choices save through the existing preference path',async()=>{await open('general');
  await page.locator('[data-choice-for=appearance-mode] [data-choice=dark]').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.mode),'dark');await snap('appearance-dark','Appearance · dark mode');
  await page.locator('[data-choice-for=appearance-mode] [data-choice=light]').click();await page.locator('[data-choice-for=display-text] [data-choice=large]').scrollIntoViewIfNeeded();await page.locator('[data-choice-for=display-text] [data-choice=large]').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.text),'large');
  await snap('text-size','Visible text-size choices');await page.locator('[data-choice-for=display-text] [data-choice=standard]').click();
  await open('appearance');await snap('appearance','Appearance · modes and palette');
 });
 await check('Visual templates save immediately and leaving needs no dashboard confirmation',async()=>{
  await open('dashboard');await page.locator('.dashboard-reset').click();await snap('dashboard-templates','Dashboard · visual starting layouts');await page.locator('[data-choice-for=overview-preset] [data-choice=photos]').click();assert.equal(await page.evaluate(()=>SkylitDashboard.isDirty()),false);assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),await page.evaluate(()=>JSON.parse(localStorage.getItem('skylit.dashboard'))));assert.equal(await page.locator('#dashboard-reset-dialog').isVisible(),false);await page.locator('#settings-close').click();assert.equal(await page.locator('.settings-draft-guard').isVisible(),false);await open('dashboard');await snap('dashboard','Dashboard · live canvas');
 });
 await check('The preview automatically follows the current viewport without changing the layout',async()=>{
  const saved=await page.evaluate(()=>SkylitDashboard.layout());
  for(const [w,h]of [[960,540],[1280,800],[1600,900],[1920,1200],[390,844]]){
   await page.setViewportSize({width:w,height:h});await open('dashboard');await page.waitForTimeout(250);
   assert.deepEqual(await page.locator('.dashboard-live-frame').evaluate(n=>[n.clientWidth,n.clientHeight]),w<800?[1280,720]:[w,h]);assert.deepEqual(await page.evaluate(()=>SkylitDashboard.layout()),saved);
   assert.ok(await page.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   const canvas=await page.locator('.dashboard-canvas').boundingBox();assert.ok(canvas.width>110&&canvas.height>70);
   assert.equal(await page.locator('#dashboard-save,#dashboard-discard').count(),0);
   await snap('dashboard-'+w+'x'+h,'Dashboard · '+w+'×'+h);
  }await page.setViewportSize({width:1280,height:720});await open('dashboard');
 });
 await check('Responsive clock cards save the selected style immediately',async()=>{
  await page.locator('.dashboard-editor-tile[data-module=clock] .dashboard-move').click();for(const style of ['analog','stacked','digital']){await page.locator('[data-choice-for=dashboard-clock-style] [data-choice='+style+']').click();assert.equal((await page.evaluate(()=>SkylitDashboard.draft())).modules.find(m=>m.type==='clock').style,style);await snap('clock-'+style,'Dashboard · '+style+' style');}
  assert.equal(await page.evaluate(()=>SkylitDashboard.isDirty()),false);
 });
 await check('Gallery browsing has no permanent selection checkboxes or repeated Edit buttons',async()=>{
  await open('photo-library');assert.equal(await page.locator('#library-grid input:visible').count(),0);assert.equal(await page.locator('#library-grid button').count(),5);assert.equal(await page.locator('#library-grid').getByRole('button',{name:'Edit',exact:true}).count(),0);await snap('library','Photo library · browse');
  await page.getByRole('button',{name:'Select pictures',exact:true}).click();await page.locator('.library-photo-open').first().click();assert.equal((await page.evaluate(()=>SkylitLibrary.selected())).length,1);await snap('library-selection','Photo library · selection and batch actions');
  await page.locator('#library-star').click();assert.equal(await page.evaluate(()=>Object.values(SkylitPhotos.snapshot().curated).some(c=>c.favourite)),true);
  await page.getByRole('button',{name:'Done selecting',exact:true}).click();assert.equal((await page.evaluate(()=>SkylitLibrary.selected())).length,0);
 });
 await check('Crop dragging is staged; navigation cannot discard picture edits silently',async()=>{
  await page.locator('.library-photo-open').first().click();assert.equal(await page.locator('#settings').getAttribute('data-area'),'photo-edit');await snap('picture-editor','Picture editor · direct crop');
  const box=await page.locator('.crop-preview').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2+20);await page.mouse.up();assert.equal(await page.evaluate(()=>SkylitLibrary.isDirty()),true);await snap('picture-crop','Picture editor · crop changed');
  await open('photos');assert.equal(await page.locator('.settings-draft-guard').isVisible(),true);await page.getByRole('button',{name:'Apply changes',exact:true}).click();assert.equal(await page.evaluate(()=>SkylitLibrary.isDirty()),false);assert.equal(await page.locator('#settings').getAttribute('data-area'),'photos');
  await page.reload();await page.waitForFunction(()=>window.SkylitSettingsInteractions);assert.equal(await page.evaluate(()=>Object.values(SkylitPhotos.snapshot().curated).some(c=>c.customCrop)),true);
 });
 await check('Custom viewing times and all five slideshow styles are retained',async()=>{
  await open('photo-slideshow');assert.equal(await page.locator('[data-choice-for=photo-style] button').count(),5);await snap('slideshow','Slideshow · visual styles');
  await page.locator('[data-choice-for=photo-speed] [data-choice="30"]').scrollIntoViewIfNeeded();await page.locator('[data-choice-for=photo-speed] [data-choice="30"]').click();assert.equal(await page.evaluate(()=>SkylitLibrary.options().duration),30);await snap('slideshow-pace','Slideshow · pace choices');
  await page.locator('.settings-custom-pace>summary').click();await page.locator('.settings-custom-pace input').fill('900');await page.getByRole('button',{name:'Set pace',exact:true}).click();assert.equal(await page.evaluate(()=>SkylitLibrary.options().duration),900);assert.match(await page.locator('.settings-custom-pace').locator('..').innerText(),/900|15 minutes/);await snap('slideshow-custom-pace','Slideshow · retained custom pace');
  await sectionSnap('slideshow-composition','Slideshow · composition and framing','[data-choice-for=slideshow-layout]');await page.getByText('Fine-tune transitions',{exact:true}).click();await sectionSnap('slideshow-transitions','Slideshow · visual transitions','[data-choice-for=slideshow-transition-type]');
 });
 await check('Visual collections and saved presentations track curation',async()=>{
  await open('photo-sequence');await page.locator('[data-collection=favourites]').click();assert.equal(await page.evaluate(()=>SkylitLibrary.options().collection),'favourites');await snap('collections','Visual collection choices');
  await open('photo-presets');await page.getByText('Save a new presentation',{exact:true}).click();await page.locator('#slideshow-preset-name').fill('Quiet evening');await page.locator('#slideshow-save-preset').click();assert.equal(await page.locator('.settings-collection-card[data-collection="Quiet evening"]').count(),1);await snap('presentations-saved','Saved presentation · visual card');
  await page.locator('#slideshow-delete-preset').click();assert.equal(await page.locator('.settings-collection-card[data-collection="Quiet evening"]').count(),1);await page.locator('#slideshow-delete-preset').click();assert.equal(await page.locator('.settings-collection-card[data-collection="Quiet evening"]').count(),0);
  await open('photo-sequence');await page.locator('[data-collection=recent]').click();
 });
 await check('Imported preferences are reviewed before writing and can be cancelled',async()=>{
  const before=await page.evaluate(()=>SkylitApp.exportDisplayPreferences());await page.evaluate(()=>SkylitApp.importDisplayPreferences(JSON.stringify({format:'skylit-display',version:1,display:{theme:'sage',mode:'dark',clock:'24',units:'fahrenheit',text:'standard',preset:'balanced',home:true,youtube:false}})));assert.equal(await page.evaluate(()=>SkylitApp.exportDisplayPreferences()),before);await snap('transfer-review','Display preferences · review before applying');await page.getByRole('button',{name:'Cancel import',exact:true}).click();assert.equal(await page.evaluate(()=>SkylitApp.exportDisplayPreferences()),before);
 });
 const routes=['general','appearance','momo','weather','photos','photo-source','photo-storage','photo-sequence','photo-arrivals','photo-import','photo-presets','routine','navigation','household','calendars','calendar-review','services','youtube-shortcuts','frame','updates','device','transfer'];
 for(const id of routes){await open(id);assert.equal(await page.locator('#settings').getAttribute('data-area'),id);assert.ok(await page.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1),id+' overflow');await snap(id,id.replaceAll('-',' ')+' · task view');}
 await open('momo');await sectionSnap('momo-gallery','Momo · single accessory gallery','#momo-gallery');
 await open('photo-source');await page.locator('#photo-account-entry').evaluate(n=>n.open=true);await sectionSnap('photo-account','Receiving photos · explicit account setup','#photo-account-entry');
 await open('calendars');await page.locator('.calendar-add-disclosure').evaluate(n=>n.open=true);await sectionSnap('calendar-add','Connect calendar · focused form','#calendar-form');
 await open('calendar-review');await page.locator('.gate-configuration').evaluate(n=>n.open=true);await sectionSnap('calendar-review-setup','Inviter review · policy setup','.gate-configuration');
 await check('Shared album and local library expose only their supported capabilities',async()=>{
  await open('photo-source');await page.locator('[data-choice-for=photo-source] [data-choice=album]').click();await open('photos');assert.equal(await page.locator('[data-local-photos=true]:visible').count(),0);await snap('photos-shared','Photos · shared-album source');
  await open('photo-source');await page.locator('[data-choice-for=photo-source] [data-choice=email]').click();
 });
 await check('Small landscape and narrow fallback retain scroll access without horizontal overflow',async()=>{
  for(const [w,h]of [[960,540],[1280,800],[390,844]])for(const id of ['appearance','photos','photo-library']){await page.setViewportSize({width:w,height:h});await open(id);assert.ok(await page.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1),id+' '+w);await snap(id+'-'+w+'x'+h,id+' · '+w+'×'+h);}
 });
 await page.setViewportSize({width:1280,height:720});const version=await page.evaluate(()=>window.SkylitVersion.name);assert.deepEqual(errors,[]);await browser.close();
 // A native updater stub exercises policy dispatch without downloading or installing.
 const nativeContext=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})}),np=await nativeContext.newPage();
 await np.route('**/*',r=>new URL(r.request().url()).origin===root?r.continue():r.abort());
 await np.route('**/updates.js',async r=>{const response=await r.fetch(),source=await response.text();await r.fulfill({response,body:`window.updateFixture={supported:true,installed:'2.16.1',stage:'current',permission:false,settings:{check:true,download:false,install:false,start:22,end:3,timezone:'Europe/London'}};Object.assign(window.Skylit,{updateStatus:()=>JSON.stringify(updateFixture),updateHeartbeat:()=>{},updateBackgroundCheck:()=>{},updateConfigure:raw=>{updateFixture.settings=JSON.parse(raw);return true;}});\n`+source});});
 await np.goto(root+'/?photos=email');await np.waitForFunction(()=>window.SkylitSettingsInteractions);await np.evaluate(()=>SkylitApp.openSettings('updates'));await np.locator('[data-policy=idle]').click();assert.equal(await np.evaluate(()=>updateFixture.settings.install),true);assert.equal(await np.evaluate(()=>updateFixture.settings.start),22);assert.equal(await np.evaluate(()=>updateFixture.settings.end),3);await np.locator('[data-policy=manual]').click();assert.equal(await np.evaluate(()=>updateFixture.settings.install),false);checks.push('Native policy dispatch preserves overnight window and manual choice');await nativeContext.close();
 const result={version,synthetic:true,checks,runtimeErrors:errors,screenshots:screens};if(output)fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:checks.length,screenshots:screens.length,runtimeErrors:errors.length}));
})().catch(e=>{console.error(e);process.exit(1);});
