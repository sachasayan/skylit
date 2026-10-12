const {test}=require('node:test');const assert=require('node:assert/strict');
const A=require('../web/appearance.js'),Sun=require('../web/suncalc.js');
const city={latitude:43.88,longitude:-79.44};
test('automatic mode crosses sunrise and sunset without a network or timezone dependency',()=>{
 for(const date of ['2026-03-08T16:00:00Z','2026-11-01T17:00:00Z','2026-06-21T16:00:00Z']){
  const t=Sun.getTimes(new Date(date),city.latitude,city.longitude);
  for(const [kind,before,after] of [['sunrise','dark','light'],['sunset','light','dark']]){
   assert.equal(A.resolve('auto',city,new Date(+t[kind]-180000)).mode,before);
   assert.equal(A.resolve('auto',city,new Date(+t[kind]+180000)).mode,after);
  }
 }
});
test('automatic works across the date line and polar seasons',()=>{
 assert.equal(A.resolve('auto',{latitude:1,longitude:179},new Date('2026-06-21T00:00:00Z')).mode,'light');
 assert.equal(A.resolve('auto',{latitude:1,longitude:-179},new Date('2026-06-21T12:00:00Z')).mode,'dark');
 assert.equal(A.resolve('auto',{latitude:89,longitude:0},new Date('2026-06-21T12:00:00Z')).mode,'light');
 assert.equal(A.resolve('auto',{latitude:89,longitude:0},new Date('2026-12-21T12:00:00Z')).mode,'dark');
});
test('manual modes win; missing or invalid city follows system preference',()=>{
 assert.equal(A.resolve('light',city,new Date('2026-01-01T05:00:00Z'),true).mode,'light');
 assert.equal(A.resolve('dark',city,new Date('2026-07-01T17:00:00Z')).mode,'dark');
 for(const c of [null,{}, {latitude:null,longitude:null},{latitude:91,longitude:0},{latitude:0,longitude:NaN}]){
  assert.deepEqual(A.resolve('auto',c,new Date(),true),{mode:'dark',reason:'system'});
  assert.equal(A.resolve('auto',c,new Date(),false).mode,'light');
 }
});
test('legacy cocoa remains dark and unknown preferences get safe defaults',()=>{
 assert.deepEqual(A.normalize('cocoa'),{theme:'linen',mode:'dark'});
 assert.deepEqual(A.normalize('cocoa','auto'),{theme:'linen',mode:'auto'});
 assert.deepEqual(A.normalize('bogus','bogus'),{theme:'linen',mode:'auto'});
 assert.deepEqual(A.normalize('sage','light'),{theme:'sage',mode:'light'});
});
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('optional high-contrast palette meets AA text and control border contrast',()=>{
 for(const theme of ['contrast'])for(const mode of ['light','dark']){
  const t=A.tokens(theme,mode);
  for(const ink of ['ink','muted','accent'])for(const bg of ['bg','panel','rail','soft'])assert.ok(contrast(t[ink],t[bg])>=4.5,`${theme} ${mode} ${ink}/${bg}: ${contrast(t[ink],t[bg])}`);
  assert.ok(contrast(t['accent-ink'],t.accent)>=4.5,theme+' button');
  for(const bg of ['bg','panel'])assert.ok(contrast(t.line,t[bg])>=3,theme+' border/'+bg);
 }
});

test('clock numerals retain high-contrast text separation in both modes',()=>{
 for(const mode of ['light','dark']){const t=A.tokens('contrast',mode);assert.ok(contrast(t['clock-paper'],t['clock-tile'])>=4.5);assert.ok(contrast(t['clock-leaf'],t.panel)>=4.5);}
});

// All palettes need legible live Flip numerals, not only the optional contrast theme.
test('Flip numerals meet AA contrast across all six light/dark palettes',()=>{
 for(const theme of Object.keys(A.palettes))for(const mode of ['light','dark']){
  const t=A.tokens(theme,mode);assert.ok(contrast(t['clock-paper'],t['clock-tile'])>=4.5,`${theme} ${mode} Flip numerals`);
 }
});
