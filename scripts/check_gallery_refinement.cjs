const{chromium}=require('playwright');const assert=require('node:assert/strict');(async()=>{const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{require('fs').mkdirSync('docs/reviews/2026-10-13-widget-gallery-visual/screenshots',{recursive:true});const p=await b.newPage({viewport:{width:1280,height:720}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8842')+'/?photos=email');await p.waitForFunction(()=>window.SkylitDashboard&&SkylitApp.status().weatherReady);await p.evaluate(()=>SkylitApp.openSettings('dashboard'));await p.waitForTimeout(300);assert.equal(await p.locator('.dashboard-recovery,.dashboard-gallery-drag').count(),0);assert.equal(await p.locator('.dashboard-canvas').evaluate(n=>getComputedStyle(n).boxShadow),'none');assert.equal(await p.locator('.dashboard-gallery-card[data-included=true] .dashboard-included-badge').count(),5);await p.screenshot({path:'docs/reviews/2026-10-13-widget-gallery-visual/screenshots/gallery.jpg'});await p.locator('.dashboard-gallery').evaluate(n=>n.scrollTop=n.scrollHeight);await p.screenshot({path:'docs/reviews/2026-10-13-widget-gallery-visual/screenshots/gallery-bottom.jpg'});const heading=await p.locator('.dashboard-palette>h3').boundingBox();assert.ok(heading.y>100&&heading.y<200);await p.locator('.dashboard-editor-tile[data-module=clock] .dashboard-move').click();await p.locator('.dashboard-editor-tile.selected .dashboard-delete').click();await p.locator('.dashboard-gallery-item[data-type=timers]').click();assert.ok((await p.evaluate(()=>SkylitDashboard.layout())).modules.some(m=>m.type==='timers'));assert.equal(await p.locator('.dashboard-selection').isVisible(),true);await p.locator('.dashboard-back-widgets').click();assert.equal(await p.locator('.dashboard-gallery-item[data-type=timers]').isDisabled(),true);for(const[w,h]of[[1920,1080],[960,540],[390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);await p.screenshot({path:`docs/reviews/2026-10-13-widget-gallery-visual/screenshots/gallery-${w}.jpg`});assert.ok(await p.locator('.settings-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1));}await p.setViewportSize({width:1280,height:720});
const strip=p.locator('#overview .dashboard-module[data-module=photos]');
const cases=[
  ['small',3,4,2], ['medium',5,6,3], ['kitchen-with-qr',6,6,4],
  ['kitchen-original',9,6,5], ['wide',12,4,5], ['tall',4,12,3], ['large',6,8,4]
];
for(const [shape,w,h,expected] of cases){
  await p.evaluate(({w,h})=>localStorage.setItem('skylit.dashboard',JSON.stringify({
    version:1,modules:[{type:'photos',x:0,y:0,w,h}]
  })),{w,h});
  await p.reload();
  await p.waitForFunction(()=>window.SkylitDashboard);
  await p.waitForFunction(()=>[...document.querySelectorAll('#overview-photos img')].length===5 &&
    [...document.querySelectorAll('#overview-photos img')].every(i=>i.complete&&i.naturalWidth));
  const pictures=strip.locator('img:visible');
  assert.equal(await pictures.count(),expected,shape+' visible prints');
  const frames=await pictures.evaluateAll(imgs=>imgs.map(img=>({
    width:img.offsetWidth-10,height:img.offsetHeight-17,aspect:img.naturalWidth/img.naturalHeight,
    x:img.offsetLeft,y:img.offsetTop
  })));
  for(const f of frames)assert.ok(Math.abs(f.width/f.height-f.aspect)<.035,'Natural photo proportions at '+shape);
  for(let i=1;i<frames.length;i++){
    if(shape==='tall')assert.ok(frames[i].y>frames[i-1].y);
    else assert.ok(frames[i].x>=frames[i-1].x+frames[i-1].width,'Distinct prints at '+shape);
  }
  console.log(shape,await strip.evaluate(n=>n.clientWidth+' × '+n.clientHeight),expected+' photos');
  await strip.screenshot({path:'docs/reviews/2026-10-13-widget-gallery-visual/screenshots/prints-'+shape+'.jpg'});
}
assert.deepEqual(errors,[]);console.log('PASS gallery labels, scroll, add/select/live-save and responsive widths');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
