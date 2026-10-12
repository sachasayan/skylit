'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitClock=api;})(typeof window!=='undefined'?window:globalThis,function(){
  // Keep the stored identifier so existing Stacked selections become Flip on upgrade.
  const styles=[{id:'classic',name:'Landscape'},{id:'analog',name:'Analog'},{id:'stacked',name:'Flip'},{id:'digital',name:'Botanical'}];
  const style=value=>styles.some(item=>item.id===value)?value:'classic';
  function composeLandscape(scene,w,h){
    // Redraw at the region's aspect ratio: hills may adapt, but the sun stays round.
    scene.setAttribute('viewBox','0 0 '+w+' '+h);
    const sun=scene.querySelector('.clock-sun-disc');sun.setAttribute('cx',w*.69);sun.setAttribute('cy',h*.43);sun.setAttribute('r',h*.30);
    scene.querySelector('.clock-hill-back').setAttribute('d',`M0 ${h*.20}C${w*.19} ${h*.17} ${w*.36} ${h*.82} ${w*.60} ${h*.62}S${w*.88} ${h*.32} ${w} ${h*.38}V${h}H0Z`);
    scene.querySelector('.clock-hill-front').setAttribute('d',`M0 ${h*.66}C${w*.26} ${h*.55} ${w*.50} ${h*.76} ${w*.72} ${h*.88}S${w*.94} ${h*.97} ${w} ${h*.88}V${h}H0Z`);
    scene.querySelector('.clock-hill-leaf').setAttribute('d',`M0 ${h*.59}C${w*.16} ${h*.56} ${w*.29} ${h*.69} ${w*.49} ${h}H0Z`);
  }
  function read(instant,timezone,format='12'){
    const date=new Date(instant),parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),get=key=>Number(parts.find(p=>p.type===key).value);
    const hour=get('hour'),minute=get('minute'),second=get('second'),options={timeZone:timezone,hour:'numeric',minute:'2-digit',hour12:format!=='24'};
    const display=new Intl.DateTimeFormat('en-CA',options).formatToParts(date);
    return {hour,minute,second,hourText:format==='24'?String(hour).padStart(2,'0'):String(hour%12||12),minuteText:String(minute).padStart(2,'0'),period:(display.find(p=>p.type==='dayPeriod')||{}).value||'',label:new Intl.DateTimeFormat('en-CA',options).format(date),date:new Intl.DateTimeFormat('en-CA',{timeZone:timezone,weekday:'long',month:'short',day:'numeric'}).format(date),hourAngle:(hour%12)*30+minute*.5+second/120,minuteAngle:minute*6+second*.1};
  }
  let nextId=0;
  function create(document){
    const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
    const svg=(tag,attributes)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))n.setAttribute(key,value);return n;};
    const root=node('div','clock-visual');root.setAttribute('aria-hidden','true');
    // Each instance owns its paint servers; the Settings sample and live clock coexist.
    const id='clock-art-'+(++nextId)+'-',defs=svg('defs',{}),paints=svg('svg',{width:0,height:0,class:'clock-paints'});paints.append(defs);root.append(paints);
    function gradient(name,stops,radial=false){const g=svg(radial?'radialGradient':'linearGradient',{id:id+name,...(radial?{cx:'.45',cy:'.35',r:'.7'}:{x1:'0',y1:'0',x2:'1',y2:'1'})});for(const [offset,token,opacity] of stops){const stop=svg('stop',{offset,'stop-opacity':opacity??1});stop.style.setProperty('stop-color','var(--'+token+')');g.append(stop);}defs.append(g);return 'url(#'+id+name+')';}
    const leafPaint=gradient('leaf',[['0%','clock-leaf',.65],['55%','clock-leaf',.95],['100%','clock-leaf',1]]);
    const vasePaint=gradient('vase',[['0%','panel'],['45%','soft'],['100%','clock-wood',.65]]);
    const potPaint=gradient('pot',[['0%','clock-hill'],['40%','soft'],['100%','accent',.8]]);
    const facePaint=gradient('face',[['0%','panel'],['65%','panel'],['100%','clock-wash']],true);
    const rimPaint=gradient('rim',[['0%','clock-wash'],['35%','panel'],['100%','line']]);
    const washPaint=gradient('wash',[['0%','panel',0],['40%','clock-wash',.9],['100%','clock-wash',.4]]);
    const hillPaint=gradient('hill',[['0%','clock-hill'],['100%','accent']]);
    const sunPaint=gradient('sun',[['0%','clock-sun'],['100%','clock-hill']]);
    const woodPaint=gradient('wood',[['0%','soft'],['35%','clock-wood'],['100%','clock-wood']]);
    function leaf(host,x,y,angle,scale,round=false){const g=svg('g',{transform:'translate('+x+' '+y+') rotate('+angle+') scale('+scale+')'});
      g.append(svg('path',{d:round?'M0 0C-24 -5 -40 -44 3 -79C36 -62 33 -17 0 0Z':'M0 0C-24 -21 -29 -55 4 -94C35 -64 27 -20 0 0Z',fill:leafPaint,class:'clock-leaf'}));
      g.append(svg('path',{d:round?'M0 0C8 -23 9 -47 3 -74':'M0 0C2 -23 -4 -46 4 -89',class:'clock-leaf-vein'}));
      for(const y of [-23,-38,-53])g.append(svg('path',{d:'M2 '+y+'l-13 -12M2 '+(y-5)+'l13 -14',class:'clock-leaf-detail'}));host.append(g);}
    function shelf(host,x,y,width){host.append(svg('rect',{x,y,width,height:11,rx:2,fill:woodPaint,class:'clock-shelf'}));for(let j=0;j<3;j++)host.append(svg('path',{d:'M'+(x+3)+' '+(y+3+j*2)+'Q'+(x+width*.45)+' '+(y+6+j)+' '+(x+width-2)+' '+(y+2+j*2),class:'clock-wood-grain'}));}
    const face=svg('svg',{viewBox:'0 0 200 200',class:'clock-dial',focusable:'false'});
    face.append(svg('circle',{cx:100,cy:100,r:97,fill:rimPaint,class:'clock-rim'}),svg('circle',{cx:100,cy:100,r:94,fill:facePaint,class:'clock-face'}));
    for(let i=0;i<12;i++)face.append(svg('line',{x1:100,y1:12,x2:100,y2:i%3===0?20:18,transform:'rotate('+(i*30)+' 100 100)',class:'clock-tick'}));
    for(const [text,x,y] of [['12',100,40],['3',169,105],['6',100,175],['9',31,105]]){const label=svg('text',{x,y,'text-anchor':'middle',class:'clock-numeral'});label.textContent=text;face.append(label);}
    const hour=svg('line',{x1:100,y1:100,x2:100,y2:57,class:'clock-hour-hand'}),minute=svg('line',{x1:100,y1:100,x2:100,y2:43,class:'clock-minute-hand'});
    face.append(hour,minute,svg('circle',{cx:100,cy:100,r:5.5,class:'clock-pin'}),svg('circle',{cx:98.8,cy:98.6,r:2.1,class:'clock-pin-highlight'}));
    const analogPlant=svg('svg',{viewBox:'0 0 180 210',class:'clock-analog-plant',focusable:'false'});
    shelf(analogPlant,24,192,156);analogPlant.append(svg('path',{d:'M115 130Q107 164 121 187Q141 198 157 184L169 130Z',fill:potPaint,class:'clock-pot'}),svg('ellipse',{cx:141,cy:131,rx:28,ry:5,class:'clock-pot-rim'}),svg('path',{d:'M141 132Q160 92 148 29M139 137Q102 110 101 44M139 133Q80 116 73 165Q62 192 53 209M99 111Q77 91 66 78',class:'clock-stem'}));
    for(const spec of [[148,51,-16,.48],[150,73,44,.55],[130,116,-33,.55],[103,85,-29,.62],[104,60,43,.51],[94,128,-51,.63],[77,165,-49,.56],[62,191,12,.44],[140,113,53,.5],[84,103,-62,.45]])leaf(analogPlant,...spec,true);
    const branch=svg('svg',{viewBox:'0 -25 280 365',class:'clock-botanical-branch',focusable:'false'});
    branch.append(svg('path',{d:'M252 340C224 268 208 194 159 28M225 257Q157 231 81 207M206 196Q164 163 104 153M184 133Q191 101 211 84',class:'clock-stem'}));
    for(const spec of [[224,256,-72,1.13],[229,273,-28,.95],[209,208,18,1.05],[201,191,-64,.96],[184,135,-9,1.09],[184,135,43,.96],[158,73,-6,.9],[164,161,-77,.86]])leaf(branch,...spec);
    const flipPlant=svg('svg',{viewBox:'0 0 180 215',class:'clock-flip-plant',focusable:'false'});
    shelf(flipPlant,0,199,180);flipPlant.append(svg('path',{d:'M133 140Q136 153 124 163C110 177 112 194 127 198H145C166 193 166 174 149 163Q138 152 141 140Z',fill:vasePaint,class:'clock-vase'}),svg('ellipse',{cx:137,cy:141,rx:6,ry:2,class:'clock-vase-lip'}),svg('path',{d:'M137 141C126 115 131 76 137 12M134 133Q112 91 58 89M134 118Q154 94 167 69M132 96Q110 60 98 40',class:'clock-stem'}));
    for(const spec of [[137,40,-8,.4],[133,72,30,.56],[133,101,-37,.52],[132,127,38,.55],[106,106,-66,.6],[90,99,-66,.45],[104,63,-14,.39],[153,90,28,.42]])leaf(flipPlant,...spec);
    const landscape=svg('svg',{viewBox:'0 0 600 260',preserveAspectRatio:'xMidYMid slice',class:'clock-landscape',focusable:'false'});
    landscape.append(svg('circle',{cx:416,cy:109,r:61,fill:sunPaint,class:'clock-sun-disc'}),svg('path',{d:'M0 57C111 55 217 179 357 146S507 92 600 97V260H0Z',fill:hillPaint,class:'clock-hill-back'}),svg('path',{d:'M0 177C138 156 268 179 407 224S542 246 600 220V260H0Z',class:'clock-hill-front'}),svg('path',{d:'M0 164C130 149 198 174 363 260H0Z',class:'clock-hill-leaf'}));
    const botanical=svg('svg',{viewBox:'0 0 600 450',preserveAspectRatio:'xMidYMid slice',class:'clock-botanical',focusable:'false'});
    botanical.append(svg('path',{d:'M25 369C-29 253 76 94 237 44S533 31 555 167C563 238 430 287 364 354S74 485 25 369Z',fill:washPaint,class:'clock-wash'}));
    const stack=node('div','clock-stack'),period=node('small','clock-stack-period');
    function tile(cls){const n=node('span',cls+' clock-flip-tile'),text=node('span','clock-flip-number');n.append(text,node('i','clock-flip-seam'));return {n,text,animation:null,cancel:null,old:''};}
    const hours=tile('clock-stack-hour'),minutes=tile('clock-stack-minute');stack.append(hours.n,minutes.n,period);
    root.append(face,analogPlant,landscape,botanical,branch,stack,flipPlant);
    function setTile(t,text,animate){
      if(t.old===text)return;
      if(t.cancel){t.cancel();t.cancel=null;t.animation=null;}
      t.n.querySelectorAll('.clock-flip-motion').forEach(n=>n.remove());
      const previous=t.old;t.old=text;t.text.textContent=text;
      if(!animate||!previous||!t.n.animate)return;
      const motion=node('span','clock-flip-motion'),oldTop=node('span','clock-flip-out'),newBottom=node('span','clock-flip-in'),oldBottom=node('span','clock-flip-bottom');
      oldTop.append(node('span','clock-flip-number',previous));oldBottom.append(node('span','clock-flip-number',previous));newBottom.append(node('span','clock-flip-number',text));motion.append(oldBottom,oldTop,newBottom);t.n.append(motion);
      // A driver owns cleanup; separate upper/lower animations share cancellation.
      // Cancel every timeline together when visibility or motion preferences change.
      t.animation=motion.animate([{opacity:1},{opacity:1}],{duration:640});
      const out=oldTop.animate([{transform:'rotateX(0deg)',filter:'brightness(1)'},{transform:'rotateX(-90deg)',filter:'brightness(.68)'}],{duration:290,easing:'cubic-bezier(.45,.02,.65,.45)',fill:'forwards'});
      const incoming=newBottom.animate([{transform:'rotateX(90deg)',filter:'brightness(.72)'},{transform:'rotateX(-4deg)',filter:'brightness(1)',offset:.85},{transform:'rotateX(0deg)',filter:'brightness(1)'}],{duration:340,delay:280,easing:'cubic-bezier(.18,.65,.32,1)',fill:'both'});
      t.cancel=()=>{t.animation?.cancel();out.cancel();incoming.cancel();motion.remove();};
      t.animation.onfinish=()=>{out.cancel();incoming.cancel();motion.remove();t.animation=null;t.cancel=null;};
    }
    let last=null;
    return {root,update(value,data){const chosen=style(value),instant=data.hour*3600+data.minute*60+data.second,delta=last===null?0:(instant-last+86400)%86400,visible=root.isConnected&&root.getClientRects().length>0,reduce=document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animate=chosen==='stacked'&&root.dataset.clockStyle===chosen&&visible&&!document.hidden&&!reduce&&delta>0&&delta<=30;
      if(!visible||document.hidden||reduce||delta>30||root.dataset.clockStyle!==chosen){for(const t of [hours,minutes]){t.cancel?.();t.cancel=null;t.animation=null;}}
      root.dataset.clockStyle=chosen;last=instant;hour.setAttribute('transform','rotate('+data.hourAngle+' 100 100)');minute.setAttribute('transform','rotate('+data.minuteAngle+' 100 100)');setTile(hours,data.hourText.padStart(2,'0'),animate);setTile(minutes,data.minuteText,animate);period.textContent=data.period.replace(/[.\s]/g,'').toUpperCase();period.hidden=!data.period;}};
  }
  return {styles,style,read,create,composeLandscape};
});
