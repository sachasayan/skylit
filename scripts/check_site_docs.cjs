'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.SKYLIT_SITE||'http://127.0.0.1:8780';
for(const width of [1440,1280,390]){
 await page.setViewportSize({width,height:900});await page.goto(base+'/docs/');
 await page.locator('#guide-search').fill('resize');await page.locator('#search-results a[href="/docs/dashboard/"]').waitFor();
 await page.locator('#guide-search').press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.pathname),'/docs/dashboard/');
 await page.keyboard.press('Enter');await page.waitForURL('**/docs/dashboard/');
 assert.equal(await page.locator('h1').textContent(),'Arrange your dashboard');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at '+width);
 if(width===390){await page.locator('.mobile-guides summary').click();await page.locator('.mobile-guides a[href="/docs/calendars/"]').click();await page.waitForURL('**/docs/calendars/');}
 await page.locator('#guide-search').fill('zzzz-no-such-guide');await page.getByText('No matching guides.',{exact:false}).waitFor();
 await page.locator('#guide-search').press('Escape');assert.equal(await page.locator('#search-results').isVisible(),false);
 if(process.env.SKYLIT_SITE_SHOTS){await page.screenshot({path:process.env.SKYLIT_SITE_SHOTS+'/article-'+width+'.png',fullPage:true});await page.goto(base+'/docs/');await page.screenshot({path:process.env.SKYLIT_SITE_SHOTS+'/home-'+width+'.png',fullPage:true});}
}
await page.route('**/docs/search.json',route=>route.abort());await page.reload();await page.locator('#guide-search').fill('calendar');await page.locator('#search-results').getByText('Search is unavailable.',{exact:false}).waitFor();
assert.deepEqual(errors,[]);console.log('PASS docs desktop, frame-size and mobile navigation, search, keyboard, failure fallback and overflow');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
