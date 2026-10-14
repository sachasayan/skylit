// Controller tests deliberately reorder worker completions; no browser or private feeds.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Overview=require('../web/overview-model.js');
const CalendarPolicy=require('../web/calendar-policy.js');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this._text='';this.value='';this.classList={toggle(){}};}
 set textContent(v){this._text=v;this.children=[]}get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('')}
 append(...c){this.children.push(...c)}setAttribute(k,v){this.attrs[k]=v}scrollIntoView(){}
}
function setup({multiple=false,organizer='',savedView=null,sourceCount=1}={}){
 const now=Date.parse('2026-10-10T08:00Z'),elements=new Map(),pending=[],listeners={},views={};
 const network={onLine:true},storage=new Map();if(savedView)storage.set('skylit.calendarView',JSON.stringify(savedView));
 const $=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 let sources=Array.from({length:sourceCount},(_,i)=>({id:i?'demo'+i:'demo',name:'Example',color:'#833e2c',body:'synthetic',fetchedAt:now}));
 const window={SkylitApp:{calendarPreferences:()=>({timezone:'UTC',clock:'24'}),go(){}},Skylit:{calendarList:()=>JSON.stringify(sources),calendarRefresh(){},calendarRemove(id){sources=sources.filter(s=>s.id!==id);return true}},addEventListener(name,fn){listeners[name]=fn}};
 window.SkylitUI={calendar:Object.fromEntries(['sources','grid','agenda','overview','approved','pending'].map(key=>[key,props=>{views[key]=props;const id={sources:'calendar-sources',grid:'calendar-grid',agenda:'calendar-agenda',overview:'overview-events',approved:'calendar-approved',pending:'calendar-pending'}[key];$(id).textContent=JSON.stringify(props)+(props.onAdd?'Add a calendar':'');}]))};
 class FixedDate extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
 class Worker{postMessage(bounds){this.bounds=bounds;pending.push(this)}terminate(){this.terminated=true;}}
 vm.runInNewContext(fs.readFileSync('web/calendar.js','utf8'),{window,document:{getElementById:$,createElement:tag=>new Element(tag),createTextNode:t=>({textContent:t})},Date:FixedDate,Intl,Worker,SkylitOverview:Overview,SkylitCalendarPolicy:CalendarPolicy,navigator:network,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},setTimeout,clearTimeout,setInterval(){}});
 const event={title:'Upcoming example',organizer,allDay:false,startDay:'2026-10-10',endDay:'2026-10-10',start:now+3600000,end:now+7200000};
 const eventList=multiple?[event,{...event,title:'Later today',start:now+10800000,end:now+14400000},{...event,title:'Next day',startDay:'2026-10-11',endDay:'2026-10-11',start:now+86400000,end:now+90000000}]:[event];
 const complete=(worker,fail=false)=>fail?worker.onmessage({data:{error:'bad'}}):worker.onmessage({data:{events:eventList.filter(e=>worker.bounds.from<=e.startDay&&worker.bounds.to>e.startDay)}});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 return {$,pending,complete,flush,network,listeners,storage,views};
}
test('calendar ignores stale render results and overview stays on today while browsing other months',async()=>{
 const h=setup();h.complete(h.pending.shift());await h.flush();assert.match(h.$('overview-events').textContent,/Upcoming example/);
 h.$('calendar-prev').onclick();const old=h.pending.shift();
 h.$('calendar-next').onclick();const latest=h.pending.shift();h.complete(latest);await h.flush();
 h.complete(old,true);await h.flush();assert.match(h.$('calendar-month-title').textContent,/October 2026/);assert.doesNotMatch(h.$('calendar-sources').textContent,/Could not read/);
 h.$('calendar-next').onclick();h.complete(h.pending.shift());await h.flush();
 // A second worker expands today's two weeks rather than relying on November.
 assert.equal(h.pending[0].bounds.from,'2026-10-10');h.complete(h.pending.shift());await h.flush();
 assert.match(h.$('calendar-month-title').textContent,/November 2026/);assert.match(h.$('overview-events').textContent,/Upcoming example/);
});
test('removing a calendar while parsing immediately clears overview and cannot resurrect events',async()=>{
 const h=setup();h.complete(h.pending.shift());await h.flush();h.$('calendar-next').onclick();const old=h.pending.shift();
 h.views.sources.onRemove('demo');await h.flush();
 assert.match(h.$('overview-events').textContent,/Add a calendar/);
 h.complete(old);await h.flush();assert.equal(old.terminated,true);assert.equal(h.pending.length,0);
 assert.match(h.$('overview-events').textContent,/Add a calendar/);assert.equal(h.$('calendar-content').hidden,true);
});

