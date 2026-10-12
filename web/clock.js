'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitClock=api;})(typeof window!=='undefined'?window:globalThis,function(){
  // Keep the stored identifier so existing Stacked selections become Flip on upgrade.
  const styles=[{id:'classic',name:'Landscape'},{id:'analog',name:'Analog'},{id:'stacked',name:'Flip'},{id:'digital',name:'Botanical'}];
  const style=value=>styles.some(item=>item.id===value)?value:'classic';
  function composeLandscape(scene,w,h,side=false){
    // Redraw at the region's aspect ratio: hills may adapt, but the sun stays round.
    scene.setAttribute('viewBox','0 0 '+w+' '+h);
    const sun=scene.querySelector('.clock-sun-disc');sun.setAttribute('cx',w*.69);sun.setAttribute('cy',h*.43);sun.setAttribute('r',h*.30);
    scene.querySelector('.clock-hill-back').setAttribute('d',side?`M0 ${h}C${w*.12} ${h} ${w*.19} ${h*.67} ${w*.40} ${h*.63}S${w*.80} ${h*.50} ${w} ${h*.42}V${h}H0Z`:`M0 ${h*.20}C${w*.19} ${h*.17} ${w*.36} ${h*.82} ${w*.60} ${h*.62}S${w*.88} ${h*.32} ${w} ${h*.38}V${h}H0Z`);
    scene.querySelector('.clock-hill-front').setAttribute('d',side?`M0 ${h}C${w*.21} ${h} ${w*.31} ${h*.89} ${w*.57} ${h*.87}S${w*.84} ${h*.85} ${w} ${h*.91}V${h}H0Z`:`M0 ${h*.66}C${w*.26} ${h*.55} ${w*.50} ${h*.76} ${w*.72} ${h*.88}S${w*.94} ${h*.97} ${w} ${h*.88}V${h}H0Z`);
    scene.querySelector('.clock-hill-leaf').setAttribute('d',side?`M0 ${h}C${w*.15} ${h} ${w*.28} ${h*.85} ${w*.52} ${h*.86}S${w*.81} ${h*.95} ${w} ${h*.94}V${h}H0Z`:`M0 ${h*.61}C${w*.22} ${h*.54} ${w*.46} ${h*.90} ${w*.71} ${h*.88}S${w*.91} ${h*.86} ${w} ${h*.93}V${h}H0Z`);
    for(const n of scene.querySelectorAll('[data-surface-copy]')){const source=scene.querySelector('.'+n.dataset.surfaceCopy);for(const key of ['d','cx','cy','r'])if(source.hasAttribute(key))n.setAttribute(key,source.getAttribute(key));}
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
    const leafPaint=gradient('leaf',[['0%','clock-leaf-lit'],['52%','clock-leaf'],['100%','clock-leaf-shade']]);
    const vasePaint=gradient('vase',[['0%','clock-vase-shade'],['24%','clock-vase-lit'],['47%','clock-vase-lit'],['70%','clock-vase'],['100%','clock-vase-shade']]);defs.querySelector('#'+id+'vase').setAttribute('y2','0');
    const potPaint=gradient('pot',[['0%','clock-clay-shade'],['24%','clock-clay-lit'],['58%','clock-clay'],['100%','clock-clay-shade']]);
    const facePaint=gradient('face',[['0%','panel'],['65%','panel'],['100%','clock-wash']],true);
    const rimPaint=gradient('rim',[['0%','clock-wash'],['35%','panel'],['100%','line']]);
    const washPaint=gradient('wash',[['0%','panel',0],['40%','clock-wash',.9],['100%','clock-wash',.4]]);
    const hillPaint=gradient('hill',[['0%','clock-hill-lit'],['65%','clock-hill'],['100%','accent']]);
    const frontPaint=gradient('front',[['0%','clock-hill-lit'],['100%','clock-hill']]);
    const sunPaint=gradient('sun',[['0%','clock-sun',.9],['70%','clock-sun'],['100%','clock-hill-lit',.86]],true);
    const woodPaint=gradient('wood',[['0%','clock-wood-lit'],['55%','clock-wood'],['100%','clock-wood-shade']]);
    const texture=svg('pattern',{id:id+'grain',width:128,height:128,patternUnits:'userSpaceOnUse'});texture.append(svg('image',{href:'clock-grain.png',width:128,height:128}));defs.append(texture);
    function surface(host,tag,attributes,opacity=.65){const n=svg(tag,attributes),grain=svg(tag,{...attributes,fill:'url(#'+id+'grain)',class:'clock-surface-grain',opacity});if(attributes.class)grain.dataset.surfaceCopy=attributes.class;host.append(n,grain);return n;}
    function leaf(host,x,y,angle,scale,variant=0){
      const shapes=[
        ['M0 0C-17 -9 -25 -32 -16 -53C-11 -66 1 -73 7 -87C15 -71 24 -55 24 -38C24 -20 13 -8 0 0Z','M0 0C0 -25 10 -57 7 -84'],
        ['M0 0C-15 -6 -23 -23 -19 -43C-15 -64 7 -74 18 -90C18 -69 31 -49 22 -29C17 -15 9 -5 0 0Z','M0 0C4 -28 19 -55 18 -87'],
        ['M0 0C-10 -12 -13 -39 -4 -62C0 -74 9 -82 13 -95C17 -77 23 -58 18 -37C14 -17 6 -6 0 0Z','M0 0C3 -28 14 -59 13 -92'],
        ['M0 0C-8 -7 -23 -2 -27 -22C-32 -45 -13 -60 1 -79C7 -58 29 -54 30 -33C31 -13 14 -2 0 0Z','M0 0C-2 -25 5 -54 1 -76']
      ],shape=shapes[variant%shapes.length],g=svg('g',{transform:'translate('+x+' '+y+') rotate('+angle+') scale('+scale+')'});
      surface(g,'path',{d:shape[0],fill:leafPaint,class:'clock-leaf'},.4);
      g.append(svg('path',{d:shape[1],class:'clock-leaf-vein'}));
      for(const [y,side] of [[-22,-1],[-36,1],[-49,-1]])g.append(svg('path',{d:'M2 '+y+'q'+(side*8)+' -2 '+(side*13)+' -12',class:'clock-leaf-detail'}));host.append(g);
    }
    function shelf(host,x,y,width){
      surface(host,'path',{d:`M${x} ${y}l8 -5h${width-8}v5Z`,fill:'var(--clock-wood-lit)',class:'clock-shelf-top'});
      surface(host,'rect',{x,y,width,height:8,rx:1.3,fill:woodPaint,class:'clock-shelf'});
      host.append(svg('path',{d:`M${x+1} ${y+1}h${width-2}`,class:'clock-shelf-edge'}));
      for(let j=0;j<3;j++)host.append(svg('path',{d:`M${x+3} ${y+2+j*2}Q${x+width*.45} ${y+4+j} ${x+width-2} ${y+1+j*2}`,class:'clock-wood-grain'}));
    }
    const face=svg('svg',{viewBox:'0 0 200 200',class:'clock-dial',focusable:'false'});
    face.append(svg('circle',{cx:100,cy:100,r:97,fill:rimPaint,class:'clock-rim'}));surface(face,'circle',{cx:100,cy:100,r:94,fill:facePaint,class:'clock-face'},.4);
    for(let i=0;i<12;i++)face.append(svg('line',{x1:100,y1:12,x2:100,y2:i%3===0?20:18,transform:'rotate('+(i*30)+' 100 100)',class:'clock-tick'}));
    for(const [text,x,y] of [['12',100,40],['3',169,105],['6',100,175],['9',31,105]]){const label=svg('text',{x,y,'text-anchor':'middle',class:'clock-numeral'});label.textContent=text;face.append(label);}
    const hour=svg('line',{x1:100,y1:100,x2:100,y2:57,class:'clock-hour-hand'}),minute=svg('line',{x1:100,y1:100,x2:100,y2:43,class:'clock-minute-hand'});
    face.append(hour,minute,svg('circle',{cx:100,cy:100,r:5.5,class:'clock-pin'}),svg('circle',{cx:98.8,cy:98.6,r:2.1,class:'clock-pin-highlight'}));
    const analogPlant=svg('svg',{viewBox:'0 0 180 210',class:'clock-analog-plant',focusable:'false'});
    shelf(analogPlant,22,194,158);
    analogPlant.append(svg('ellipse',{cx:139,cy:193,rx:26,ry:3,class:'clock-contact-shadow'}));
    surface(analogPlant,'path',{d:'M110 130Q138 123 168 130L161 179C158 196 119 197 116 178Z',fill:potPaint,class:'clock-pot'});
    analogPlant.append(svg('ellipse',{cx:139,cy:130,rx:29,ry:6.5,fill:potPaint,class:'clock-pot-lip'}),svg('ellipse',{cx:139,cy:129,rx:24,ry:3.3,class:'clock-pot-soil'}),svg('path',{d:'M139 130C146 108 137 74 149 50M139 132C114 114 108 92 98 56M132 133C103 119 86 135 78 151S63 165 59 173M145 91Q144 86 144 82M111 99Q108 90 105 83M88 137Q92 128 102 122',class:'clock-stem'}));
    for(const spec of [[149,50,-12,.42,2],[144,82,43,.48,3],[133,110,-36,.54,0],[105,83,-40,.50,3],[98,56,34,.40,0],[102,122,-68,.46,1],[78,151,-48,.50,3],[67,159,151,.44,0],[59,173,164,.36,3]])leaf(analogPlant,...spec);
    const branch=svg('svg',{viewBox:'0 -25 280 365',class:'clock-botanical-branch',focusable:'false'});
    branch.append(svg('path',{d:'M250 340C228 291 226 251 194 194C174 160 157 132 163 105M177 165Q170 158 150 154M179 168Q186 158 190 146M208 220Q197 215 179 216M208 220Q212 210 210 201M235 290Q215 279 208 275M231 268Q232 258 224 249',class:'clock-stem clock-botanical-stem'}));
    for(const spec of [[163,105,-7,.76,2],[150,154,-57,.87,0],[190,146,32,.87,1],[179,216,-66,.98,1],[210,201,34,.88,0],[208,275,-75,1.02,0],[224,249,24,.82,2]])leaf(branch,...spec);
    const flipPlant=svg('svg',{viewBox:'0 0 180 215',class:'clock-flip-plant',focusable:'false'});
    shelf(flipPlant,0,201,180);flipPlant.append(svg('ellipse',{cx:137,cy:199,rx:21,ry:3,class:'clock-contact-shadow'}));
    surface(flipPlant,'path',{d:'M131 139C133 149 128 156 119 166C101 188 111 199 136 200C160 199 171 187 154 167C145 157 141 150 143 139Z',fill:vasePaint,class:'clock-vase'});
    flipPlant.append(svg('ellipse',{cx:137,cy:139,rx:6,ry:2,class:'clock-vase-lip'}),svg('path',{d:'M137 139C127 112 137 78 135 44M132 118Q121 108 105 103M131 93Q145 92 151 87M130 76Q119 74 111 64M112 104Q99 98 87 91',class:'clock-stem clock-flip-stem'}));
    for(const spec of [[135,44,-8,.38,2],[132,75,32,.49,0],[133,105,-33,.48,1],[134,126,38,.46,2],[105,103,-63,.52,0],[87,91,-58,.4,1],[111,64,-14,.35,2],[151,87,28,.4,0]])leaf(flipPlant,...spec);
    const landscape=svg('svg',{viewBox:'0 0 600 260',preserveAspectRatio:'xMidYMid slice',class:'clock-landscape',focusable:'false'});
    surface(landscape,'circle',{cx:416,cy:109,r:61,fill:sunPaint,class:'clock-sun-disc'},.4);surface(landscape,'path',{d:'M0 57C111 55 217 179 357 146S507 92 600 97V260H0Z',fill:hillPaint,class:'clock-hill-back'});surface(landscape,'path',{d:'M0 177C138 156 268 179 407 224S542 246 600 220V260H0Z',fill:frontPaint,class:'clock-hill-front'});surface(landscape,'path',{d:'M0 164C130 149 198 174 600 260V260H0Z',fill:leafPaint,class:'clock-hill-leaf'});
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
