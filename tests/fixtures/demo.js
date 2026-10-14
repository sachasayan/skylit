/* Synthetic public screenshot fixture. Not included in APK assets. No remote requests. */
(() => {
const RealDate=Date,now=RealDate.parse('2026-10-10T08:15:00Z');
window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}};
if(!localStorage.getItem('skylit.settings'))localStorage.setItem('skylit.settings',JSON.stringify({theme:'linen',mode:'light',city:{name:'London',admin1:'England',country:'United Kingdom',latitude:51.51,longitude:-.13,timezone:'Europe/London'},idle:0}));
if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('photos')==='email')localStorage.setItem('skylit.photoSource','email');
if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('review')==='1')window.addEventListener('load',()=>setTimeout(()=>document.getElementById('calendar-review').click(),300));
const date='20261010';
const event=(id,title,start,end,extra='')=>`BEGIN:VEVENT\r\nUID:${id}\r\nDTSTART:${start}\r\nDTEND:${end}\r\nSUMMARY:${title}\r\n${extra}END:VEVENT\r\n`;
const body='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Skylit//Synthetic demo//EN\r\n'+event('breakfast','Market & breakfast',date+'T090000Z',date+'T103000Z','LOCATION:Town square\r\nDESCRIPTION:Bring the shopping bags.\r\n')+event('walk','Afternoon walk',date+'T140000Z',date+'T150000Z')+event('dinner','Dinner with friends',date+'T180000Z',date+'T200000Z')+event('library','Library books due','20261012T090000Z','20261012T093000Z')+event('garden','Garden club','20261014T153000Z','20261014T163000Z','RRULE:FREQ=WEEKLY;COUNT=4\r\n')+'END:VCALENDAR';
const sources=[{id:'demo',name:'Example calendar',color:'#833e2c',body,fetchedAt:now}];
window.Skylit={configure(){},calendarList:()=>JSON.stringify(sources),calendarRefresh(){},calendarMetadata(id,name,color){const s=sources.find(x=>x.id===id);if(!s)return false;s.name=name;s.color=color;return true;},calendarRemove:()=>false,calendarAdd:()=>'',calendarAccept:()=>true};
const hour=3600,base=now/1000;
const weather={fetchedAt:now,current:{temperature_2m:17,weather_code:2,is_day:1,apparent_temperature:16,relative_humidity_2m:62,wind_speed_10m:11},daily:{time:Array.from({length:5},(_,i)=>base+i*86400),temperature_2m_max:[19,18,17,16,18],temperature_2m_min:[11,10,9,10,11],weather_code:[2,3,61,2,0],precipitation_probability_max:[15,25,70,20,5],sunrise:[base-2*hour],sunset:Array.from({length:5},(_,i)=>base+9*hour+i*86400)},hourly:{time:Array.from({length:24},(_,i)=>base+i*hour),temperature_2m:Array.from({length:24},(_,i)=>17+Math.round(Math.sin(i/4)*3)),weather_code:Array(24).fill(2),is_day:Array(24).fill(1),precipitation_probability:Array(24).fill(15)}};
const preview=new URLSearchParams(location.search),previewCode=Number(preview.get('weather'));
if(preview.has('weather')&&[0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(previewCode))weather.current.weather_code=previewCode;
if(preview.get('night')==='1')weather.current.is_day=0;
const realFetch=window.fetch.bind(window);
window.fetch=(url,options)=>String(url).startsWith('https://api.open-meteo.com/v1/forecast?')?Promise.resolve({ok:true,json:async()=>weather}):realFetch(url,options);
// A refresh is a no-op in the fixture; keep it from implying a real connection.
window.Skylit.calendarRefresh=id=>setTimeout(()=>window.SkylitCalendar.receive({id,body,request:'demo-refresh'}),0);
const badge=document.createElement('div');badge.textContent='DEMO DATA';badge.style.cssText='position:fixed;right:12px;bottom:8px;font:11px system-ui;color:var(--muted);z-index:5;pointer-events:none';document.body.append(badge);
})();
