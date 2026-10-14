/* Skylit's iCalendar adapter. Event data is returned as text, never HTML. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./ical.js'));else root.CalendarModel=factory(root.ICAL);})(typeof self!=='undefined'?self:this,function(ICAL){
'use strict';
const pad=n=>String(n).padStart(2,'0');
// A worker parses one feed; keep public helper use bounded as well.
const formatters=new Map();
function formatter(zone,clock=false){const key=zone+'|'+clock;if(!formatters.has(key)){if(formatters.size>=32)formatters.delete(formatters.keys().next().value);formatters.set(key,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',...(clock?{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}:{})}));}return formatters.get(key);}

function organizerAddress(value){
  const text=String(value||'').trim();
  const match=/^mailto:([^\s?<>]{1,254})$/i.exec(text);
  if(!match||! /^[^@]+@[^@]+\.[^@]+$/.test(match[1]))return '';
  return match[1].toLowerCase();
}
function dayKey(date,zone){const p={};formatter(zone).formatToParts(date).forEach(x=>p[x.type]=x.value);return p.year+'-'+p.month+'-'+p.day;}
function wallDay(t){return t.year+'-'+pad(t.month)+'-'+pad(t.day);}
function addDays(key,n){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function wallEpoch(t,zone){
  const wall=Date.UTC(t.year,t.month-1,t.day,t.hour||0,t.minute||0,t.second||0);
  let guess=wall;
  const fmt=formatter(zone,true);
  for(let i=0;i<4;i++){const p={};fmt.formatToParts(new Date(guess)).forEach(x=>p[x.type]=x.value);const got=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);const next=guess+wall-got;if(next===guess)return guess;guess=next;}
  return guess;
}
function epoch(t,zone){return t.isDate||t.zone===ICAL.Timezone.localTimezone?wallEpoch(t,zone):t.toUnixTime()*1000;}
function parse(body,from,to,zone){
  if(typeof body!=='string'||body.length>2097152)throw Error('Calendar is too large.');
  const data=ICAL.parse(body);if(data[0]!=='vcalendar')throw Error('This is not an iCalendar feed.');
  ICAL.TimezoneService.reset();
  const calendar=new ICAL.Component(data);
  for(const component of calendar.getAllSubcomponents('vtimezone')){const tzid=component.getFirstPropertyValue('tzid');if(tzid)ICAL.TimezoneService.register(tzid,new ICAL.Timezone(component));}
  const components=calendar.getAllSubcomponents('vevent');
  if(components.length>10000)throw Error('This calendar has too many events.');
  // Never silently interpret an unknown TZID as the frame's local timezone.
  for(const c of components)for(const p of c.getAllProperties()){
    const tz=p.getParameter('tzid');if(tz&&!ICAL.TimezoneService.has(tz))throw Error('Calendar timezone definitions are missing.');
  }
  const masters=new Map(),exceptions=new Map();
  for(const c of components){const uid=c.getFirstPropertyValue('uid');if(!uid)throw Error('An event has no identifier.');const event=new ICAL.Event(c);
    if(event.isRecurrenceException()){if(!exceptions.has(uid))exceptions.set(uid,[]);exceptions.get(uid).push(event);}
    else {const previous=masters.get(uid);if(!previous||Number(c.getFirstPropertyValue('sequence')||0)>=Number(previous.component.getFirstPropertyValue('sequence')||0))masters.set(uid,event);}
  }
  const output=[],seen=new Set();const lower=Date.parse(from+'T00:00:00Z')-172800000,upper=Date.parse(to+'T00:00:00Z')+172800000;
  function push(event,start,end,key,master){
    if(event.component.getFirstPropertyValue('status')==='CANCELLED'||!start)return;
    if(!end){end=start.clone();if(start.isDate)end.adjust(1,0,0,0);}
    const s=epoch(start,zone),e=epoch(end,zone);
    const startDay=start.isDate?wallDay(start):dayKey(new Date(s),zone);
    const endDay=start.isDate?wallDay(end):dayKey(new Date(Math.max(s,e-1)),zone);
    if(startDay>=to||(start.isDate?endDay<=from:endDay<from)||seen.has(key))return;
    seen.add(key);
    const organizer=organizerAddress(event.component.getFirstPropertyValue('organizer')||(master&&master.component.getFirstPropertyValue('organizer')));
    output.push({key,title:String(event.summary||'Untitled event').slice(0,500),location:String(event.location||'').slice(0,1000),description:String(event.description||'').slice(0,6000),organizer,allDay:start.isDate,start:s,end:e,startDay,endDay});
    if(output.length>2000)throw Error('Too many events in this view.');
  }
  for(const [uid,event] of masters){
    if(event.component.getFirstPropertyValue('status')==='CANCELLED')continue;
    const overrides=exceptions.get(uid)||[];
    for(const ex of overrides)event.relateException(ex);
    if(event.isRecurring()){
      const iterator=event.iterator();let time,steps=0,maxShift=0;
      // Still advance the original iterator so COUNT, EXDATE and BY* retain their
      // semantics. Skip expensive timezone/occurrence work only when no exception
      // can move an old occurrence into view. Two extra days cover offset/DST changes.
      const duration=event.duration.toSeconds()*1000;
      const skipBefore=!overrides.length&&duration>=0?lower-duration-172800000:-Infinity;
      for(const ex of overrides)if(ex.startDate)maxShift=Math.max(maxShift,Math.abs(epoch(ex.startDate,zone)-epoch(ex.recurrenceId,zone)));
      while((time=iterator.next())){
        if(++steps>30000)throw Error('This repeating calendar is too complex.');
        if(Date.UTC(time.year,time.month-1,time.day,time.hour||0,time.minute||0,time.second||0)<skipBefore)continue;
        const original=epoch(time,zone);if(original>upper+maxShift)break;
        const details=event.getOccurrenceDetails(time);
        if(epoch(details.endDate,zone)<lower)continue;
        push(details.item,details.startDate,details.endDate,uid+'/'+time.toString(),event);
      }
    }else push(event,event.startDate,event.endDate,uid);
    // Detached exceptions can move into the visible range from outside the iterator window.
    for(const ex of overrides)push(ex,ex.startDate,ex.endDate,uid+'/'+ex.recurrenceId.toString(),event);
  }
  for(const [uid,overrides] of exceptions)if(!masters.has(uid))for(const ex of overrides)push(ex,ex.startDate,ex.endDate,uid+'/'+ex.recurrenceId.toString());
  return output.sort((a,b)=>a.startDay.localeCompare(b.startDay)||Number(b.allDay)-Number(a.allDay)||a.start-b.start||a.title.localeCompare(b.title));
}
function onDay(event,key){return event.startDay<=key&&(event.allDay?event.endDay>key:event.endDay>=key);}
return {parse,dayKey,addDays,onDay,wallEpoch,organizerAddress};
});
