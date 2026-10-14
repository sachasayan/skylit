'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitDashboardModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const columns=12,rows=12;
  const styles={clock:['classic','analog','stacked','digital'],photos:['prints','mosaic','spotlight'],weather:['landscape','minimal','sky']};
  function setStyle(item,value){if(value===styles[item.type]?.[0]||!styles[item.type]?.includes(value))delete item.style;else item.style=value;return item;}
  const catalog=[
    {type:'clock',name:'Clock & date',description:'Time and date in your selected city.',minW:3,minH:3},
    {type:'weather',name:'Weather',description:'Current conditions and the familiar landscape.',minW:3,minH:4},
    {type:'photos',name:'Photos',description:'Your curated local pictures; tap to open Photos.',minW:3,minH:3},
    {type:'plans',name:'Upcoming events',description:'Plans anchored to today, independent of month browsing.',minW:3,minH:4},
    {type:'forecast',name:'Hourly forecast',description:'The next few hours from your existing forecast.',minW:3,minH:4},
    {type:'note',name:'Note',description:'The pinned note from Household settings.',minW:3,minH:3},
    {type:'shopping',name:'Shopping list',description:'Check off items on your shared on-frame list.',minW:3,minH:4},
    {type:'countdowns',name:'Countdowns',description:'Days until your saved occasions.',minW:3,minH:3},
    {type:'timers',name:'Timers',description:'Your running on-frame timers; no background alarm.',minW:3,minH:3}
  ];
  const definition=type=>catalog.find(item=>item.type===type);
  const copy=layout=>({version:1,modules:layout.modules.map(item=>({...item}))});
  function preset(name='balanced'){
    const positions=name==='photos'?[[0,0,6,4],[0,4,6,8],[6,0,6,6],[6,6,6,6]]:name==='agenda'?[[0,0,4,4],[0,4,4,8],[4,0,8,4],[4,4,8,8]]:[[0,0,6,4],[0,4,6,8],[6,0,6,4],[6,4,6,8]];
    return {version:1,modules:['clock','weather','photos','plans'].map((type,i)=>({type,x:positions[i][0],y:positions[i][1],w:positions[i][2],h:positions[i][3]}))};
  }
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function valid(item){const d=item&&definition(item.type);return !!d&&['x','y','w','h'].every(k=>Number.isInteger(item[k]))&&item.x>=0&&item.y>=0&&item.w>=d.minW&&item.h>=d.minH&&item.x+item.w<=columns&&item.y+item.h<=rows;}
  function normalize(raw,legacy={}){
    const fallback=()=>{let layout=preset(legacy.preset);if(legacy.excerpt)layout=add(layout,'note').layout;return layout;};
    if(!raw||raw.version!==1||!Array.isArray(raw.modules))return fallback();
    const modules=[];
    for(const value of raw.modules.slice(0,40)){
      if(!valid(value)||modules.some(item=>item.type===value.type||overlaps(item,value)))continue;
      const item={type:value.type,x:value.x,y:value.y,w:value.w,h:value.h};setStyle(item,value.style);modules.push(item);
      if(modules.length===catalog.length)break;
    }
    return modules.length||raw.modules.length===0?{version:1,modules}:fallback();
  }
  function change(layout,type,patch){
    const next=copy(layout),item=next.modules.find(item=>item.type===type);if(!item)return null;
    for(const k of ['x','y','w','h'])if(patch[k]!==undefined)item[k]=patch[k];
    if(patch.style!==undefined){if(!styles[type]?.includes(patch.style))return null;setStyle(item,patch.style);}
    return valid(item)&&!next.modules.some(other=>other!==item&&overlaps(item,other))?next:null;
  }
  // A swap exchanges slots, including their size, only when both widgets fit.
  function swap(layout,type,targetType){
    const next=copy(layout),a=next.modules.find(i=>i.type===type),b=next.modules.find(i=>i.type===targetType);
    if(!a||!b||a===b)return null;
    const slot={x:a.x,y:a.y,w:a.w,h:a.h};for(const k of ['x','y','w','h'])a[k]=b[k];Object.assign(b,slot);
    return valid(a)&&valid(b)?next:null;
  }
  function placement(layout,type,point){
    const d=definition(type);if(!d||layout.modules.some(i=>i.type===type)||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
    let best=null,score=Infinity;
    for(let w=4;w>=d.minW;w--)for(let h=4;h>=d.minH;h--)for(let y=0;y<=rows-h;y++)for(let x=0;x<=columns-w;x++){
      const item={type,x,y,w,h};if(!valid(item)||layout.modules.some(other=>overlaps(item,other)))continue;
      const distance=(x+w/2-point.x)**2+(y+h/2-point.y)**2+(16-w*h)*.12;
      if(distance<score){best=item;score=distance;}
    }return best;
  }
  function arrange(layout){return {version:1,modules:layout.modules.map((item,i)=>{const next={type:item.type,x:(i%3)*4,y:Math.floor(i/3)*4,w:4,h:4};setStyle(next,item.style);return next;})};}
  function add(layout,type,position=null){
    if(!definition(type)||layout.modules.some(item=>item.type===type))return {layout:copy(layout),added:false,rearranged:false};
    const next=copy(layout),item={type,x:0,y:0,w:4,h:4};
    if(position){item.x=position.x;item.y=position.y;item.w=position.w??4;item.h=position.h??4;if(valid(item)&&!next.modules.some(other=>overlaps(item,other))){next.modules.push(item);return {layout:next,added:true,rearranged:false};}return {layout:next,added:false,rearranged:false};}
    for(let y=0;y<=rows-item.h;y++)for(let x=0;x<=columns-item.w;x++){item.x=x;item.y=y;if(!next.modules.some(other=>overlaps(item,other))){next.modules.push({...item});return {layout:next,added:true,rearranged:false};}}
    next.modules.push(item);return {layout:arrange(next),added:true,rearranged:true};
  }
  const remove=(layout,type)=>({version:1,modules:layout.modules.filter(item=>item.type!==type).map(item=>({...item}))});
  return {columns,rows,styles,catalog,definition,preset,normalize,overlaps,valid,change,swap,placement,add,remove,arrange,copy};
});
