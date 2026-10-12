const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const pairing=require('../web/phone-pairing.js'),qr=require('../web/qrcode.js');
test('QR invitation only accepts temporary private-network HTTPS destinations',()=>{
 const ticket='a'.repeat(64);for(const host of ['10.0.0.1','192.168.50.10','172.16.0.5','172.31.255.254'])assert.equal(pairing.invitation('https://'+host+':49152/#pair='+ticket),true);
 for(const url of ['http://192.168.1.2:443/#pair='+ticket,'https://example.com:49152/#pair='+ticket,'https://172.32.1.2:49152/#pair='+ticket,'https://192.168.1.2:49152/?pair='+ticket,'https://u:p@192.168.1.2:49152/#pair='+ticket,'https://192.168.1.2:49152/#pair=short'])assert.equal(pairing.invitation(url),false);
});
test('Pinned QR generator encodes full invitation with four-module quiet margin',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(require.resolve('../web/qrcode.js'))).digest('hex'),'18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780');
 const value='https://192.168.50.10:49152/#pair='+'a'.repeat(64),code=qr(0,'M');code.addData(value,'Byte');code.make();assert.ok(code.getModuleCount()>=21);assert.ok(code.isDark(0,0));
 // Verify the actual renderer reserves the quiet border and draws the matrix locally.
 globalThis.qrcode=qr;let rectangles=[];const node={setAttribute(){},getContext(){return {set fillStyle(v){this.colour=v},fillRect(...r){rectangles.push({colour:this.colour,r})}}}};
 assert.equal(pairing.canvas(value,{createElement(){return node}}),node);assert.equal(node.width,(code.getModuleCount()+8)*6);assert.equal(rectangles[0].colour,'#fff');assert.ok(rectangles.slice(1).every(({r})=>r[0]>=24&&r[1]>=24&&r[0]<node.width-24&&r[1]<node.height-24));
});
