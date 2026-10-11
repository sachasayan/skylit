const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../web/app-model.js');
const defaults={theme:'linen',city:{name:'Choose your city',admin1:'',country:'',latitude:null,longitude:null,timezone:'UTC'},units:'celsius',clock:'12',idle:120,album:'',home:'https://home.google.com/u/0/',calendar:'',youtube:'mobile'};
test('valid JSON with an invalid city or preference cannot break startup',()=>{
 for(const city of [null,[],0,'bad']){
  const config=M.settings(defaults,{}, {city,clock:null,idle:999,youtube:'other',units:'invalid'});
  assert.deepEqual(config.city,defaults.city);assert.equal(config.clock,'12');assert.equal(config.idle,120);assert.equal(config.units,'celsius');
 }
 assert.deepEqual(M.settings(defaults,null,[]),defaults);
 const valid={name:'Example city',latitude:43,longitude:-79,timezone:'America/Toronto'};
 const config=M.settings(defaults,{city:valid},{city:{name:'Renamed city',timezone:'not/a/zone'},clock:'24'});
 assert.equal(config.city.name,'Renamed city');assert.equal(config.city.latitude,43);assert.equal(config.city.timezone,'UTC');assert.equal(config.clock,'24');
 assert.equal(M.settings(defaults,{city:{...valid,latitude:91}}).city.latitude,null);
 assert.deepEqual(defaults.city,{name:'Choose your city',admin1:'',country:'',latitude:null,longitude:null,timezone:'UTC'});
});
test('expired hourly forecasts do not wrap to an old Now or label an old date Today',()=>{
 const now=Date.parse('2026-10-11T15:00Z'),seconds=time=>Date.parse(time)/1000;
 const forecast=M.forecast({hourly:{time:[seconds('2026-10-09T12:00Z')]},daily:{time:[seconds('2026-10-09T00:00Z'),seconds('2026-10-11T00:00Z')]}},now,'UTC');
 assert.deepEqual(forecast.hours,[]);assert.equal(forecast.days[0].isToday,false);assert.equal(forecast.days[0].isPast,true);assert.equal(forecast.days[1].isToday,true);
});
test('hourly labels and daily labels use actual timestamps in the chosen city zone',()=>{
 const now=Date.parse('2026-10-11T00:15Z'),seconds=time=>Date.parse(time)/1000;
 const result=M.forecast({hourly:{time:[seconds('2026-10-10T22:00Z'),seconds('2026-10-11T00:00Z'),seconds('2026-10-11T01:00Z')]},daily:{time:[seconds('2026-10-10T07:00Z'),seconds('2026-10-11T07:00Z')]}},now,'America/Los_Angeles');
 assert.deepEqual(result.hours.map(x=>[x.index,x.isNow]),[[1,true],[2,false]]);assert.deepEqual(result.days.map(x=>x.isToday),[true,false]);
});
