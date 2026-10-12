'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitAppModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  function settings(defaults,...layers){
    const result={...defaults,city:{...defaults.city}};
    for(const layer of layers){if(!object(layer))continue;for(const key of Object.keys(defaults)){
      if(!Object.prototype.hasOwnProperty.call(layer,key))continue;
      if(key==='city')result.city=object(layer.city)?{...result.city,...layer.city}:{...defaults.city};
      else if(typeof layer[key]===typeof defaults[key])result[key]=layer[key];
    }if(typeof layer.mode==='string')result.mode=layer.mode;}
    for(const key of ['name','admin1','country','timezone'])if(typeof result.city[key]!=='string')result.city[key]=defaults.city[key];
    const {latitude,longitude}=result.city;
    if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180){result.city.latitude=null;result.city.longitude=null;}
    try{new Intl.DateTimeFormat('en-CA',{timeZone:result.city.timezone}).format(0);}catch(_){result.city.timezone=defaults.city.timezone;}
    if(!['12','24'].includes(result.clock))result.clock=defaults.clock;
    if(!['celsius','fahrenheit'].includes(result.units))result.units=defaults.units;
    if(![0,60,120,300,600].includes(result.idle))result.idle=defaults.idle;
    if(!['mobile','desktop'].includes(result.youtube))result.youtube=defaults.youtube;
    return result;
  }
  function day(instant,zone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant)),value=key=>parts.find(p=>p.type===key).value;return value('year')+'-'+value('month')+'-'+value('day');}
  function forecast(data,now,zone){
    const currentDay=day(now,zone),hours=(data.hourly.time||[]).map((time,index)=>({time,index})).filter(row=>Number.isFinite(row.time)&&row.time*1000>=now-1800000).slice(0,7).map(row=>({...row,isNow:Math.abs(row.time*1000-now)<=1800000}));
    const days=(data.daily.time||[]).slice(0,5).map((time,index)=>({time,index,isToday:Number.isFinite(time)&&day(time*1000,zone)===currentDay,isPast:Number.isFinite(time)&&day(time*1000,zone)<currentDay})).filter(row=>Number.isFinite(row.time));
    return {hours,days};
  }
  return {settings,forecast};
});
