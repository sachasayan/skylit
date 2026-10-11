'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitClock=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const styles=[{id:'classic',name:'Classic'},{id:'analog',name:'Analog'},{id:'stacked',name:'Stacked'},{id:'digital',name:'Digital'}];
  const style=value=>styles.some(item=>item.id===value)?value:'classic';
  function read(instant,timezone,format='12'){
    const date=new Date(instant),parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),get=key=>Number(parts.find(p=>p.type===key).value);
    const hour=get('hour'),minute=get('minute'),second=get('second'),options={timeZone:timezone,hour:'numeric',minute:'2-digit',hour12:format!=='24'};
    const display=new Intl.DateTimeFormat('en-CA',options).formatToParts(date);
    return {hour,minute,second,hourText:format==='24'?String(hour).padStart(2,'0'):String(hour%12||12),minuteText:String(minute).padStart(2,'0'),period:(display.find(p=>p.type==='dayPeriod')||{}).value||'',label:new Intl.DateTimeFormat('en-CA',options).format(date),date:new Intl.DateTimeFormat('en-CA',{timeZone:timezone,weekday:'long',month:'short',day:'numeric'}).format(date),hourAngle:(hour%12)*30+minute*.5+second/120,minuteAngle:minute*6+second*.1};
  }
  function create(document){
    const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;},svg=(tag,attributes)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))n.setAttribute(key,value);return n;};
    const root=node('div','clock-visual');root.setAttribute('aria-hidden','true');
    const face=svg('svg',{viewBox:'0 0 200 200',class:'clock-dial','aria-hidden':'true',focusable:'false'});face.append(svg('circle',{cx:100,cy:100,r:96,class:'clock-face'}));
    for(let i=0;i<12;i++)face.append(svg('line',{x1:100,y1:11,x2:100,y2:i%3===0?19:16,transform:'rotate('+(i*30)+' 100 100)',class:'clock-tick'}));
    for(const [text,x,y] of [['12',100,42],['3',161,110],['6',100,177],['9',39,110]]){const label=svg('text',{x,y,'text-anchor':'middle',class:'clock-numeral'});label.textContent=text;face.append(label);}
    const hour=svg('line',{x1:100,y1:106,x2:100,y2:57,class:'clock-hour-hand'}),minute=svg('line',{x1:100,y1:110,x2:100,y2:32,class:'clock-minute-hand'});face.append(hour,minute,svg('circle',{cx:100,cy:100,r:5,class:'clock-pin'}));
    const stack=node('div','clock-stack'),hours=node('span','clock-stack-hour'),minutes=node('span','clock-stack-minute'),period=node('small','clock-stack-period');stack.append(hours,minutes,period);root.append(face,stack);
    return {root,update(value,data){root.dataset.clockStyle=style(value);hour.setAttribute('transform','rotate('+data.hourAngle+' 100 100)');minute.setAttribute('transform','rotate('+data.minuteAngle+' 100 100)');hours.textContent=data.hourText;minutes.textContent=data.minuteText;period.textContent=data.period;period.hidden=!data.period;}};
  }
  return {styles,style,read,create};
});
