const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});try{
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const origin=process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8811';await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());await page.goto(origin+'/?photos=email');await page.waitForFunction(()=>window.SkylitSettingsInteractions&&SkylitApp.status().weatherReady);
const open=id=>page.evaluate(id=>SkylitApp.openSettings(id),id),out='docs/reviews/2026-10-13-walkthrough/after';fs.mkdirSync(out,{recursive:true});
await open('appearance');assert.equal(await page.locator('[data-choice-for=appearance-mode] svg').count(),3);assert.equal(await page.locator('[data-choice-for=display-text] svg').count(),2);assert.equal(await page.locator('.settings-category-button svg').count(),8);
assert.ok(await page.locator('[data-choice-for=appearance-mode]').evaluate(n=>n.clientWidth<n.closest('article').clientWidth-50));
await open('navigation');assert.equal(await page.locator('#show-home').isVisible(),true);assert.equal(await page.locator('#photo-prefer-favourites').isVisible(),false);await page.screenshot({path:out+'/navigation.jpg'});
await open('dashboard');assert.equal(await page.getByRole('button',{name:'Pages on frame',exact:true}).count(),0);
const tile=type=>page.locator('.dashboard-editor-tile[data-module='+type+']');const c=await tile('clock').boundingBox(),p=await tile('photos').boundingBox();await page.mouse.move(c.x+c.width/2,c.y+c.height/2);await page.mouse.down();await page.mouse.move(p.x+p.width/2,p.y+p.height/2,{steps:12});await page.mouse.up();assert.equal(await tile('clock').evaluate(n=>n.style.gridColumn),'7 / span 6');await page.locator('#dashboard-discard').click();
// Resize from each corner in an empty layout so the opposite corner can stay fixed.
await page.evaluate(()=>{const select=document.getElementById('overview-preset');select.value='balanced';select.dispatchEvent(new Event('change',{bubbles:true}));});
await tile('photos').locator('.dashboard-move').click();await page.locator('#dashboard-remove').click();await tile('weather').locator('.dashboard-move').click();await page.locator('#dashboard-remove').click();await tile('plans').locator('.dashboard-move').click();await page.locator('#dashboard-remove').click();await tile('clock').locator('.dashboard-move').click();
// Give the clock space on every side, then resize each corner independently.
let initial=await tile('clock').boundingBox(),grid=await page.locator('#dashboard-editor-grid').boundingBox();
await page.mouse.move(initial.x+initial.width/2,initial.y+initial.height/2);await page.mouse.down();await page.mouse.move(initial.x+initial.width/2+grid.width/12*3,initial.y+initial.height/2+grid.height/12*3,{steps:10});await page.mouse.up();
for(const [corner,dx,dy] of [['se',1,1],['nw',-1,-1],['ne',1,-1],['sw',-1,1]]){
 const prior=await tile('clock').boundingBox(),handle=tile('clock').locator('.corner-'+corner),box=await handle.boundingBox();await page.mouse.move(box.x+22,box.y+22);await page.mouse.down();await page.mouse.move(box.x+22+dx*grid.width/12,box.y+22+dy*grid.height/12,{steps:8});await page.mouse.up();const after=await tile('clock').boundingBox();assert.ok(after.width>prior.width+5&&after.height>prior.height+5,corner+' must resize');
 assert.ok(Math.abs((corner.includes('w')?after.x+after.width:after.x)-(corner.includes('w')?prior.x+prior.width:prior.x))<2,corner+' opposite x anchored');
 assert.ok(Math.abs((corner.includes('n')?after.y+after.height:after.y)-(corner.includes('n')?prior.y+prior.height:prior.y))<2,corner+' opposite y anchored');
 await page.evaluate(()=>document.getElementById('dashboard-undo').click());
}
await page.locator('#dashboard-discard').click();
for(const [w,h] of [[1280,720],[1920,1080],[1280,800],[390,844]]){await page.setViewportSize({width:w,height:h});await open('dashboard');await page.waitForTimeout(250);assert.ok(await page.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:out+'/editor-'+w+'x'+h+'.jpg'});await open('appearance');await page.screenshot({path:out+'/appearance-'+w+'x'+h+'.jpg'});}
assert.deepEqual(errors,[]);console.log('PASS compact icon controls, navigation, actual pointer swap, four-corner resizing and responsive screenshots');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
