'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitSlideshowModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const MAX_PHOTOS=300,MAX_ALBUMS=24,MAX_PRESETS=12;
  const id=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
  const pick=(v,values,d)=>values.includes(v)?v:d;
  const number=(v,min,max,d)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):d;
  const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
  const ids=values=>Array.isArray(values)?Array.from(new Set(values.filter(id))).slice(0,MAX_PHOTOS):[];
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  const time=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  function options(raw={}){
    if(!raw||typeof raw!=='object')raw={};
    return {duration:number(raw.duration,5,3600,30),browseDuration:number(raw.browseDuration,5,300,8),transition:pick(raw.transition,[0,300,800,1500],800),style:pick(raw.style,['fade','stack','collage','gentle','still'],'fade'),transitionType:pick(raw.transitionType,['fade','cut','slide','wipe','mixed'],'fade'),background:pick(raw.background,['mat','black','blur'],'mat'),fit:pick(raw.fit,['contain','cover','auto'],'contain'),layout:pick(raw.layout,['auto','single','pair'],'auto'),order:pick(raw.order,['newest','oldest','manual','shuffle'],'newest'),repeat:raw.repeat!==false,motion:raw.motion!==false,weighted:raw.weighted===true,newFirst:raw.newFirst!==false,resume:raw.resume!==false,collection:text(raw.collection,64)||'recent',manual:ids(raw.manual),schedule:raw.schedule===true,start:time(raw.start)?raw.start:'07:00',end:time(raw.end)?raw.end:'22:00',brightness:number(raw.brightness,0.05,1,1),nightBrightness:number(raw.nightBrightness,0.05,1,0.1),dim:raw.dim===true,title:text(raw.title,100),outro:text(raw.outro,100),titleSeconds:number(raw.titleSeconds,2,10,3),music:raw.music===true,musicVolume:number(raw.musicVolume,0,1,.2),story:raw.story===true,storySeconds:number(raw.storySeconds,5,60,8),seasonal:raw.seasonal===true,seasonStart:number(raw.seasonStart,1,12,1),seasonEnd:number(raw.seasonEnd,1,12,12)};
  }
  function photoChoice(raw={}){
    if(!raw||typeof raw!=='object')raw={};
    return {favourite:raw.favourite===true,hidden:raw.hidden===true,fit:pick(raw.fit,['contain','cover','auto'],'auto'),caption:text(raw.caption,120),title:text(raw.title,100),description:text(raw.description,180),rotation:pick(raw.rotation,[0,90,180,270],0),x:number(raw.x,0,100,50),y:number(raw.y,0,100,50),customCrop:raw.customCrop===true,autoCrop:raw.autoCrop===true,taken:validDate(raw.taken)?raw.taken:'',seconds:number(raw.seconds,0,3600,0)};
  }
  function library(raw={}){
    if(!raw||typeof raw!=='object')raw={};
    const albums=Array.isArray(raw.albums)?raw.albums.filter(a=>a&&/^[a-z0-9-]{1,64}$/.test(a.id)&&text(a.name,60)).slice(0,MAX_ALBUMS).map(a=>({id:a.id,name:text(a.name,60),photos:ids(a.photos)})):[];
    const presets=Array.isArray(raw.presets)?raw.presets.filter(p=>p&&text(p.name,60)).slice(0,MAX_PRESETS).map(p=>({name:text(p.name,60),options:options(p.options)})):[];
    return {version:1,options:options(raw.options),albums,presets};
  }
  function dateParts(now,zone){if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return null;try{return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).reduce((r,p)=>(r[p.type]=p.value,r),{});}catch(_){return dateParts(now,'UTC');}}
  function allowed(p,now=new Date(),zone='UTC'){p=options(p);if(!p.schedule||p.start===p.end)return true;const parts=dateParts(now,zone);if(!parts)return false;const t=parts.hour+':'+parts.minute;return p.start<p.end?t>=p.start&&t<p.end:t>=p.start||t<p.end;}
  function select(photos,choices,p,albums=[],now=new Date(),zone='UTC'){
    p=options(p);const parts=dateParts(now,zone);if(!parts&&(p.collection==='memories'||p.seasonal))return [];const month=parts?Number(parts.month):0;
    if(p.seasonal&&!(p.seasonStart<=p.seasonEnd?month>=p.seasonStart&&month<=p.seasonEnd:month>=p.seasonStart||month<=p.seasonEnd))return [];
    const album=albums.find(a=>a.id===p.collection),members=album?new Set(album.photos):null;
    let result=photos.filter(photo=>photo&&id(photo.id)&&!photo.pending&&!photoChoice(choices[photo.id]).hidden);
    if(p.collection==='keepers')result=result.filter(photo=>photo.keeper);
    else if(p.collection==='favourites')result=result.filter(photo=>photoChoice(choices[photo.id]).favourite);
    else if(p.collection==='recent')result=result.filter(photo=>!photo.keeper||photo.recent!==false);
    else if(p.collection==='memories')result=result.filter(photo=>{const d=photoChoice(choices[photo.id]).taken||photo.taken;return validDate(d)&&d.slice(5)===parts.month+'-'+parts.day&&Number(d.slice(0,4))<Number(parts.year);});
    else if(members)result=result.filter(photo=>members.has(photo.id));
    else if(p.collection!=='all')return [];
    if(p.order==='manual'){const rank=new Map(p.manual.map((id,i)=>[id,i]));result.sort((a,b)=>(rank.has(a.id)?rank.get(a.id):MAX_PHOTOS)-(rank.has(b.id)?rank.get(b.id):MAX_PHOTOS)||b.at-a.at);}
    else result.sort((a,b)=>p.order==='oldest'?a.at-b.at:b.at-a.at);
    return result.slice(0,MAX_PHOTOS);
  }
  function shuffled(items,random=Math.random,previous=null){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}if(out.length>1&&out[0]===previous){[out[0],out[1]]=[out[1],out[0]];}return out;}
  // Queue changes never reshuffle the current cycle or replace viewing history.
  class Queue{
    constructor(items=[],p={},random=Math.random){this.random=random;this.p=options(p);this.available=[];this.queue=[];this.history=[];this.cursor=-1;this.cycles=0;this.favourites=[];this.update(items,p);}
    update(items,p=this.p){this.p=options(p);const next=ids(items),valid=new Set(next),old=new Set(this.available);this.available=next;this.queue=this.queue.filter(x=>valid.has(x));const before=this.history.slice(0,this.cursor+1).filter(x=>valid.has(x)),after=this.history.slice(this.cursor+1).filter(x=>valid.has(x));this.history=before.concat(after);this.cursor=before.length-1;const additions=next.filter(x=>!old.has(x));if(this.cursor<0&&!this.queue.length)this.queue=this.cycle(null);else{const queued=new Set(this.queue);const fresh=additions.filter(x=>!queued.has(x));this.queue=this.p.newFirst?fresh.concat(this.queue):this.queue.concat(fresh);}return this.current();}
    cycle(previous){this.cycles++;const out=this.p.order==='shuffle'?shuffled(this.available,this.random,previous):this.available.slice();if(this.p.weighted&&out.length>1){for(const id of this.favourites||[]){if(!out.includes(id))continue;for(let i=Math.floor(out.length/2);i<=out.length;i++)if(out[i-1]!==id&&out[i]!==id){out.splice(i,0,id);break;}}}if(out.length>1&&out[0]===previous){const index=out.findIndex(x=>x!==previous);if(index>0)[out[0],out[index]]=[out[index],out[0]];}return out;}
    current(){return this.history[this.cursor]||null;}
    start(value){if(value&&this.available.includes(value)){this.queue=this.queue.filter(x=>x!==value);this.history=[value];this.cursor=0;return value;}return this.next();}
    next(){if(this.cursor<this.history.length-1)return this.history[++this.cursor];if(!this.queue.length){if(!this.p.repeat)return null;this.queue=this.cycle(this.current());}const value=this.queue.shift();if(!value)return null;this.history.push(value);if(this.history.length>600)this.history.shift();this.cursor=this.history.length-1;return value;}
    previous(){if(this.cursor>0)return this.history[--this.cursor];return this.current();}
    skip(id){this.update(this.available.filter(x=>x!==id));}
    snapshot(){return {current:this.current(),queue:this.queue.slice(),history:this.history.slice(-60),cycles:this.cycles};}
  }
  function aspect(photo,choice={}){const w=Number(photo.width)||1,h=Number(photo.height)||1;return [90,270].includes(choice.rotation)?h/w:w/h;}
  function composition(photos,index,p,choices={}){if(!photos.length)return [];p=options(p);const first=photos[index%photos.length];if(first.kind==='video')return [first];const portrait=aspect(first,photoChoice(choices[first.id]))<.85;let count=p.style==='collage'?Math.min(3,photos.length):p.layout==='pair'||p.layout==='auto'&&portrait?Math.min(2,photos.length):1;const result=[first];for(let i=1;i<photos.length&&result.length<count;i++){const photo=photos[(index+i)%photos.length];if(photo.kind==='video')continue;if(p.style!=='collage'&&count===2&&p.layout==='auto'&&aspect(photo,photoChoice(choices[photo.id]))>=.85)continue;result.push(photo);}return result;}
  function framing(photo,c,p,width,height){c=photoChoice(c);p=options(p);const rotation=c.rotation,fit=c.fit==='auto'?p.fit==='auto'?(Math.abs(aspect(photo,c)-width/Math.max(1,height))<.2?'cover':'contain'):p.fit:c.fit;let x=c.customCrop?c.x:c.autoCrop&&Number.isFinite(photo.focalX)?photo.focalX*100:50,y=c.customCrop?c.y:c.autoCrop&&Number.isFinite(photo.focalY)?photo.focalY*100:50;if(c.customCrop){if(rotation===90)[x,y]=[y,100-x];else if(rotation===180)[x,y]=[100-x,100-y];else if(rotation===270)[x,y]=[100-y,x];}return {fit,position:x+'% '+y+'%',rotation,width:rotation===90||rotation===270?height:width,height:rotation===90||rotation===270?width:height};}
  function panImage(x,y,zoom,width,height,imageWidth,imageHeight,fit='contain'){const factor=fit==='cover'?Math.max(width/imageWidth,height/imageHeight):Math.min(width/imageWidth,height/imageHeight),dx=Math.max(0,(imageWidth*factor*zoom-width)/2),dy=Math.max(0,(imageHeight*factor*zoom-height)/2);return {x:Math.max(-dx,Math.min(dx,x)),y:Math.max(-dy,Math.min(dy,y))};}
  function pan(x,y,zoom,width,height){const limitX=Math.max(0,width*(zoom-1)/2),limitY=Math.max(0,height*(zoom-1)/2);return {x:Math.max(-limitX,Math.min(limitX,x)),y:Math.max(-limitY,Math.min(limitY,y))};}
  function similar(a,b){if(typeof a!=='string'||typeof b!=='string'||!/^([a-f0-9]{16})$/.test(a)||!/^([a-f0-9]{16})$/.test(b))return false;let distance=0;for(let i=0;i<16;i++){let n=parseInt(a[i],16)^parseInt(b[i],16);while(n){distance+=n&1;n>>=1;}}return distance<=5;}
  return {MAX_PHOTOS,MAX_ALBUMS,MAX_PRESETS,id,ids,validDate,options,photoChoice,library,dateParts,allowed,select,shuffled,Queue,aspect,composition,framing,pan,panImage,similar};
});
