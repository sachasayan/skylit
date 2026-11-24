'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../web/slideshow-model.js');
const id=n=>n.toString(16).padStart(64,'0'),photo=(n,extra={})=>({id:id(n),at:n,width:1600,height:1000,...extra});
test('slideshow schema rejects unsafe records, preserves bounded settings and dates',()=>{
 assert.equal(M.options({duration:null}).duration,30);assert.equal(M.options({duration:Infinity}).duration,30);assert.equal(M.options({duration:9000}).duration,3600);assert.equal(M.options({style:'javascript:alert(1)'}).style,'fade');assert.equal(M.photoChoice({rotation:45}).rotation,0);assert.equal(M.photoChoice({x:-5}).x,0);assert.equal(M.validDate('2026-02-29'),false);assert.equal(M.validDate('2024-02-29'),true);assert.equal(M.library({albums:[{id:'<img>',name:'Bad',photos:[id(1)]}]}).albums.length,0);assert.equal(M.ids([id(1),id(1),'../secret']).length,1);assert.equal(M.similar('not-a-hex-hash!!','not-a-hex-hash!!'),false);
});
test('queues keep cycle, current photo and real history stable during progress-only refresh',()=>{
 const q=new M.Queue([id(1),id(2),id(3)],{order:'shuffle'},()=>.2);q.start();q.next();const before=q.snapshot();q.update([id(1),id(2),id(3)]);assert.deepEqual(q.snapshot(),before);const last=q.current();q.previous();assert.notEqual(q.current(),last);q.next();assert.equal(q.current(),last);q.update([id(1),id(2),id(3),id(4)]);assert.equal(q.current(),last);assert.equal(q.queue[0],id(4));q.next();assert.equal(q.current(),id(4));
});
test('shuffle cycle boundaries never immediately repeat when alternatives exist; singleton and no-repeat finish safely',()=>{
 const q=new M.Queue([id(1),id(2),id(3)],{order:'shuffle'},()=>.99);let previous=null;for(let i=0;i<70;i++){const current=q.next();assert.notEqual(current,previous);previous=current;}
 const one=new M.Queue([id(1)],{repeat:false});assert.equal(one.next(),id(1));assert.equal(one.next(),null);assert.equal(one.previous(),id(1));one.update([]);assert.equal(one.next(),null);
});
test('removed photos cannot reappear through queued future or playback history',()=>{
 const q=new M.Queue([id(1),id(2),id(3)]);q.next();q.next();q.update([id(2),id(3)]);assert.equal(q.current(),id(2));assert.equal(q.previous(),id(2));assert.equal(q.next(),id(3));q.skip(id(2));assert.ok(!q.history.includes(id(2)));for(let i=0;i<8;i++)assert.notEqual(q.next(),id(2));
});
test('optional favourite weighting adds spaced turns without adjacent duplicates',()=>{
 const q=new M.Queue([id(1),id(2),id(3)],{weighted:true});q.favourites=[id(2)];const cycle=q.cycle(id(1));assert.equal(cycle.filter(x=>x===id(2)).length,2);for(let i=1;i<cycle.length;i++)assert.notEqual(cycle[i],cycle[i-1]);assert.notEqual(cycle[0],id(1));
});
test('collections never expose pending, excluded or another album when a filter is empty',()=>{
 const list=[photo(1,{keeper:true,recent:false}),photo(2,{pending:true}),photo(3),photo(4)],choices={[id(4)]:{hidden:true}};
 assert.deepEqual(M.select(list,choices,{collection:'keepers'}).map(p=>p.id),[id(1)]);assert.deepEqual(M.select(list,choices,{collection:'recent'}).map(p=>p.id),[id(3),id(1)]);assert.equal(M.select(list,choices,{collection:'missing'}).length,0);assert.equal(M.select(list,choices,{collection:'album-one'},[{id:'album-one',name:'One',photos:[id(1),id(2)]}]).length,1);
});
test('capture-date memories and seasons respect city date, leap days and year boundaries',()=>{
 const list=[photo(1,{taken:'2020-10-12'}),photo(2,{taken:'2026-10-12'}),photo(3)];
 assert.equal(M.select(list,{}, {collection:'memories'},[],new Date('2026-10-13T02:00:00Z'),'America/Toronto').length,1);
 assert.equal(M.select(list,{}, {seasonal:true,seasonStart:12,seasonEnd:2},[],new Date('2026-01-01T12:00:00Z')).length,3);
 assert.equal(M.select(list,{}, {seasonal:true,seasonStart:12,seasonEnd:2},[],new Date('2026-06-01T12:00:00Z')).length,0);
});
test('schedules cross midnight without affecting manual playback, and invalid zones fall back',()=>{
 assert.equal(M.allowed({schedule:true,start:'22:00',end:'07:00'},new Date('2026-10-12T23:00:00Z')),true);assert.equal(M.allowed({schedule:true,start:'22:00',end:'07:00'},new Date('2026-10-12T12:00:00Z')),false);assert.equal(M.allowed({schedule:false},new Date(),'not-a-zone'),true);assert.equal(M.allowed({schedule:true,start:'00:00',end:'00:00'},new Date()),true);
});
test('portrait pairing, rotated shapes, videos and small collages select distinct photos',()=>{
 const list=[photo(1,{width:600,height:900}),photo(2),photo(3,{width:600,height:900})];assert.deepEqual(M.composition(list,0,{}).map(p=>p.id),[id(1),id(3)]);assert.equal(M.composition(list,1,{}).length,1);assert.equal(M.composition(list,1,{}, {[id(2)]:{rotation:90}}).length,2);assert.equal(M.composition([photo(1,{kind:'video'}),photo(2)],0,{style:'collage'}).length,1);assert.equal(new Set(M.composition(list.slice(0,2),0,{style:'collage'}).map(p=>p.id)).size,2);
});
test('zoom panning cannot move the picture completely outside its canvas',()=>{assert.deepEqual(M.pan(900,-900,2,800,400),{x:400,y:-200});assert.deepEqual(M.pan(30,40,1,800,400),{x:0,y:0});});

