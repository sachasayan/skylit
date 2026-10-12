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
 assert.deepEqual(M.select(list,choices,{collection:'keepers'}).map(p=>p.id),[id(1)]);assert.deepEqual(M.select(list,choices,{collection:'recent'}).map(p=>p.id),[id(3)]);assert.equal(M.select(list,choices,{collection:'missing'}).length,0);assert.equal(M.select(list,choices,{collection:'album-one'},[{id:'album-one',name:'One',photos:[id(1),id(2)]}]).length,1);
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
