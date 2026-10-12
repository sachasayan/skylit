'use strict';
/* Local QR rendering. The address/secret never goes to an external QR service. */
(function(root){
  function invitation(value){
    if(typeof value!=='string'||value.length>180)return false;
    try{const url=new URL(value),parts=url.hostname.split('.').map(Number);return url.protocol==='https:'&&!url.username&&!url.password&&parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31)&&/^\d+$/.test(url.port)&&Number(url.port)>0&&Number(url.port)<=65535&&url.pathname==='/'&&!url.search&&/^#pair=[a-f0-9]{64}$/.test(url.hash);}catch(_){return false;}
  }
  function canvas(value,document){
    if(!invitation(value))throw Error('Invalid local invitation');
    const code=root.qrcode(0,'M');code.addData(value,'Byte');code.make();
    const count=code.getModuleCount(),scale=6,node=document.createElement('canvas');node.width=node.height=(count+8)*scale;node.className='phone-pair-qr';node.setAttribute('role','img');node.setAttribute('aria-label','Scan to request photo access on this frame');const context=node.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,node.width,node.height);context.fillStyle='#000';for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(code.isDark(y,x))context.fillRect((x+4)*scale,(y+4)*scale,scale,scale);return node;
  }
  const api={invitation,canvas};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkylitPhonePairing=api;
})(typeof window==='undefined'?globalThis:window);