test('latest count adds Keepers without using ordinary slots',()=>{
 const list=Array.from({length:100},(_,i)=>photo(i+1));
 list.push(photo(1001,{at:0,keeper:true,recent:false}),photo(1002,{at:-1,keeper:true}));
 const choices={[id(100)]:{hidden:true},[id(1002)]:{hidden:true}};
 const selected=M.select(list,choices,{maximum:30});
 assert.equal(selected.length,31);assert.ok(selected.some(p=>p.id===id(1001)));
 assert.ok(!selected.some(p=>p.id===id(100)||p.id===id(1002)));
 assert.equal(selected.filter(p=>!p.keeper).length,30);
 assert.equal(M.select(list,choices,{maximum:12,order:'oldest'}).filter(p=>!p.keeper).length,12);
 assert.equal(list.length,102); // Selection never mutates/deletes library records.
});
test('legacy upgrade resets the selection once while preserving collections and presentation',()=>{
 const migrated=M.library({version:1,options:{collection:'all',maximum:200,style:'collage'},albums:[{id:'family',name:'Family',photos:[id(1)]}]});
 assert.equal(migrated.version,2);assert.equal(migrated.options.collection,'recent');assert.equal(migrated.options.maximum,30);
 assert.equal(migrated.options.style,'collage');assert.equal(migrated.albums.length,1);
 migrated.options.maximum=60;migrated.options.collection='keepers';
 assert.equal(M.library(migrated).options.maximum,60);assert.equal(M.library(migrated).options.collection,'keepers');
});
test('archive pictures never enter a slideshow through a different ordering or collection',()=>{
 const list=Array.from({length:50},(_,i)=>photo(i+1)),choices={[id(1)]:{favourite:true}};
 assert.equal(M.select(list,choices,{collection:'favourites',maximum:12}).length,0);
 assert.equal(M.select(list,{}, {collection:'all',maximum:12,order:'oldest'})[0].id,id(39));
});

