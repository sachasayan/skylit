'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitClock=api;})(typeof window!=='undefined'?window:globalThis,function(){
  // Keep the stored identifier so existing Stacked selections become Flip on upgrade.
  const styles=[{id:'classic',name:'Landscape'},{id:'analog',name:'Analog'},{id:'stacked',name:'Flip'},{id:'digital',name:'Botanical'}];
  const style=value=>styles.some(item=>item.id===value)?value:'classic';
  function composeLandscape(scene,w,h,side=false){
    // Redraw at the region's aspect ratio: hills may adapt, but the sun stays round.
    scene.setAttribute('viewBox','0 0 '+w+' '+h);
    const sun=scene.querySelector('.clock-sun-disc'),radius=Number(scene.dataset.sunRadius)||Math.min(w*.105,h*.32);
    sun.setAttribute('cx',side?w*.62:w*.68);sun.setAttribute('cy',side?h*.70:h*.40);sun.setAttribute('r',radius);
    scene.querySelector('.clock-hill-back').setAttribute('d',side?`M0 ${h}C${w*.20} ${h*.83} ${w*.67} ${h*.52} ${w} ${h*.59}V${h}H0Z`:`M0 ${h}C${w*.48} ${h*.83} ${w*.79} ${h*.18} ${w} ${h*.25}V${h}H0Z`);
    scene.querySelector('.clock-hill-front').setAttribute('d',side?`M0 ${h}C${w*.17} ${h*.84} ${w*.48} ${h*.66} ${w} ${h*.85}V${h}H0Z`:`M0 ${h*.04}C${w*.23} ${-h*.15} ${w*.30} ${h*.47} ${w*.59} ${h*.57}S${w*.88} ${h*.74} ${w} ${h*.82}V${h}H0Z`);
    scene.querySelector('.clock-hill-leaf').setAttribute('d',side?`M0 ${h}C${w*.18} ${h*.88} ${w*.35} ${h*.91} ${w*.68} ${h}H0Z`:`M0 ${h*.45}C${w*.24} ${h*.29} ${w*.51} ${h*.73} ${w*.72} ${h}H0Z`);
    for(const n of scene.querySelectorAll('[data-surface-copy]')){const source=scene.querySelector('.'+n.dataset.surfaceCopy);for(const key of ['d','cx','cy','r'])if(source.hasAttribute(key))n.setAttribute(key,source.getAttribute(key));}
  }
  function read(instant,timezone,format='12'){
    const date=new Date(instant),parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),get=key=>Number(parts.find(p=>p.type===key).value);
    const hour=get('hour'),minute=get('minute'),second=get('second'),options={timeZone:timezone,hour:'numeric',minute:'2-digit',hour12:format!=='24'};
    const display=new Intl.DateTimeFormat('en-CA',options).formatToParts(date);
    return {hour,minute,second,hourText:format==='24'?String(hour).padStart(2,'0'):String(hour%12||12),minuteText:String(minute).padStart(2,'0'),period:(display.find(p=>p.type==='dayPeriod')||{}).value||'',label:new Intl.DateTimeFormat('en-CA',options).format(date),date:new Intl.DateTimeFormat('en-CA',{timeZone:timezone,weekday:'long',month:'short',day:'numeric'}).format(date),hourAngle:(hour%12)*30+minute*.5+second/120,minuteAngle:minute*6+second*.1,secondAngle:second*6};
  }
  let nextId=0;
  function create(document){
    const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
    const svg=(tag,attributes)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))n.setAttribute(key,value);return n;};
    const root=node('div','clock-visual');root.setAttribute('aria-hidden','true');
    // Each instance owns its paint servers; the Settings sample and live clock coexist.
    const id='clock-art-'+(++nextId)+'-',defs=svg('defs',{}),paints=svg('svg',{width:0,height:0,class:'clock-paints'});paints.append(defs);root.append(paints);
    function gradient(name,stops,radial=false){const g=svg(radial?'radialGradient':'linearGradient',{id:id+name,...(radial?{cx:'.45',cy:'.35',r:'.7'}:{x1:'0',y1:'0',x2:'1',y2:'1'})});for(const [offset,token,opacity] of stops){const stop=svg('stop',{offset,'stop-opacity':opacity??1});stop.style.setProperty('stop-color','var(--'+token+')');g.append(stop);}defs.append(g);return 'url(#'+id+name+')';}
    const facePaint=gradient('face',[['0%','panel'],['100%','clock-dial-floor']],true);
    const rimPaint=gradient('rim',[['0%','clock-dial-shadow'],['48%','clock-dial-floor'],['100%','clock-dial-lit']]);
    const washPaint=gradient('wash',[['0%','panel',0],['40%','clock-wash',.9],['100%','clock-wash',.4]]);
    const hillPaint=gradient('hill',[['0%','clock-hill-lit'],['100%','clock-hill-lit']]);
    const frontPaint=gradient('front',[['0%','clock-hill'],['100%','clock-hill']]);
    const sunPaint=gradient('sun',[['0%','clock-sun',.9],['70%','clock-sun'],['100%','clock-hill-lit',.86]],true);
    const leafPaint=gradient('leaf',[['0%','clock-landscape-leaf'],['100%','clock-landscape-leaf']]);
    // Static multiscale pigment variation, clipped to each SVG surface.
    const pigment=svg('filter',{id:id+'pigment',x:'0%',y:'0%',width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
    pigment.append(svg('feTurbulence',{type:'fractalNoise',baseFrequency:'.025',numOctaves:3,seed:13,result:'noise'}),svg('feColorMatrix',{in:'noise',type:'saturate',values:0,result:'gray'}));
    const transfer=svg('feComponentTransfer',{in:'gray',result:'faint'});transfer.append(svg('feFuncA',{type:'linear',slope:.18}));pigment.append(transfer,svg('feComposite',{in:'faint',in2:'SourceAlpha',operator:'in',result:'clipped'}),svg('feBlend',{in:'SourceGraphic',in2:'clipped',mode:'soft-light'}));defs.append(pigment);
    const texture=svg('pattern',{id:id+'grain',width:128,height:128,patternUnits:'userSpaceOnUse'});texture.append(svg('image',{href:'clock-grain.png',width:128,height:128}));defs.append(texture);
    function surface(host,tag,attributes,opacity=.65){const n=svg(tag,{...attributes,...(attributes.class?.startsWith('clock-hill')||attributes.class==='clock-sun-disc'?{filter:'url(#'+id+'pigment)'}:{})}),grain=svg(tag,{...attributes,fill:'url(#'+id+'grain)',class:'clock-surface-grain',opacity});if(attributes.class)grain.dataset.surfaceCopy=attributes.class;host.append(n,grain);return n;}
    // Interior shadows establish a recess; only the hands/cap project above it.
    const recess=svg('filter',{id:id+'recess',x:'-10%',y:'-10%',width:'120%',height:'120%','color-interpolation-filters':'sRGB'});
    recess.append(svg('feGaussianBlur',{in:'SourceAlpha',stdDeviation:1.6,result:'soft-edge'}));
    for(const [name,dy,token,opacity] of [['shade',2.2,'clock-dial-shadow',.7],['light',-1.5,'clock-dial-lit',.85]]){
      recess.append(svg('feOffset',{in:'soft-edge',dy,result:name+'-offset'}),svg('feComposite',{in:'SourceAlpha',in2:name+'-offset',operator:'out',result:name+'-edge'}));
      const flood=svg('feFlood',{'flood-opacity':opacity,result:name+'-color'});flood.style.setProperty('flood-color','var(--'+token+')');recess.append(flood,svg('feComposite',{in:name+'-color',in2:name+'-edge',operator:'in',result:name}));
    }
    const merge=svg('feMerge',{});for(const input of ['SourceGraphic','shade','light'])merge.append(svg('feMergeNode',{in:input}));recess.append(merge);defs.append(recess);
    const copper=gradient('copper',[['0%','clock-copper-lit'],['40%','clock-copper'],['100%','clock-copper-shade']]);
    const copperServer=defs.querySelector('#'+id+'copper');for(const [k,v] of Object.entries({gradientUnits:'userSpaceOnUse',x1:97,y1:30,x2:103,y2:105}))copperServer.setAttribute(k,v);
    const pinPaint=gradient('pin',[['0%','clock-leaf-lit'],['55%','clock-leaf'],['100%','clock-leaf-shade']],true);
    const face=svg('svg',{viewBox:'0 0 200 200',class:'clock-dial',focusable:'false'});
    face.append(svg('circle',{cx:100,cy:100,r:97,fill:rimPaint,class:'clock-rim'}),svg('circle',{cx:100,cy:100,r:96,fill:facePaint,filter:'url(#'+id+'recess)',class:'clock-face'}));
    for(let i=0;i<12;i++)face.append(svg('line',{x1:100,y1:14,x2:100,y2:22,transform:'rotate('+(i*30)+' 100 100)',class:'clock-tick'}));
    for(const [text,x,y] of [['12',100,40],['3',169,105],['6',100,175],['9',31,105]]){const label=svg('text',{x,y,'text-anchor':'middle',class:'clock-numeral'});label.textContent=text;face.append(label);}
    function hand(cls,end,width){const g=svg('g',{class:cls});g.append(svg('line',{x1:100,y1:100,x2:100,y2:end,stroke:copper,'stroke-width':width,'stroke-linecap':'round'}),svg('line',{x1:99.1,y1:98,x2:99.1,y2:end+.9,stroke:'var(--clock-copper-lit)','stroke-width':.55,'stroke-linecap':'round',opacity:.65}));return g;}
    const hour=hand('clock-hour-hand',44,4.2),minute=hand('clock-minute-hand',32,3.1),second=svg('line',{x1:100,y1:100,x2:100,y2:35,class:'clock-second-hand'});
    face.append(hour,minute,second,svg('circle',{cx:100,cy:100,r:6.1,fill:pinPaint,class:'clock-pin'}));
    const analogPlant=node('img','clock-analog-plant');analogPlant.src='clock-analog-plant.png';analogPlant.alt='';analogPlant.draggable=false;
    const branch=node('img','clock-botanical-branch');branch.src='clock-botanical-branch.png';branch.alt='';branch.draggable=false;
    const flipPlant=node('img','clock-flip-plant');flipPlant.src='clock-flip-plant.png';flipPlant.alt='';flipPlant.draggable=false;
    const landscape=svg('svg',{viewBox:'0 0 600 260',preserveAspectRatio:'xMidYMid slice',class:'clock-landscape',focusable:'false'});
    surface(landscape,'circle',{cx:416,cy:109,r:61,fill:sunPaint,class:'clock-sun-disc'},.12);surface(landscape,'path',{d:'M0 57C111 55 217 179 357 146S507 92 600 97V260H0Z',fill:hillPaint,class:'clock-hill-back'},.16);surface(landscape,'path',{d:'M0 177C138 156 268 179 407 224S542 246 600 220V260H0Z',fill:frontPaint,class:'clock-hill-front'},.18);surface(landscape,'path',{d:'M0 164C130 149 198 174 600 260V260H0Z',fill:leafPaint,class:'clock-hill-leaf'},.16);
    const botanical=svg('svg',{viewBox:'0 0 600 450',preserveAspectRatio:'none',class:'clock-botanical',focusable:'false'});
    botanical.append(svg('path',{d:'M28 350C3 264 109 161 252 75S511 5 546 79C578 143 489 201 408 252S164 445 80 411C48 399 35 376 28 350Z',fill:washPaint,class:'clock-wash'}),svg('path',{d:'M433 450C473 357 523 312 600 322V450Z',fill:washPaint,class:'clock-wash-base'}));
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
      root.dataset.clockStyle=chosen;last=instant;hour.setAttribute('transform','rotate('+data.hourAngle+' 100 100)');minute.setAttribute('transform','rotate('+data.minuteAngle+' 100 100)');second.setAttribute('transform','rotate('+data.secondAngle+' 100 100)');setTile(hours,data.hourText.padStart(2,'0'),animate);setTile(minutes,data.minuteText,animate);period.textContent=data.period.replace(/[.\s]/g,'').toUpperCase();period.hidden=!data.period;}};
  }
  return {styles,style,read,create,composeLandscape};
});
