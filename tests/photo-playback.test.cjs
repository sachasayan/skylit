const {test}=require('node:test');
const assert=require('node:assert/strict');
const playback=require('../web/photo-playback.js');

test('unknown slideshow settings fall back to a soft fade',()=>{
  assert.deepEqual(playback.styles,['fade','stack','collage','gentle','still']);
  assert.equal(playback.style('stack'),'stack');
  assert.equal(playback.style('collage'),'collage');
  assert.equal(playback.style('anything-else'),'fade');
});

test('collage never repeats one picture in a single composition',()=>{
  assert.deepEqual(playback.collage(0,0),[]);
  assert.deepEqual(playback.collage(0,1),[0]);
  assert.deepEqual(playback.collage(1,2),[1,0]);
  assert.deepEqual(playback.collage(3,5),[3,4,0]);
  assert.ok(Math.abs(playback.angle(100))<=6);
});