test('overview groups dates once and hides redundant single-calendar metadata',async()=>{
 const h=setup({multiple:true});h.complete(h.pending.shift());await h.flush();
 const groups=h.views.overview.groups;
 assert.equal(groups.length,2);assert.equal(groups[0].title,'Today');assert.equal(groups[0].items.length,2);
 assert.equal(groups[1].title,'Tomorrow');assert.equal(h.views.overview.multiple,false);
 assert.equal(h.$('overview-calendar-status').textContent,'');
 h.network.onLine=false;h.listeners.offline();
 assert.match(h.$('overview-calendar-status').textContent,/Offline/);
});

test('inviter approval and removal update both Calendar and Overview without a refetch',async()=>{
 const h=setup({organizer:'guest@example.invalid'});h.complete(h.pending.shift());await h.flush();
 assert.match(h.$('overview-events').textContent,/Upcoming example/);
 h.$('calendar-owner').value='host@example.invalid';h.$('calendar-owner').onchange();
 h.$('calendar-gate-enable').checked=true;h.$('calendar-gate-enable').onchange();
 assert.doesNotMatch(h.$('overview-events').textContent,/Upcoming example/);
 assert.doesNotMatch(h.$('calendar-agenda').textContent,/Upcoming example/);
 assert.match(h.$('calendar-review').textContent,/1/);
 h.$('calendar-approve-email').value='guest@example.invalid';h.$('calendar-approve-form').onsubmit({preventDefault(){}});
 assert.match(h.$('overview-events').textContent,/Upcoming example/);
 assert.match(h.$('calendar-agenda').textContent,/Upcoming example/);
 h.views.approved.onRevoke('guest@example.invalid');
 assert.doesNotMatch(h.$('overview-events').textContent,/Upcoming example/);
 assert.doesNotMatch(h.$('calendar-agenda').textContent,/Upcoming example/);
});


test('source visibility hides both Calendar and Overview immediately without removing feeds',async()=>{
 const h=setup();h.complete(h.pending.shift());await h.flush();
 h.views.sources.onVisible('demo',false);
 assert.doesNotMatch(h.$('calendar-agenda').textContent,/Upcoming example/);
 assert.doesNotMatch(h.$('overview-events').textContent,/Upcoming example/);
 assert.equal(h.$('calendar-content').hidden,false);assert.deepEqual(JSON.parse(h.storage.get('skylit.calendarView')).hidden,['demo']);
 h.views.sources.onVisible('demo',true);
 assert.match(h.$('overview-events').textContent,/Upcoming example/);
});
test('an upgrade with a retired Today view keeps the selected-date month agenda',async()=>{
 const h=setup({multiple:true,savedView:{view:'today',hidden:[]}});h.complete(h.pending.shift());await h.flush();
 assert.match(h.$('calendar-agenda').textContent,/Later today/);assert.match(h.$('calendar-agenda').textContent,/Next day/);assert.equal(h.$('calendar-view').onchange,undefined);
});

test('loaded-date search filters only Calendar, preserving the today-anchored Overview',async()=>{
 const h=setup({multiple:true});h.complete(h.pending.shift());await h.flush();
 h.$('calendar-search').value='Next day';h.$('calendar-search').oninput();
 assert.match(h.$('calendar-agenda').textContent,/Next day/);assert.doesNotMatch(h.$('calendar-agenda').textContent,/Upcoming example/);
 assert.match(h.$('overview-events').textContent,/Upcoming example/);
 h.$('calendar-search').value='';h.$('calendar-search').oninput();
 assert.match(h.$('calendar-agenda').textContent,/Upcoming example/);
});

test('superseded multi-feed renders terminate work and never start another obsolete worker',async()=>{
 const h=setup({sourceCount:3});const obsolete=h.pending.shift();
 h.$('calendar-next').onclick();const next=h.pending.shift();assert.equal(obsolete.terminated,true);
 h.$('calendar-prev').onclick();const latest=h.pending.shift();assert.equal(next.terminated,true);
 h.complete(obsolete);h.complete(next);await h.flush();assert.equal(h.pending.length,0);
 h.complete(latest);await h.flush();assert.equal(h.pending.length,1);
 h.complete(h.pending.shift());await h.flush();assert.equal(h.pending.length,1);
 h.complete(h.pending.shift());await h.flush();assert.match(h.$('overview-events').textContent,/Upcoming example/);assert.equal(h.pending.length,0);
});
