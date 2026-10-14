'use strict';
// Calendar rules are independent of rendering so local midnight and DST can be tested.
(function(root){
  const dayHats=['beret','beanie','bucket','cap','party','crown','flower','headphones','bow','nightcap','wizard'];
  function at(epoch,timezone='America/Toronto'){
    let parts;
    try{parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch));}
    catch(_){timezone='America/Toronto';parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch));}
    const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    const ordinal=Math.floor(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day))/86400000);
    const hour=Number(p.hour);
    return {date:p.year+'-'+p.month+'-'+p.day,hour,timezone,period:hour>=22||hour<6?'night':hour<9?'morning':hour>=20?'evening':'day',dailyHat:dayHats[((ordinal%dayHats.length)+dayHats.length)%dayHats.length]};
  }
  function idle(period,quietFor,random=Math.random()){
    const pool=period==='night'?['sleepy']:period==='morning'?['yawn','stretch','yawn','curious']:period==='evening'?['yawn','sleepy','stretch']:quietFor>45000?['sleepy']:['curious','wink','delighted','stretch','sneeze','dance','peek','proud','puzzled'];
    return pool[Math.min(pool.length-1,Math.floor(Math.max(0,random)*pool.length))];
  }
  // One action at a time; automatic requests are dropped, never queued.
  function coordinator(){
    let action=null,blockedUntil=0;
    return {
      request(name,now,{night=false,user=false,quiet=false,duration=3000}={}){
        if(quiet||(!user&&(night||now<blockedUntil||action&&now<action.until)))return false;
        action={name,started:now,until:now+duration,user};blockedUntil=now+90000;return true;
      },
      current(now,night=false){if(action&&(now>=action.until||night&&!action.user))action=null;return action;},
      reset(now,delay=60000){action=null;blockedUntil=now+delay;}
    };
  }
  function weather(data,units,now=Date.now()){
    if(!data||!Number.isFinite(data.fetchedAt)||now-data.fetchedAt>3600000||data.fetchedAt>now+60000)return '';
    const c=data.current;if(!c)return '';
    const temp=Number(c.temperature_2m),code=Number(c.weather_code);
    if(c.temperature_2m!=null&&Number.isFinite(temp)&&(units==='fahrenheit'?(temp-32)*5/9:temp)<0)return 'frost';
    if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code))return 'rain';
    return '';
  }
  const api={at,idle,coordinator,weather};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MomoRoutine=api;
})(typeof window!=='undefined'?window:globalThis);