test('manual browsing queues can reach archived pictures beyond the old 300-picture bound',()=>{
 const all=Array.from({length:500},(_,i)=>id(i+1)),q=new M.Queue(all);
 assert.equal(q.available.length,500);assert.equal(q.start(id(490)),id(490));
 assert.equal(M.ids(all).length,300); // Persisted collection/action limits stay bounded.
});
test('pairs consume queue entries together across shuffle and repeat boundaries',()=>{
 for(const order of ['newest','shuffle']){
  for(const count of [4,5,8]){
   for(const weighted of [false,true]){
   const ids=Array.from({length:count},(_,i)=>id(i+1)),q=new M.Queue(ids,{order,repeat:true,weighted},()=>.31);
   q.favourites=ids.slice(1,3);
   let previous=[];
   for(let i=0;i<25;i++){
    q.next(previous);
    const scene=q.pair(ids);
    assert.equal(new Set(scene).size,2);
    assert.ok(scene.every(id=>!previous.includes(id)));
    previous=scene;
   }
   q.previous();assert.notDeepEqual(q.pair(ids),previous);
   q.next();assert.deepEqual(q.pair(ids),previous);
   }
  }
 }
});
test('finite and small collections finish without a duplicate print',()=>{
 for(const count of [1,2,3,5]){
  const ids=Array.from({length:count},(_,i)=>id(i+1)),q=new M.Queue(ids,{repeat:false});
  const seen=[];while(q.next())seen.push(...q.pair(ids));
  assert.deepEqual(seen,ids);
 }
});
test('legacy surrounds normalize to black and print margins fit rotated portraits',()=>{
 const source=photo(1,{width:400,height:700});
 for(const background of ['mat','black','blur'])assert.equal(M.options({background}).background,'black');
 for(const rotation of [0,90]){
  const size=M.printGeometry(source,{rotation},{fit:'contain'},500,600);
  assert.ok(size.width+2*size.edge<=501&&size.height+2*size.edge<=601);
  assert.ok(size.edge>0);assert.ok(Math.abs(size.width/size.height-M.aspect(source,{rotation}))<.001);
 }
});
test('each photo keeps a subtle tilt across appearances',()=>{
 const photos=Array.from({length:96},(_,i)=>id(i)),angles=photos.map(M.printTilt);
 assert.ok(angles.every(angle=>Number.isFinite(angle)&&Math.abs(angle)<=2));
 assert.ok(angles.some(angle=>angle<0)&&angles.some(angle=>angle>0));
 assert.ok(new Set(angles).size>10);
 assert.deepEqual(photos.reverse().map(M.printTilt).reverse(),angles);
});
test('tall dashboard stage stacks two landscape photos vertically and keeps portrait photos solo',()=>{
 const landA=photo(1,{width:1600,height:1000}),landB=photo(2,{width:1500,height:1000}),portA=photo(3,{width:800,height:1200}),portB=photo(4,{width:700,height:1100});
 const stacked=M.stageComposition([landA,portA,landB],0,{layout:'auto'},{},0.95);
 assert.equal(stacked.direction,'column');
 assert.deepEqual(stacked.photos.map(p=>p.id),[landA.id,landB.id]);
 const soloPortrait=M.stageComposition([portA,portB,landA],0,{layout:'auto'},{},0.95);
 assert.equal(soloPortrait.direction,'column');
 assert.deepEqual(soloPortrait.photos.map(p=>p.id),[portA.id]);
 const widePair=M.stageComposition([portA,landA,portB],0,{layout:'auto'},{},1.8);
 assert.equal(widePair.direction,'row');
 assert.deepEqual(widePair.photos.map(p=>p.id),[portA.id,portB.id]);
 const wideSingle=M.stageComposition([landA,landB],0,{layout:'auto'},{},1.8);
 assert.equal(wideSingle.direction,'row');
 assert.deepEqual(wideSingle.photos.map(p=>p.id),[landA.id]);
});
