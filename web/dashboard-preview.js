'use strict';
/* Script-free preview document. Only the parent renders; no service controllers. */
window.SkylitDashboardPreview={create(canvas,options){
 const frame=document.createElement('iframe');frame.className='dashboard-live-frame';frame.title='Live dashboard layout preview';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-same-origin');const clip=document.createElement('div');clip.style.cssText='position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none';clip.append(frame);canvas.prepend(clip);
 const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\'; script-src \'none\'"><base><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="weather-art.css"><link rel="stylesheet" href="workspace.css"><link rel="stylesheet" href="dashboard.css"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}button{pointer-events:none}#overview .dashboard-module{pointer-events:none}</style></head><body><div class="shell"><aside class="rail" aria-hidden="true"></aside><main><div class="topline" aria-hidden="true"></div><section id="overview" class="page active"><div class="overview-grid dashboard-grid"></div></section></main></div></body></html>');doc.close();doc.querySelector('base').href=location.href;doc.querySelectorAll('link').forEach(link=>link.href=new URL(link.getAttribute('href'),location.href).href);
 const clockPaints=new WeakMap();
 const grid=doc.querySelector('.dashboard-grid'),copies=new Map();let sizes=new WeakMap(), visual=null,clockHost=null,latest=null,clockData=null,logical={width:1280,height:720},pending=0,changed=new Set(),gesture=null,deferred=new Set();
 function clean(node){for(const n of [node,...node.querySelectorAll('*')]){for(const a of [...n.attributes])if(/^on/i.test(a.name)||['href','srcdoc'].includes(a.name))n.removeAttribute(a.name);if(n.matches('script,iframe,object,embed'))n.remove();if(n.matches('button,input,select,textarea')){n.tabIndex=-1;}}}
 function syncTheme(){if(doc.documentElement.style.cssText!==document.documentElement.style.cssText)doc.documentElement.style.cssText=document.documentElement.style.cssText;for(const [key,value] of Object.entries(document.documentElement.dataset))if(doc.documentElement.dataset[key]!==value)doc.documentElement.dataset[key]=value;}
 function render(layout,sources,data,refresh=false){if(gesture){if(refresh)refresh.forEach(type=>deferred.add(type));return;}if(deferred.size){refresh=new Set([...(refresh||[]),...deferred]);deferred.clear();}latest=layout;clockData=data;syncTheme();const wanted=new Set(layout.modules.map(i=>i.type));for(const [type,n] of copies)if(!wanted.has(type)){n.remove();copies.delete(type);if(type==='clock'){visual=null;clockHost=null;}}
  for(const item of layout.modules){let copy=copies.get(item.type);if(!copy||refresh&&refresh.has(item.type)&&item.type!=='clock'){const source=sources.get(item.type);if(!source)continue;const next=source.cloneNode(true);clean(next);next.hidden=false;if(copy)copy.replaceWith(next);else grid.append(next);copy=next;copies.set(item.type,copy);if(item.type==='clock'){clockHost=copy.querySelector('.clock-frame');clockHost.querySelector('.clock-visual')?.remove();visual=SkylitClock.create(doc);clockHost.prepend(visual.root);}}
   options.position(copy,item);if(item.type==='clock'){const style=SkylitClock.style(item.style);copy.dataset.clockStyle=style;clockHost.dataset.clockStyle=style;const paintKey=[style,data.hour,data.minute,data.second,data.period,data.date].join('|');if(clockPaints.get(copy)!==paintKey){clockPaints.set(copy,paintKey);visual.update(style,data);clockHost.querySelector('#clock-time').textContent=data.hourText+':'+data.minuteText;clockHost.querySelector('#clock-period').textContent=data.period.replace(/[.\s]/g,'').toUpperCase();options.paintDate(clockHost,data);}}
  }size();}
 // Keep decoded widget contents on compositor layers during a gesture. Responsive
 // typography/art sizing runs once after release, not once for each crossed cell.
 function beginGeometry(){
  if(!latest)return;
  const bounds=grid.getBoundingClientRect(),css=getComputedStyle(grid),gx=parseFloat(css.columnGap)||0,gy=parseFloat(css.rowGap)||0;
  gesture={items:new Map(latest.modules.map(item=>[item.type,{...item}])),x:(bounds.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)+gx)/12,y:(bounds.height-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)+gy)/12,gx,gy};
  copies.forEach(copy=>{copy.style.transformOrigin='top left';copy.style.willChange='transform';});
 }
 function geometry(layout){
  if(!gesture)beginGeometry();if(!gesture)return;
  for(const item of layout.modules){const copy=copies.get(item.type),base=gesture.items.get(item.type);if(!copy||!base)continue;
   const x=(item.x-base.x)*gesture.x,y=(item.y-base.y)*gesture.y,sx=(item.w*gesture.x-gesture.gx)/(base.w*gesture.x-gesture.gx),sy=(item.h*gesture.y-gesture.gy)/(base.h*gesture.y-gesture.gy);
   copy.style.transform='translate('+x+'px,'+y+'px) scale('+sx+','+sy+')';
  }
 }
 function endGeometry(){gesture=null;copies.forEach(copy=>{copy.style.transform='';copy.style.willChange='';copy.style.transformOrigin='';});}

 function size(){if(!latest)return;const measured=latest.modules.map(item=>({item,copy:copies.get(item.type)})).filter(v=>v.copy).map(v=>({...v,r:v.copy.getBoundingClientRect()}));for(const {item,copy,r} of measured){const signature=[r.width,r.height,item.style,clockData?.hourText,clockData?.minuteText,clockData?.period,clockData?.date,document.documentElement.dataset.text].join('|');if(sizes.get(copy)===signature)continue;sizes.set(copy,signature);copy.dataset.density=r.width<340||r.height<220?'compact':'regular';copy.dataset.short=String(r.height<280);copy.dataset.narrow=String(r.width<340);copy.style.setProperty('--module-temperature',Math.max(36,Math.min(100,r.width*.17,r.height*.28))+'px');if(item.type==='photos')options.sizePhotos(copy,r.width,r.height);if(item.type==='clock')options.sizeClock(clockHost,r.width,r.height,SkylitClock.style(item.style),clockData);}}
 function fit(width,height){
  logical={width,height};frame.style.width=width+'px';frame.style.height=height+'px';
  const r=grid.getBoundingClientRect(),css=getComputedStyle(grid),left=r.left+parseFloat(css.paddingLeft),top=r.top+parseFloat(css.paddingTop),contentWidth=r.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),contentHeight=r.height-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  if(contentWidth<=0||contentHeight<=0)return;
  const scale=Math.min((Number(canvas.dataset.maxWidth)||canvas.parentElement.clientWidth)/contentWidth,(Number(canvas.dataset.maxHeight)||10000)/contentHeight);
  canvas.style.width=(contentWidth*scale)+'px';canvas.closest('.dashboard-workspace').style.setProperty('--editor-canvas-width',(contentWidth*scale)+'px');canvas.style.height=(contentHeight*scale)+'px';frame.style.left=(-left*scale)+'px';frame.style.top=(-top*scale)+'px';frame.style.transform='scale('+scale+')';canvas.style.setProperty('--preview-gap',(parseFloat(css.columnGap)*scale)+'px');size();
 }
 function queueRefresh(layout,sources,data,types){types.forEach(type=>changed.add(type));cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{const update=changed;changed=new Set();render(layout,sources,data,update);});}
 doc.querySelectorAll('link').forEach(link=>link.addEventListener('load',()=>fit(logical.width,logical.height)));function fontsChanged(){sizes=new WeakMap();fit(logical.width,logical.height);}doc.fonts.ready.then(fontsChanged);doc.fonts.addEventListener('loadingdone',fontsChanged);new ResizeObserver(()=>fit(logical.width,logical.height)).observe(canvas);
 return {render,beginGeometry,geometry,endGeometry,fit,queueRefresh,frame,document:doc};
}};
