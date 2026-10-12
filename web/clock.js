'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitClock=api;})(typeof window!=='undefined'?window:globalThis,function(){
  // Keep the stored identifier so existing Stacked selections become Flip on upgrade.
  const styles=[{id:'classic',name:'Landscape'},{id:'analog',name:'Analog'},{id:'stacked',name:'Flip'},{id:'digital',name:'Botanical'}];
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
    for(const [text,x,y] of [['12',100,39],['3',168,108],['6',100,179],['9',32,108]]){const label=svg('text',{x,y,'text-anchor':'middle',class:'clock-numeral'});label.textContent=text;face.append(label);}
    const hour=svg('line',{x1:100,y1:100,x2:100,y2:53,class:'clock-hour-hand'}),minute=svg('line',{x1:100,y1:100,x2:100,y2:30,class:'clock-minute-hand'});face.append(hour,minute,svg('circle',{cx:100,cy:100,r:5.5,class:'clock-pin'}));
    const stack=node('div','clock-stack'),period=node('small','clock-stack-period');
    function tile(cls){const n=node('span',cls+' clock-flip-tile'),text=node('span','clock-flip-number');n.append(text,node('i','clock-flip-seam'));return {n,text,animation:null,old:''};}
    const hours=tile('clock-stack-hour'),minutes=tile('clock-stack-minute');stack.append(hours.n,minutes.n,period);
    // Original vector art inspired by the approved concept. It stays decorative,
    // local and sharp at every module size; no embedded generated-image dependency.
    const plant=svg('svg',{viewBox:'0 0 120 160',class:'clock-flourish','aria-hidden':'true',focusable:'false'});
    plant.append(svg('path',{d:'M8 151H119',class:'clock-shelf'}),svg('path',{d:'M60 149C43 130 44 114 48 105H82C86 119 85 137 74 149Z',class:'clock-vase'}),svg('path',{d:'M65 109C64 78 62 40 69 9M65 93C54 74 39 62 20 53M65 78C77 58 87 51 106 43M65 55C50 41 43 30 39 19',class:'clock-stem'}));
    for(const d of ['M68 30C58 20 61 8 70 2C77 13 75 24 68 30Z','M60 51C46 47 37 36 39 19C53 25 59 36 60 51Z','M47 76C30 77 19 68 14 52C31 51 42 61 47 76Z','M66 73C74 54 88 42 109 42C100 60 85 71 66 73Z','M64 99C81 80 96 80 115 89C99 103 82 106 64 99Z','M62 108C43 106 32 95 30 80C47 80 58 91 62 108Z'])plant.append(svg('path',{d,class:'clock-leaf'}));
    const sun=node('span','clock-sun-disc'),landscape=svg('svg',{viewBox:'0 0 600 180',preserveAspectRatio:'none',class:'clock-landscape',focusable:'false'});
    landscape.append(svg('path',{d:'M0 76C100 13 152 89 270 94S459 46 600 94V180H0Z',class:'clock-hill-back'}),svg('path',{d:'M0 124C145 111 237 157 382 126S539 91 600 131V180H0Z',class:'clock-hill-front'}),svg('path',{d:'M0 126C100 130 160 150 248 180H0Z',class:'clock-hill-leaf'}));
    const botanical=svg('svg',{viewBox:'0 0 600 400',preserveAspectRatio:'none',class:'clock-botanical',focusable:'false'});
    botanical.append(svg('path',{d:'M16 341C-38 225 68 66 207 26S435 52 458 147C472 218 354 221 326 275S65 455 16 341Z',class:'clock-wash'}));
    root.append(face,stack,sun,landscape,botanical,plant);
    function setTile(t,text,animate){
      if(t.old===text)return;
      if(t.animation){t.animation.cancel();t.animation=null;}
      t.n.querySelectorAll('.clock-flip-flap').forEach(n=>n.remove());
      const previous=t.old;t.old=text;t.text.textContent=text;
      if(!animate||!previous||!t.n.animate)return;
      const flap=node('span','clock-flip-flap'),old=node('span','clock-flip-number',previous);flap.append(old);t.n.append(flap);
      t.animation=flap.animate([{transform:'rotateX(0deg)'},{transform:'rotateX(-90deg)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
      t.animation.onfinish=()=>{flap.remove();t.animation=null;};
    }
    let last=null;
    return {root,update(value,data){const chosen=style(value),instant=data.hour*3600+data.minute*60+data.second,delta=last===null?0:(instant-last+86400)%86400,visible=root.isConnected&&root.getClientRects().length>0,reduce=document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animate=chosen==='stacked'&&root.dataset.clockStyle===chosen&&visible&&!document.hidden&&!reduce&&delta>0&&delta<=30;
      root.dataset.clockStyle=chosen;last=instant;hour.setAttribute('transform','rotate('+data.hourAngle+' 100 100)');minute.setAttribute('transform','rotate('+data.minuteAngle+' 100 100)');setTile(hours,data.hourText.padStart(2,'0'),animate);setTile(minutes,data.minuteText,animate);period.textContent=data.period;period.hidden=!data.period;}};
  }
  return {styles,style,read,create};
});
