/* Synthetic public preview only. This file is never included in an APK. */
(() => {
  const allNames=['marigolds','dog','cat','lake','orchard'];
  const requested=Number(new URLSearchParams(location.search).get('count'));
  const names=Number.isInteger(requested)&&requested>=1&&requested<=allNames.length?allNames.slice(0,requested):allNames;
  const photos=names.map((name,index)=>({id:String(index+1).padStart(64,'0'),url:'demo-photos/'+name+'.png',at:Date.now()-index*86400000}));
  if(new URLSearchParams(location.search).get('slides')==='advanced'){
    photos.push({id:'a'.repeat(64),url:'demo-photos/portrait-garden.svg',at:Date.now()-10*86400000,width:600,height:900,keeper:true,recent:false,taken:'2020-10-12',visual:'abcdef0123456789'}, {id:'b'.repeat(64),url:'demo-photos/portrait-house.svg',at:Date.now()-11*86400000,width:600,height:900,keeper:true,recent:false,taken:'2021-10-12',visual:'abcdef0123456788'}, {id:'c'.repeat(64),url:'demo-photos/lake.png',media:'demo-photos/sample-clip.mp4',at:Date.now()-12*86400000,width:640,height:480,kind:'video',keeper:true,recent:false});
  }
  const storedKeepers=localStorage.getItem('demo.keepers');const savedKeepers=new Set(storedKeepers?JSON.parse(storedKeepers):photos.filter(p=>p.keeper).map(p=>p.id));photos.forEach(photo=>{photo.keeper=savedKeepers.has(photo.id);});let review=localStorage.getItem('demo.review')==='true',dates=localStorage.getItem('demo.dates')==='true';
  const excluded=new Set(JSON.parse(localStorage.getItem('demo.photoExclusions')||'[]'));let days=Number(localStorage.getItem('demo.photoDays')||30),maximum=Number(localStorage.getItem('demo.photoMaximum')||30);
  const normalize=window.SkylitPhotoModel.normalize;
  window.SkylitPhotoModel.normalize=raw=>{
    const base=normalize(raw);let parsed={};try{parsed=typeof raw==='string'?JSON.parse(raw):raw||{}}catch(_){}
    const safe=Array.isArray(parsed.photos)?parsed.photos.filter(photo=>photo&&photos.some(original=>photo.url===original.url)):[];
    return Object.assign(base,{photos:safe});
  };
  window.SkylitDemoPhotos={photos};
  Object.assign(window.Skylit,{
    photoStatus:()=>JSON.stringify({epoch:'synthetic-cache',connected:true,email:'demo@example.invalid',days,maximum,excluded:Array.from(excluded),lastSync:Date.now(),busy:false,error:'',photos,storage:{used:photos.length*160000,limit:268435456,keepers:photos.filter(photo=>photo.keeper).length,keeperBytes:photos.filter(photo=>photo.keeper).length*160000,review,dates}}),
    photoKeepMany(raw,value){const ids=JSON.parse(raw);for(const id of ids){const photo=photos.find(p=>p.id===id);if(!photo)return false;photo.keeper=value;value?savedKeepers.add(id):savedKeepers.delete(id);}localStorage.setItem('demo.keepers',JSON.stringify(Array.from(savedKeepers)));return true;},photoExcludeMany(raw,value){for(const id of JSON.parse(raw))value?excluded.add(id):excluded.delete(id);localStorage.setItem('demo.photoExclusions',JSON.stringify(Array.from(excluded)));return true;},photoReviewMany(raw,value){for(const id of JSON.parse(raw)){const photo=photos.find(p=>p.id===id);if(photo)photo.pending=false;if(!value)excluded.add(id);}return true;},photoImportOptions(r,d){review=r;dates=d;localStorage.setItem('demo.review',String(r));localStorage.setItem('demo.dates',String(d));return true;},
    photoDeliverySettings:()=>JSON.stringify({interval:3600,trusted:false,senders:[]}),photoDelivery(){return true;},configureQuiet(){},privacyPause(){},ambientClosed(){},
    photoSource(){},photoRefresh(){},photoConfigure(window,limit){days=window;maximum=limit;localStorage.setItem('demo.photoDays',String(days));localStorage.setItem('demo.photoMaximum',String(maximum));return true},photoExclude(id,value){value?excluded.add(id):excluded.delete(id);localStorage.setItem('demo.photoExclusions',JSON.stringify(Array.from(excluded)));return true},photoRestoreExcluded(){excluded.clear();localStorage.removeItem('demo.photoExclusions');return true},
    photoOpen(idle){setTimeout(()=>window.SkylitPhotos.open(idle),0)},
    photoBrowse(index){setTimeout(()=>window.SkylitPhotos.open(false,index,false),0)},
    localPhotoClosed(){}
  });
})();
