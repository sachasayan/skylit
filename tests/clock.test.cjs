const {test}=require('node:test'),assert=require('node:assert/strict'),clock=require('../web/clock.js'),layout=require('../web/dashboard-model.js');
test('clock hands include minutes/seconds and use the configured city, independent of local timezone',()=>{
  const london=clock.read('2026-10-10T08:15:30Z','Europe/London','12');
  assert.equal(london.hour,9);assert.equal(london.hourText,'9');assert.equal(london.minuteText,'15');assert.equal(london.hourAngle,277.75);assert.equal(london.minuteAngle,93);assert.equal(london.secondAngle,180);
  const india=clock.read('2026-10-10T08:15:00Z','Asia/Kolkata','24');assert.equal(india.hourText,'13');assert.equal(india.minuteText,'45');
  const newYork=clock.read('2026-10-10T08:15:00Z','America/New_York','12');assert.equal(newYork.hourText,'4');assert.equal(newYork.minute,15);
});
test('midnight, noon and 24-hour labels agree with analog hands',()=>{
  for(const [hour,display] of [[0,'12'],[12,'12'],[23,'11']]){
    const instant='2026-10-10T'+String(hour).padStart(2,'0')+':00:00Z',a=clock.read(instant,'UTC','12'),b=clock.read(instant,'UTC','24');
    assert.equal(a.hourText,display);assert.equal(b.hourText,String(hour).padStart(2,'0'));assert.equal(b.period,'');assert.equal(a.hourAngle,b.hourAngle);assert.ok(a.hourAngle<360);assert.doesNotMatch(b.label,/24:00/);
  }
});
test('DST skipped and repeated hours, and date-line dates, follow the city clock',()=>{
  assert.equal(clock.read('2026-03-08T06:59:00Z','America/New_York').hour,1);assert.equal(clock.read('2026-03-08T07:00:00Z','America/New_York').hour,3);
  const first=clock.read('2026-11-01T05:30:00Z','America/New_York'),repeat=clock.read('2026-11-01T06:30:00Z','America/New_York');assert.equal(first.hourAngle,repeat.hourAngle);assert.equal(first.label,repeat.label);
  assert.match(clock.read('2026-10-10T12:00:00Z','Pacific/Kiritimati').date,/11/);assert.match(clock.read('2026-10-10T12:00:00Z','Pacific/Honolulu').date,/10/);
});
test('clock styles survive normalization, packing and geometry edits; unsupported values cannot enter layouts',()=>{
  for(const s of clock.styles){
    let value=layout.change(layout.preset(),'clock',{style:s.id});assert.equal(clock.style(value.modules[0].style),s.id);
    value=layout.add(value,'note').layout;assert.equal(clock.style(value.modules[0].style),s.id);
    value=layout.change(value,'clock',{w:3});value=layout.normalize(JSON.parse(JSON.stringify(value)));assert.equal(clock.style(value.modules[0].style),s.id);
  }
  assert.equal(layout.change(layout.preset(),'clock',{style:'<img src=x>'}),null);assert.equal(layout.change(layout.preset(),'weather',{style:'analog'}),null);
  const raw=layout.preset();raw.modules[0].style='<script>';assert.equal(clock.style(layout.normalize(raw).modules[0].style),'classic');assert.doesNotMatch(JSON.stringify(layout.normalize(raw)),/script/);
  assert.equal(layout.normalize(layout.preset()).modules[0].style,undefined);
});

test('legacy clock identifiers remain valid after visual replacements',()=>{
 const old={version:1,modules:[{type:'clock',style:'stacked',x:0,y:0,w:6,h:4}]};
 const upgraded=layout.normalize(old);assert.equal(upgraded.modules[0].style,'stacked');assert.equal(clock.styles.find(s=>s.id===upgraded.modules[0].style).name,'Flip');
 assert.equal(clock.style('classic'),'classic');assert.equal(clock.style('digital'),'digital');
});
test('24-hour labels run 00 to 23 in every hour, never 24:xx',()=>{
  for(let hour=0;hour<24;hour++){
    const label=clock.read('2026-10-10T'+String(hour).padStart(2,'0')+':05:00Z','UTC','24').label;
    assert.ok(label.startsWith(String(hour).padStart(2,'0')+':05'),hour+' → '+label);
  }
});
test('time formatting sets an explicit hour cycle; hour12:false can mean 24:xx on older engines',()=>{
  // Chromium/WebView 95 and Node 20 map hour12:false to the h24 cycle, so 00:05 renders as 24:05.
  const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..'),generated=new Set(['react-ui.js','manage-react.js']);
  const files=[...fs.readdirSync(path.join(root,'web')).filter(f=>f.endsWith('.js')&&!generated.has(f)).map(f=>path.join('web',f)),
    ...fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>/\.tsx?$/.test(f)).map(f=>path.join('src',f))];
  for(const file of files)assert.doesNotMatch(fs.readFileSync(path.join(root,file),'utf8'),/\bhour12\s*:/,file+' uses hour12; use hourCycle h12/h23');
});
