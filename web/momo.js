'use strict';
// Momo is procedural canvas geometry: no sprites, remote assets, or animation library.
(() => {
  const canvas = document.getElementById('momo-canvas');
  let ctx = canvas.getContext('2d');
  const button = document.getElementById('momo');
  const outfit = document.getElementById('momo-outfit');
  const motion = document.getElementById('momo-motion');
  const caption = document.getElementById('momo-expression');
  const hats = ['none','beret','beanie','bucket','cap','party','crown','flower','headphones','bow','nightcap','wizard','leaf','earmuffs'];
  const moods = ['hello','curious','wink','delighted','stretch','sneeze','dance','peek','proud','puzzled','sleepy','surprised','yawn'];
  const labels = {yawn:'Just five more minutes…',hello:'Hello, you.',curious:'What’s happening over there?',wink:'Our little secret.',delighted:'Well, this is lovely.',stretch:'A little stretch.',sneeze:'Ah… ah… achoo!',dance:'A tiny happy dance.',peek:'Just checking in.',proud:'Looking rather fetching.',puzzled:'Hmm. Interesting.',sleepy:'Just resting my eyes.',surprised:'Oh! Hello!'};
  let prefs = {hat:'auto',motion:'lively',routine:true};
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('skylit.momo') || '{}')); } catch (_) {}
  if (!['auto','daily',...hats].includes(prefs.hat)) prefs.hat='auto';
  if (!['lively','gentle','still'].includes(prefs.motion)) prefs.motion='lively';
  prefs.routine=prefs.routine!==false;
  const routineControl=document.getElementById('momo-routine');
  outfit.value=prefs.hat; motion.value=prefs.motion;routineControl.value=prefs.routine?'day':'anytime';
  let calendar=readCalendar();
  function readCalendar(){const app=window.SkylitApp;return window.MomoRoutine.at(Date.now(),app?app.status().timezone:undefined);}
  function period(){return prefs.routine?calendar.period:'day';}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const palette = {ink:document.documentElement.dataset.mode==='dark'?'#f2d6a4':'#493b33',cream:'#fff6df',shell:'#f3c57d',coral:'#cc795e',sage:'#8d9e7e',blue:'#7d9da6',face:'#3c3531',eye:'#fff0cc'};
  const behavior=window.MomoRoutine.coordinator();
  let mode=period()==='night'?'sleepy':period()==='morning'?'yawn':'hello',started=performance.now(),until=started+3000,nextIdle=started+90000;
  let lastInput=started,lastGaze=0,lookX=0,lookY=0,gazeX=0,gazeY=0,scrollKick=0;
  let nextBlink=started+2400,blinkStart=-10000,hatIndex=1,nextHat=started+90000;
  let manualIndex=0,paused=false,raf=0,lastFrame=0,frames=0,pointerBounds=null;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const quiet=()=>prefs.motion==='still'||reduced.matches;
  function persist(){try{localStorage.setItem('skylit.momo',JSON.stringify(prefs));}catch(_) {caption.textContent='Could not save Momo’s preferences.';}}
  function round(x,y,w,h,r,fill,stroke=palette.ink,lw=2.5){
    r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function oval(x,y,rx,ry,fill,stroke=palette.ink,lw=2.5){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
  function line(points,color=palette.ink,width=2.5){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function shape(points,fill){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=palette.ink;ctx.lineWidth=2.5;ctx.stroke();}
  function star(x,y,r,color){const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,s=i%2?r*.45:r;p.push([x+Math.cos(a)*s,y+Math.sin(a)*s]);}shape(p,color);}
  function chosenHat(){return prefs.hat==='daily'?calendar.dailyHat:prefs.hat==='auto'?hats[hatIndex]:prefs.hat;}
  function drawHat(h,t){
    const p=palette;
    if(h==='beret'){ctx.save();ctx.rotate(-.13);oval(0,-43,39,12,p.coral);round(-5,-59,6,8,3,p.coral);ctx.restore();}
    if(h==='beanie'){ctx.beginPath();ctx.arc(0,-38,34,Math.PI,0);ctx.closePath();ctx.fillStyle=p.blue;ctx.fill();ctx.strokeStyle=p.ink;ctx.stroke();for(let x=-20;x<=20;x+=10)line([[x,-60+Math.abs(x)*.4],[x,-40]],p.cream,1.5);round(-36,-42,72,12,5,p.blue);oval(0,-77,8,8,p.cream);}
    if(h==='bucket'){shape([[-27,-65],[27,-65],[34,-37],[-34,-37]],p.sage);oval(0,-36,44,6,p.sage);line([[-29,-47],[29,-47]],p.cream,3);}
    if(h==='cap'){ctx.beginPath();ctx.arc(-2,-38,32,Math.PI,0);ctx.fillStyle=p.coral;ctx.fill();ctx.stroke();oval(22,-37,28,5,p.coral);line([[-3,-68],[-3,-40]],p.cream,2);}
    if(h==='party'){shape([[-23,-37],[0,-90],[24,-37]],p.blue);line([[-15,-54],[12,-65]],p.shell,5);line([[-8,-72],[5,-77]],p.coral,4);oval(0,-93,5,5,p.coral);}
    if(h==='crown'){shape([[-32,-39],[-37,-64],[-17,-52],[0,-72],[18,-52],[37,-64],[32,-39]],p.shell);oval(0,-48,4,4,p.coral,null);}
    if(h==='flower'){ctx.save();ctx.translate(32,-42);ctx.rotate(.18*Math.sin(t));for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);oval(0,-10,6,9,p.coral);ctx.restore();}oval(0,0,6,6,p.shell);ctx.restore();}
    if(h==='headphones'){ctx.beginPath();ctx.ellipse(0,-7,65,55,0,Math.PI,Math.PI*2);ctx.strokeStyle=p.ink;ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle=p.blue;ctx.lineWidth=4;ctx.stroke();round(-73,-18,13,35,6,p.blue);round(60,-18,13,35,6,p.blue);}
    if(h==='bow'){ctx.save();ctx.translate(29,-44);ctx.rotate(.2);shape([[0,0],[-22,-12],[-20,12]],p.coral);shape([[0,0],[22,-12],[20,12]],p.coral);oval(0,0,5,6,p.shell);ctx.restore();}
    if(h==='nightcap'){ctx.beginPath();ctx.moveTo(-33,-36);ctx.quadraticCurveTo(-15,-89,25,-69);ctx.quadraticCurveTo(40,-57,44,-47);ctx.quadraticCurveTo(15,-68,29,-35);ctx.closePath();ctx.fillStyle=p.blue;ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=2.5;ctx.stroke();round(-34,-40,67,10,4,p.cream);oval(45,-47+Math.sin(t)*1.5,7,7,p.cream);}
    if(h==='leaf'){ctx.save();ctx.translate(28,-43);ctx.rotate(-.4);shape([[0,4],[-18,-7],[-12,-13],[-19,-23],[-3,-20],[5,-35],[14,-21],[26,-22],[21,-10],[30,-5],[9,5]],p.coral);line([[3,11],[7,-24]],p.ink,2);ctx.restore();}
    if(h==='earmuffs'){ctx.beginPath();ctx.ellipse(0,-7,63,56,0,Math.PI,Math.PI*2);ctx.strokeStyle=p.sage;ctx.lineWidth=8;ctx.stroke();oval(-65,-3,13,19,p.cream);oval(65,-3,13,19,p.cream);}
    if(h==='wizard'){shape([[-33,-38],[-8,-97],[29,-38]],p.blue);oval(0,-37,43,5,p.blue);star(-7,-67,6,p.shell);oval(8,-48,2,2,p.cream,null);}
  }
  function eye(x,y,w,h,type,blink,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1,Math.max(.07,1-blink));
    if(type==='happy'){ctx.beginPath();ctx.moveTo(-w/2,4);ctx.quadraticCurveTo(0,-13,w/2,4);ctx.strokeStyle=palette.eye;ctx.lineWidth=6;ctx.stroke();}
    else if(type==='sleep'){ctx.beginPath();ctx.moveTo(-w/2,0);ctx.quadraticCurveTo(0,6,w/2,0);ctx.strokeStyle=palette.eye;ctx.lineWidth=4;ctx.stroke();}
    else round(-w/2,-h/2,w,h,w/2,palette.eye,null);
    ctx.restore();
  }
  function react(name,user=false){const now=performance.now();if(paused||document.hidden)return;const duration=['camera','calendar'].includes(name)?4200:name==='sleepy'?7500:name==='dance'?4500:3000;if(!behavior.request(name,now,{night:period()==='night',user,quiet:quiet(),duration}))return;mode=name;started=now;until=now+duration;nextIdle=until+90000+Math.random()*60000;if(user){lastInput=started;caption.textContent=labels[name]||'Hello, you.';}wake();}
  function weatherPose(){return window.MomoRoutine.weather(window.SkylitUI?.weather.get().data,window.SkylitApp?.displayPreferences().units);}
  function props(kind,age,still,behind){
    const p=palette;
    if(kind==='rain'&&behind){
      line([[62,-66],[62,17],[57,22],[51,20]],p.ink,3);
      ctx.beginPath();ctx.moveTo(15,-64);ctx.quadraticCurveTo(60,-125,98,-64);ctx.quadraticCurveTo(84,-74,72,-64);ctx.quadraticCurveTo(58,-76,44,-64);ctx.quadraticCurveTo(30,-74,15,-64);ctx.fillStyle=p.blue;ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=2;ctx.stroke();
      line([[58,-96],[58,-101]],p.ink,2);
    }
    if(behind)return;
    if(kind==='frost'){for(const [x,y,h] of [[-39,33,9],[-31,37,7],[36,34,10]]){shape([[x-3,y],[x+3,y],[x,y+h]],'#cce3e5');}}
    if(kind==='camera'){
      ctx.save();ctx.translate(10,still?10:17-17*Math.sin(Math.PI*clamp(age/4.2,0,1)));
      round(-28,-12,56,33,6,p.sage);round(-19,-18,15,8,3,p.sage);oval(5,4,12,12,p.ink);oval(5,4,8,8,p.blue);oval(2,1,2,2,p.cream,null);round(-20,-6,9,5,2,p.shell,null);
      if(!still&&prefs.motion==='lively'&&age>1.65&&age<1.82)star(-17,-10,5,p.cream);
      oval(-30,11,6,8,p.shell);oval(30,11,6,8,p.shell);ctx.restore();
    }
    if(kind==='calendar'){
      ctx.save();ctx.translate(16,12);ctx.rotate(still?-.08:-.08+Math.sin(age*1.5)*.025);
      round(-23,-18,46,44,5,p.cream);round(-23,-18,46,12,4,p.coral);line([[-12,-23],[-12,-14]],p.ink,3);line([[12,-23],[12,-14]],p.ink,3);
      for(let y=2;y<=16;y+=7)for(let x=-13;x<=13;x+=13)oval(x,y,1.5,1.5,p.sage,null);
      oval(0,9,5,5,null,p.coral,1.5);oval(-25,15,5,7,p.shell);oval(25,15,5,7,p.shell);ctx.restore();
    }
  }
  function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(210*dpr);canvas.height=Math.round(155*dpr);pointerBounds=null;draw(performance.now());wake();}
  function draw(now,preview){
    const surface=preview?preview.canvas:canvas,previousContext=ctx;
    if(preview)ctx=surface.getContext('2d');
    const still=!!preview||quiet(),t=still?0:now/1000,age=(now-started)/1000;
    const resting=period()==='night'?'sleepy':period()==='morning'||period()==='evening'?'drowsy':'neutral';
    const action=behavior.current(now,period()==='night');
    const active=preview?'neutral':still?resting:action? action.name:resting;
    const prop=preview||period()==='night'?'':['camera','calendar'].includes(active)?active:action?'':weatherPose();
    const lively=prefs.motion==='lively'?1:.38;
    const env=still?0:Math.sin(Math.PI*clamp(age/3,0,1));
    let tilt=Math.sin(t*.8)*.025*lively+gazeX*.025,dy=Math.sin(t*1.5)*1.5*lively,dx=0,sx=1,sy=1;
    let leftH=19,rightH=16,leftType='normal',rightType='normal',leftAngle=0,rightAngle=0;
    if(active==='drowsy'){leftH=10;rightH=8;tilt=.04;}
    if(active==='yawn'){leftType=rightType='sleep';sy=1+.06*env;tilt=-.05*env;}
    if(active==='hello'){tilt+=Math.sin(age*7)*.11*env;leftType=rightType='happy';}
    if(active==='curious'){tilt+=.16*env;rightH=26;leftH=14;}
    if(active==='wink'){rightType='sleep';leftType='happy';tilt-=.1*env;}
    if(active==='delighted'){leftType=rightType='happy';dy-=Math.abs(Math.sin(age*7))*5*env;}
    if(active==='stretch'){sx=1-.08*env;sy=1+.12*env;leftH=rightH=25;dy-=5*env;}
    if(active==='sneeze'){const achoo=age>1.1&&age<1.5;leftType=rightType=age<1.5?'sleep':'normal';tilt+=achoo?.22:Math.sin(age*12)*.025;sy=achoo?.83:1;dy+=achoo?7:0;}
    if(active==='dance'){tilt+=Math.sin(age*6)*.16;dx=Math.sin(age*3)*5;leftType=rightType='happy';}
    if(active==='peek'){dx=10*env;tilt=-.12*env;leftH=rightH=13;}
    if(active==='proud'){dy-=5*env;leftType=rightType='happy';tilt=-.08;}
    if(active==='puzzled'){leftH=11;rightH=24;leftAngle=.22;tilt=.13*env;}
    if(active==='sleepy'){leftType=rightType='sleep';tilt=.08;dy+=4+Math.sin(t*1.4)*2;}
    if(active==='surprised'){leftH=rightH=28;sy=1+.05*env;dy-=4*env;}
    if(still){tilt=dy=dx=0;}else{tilt+=scrollKick*.035;if(prefs.motion==='gentle'){tilt*=.4;dx*=.4;dy*=.4;sx=1+(sx-1)*.4;sy=1+(sy-1)*.4;}}
    const blink=still?0:Math.max(0,1-Math.abs((now-blinkStart)/85-1));
    const dpr=surface.width/210;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,210,155);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.translate(105+dx,104+dy);ctx.rotate(tilt);ctx.scale(sx,sy);
    props(prop,age,still,true);
    round(-70,-17,16,31,8,palette.sage);round(54,-17,16,31,8,palette.sage);
    line([[-64,-8],[-64,5]],palette.cream,2);line([[64,-8],[64,5]],palette.cream,2);
    round(-59,-39,118,79,27,palette.shell,palette.ink,3);
    // An offset inner outline gives the shell a warm enamel-pin character.
    round(-51,-31,102,63,21,palette.cream,palette.ink,2);
    round(-46,-26,92,53,17,palette.face,palette.ink,1.5);
    const gx=still?0:gazeX*7+(active==='peek'?6:0),gy=still?0:gazeY*5;
    eye(-19+gx,-1+gy,12,leftH,leftType,blink,leftAngle);eye(19+gx,-1+gy,12,rightH,rightType,blink,rightAngle);
    oval(-33,16,3,1.5,palette.coral,null);oval(33,16,3,1.5,palette.coral,null);
    if(active==='yawn')oval(0,15,3+env*2,1+env*5,palette.eye,null);
    drawHat(preview?preview.hat:chosenHat(),t);
    props(prop,age,still,false);
    if(!preview){canvas.dataset.context=prop;frames++;canvas.dataset.expression=active;canvas.dataset.hat=chosenHat();canvas.dataset.period=period();}
    ctx=previousContext;
  }
  function step(now){raf=0;if(paused||document.hidden)return;
    if(quiet()||now-lastFrame>=32){
      lastFrame=now;
      if(!quiet()){
        if(now>nextBlink){blinkStart=now;nextBlink=now+2400+Math.random()*4000;}
        if(now-lastGaze>2800){lookX*=.94;lookY*=.94;}
        gazeX+=(lookX-gazeX)*.12;gazeY+=(lookY-gazeY)*.12;scrollKick*=.88;
        if(now>nextIdle){nextIdle=now+90000+Math.random()*60000;react(window.MomoRoutine.idle(period(),now-lastInput));}
        if(prefs.hat==='auto'&&now>nextHat){hatIndex=(hatIndex+1)%hats.length;nextHat=now+90000;updateWardrobe();}
      }
      draw(now);
    }
    if(!quiet())wake();
  }
  function wake(){if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(step);}
  function suspend(value){paused=!!value;if(raf){cancelAnimationFrame(raf);raf=0;}lastFrame=0;if(!paused){refreshCalendar();lastInput=performance.now();nextIdle=lastInput+90000;behavior.reset(lastInput);wake();}}
  button.addEventListener('click',()=>react(moods[manualIndex++%moods.length],true));
  document.getElementById('momo-preview').addEventListener('click',()=>react(moods[manualIndex++%moods.length],true));
  document.getElementById('momo-shuffle').addEventListener('click',()=>{const index=hats.indexOf(chosenHat());selectHat(hats[(index+1)%hats.length]);});
  outfit.addEventListener('change',()=>{selectHat(outfit.value);});
  motion.addEventListener('change',()=>{prefs.motion=motion.value;persist();behavior.reset(performance.now());lastFrame=0;wake();});
  function attention(e){lastInput=performance.now();if(quiet())return;pointerBounds=pointerBounds||canvas.getBoundingClientRect();lookX=clamp((e.clientX-pointerBounds.left-pointerBounds.width/2)/400,-1,1);lookY=clamp((e.clientY-pointerBounds.top-pointerBounds.height/2)/300,-1,1);lastGaze=lastInput;wake();}
  document.addEventListener('pointermove',attention,{passive:true});document.addEventListener('pointerdown',attention,{passive:true});
  document.addEventListener('keydown',()=>{lastInput=performance.now();});
  let previousScroll=window.scrollY;
  window.addEventListener('scroll',()=>{const y=window.scrollY,delta=y-previousScroll;previousScroll=y;pointerBounds=null;lastInput=performance.now();if(!quiet()){scrollKick=clamp(delta/25,-2,2);lookY=Math.sign(delta)*.85;lastGaze=lastInput;wake();}},{passive:true});
  new MutationObserver(()=>{const dark=document.documentElement.dataset.mode==='dark'||document.documentElement.dataset.theme==='cocoa';palette.ink=dark?'#f2d6a4':'#493b33';renderGallery();lastFrame=0;wake();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-mode']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){behavior.reset(performance.now());if(raf)cancelAnimationFrame(raf);raf=0;}else{refreshCalendar();lastFrame=0;wake();}});
  reduced.addEventListener('change',()=>{lastFrame=0;wake();});window.addEventListener('resize',resize);
  window.Momo={setPaused:suspend,greet:()=>{refreshCalendar();react(period()==='night'?'sleepy':period()==='morning'?'yawn':'hello');},status:()=>({hat:chosenHat(),preference:prefs.hat,period:period(),date:calendar.date,timezone:calendar.timezone,motion:prefs.motion,reduced:reduced.matches,paused,frames,expression:canvas.dataset.expression,context:canvas.dataset.context})};
  const gallery=document.getElementById('momo-gallery'),cards=[];
  const hatLabels={none:'Just Momo',beret:'Terracotta beret',beanie:'Bobble beanie',bucket:'Garden bucket',cap:'Weekend cap',party:'Party hat',crown:'Little crown',flower:'Flower clip',headphones:'Headphones',bow:'Ribbon bow',nightcap:'Nightcap',wizard:'Wizard hat',leaf:'Autumn leaf',earmuffs:'Winter earmuffs'};
  function selectHat(hat){prefs.hat=hat;outfit.value=hat;persist();updateWardrobe();react('proud',true);lastFrame=0;wake();}
  function updateWardrobe(){
    const selected=chosenHat();
    cards.forEach(card=>card.button.setAttribute('aria-pressed',String(card.hat===selected)));
    const suffix=prefs.hat==='daily'?' · a new look at local midnight':prefs.hat==='auto'?' · rotating every 90 seconds':' · keeping this look';
    document.getElementById('momo-outfit-note').textContent='Wearing '+hatLabels[selected]+suffix+'.';
  }
  function renderGallery(){cards.forEach(card=>draw(0,{canvas:card.canvas,hat:card.hat}));}
  hats.forEach(hat=>{
    const tile=document.createElement('button');tile.type='button';tile.className='momo-tile';tile.setAttribute('aria-label','Wear '+hatLabels[hat]);
    const thumb=document.createElement('canvas');thumb.width=294;thumb.height=217;thumb.setAttribute('aria-hidden','true');
    const name=document.createElement('span');name.textContent=hatLabels[hat];
    tile.appendChild(thumb);tile.appendChild(name);tile.addEventListener('click',()=>selectHat(hat));gallery.appendChild(tile);cards.push({hat,button:tile,canvas:thumb});
  });
  function routineNote(){
    const descriptions={night:'Snoozing · 10 p.m.–6 a.m. Tap for a brief hello.',morning:'Waking up · yawns and stretches from 6–9 a.m.',day:'Up and about · playful until 8 p.m.',evening:'Winding down · gentle yawns from 8–10 p.m.'};
    document.getElementById('momo-routine-note').textContent=(prefs.routine?descriptions[calendar.period]:'Anytime mode · no bedtime schedule.')+' Clock: '+calendar.timezone.replace(/_/g,' ')+'.';
  }
  function refreshCalendar(){
    const before=calendar;calendar=readCalendar();
    if(before.date!==calendar.date||before.period!==calendar.period||before.timezone!==calendar.timezone){
      if(before.period!==calendar.period&&prefs.routine){mode=period()==='morning'?'yawn':period()==='night'?'sleepy':'stretch';started=performance.now();until=started+3000;nextIdle=until+90000;behavior.reset(started,0);react(mode);}
      routineNote();updateWardrobe();lastFrame=0;wake();
    }
  }
  routineControl.addEventListener('change',()=>{prefs.routine=routineControl.value==='day';persist();routineNote();behavior.reset(performance.now());until=0;lastFrame=0;wake();});
  // Wall-clock checks are cheap; still mode never starts a perpetual render loop.
  setInterval(()=>{if(!paused&&!document.hidden)refreshCalendar();},30000);
  let currentPage=window.SkylitApp?.status().tab;
  window.addEventListener('skylit-tab',event=>{const page=event.detail;if(page===currentPage)return;currentPage=page;if(page==='photos')react('camera');else if(page==='calendar')react('calendar');});
  window.SkylitUI?.weather.subscribe(()=>{lastFrame=0;wake();});
  renderGallery();routineNote();updateWardrobe();resize();
})();
