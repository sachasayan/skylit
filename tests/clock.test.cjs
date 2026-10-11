const {test}=require('node:test'),assert=require('node:assert/strict'),clock=require('../web/clock.js'),layout=require('../web/dashboard-model.js');
test('clock hands include minutes/seconds and use the configured city, independent of local timezone',()=>{
  const london=clock.read('2026-10-10T08:15:30Z','Europe/London','12');
  assert.equal(london.hour,9);assert.equal(london.hourText,'9');assert.equal(london.minuteText,'15');assert.equal(london.hourAngle,277.75);assert.equal(london.minuteAngle,93);
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
