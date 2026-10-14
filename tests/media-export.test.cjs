const {test}=require('node:test'),assert=require('node:assert/strict');
const transfer=require('../web/media-export.js');
test('export transfers one bounded chunk at a time and yields until native completion',async()=>{
 let pending=false,writes=0,finished=false,polls=0;const chunks=[];
 const native={mediaExportBegin:()=> 'job',mediaExportWrite(id,chunk){assert(!pending);assert.equal(id,'job');pending=true;writes++;chunks.push(Buffer.from(chunk,'base64'));return true},mediaExportFinish(){assert(!pending);pending=true;finished=true;return true},mediaExportStatus(){polls++;if(pending){pending=false;return 'pending'}return finished?'done':'ready'},mediaExportCancel(){throw Error('Unexpected cancel')}};
 const bytes=Buffer.alloc(100000,42);let ticks=0;const timer=setInterval(()=>ticks++,0);
 try{await transfer.save(new Blob([bytes]),native,()=>false);assert.equal(writes,4);assert(polls>=10);assert(ticks>=4);assert.deepEqual(Buffer.concat(chunks),bytes);}finally{clearInterval(timer)}
});
test('export cancellation while a write is pending stops further writes and publication',async()=>{
 let cancelled=false,writes=0,erased=0;const native={mediaExportBegin:()=> 'job',mediaExportWrite(){writes++;setTimeout(()=>cancelled=true,0);return true},mediaExportStatus:()=> 'pending',mediaExportFinish(){throw Error('Published after cancel')},mediaExportCancel(){erased++}};
 await assert.rejects(transfer.save(new Blob([new Uint8Array(100000)]),native,()=>cancelled),/cancelled/);assert.equal(writes,1);assert.equal(erased,1);
});
test('native export failures erase partial output',async()=>{
 let erased=0;const native={mediaExportBegin:()=> 'job',mediaExportWrite:()=>true,mediaExportStatus:()=> 'failed',mediaExportCancel(){erased++}};
 await assert.rejects(transfer.save(new Blob(['synthetic']),native,()=>false),/write/);assert.equal(erased,1);
});
