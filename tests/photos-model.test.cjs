const test=require('node:test');
const assert=require('node:assert/strict');
const Photos=require('../web/photos-model.js');

test('only a private local photo URL is accepted for slideshow images',()=>{
  const id='a'.repeat(64),good='https://appassets.androidplatform.net/private-photos/'+id+'.jpg';
  assert.equal(Photos.safePhoto(good),good);
  const photo=Photos.normalize({photos:[{url:good,thumbnail:'https://example.invalid/large.jpg'}]}).photos[0];
  assert.equal(photo.url,good);
  assert.equal(photo.thumbnail,good.replace('/private-photos/','/private-photos/thumb/'));
  for(const bad of ['https://appassets.androidplatform.net.evil.test/private-photos/'+id+'.jpg','http://appassets.androidplatform.net/private-photos/'+id+'.jpg','https://appassets.androidplatform.net/private-photos/../index.html','https://appassets.androidplatform.net/private-photos/'+id+'.jpg?x=1'])assert.equal(Photos.safePhoto(bad),null);
});

test('malformed native status cannot provide external images or unsafe limits',()=>{
  const id='b'.repeat(64),good='https://appassets.androidplatform.net/private-photos/'+id+'.jpg';
  const state=Photos.normalize(JSON.stringify({connected:true,email:'person@example.invalid',days:365,maximum:999,lastSync:-1,photos:[{url:good,at:123},{url:'https://example.com/secret.jpg'}]}));
  assert.equal(state.photos.length,1);
  assert.equal(state.photos[0].url,good);
  assert.equal(state.days,0);assert.equal(state.maximum,30);assert.equal(state.lastSync,0);
  assert.match(Photos.caption(state),/not yet verified|verify mail access/);
});

test('last check displays in the configured city time rather than Android timezone',()=>{
  const checked=Date.UTC(2026,9,10,22,26,0);
  const status={connected:true,busy:false,error:'',lastSync:checked,photos:[{},{}]};
  const caption=Photos.caption(status,'America/Toronto');
  assert.match(caption,/2 saved/);
  assert.match(caption,/6:26/);
  assert.doesNotMatch(caption,/10:26/);
});

test('count-only selection accepts exactly 12, 30, 60 and 90, ignoring legacy day windows',()=>{
 for(const days of [0,7,30,90,180,-1,Infinity,'30'])assert.equal(Photos.normalize({days}).days,0);
 for(const maximum of [12,30,60,90])assert.equal(Photos.normalize({maximum}).maximum,maximum);
 for(const maximum of [5,50,100,200,'12'])assert.equal(Photos.normalize({maximum}).maximum,30);
});

test('photo contribution code addresses only the active receiving inbox',()=>{
  const state={connected:true,email:'frame+photos@example.invalid'};
  assert.equal(Photos.inboxMailto('email',state),'mailto:frame%2Bphotos@example.invalid');
  assert.equal(Photos.inboxMailto('email',{...state,email:'other@example.test'}),'mailto:other@example.test');
  assert.equal(Photos.inboxMailto('email',{...state,email:'frame+party?2026@example.invalid'}),'mailto:frame%2Bparty%3F2026@example.invalid');
  assert.equal(Photos.inboxMailto('album',state),'');
  assert.equal(Photos.inboxMailto('email',{...state,connected:false}),'');
  for(const email of ['',null,'a,b@example.invalid','a..b@example.invalid','a@bad..example','a@b@example.invalid','a\nb@example.invalid']){
    assert.equal(Photos.inboxMailto('email',{...state,email}),'');
  }
});
