'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('../web/update-model.js');
test('update controls only expose recognized, supported native states',()=>{assert.equal(model.action(model.normalize({stage:'ready',version:'9.0.0'})),null);for(const stage of ['available','ready','confirm'])assert.ok(model.badge(model.normalize({supported:true,stage,version:'2.16.1'})));assert.equal(model.badge(model.normalize({supported:true,stage:'current',version:'2.16.0'})),false);assert.equal(model.action(model.normalize({supported:true,stage:'confirm'}))[0],'install');});
test('malformed update status cannot enable automation or inject unbounded release content',()=>{const s=model.normalize({supported:'true',permission:'true',stage:'<script>',version:'../latest',notes:'x'.repeat(7000),lastChecked:-1,settings:{install:'true',check:1,start:-1,end:25}});assert.equal(s.supported,false);assert.equal(s.permission,false);assert.equal(s.stage,'failed');assert.equal(s.version,'');assert.equal(s.notes.length,6000);assert.equal(s.settings.install,false);assert.equal(s.settings.check,false);assert.equal(s.settings.start,2);assert.equal(s.settings.end,4);assert.equal(s.lastChecked,0);});

test('missing and non-object native status fails closed',()=>{for(const raw of [null,false,'ready',42]){const s=model.normalize(raw);assert.equal(s.supported,false);assert.equal(model.action(s),null);assert.equal(model.badge(s),false);}});
test('update policy maps explicit choices while preserving schedule and custom legacy combinations',()=>{
 const current={check:true,download:false,install:true,start:22,end:3,timezone:'Europe/London'};
 assert.equal(model.policy(current),'custom');assert.equal(model.policySettings('unknown',current),null);
 for(const [policy,flags] of Object.entries({manual:[false,false,false],check:[true,false,false],download:[true,true,false],idle:[true,true,true]})){
  const next=model.policySettings(policy,current);assert.deepEqual([next.check,next.download,next.install],flags);assert.equal(next.start,22);assert.equal(next.end,3);assert.equal(next.timezone,current.timezone);assert.equal(model.policy(next),policy);
 }
 assert.equal(current.install,true);
});
