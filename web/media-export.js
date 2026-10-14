/* Bounded transfer with backpressure: native I/O never holds the WebView thread. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitMediaExport=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 async function save(blob,native,cancelled){
  let id='';const deadline=Date.now()+180000;
  const check=()=>{if(cancelled())throw Error('Export cancelled. No video saved.');if(Date.now()>deadline)throw Error('Saving the export timed out.');};
  async function wait(expected){for(;;){await new Promise(resolve=>setTimeout(resolve,16));check();const status=native.mediaExportStatus(id);if(status===expected)return;if(status!=='pending')throw Error('Could not write the export.');}}
  try{check();id=native.mediaExportBegin();if(!id)throw Error('Could not start the export.');
   for(let offset=0;offset<blob.size;offset+=32768){check();const bytes=new Uint8Array(await blob.slice(offset,offset+32768).arrayBuffer());check();let binary='';for(const value of bytes)binary+=String.fromCharCode(value);if(!native.mediaExportWrite(id,btoa(binary)))throw Error('Could not write the export.');await wait('ready');}
   check();if(!native.mediaExportFinish(id))throw Error('Could not save the export.');await wait('done');return 'Saved video in Downloads.';
  }catch(error){if(id)native.mediaExportCancel();throw error;}
 }
 return {save};
});
