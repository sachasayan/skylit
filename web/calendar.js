'use strict';
(() => {
const $=id=>document.getElementById(id),bridge=window.Skylit;
const available=!!(bridge&&bridge.calendarList);
let sources=[],events=[],overviewEvents=[],allEvents=[],allOverviewEvents=[],errors=new Map(),busy=new Set(),revision=0;
const gateModel=SkylitCalendarPolicy,gateKey='skylit.calendarGate';
let gate=(()=>{try{return gateModel.clean(JSON.parse(localStorage.getItem(gateKey)||'{}'));}catch(e){return gateModel.clean({});}})();
function saveGate(){try{localStorage.setItem(gateKey,JSON.stringify(gate));}catch(e){gateMessage('Could not save inviter settings on this frame.');}}
function gateMessage(message){$('calendar-gate-status').textContent=message;}
function applyGate(){events=allEvents.filter(e=>visible(e)&&gateModel.allowed(e,gate));overviewEvents=allOverviewEvents.filter(e=>visible(e)&&gateModel.allowed(e,gate));paint();}
const prefs=()=>window.SkylitApp.calendarPreferences();
const day=(date)=>{const p={};new Intl.DateTimeFormat('en-CA',{timeZone:prefs().timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).forEach(x=>p[x.type]=x.value);return p.year+'-'+p.month+'-'+p.day;};
const today=()=>day(new Date());
const addDays=(key,n)=>{const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
let selected=today(),month=selected.slice(0,7),activeZone=prefs().timezone,lastToday=today(),hiddenSources=[],search='';
try{const saved=JSON.parse(localStorage.getItem('skylit.calendarView')||'{}');hiddenSources=Array.isArray(saved.hidden)?saved.hidden.filter(x=>typeof x==='string').slice(0,6):[];}catch(_){}
function saveView(){try{localStorage.setItem('skylit.calendarView',JSON.stringify({hidden:hiddenSources}));}catch(_){formMessage('Could not save calendar display choices.');}}
const visible=e=>!hiddenSources.includes(e.source);

const label=(key,options)=>new Intl.DateTimeFormat('en-CA',Object.assign({timeZone:'UTC'},options)).format(new Date(key+'T12:00:00Z'));
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function range(){const first=month+'-01';const start=addDays(first,-new Date(first+'T12:00:00Z').getUTCDay());return {from:start,to:addDays(start,70),zone:prefs().timezone};}
let renderWorkers=new Set();
function parse(body,bounds,group){return new Promise((resolve,reject)=>{
 let worker,timeout,finished=false;
 const finish=(error,events)=>{if(finished)return;finished=true;if(worker)worker.terminate();clearTimeout(timeout);if(group)group.delete(cancel);if(error)reject(error);else resolve(events);};
 const cancel=()=>finish(Error('Calendar render superseded.'));
 if(group)group.add(cancel);
 timeout=setTimeout(()=>finish(Error('Calendar could not be read.')),6000);
 try{worker=new Worker('calendar-worker.js');worker.onerror=()=>finish(Error('Calendar could not be read.'));worker.onmessage=e=>finish(e.data.error?Error(e.data.error):null,e.data.events);worker.postMessage(Object.assign({body},bounds));}catch(e){finish(e);}
});}
function read(){try{sources=JSON.parse(bridge.calendarList());}catch(e){sources=[];}}
function settings(){
 window.SkylitUI.calendar.sources({sources,hidden:hiddenSources,errors,busy,format:n=>new Intl.DateTimeFormat('en-CA',{timeZone:prefs().timezone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hourCycle:prefs().clock==='12'?'h12':'h23'}).format(new Date(n)),onVisible(id,value){hiddenSources=value?hiddenSources.filter(x=>x!==id):[...new Set([...hiddenSources,id])];saveView();applyGate();},onRemove(id){if(!bridge.calendarRemove(id)){formMessage('Could not remove this calendar. Try again.');return;}errors.delete(id);busy.delete(id);formMessage('Calendar removed from this frame.');allEvents=allEvents.filter(e=>e.source!==id);allOverviewEvents=allOverviewEvents.filter(e=>e.source!==id);hiddenSources=hiddenSources.filter(x=>x!==id);saveView();read();applyGate();render();},onEdit(id,name,color){if(!bridge.calendarMetadata||!bridge.calendarMetadata(id,name,color)){formMessage('Edit on the frame. Use a label up to 60 characters and a colour.');return false;}revision++;read();formMessage('Calendar label and colour saved.');render();return true;}});
 $('calendar-add').disabled=!available||sources.length>=6;if(!available)formMessage('Connect calendars on the frame. This browser preview does not store private links.');
}
function formMessage(text){$('calendar-form-status').textContent=text;}
function status(){let overviewText='';
  let text='Connect a calendar to bring your plans here.';
  if(sources.length){const times=sources.map(s=>s.fetchedAt||0);const last=Math.min(...times);const age=Date.now()-last;const failures=errors.size;overviewText=!navigator.onLine?'Offline · Showing saved events.':failures?'Some calendars could not update · Saved events shown where available.':!last?'Waiting for your first calendar update.':age>30*60000?'Saved events · Waiting for a fresh update.':'';
    text=busy.size?'Refreshing your calendars…':!navigator.onLine?'Offline · Showing saved events.':failures?'Some calendars could not update · Saved events shown where available.':!last?'Waiting for your first calendar update.':age>30*60000?'Saved events · Waiting for a fresh update.':'Up to date';
    if(last)text+=' · Last refreshed '+new Intl.DateTimeFormat('en-CA',{timeZone:prefs().timezone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hourCycle:prefs().clock==='12'?'h12':'h23'}).format(new Date(last));
  }
  $('calendar-status').textContent=text;$('overview-calendar-status').textContent=overviewText;

}
function onDay(e,key){return e.startDay<=key&&(e.allDay?e.endDay>key:e.endDay>=key);}
function time(e){if(e.allDay)return 'All day';return new Intl.DateTimeFormat('en-CA',{timeZone:prefs().timezone,hour:'numeric',minute:'2-digit',hourCycle:prefs().clock==='12'?'h12':'h23'}).format(new Date(e.start));}
function paintGate(){
  $('calendar-gate-enable').checked=gate.enabled;$('calendar-unattributed').checked=gate.unattributed;
  if(document.activeElement!==$('calendar-owner'))$('calendar-owner').value=gate.owner;
  window.SkylitUI.calendar.approved({addresses:gate.approved,onRevoke(address){gate=gateModel.revoke(gate,address);saveGate();applyGate();}});
  const byKey=new Map();for(const e of allEvents.concat(allOverviewEvents)){const key=e.source+'/'+e.key;if(!byKey.has(key))byKey.set(key,e);}
  const waiting=gateModel.pending([...byKey.values()],gate);
  const waitingCount=waiting.reduce((sum,item)=>sum+item.count,0);
  $('calendar-pending-count').textContent=String(waitingCount);
  $('calendar-review').textContent=waitingCount?'Review inviters · '+waitingCount:'Review inviters';$('calendar-review').hidden=!waitingCount;
  window.SkylitUI.calendar.pending({waiting,enabled:gate.enabled,onApprove(address){gate=gateModel.approve(gate,address);saveGate();gateMessage('Inviter approved on this frame.');applyGate();}});
}
function paint(){
  $('calendar-empty').hidden=sources.length>0;$('calendar-content').hidden=!sources.length;
  $('calendar-month-title').textContent=label(month+'-01',{month:'long',year:'numeric'});
  const first=month+'-01',offset=new Date(first+'T12:00:00Z').getUTCDay(),begin=addDays(first,-offset);
  const days=Array.from({length:42},(_,i)=>{const key=addDays(begin,i);return {key,items:events.filter(e=>onDay(e,key)),outside:!key.startsWith(month),today:key===today(),selected:key===selected,label:label(key,{weekday:'long',month:'long',day:'numeric'})};});
  window.SkylitUI.calendar.grid({days,onSelect(key){selected=key;if(key.slice(0,7)!==month){month=key.slice(0,7);render();}else paint();}});
  const anchor=search?range().from:selected,span=search?70:14;let count=0;const groups=[];
  $('calendar-agenda-title').textContent=search?'Search · Loaded dates':label(anchor,{month:'short',day:'numeric'})+' onwards';
  for(let i=0;i<span;i++){const key=addDays(anchor,i),items=events.filter(e=>onDay(e,key)&&(!search||e.title.toLowerCase().includes(search)));if(!items.length&&(search||i!==0))continue;const rows=[];for(const e of items){if(count++>=100)break;const format=n=>new Intl.DateTimeFormat('en-CA',{timeZone:prefs().timezone,dateStyle:'medium',timeStyle:'short',hourCycle:prefs().clock==='12'?'h12':'h23'}).format(new Date(n));rows.push({event:e,time:time(e),range:e.allDay?'':format(e.start)+' – '+format(e.end)});}groups.push({key,title:key===today()?'Today · '+label(key,{month:'short',day:'numeric'}):label(key,{weekday:'short',month:'short',day:'numeric'}),items:rows});if(count>=100)break;}
  window.SkylitUI.calendar.agenda({groups,empty:count?'':sources.some(s=>!s.fetchedAt)?'Events will appear after the first successful connection.':search?'No matching titles in the loaded dates.':'No plans in the next two weeks.',onCountdown:window.SkylitApp.addCountdown});
  status();settings();paintOverview();paintGate();
}
function paintOverview(){const day=today(),list=SkylitOverview.upcoming(overviewEvents,day,Date.now(),3),groups=[];for(const e of list){const key=e.startDay<day?'ongoing':e.startDay;let group=groups[groups.length-1];if(!group||group.key!==key){group={key,title:key==='ongoing'?'Ongoing':key===day?'Today':key===addDays(day,1)?'Tomorrow':label(key,{weekday:'short',month:'short',day:'numeric'}),items:[]};groups.push(group);}group.items.push({event:e,time:time(e)});}window.SkylitUI.calendar.overview({groups,multiple:sources.length>1,empty:list.length?'':!sources.length?'Add a calendar to see upcoming events.':sources.some(s=>!s.fetchedAt)?'Waiting for the first calendar update.':'No upcoming events in the next two weeks.',onSelect(e){selected=e.startDay<today()?today():e.startDay;month=selected.slice(0,7);window.SkylitApp.go('calendar');render();},onAdd:sources.length?null:()=>window.SkylitApp.openSettings?window.SkylitApp.openSettings('calendars','overview'):setup()});}
async function render(){
 for(const cancel of renderWorkers)cancel();
 const workers=renderWorkers=new Set();
 const version=++revision,bounds=range(),snapshot=sources.slice(),upcoming={from:today(),to:addDays(today(),14),zone:prefs().timezone};
 const result=[],overview=[],failures=[];
 for(const s of snapshot){if(!s.body)continue;try{
  if(version!==revision)return;
  const list=await parse(s.body,bounds,workers);
  if(version!==revision)return;
  const next=bounds.from<=upcoming.from&&bounds.to>=upcoming.to?list:await parse(s.body,upcoming,workers);
  if(version!==revision)return;
  const annotate=e=>Object.assign({},e,{source:s.id,name:s.name,color:s.color});
  result.push(...list.map(annotate));overview.push(...next.filter(e=>e.startDay<upcoming.to).map(annotate));
 }catch(e){if(version!==revision)return;failures.push(s.id);}}
 if(version!==revision)return;
 failures.forEach(id=>errors.set(id,'Could not read saved events. Try refreshing.'));
 allEvents=result.sort((a,b)=>a.startDay.localeCompare(b.startDay)||Number(b.allDay)-Number(a.allDay)||a.start-b.start);allOverviewEvents=overview;applyGate();
}
async function receive(message){const s=sources.find(s=>s.id===message.id);if(!s)return;if(message.error){busy.delete(s.id);errors.set(s.id,message.error);formMessage('Connection failed. Check Wi-Fi, or remove the calendar and add its current private link.');paint();return;}try{await parse(message.body,range());if(!sources.some(x=>x.id===s.id)){bridge.calendarAccept(s.id,message.request,false);return;}if(!bridge.calendarAccept(s.id,message.request,true))throw Error('Save failed');read();errors.delete(s.id);formMessage('Calendar connected. Your events are ready in the Calendar tab.');}catch(e){bridge.calendarAccept(s.id,message.request,false);errors.set(s.id,'Could not read or save this feed. Previous events kept.');formMessage('This feed could not be read. Any previously saved events are still available.');}finally{busy.delete(s.id);render();}}
function refresh(){if(!available)return;for(const s of sources)if(!busy.has(s.id)){busy.add(s.id);bridge.calendarRefresh(s.id)}status();settings();}
function setup(){if(window.SkylitApp.openSettings)window.SkylitApp.openSettings('calendars','calendar');else{window.SkylitApp.go('settings');$('calendar-settings').scrollIntoView({block:'start'});}}
$('calendar-setup').onclick=setup;$('calendar-connect').onclick=setup;
$('calendar-review').onclick=()=>{if(window.SkylitApp.openSettings)window.SkylitApp.openSettings('calendar-review','calendar');else{setup();$('calendar-inviters').open=true;$('calendar-inviters').scrollIntoView({block:'start'});}};
$('calendar-owner').onchange=()=>{const address=gateModel.email($('calendar-owner').value);if(!address){gateMessage('Enter a valid calendar account email.');return;}gate.owner=address;saveGate();gateMessage('Calendar account saved on this frame.');applyGate();};
$('calendar-gate-enable').onchange=()=>{if($('calendar-gate-enable').checked&&!gate.owner){$('calendar-gate-enable').checked=false;gateMessage('Enter the calendar account email first, so its own events stay visible.');return;}gate.enabled=$('calendar-gate-enable').checked;saveGate();gateMessage(gate.enabled?'Inviter review is on. Events from other organizers wait below.':'Inviter review is off. All calendar events are visible.');applyGate();};
$('calendar-unattributed').onchange=()=>{gate.unattributed=$('calendar-unattributed').checked;saveGate();applyGate();};
$('calendar-approve-form').onsubmit=e=>{e.preventDefault();const input=$('calendar-approve-email'),address=gateModel.email(input.value);if(!address){gateMessage('Enter a valid email address.');return;}if(gate.approved.length>=gateModel.MAX_SENDERS){gateMessage('The approved list is full. Remove an address first.');return;}gate=gateModel.approve(gate,address);input.value='';saveGate();gateMessage('Inviter approved on this frame.');applyGate();};
$('calendar-today').onclick=()=>{selected=today();month=selected.slice(0,7);render()};
function move(delta){const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);month=date.toISOString().slice(0,7);selected=month+'-01';render();}
$('calendar-prev').onclick=()=>move(-1);$('calendar-next').onclick=()=>move(1);
$('calendar-form').onsubmit=e=>{e.preventDefault();if(!available)return;const input=$('calendar-feed');const id=bridge.calendarAdd($('calendar-name').value,$('calendar-color').value,input.value.trim());input.value='';if(!id){formMessage('Use the Google iCal address ending in basic.ics. Check for a duplicate calendar or the six-calendar limit.');return;}formMessage('Saved privately. Checking the connection…');$('calendar-name').value='';read();paint();refresh();};
window.SkylitCalendar={receive,refresh,health:()=>({count:sources.length,updated:sources.length?Math.min(...sources.map(s=>s.fetchedAt||0)):0,busy:busy.size>0,error:errors.size>0})};
const searchInput=$('calendar-search');if(searchInput)searchInput.oninput=()=>{search=searchInput.value.trim().toLowerCase().slice(0,100);paint();};
window.addEventListener('online',refresh);window.addEventListener('offline',status);
window.addEventListener('skylit-preferences',()=>{activeZone=prefs().timezone;selected=today();month=selected.slice(0,7);render()});
window.addEventListener('skylit-tab',e=>{if(e.detail==='calendar'||e.detail==='overview'){if(activeZone!==prefs().timezone){activeZone=prefs().timezone;selected=today();month=selected.slice(0,7);}render();}});
setInterval(()=>{const now=today();if(lastToday!==now){if(selected===lastToday){selected=now;month=now.slice(0,7);}lastToday=now;render();}status();paintOverview();if(available&&sources.some(s=>Date.now()-s.fetchedAt>15*60000))refresh();},60000);
if(available)read();paint();render();if(available)refresh();
})();
