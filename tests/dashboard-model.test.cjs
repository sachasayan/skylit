const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../web/dashboard-model.js');
function sound(layout){
  assert.ok(layout.modules.length<=model.catalog.length);
  assert.equal(new Set(layout.modules.map(item=>item.type)).size,layout.modules.length);
  for(const item of layout.modules){assert.equal(model.valid(item),true);for(const other of layout.modules)if(other!==item)assert.equal(model.overlaps(item,other),false);}
}
test('legacy presets and a pinned excerpt migrate without storing household content',()=>{
  for(const preset of ['balanced','photos','agenda']){const layout=model.normalize(null,{preset,excerpt:true,note:'private sentinel'});sound(layout);assert.equal(layout.modules.some(item=>item.type==='note'),true);assert.doesNotMatch(JSON.stringify(layout),/private sentinel/);}
});
test('invalid and overlapping records cannot break the grid or supply markup',()=>{
  const valid={type:'clock',x:0,y:0,w:6,h:4};const layout=model.normalize({version:1,modules:[valid,{...valid,type:'weather'}, {...valid,x:NaN}, {...valid,type:'<img>'},{...valid,type:'note',x:6,secret:'private'}]});
  sound(layout);assert.equal(layout.modules.length,2);assert.doesNotMatch(JSON.stringify(layout),/secret|private|img/);
  assert.deepEqual(model.normalize({version:1,modules:[]}).modules,[]);
  assert.equal(model.normalize({version:1,modules:[{}]}).modules.length,4);
});
test('move and resize reject collisions, non-integers and offscreen geometry without mutating input',()=>{
  const layout=model.preset(),before=JSON.stringify(layout);
  assert.equal(model.change(layout,'clock',{x:1}),null);
  assert.equal(model.change(layout,'clock',{h:5}),null);
  assert.equal(model.change(layout,'clock',{x:-1}),null);
  assert.equal(model.change(layout,'clock',{w:2}),null);
  assert.equal(model.change(layout,'clock',{h:3.1}),null);
  const next=model.change(layout,'clock',{w:3,h:3});sound(next);assert.equal(model.change(next,'clock',{x:3,y:1}).modules[0].x,3);
  assert.equal(JSON.stringify(layout),before);
});
test('adding to a full dashboard makes space, preserves every module and supports all nine kinds',()=>{
  let layout=model.preset();const result=model.add(layout,'note');assert.equal(result.rearranged,true);assert.equal(result.added,true);layout=result.layout;
  for(const item of model.catalog)layout=model.add(layout,item.type).layout;
  sound(layout);assert.equal(layout.modules.length,9);assert.equal(model.add(layout,'note').added,false);
  const removed=model.remove(layout,'weather');assert.equal(removed.modules.length,8);assert.equal(layout.modules.length,9);
});
test('gallery drop needs free space; explicit removal leaves an empty layout usable',()=>{
  const layout=model.preset();assert.equal(model.add(layout,'note',{x:0,y:0}).added,false);
  const reduced=model.change(layout,'clock',{w:3,h:4});assert.equal(model.add(reduced,'note',{x:3,y:0}).added,false);
  let empty=layout;for(const item of layout.modules)empty=model.remove(empty,item.type);
  assert.equal(model.add(empty,'note',{x:8,y:8}).added,true);
  assert.equal(model.add(empty,'note',{x:9,y:9}).added,false);
});
test('bounded arbitrary edit sequences preserve valid, unique and non-overlapping modules',()=>{
  let layout=model.preset();let seed=31;
  const random=max=>{seed=(seed*1664525+1013904223)>>>0;return seed%max;};
  for(let n=0;n<600;n++){
    const type=model.catalog[random(9)].type;
    if(n%5===0)layout=model.add(layout,type).layout;
    else if(n%7===0)layout=model.remove(layout,type);
    else layout=model.change(layout,type,{x:random(15)-1,y:random(15)-1,w:random(13),h:random(13)})||layout;
    sound(layout);
  }
});
