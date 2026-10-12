/* Palettes and solar decisions shared by the UI and dependency-free unit tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./suncalc.js'));else root.SkylitAppearance=factory(root.SunCalc);})(typeof globalThis==='object'?globalThis:this,function(SunCalc){
'use strict';
const palettes={
 linen:{name:'Linen',light:['#eee8dd','#faf7f0','#e4dccd','#352e28','#74695e','#d8cfbf','#9a513b','#fff9f0','#ead0b5'],dark:['#241f1c','#332d28','#1c1917','#f2e7d5','#bdad98','#51463b','#e7b487','#2c2018','#554437']},
 sage:{name:'Sage',light:['#e4e8dd','#f6f5ec','#d5ddce','#303b31','#64705f','#c7d0bf','#526747','#fffbee','#dde2ca'],dark:['#1d261e','#29352a','#172019','#e4ebd8','#a8b69f','#46523f','#adc68d','#1c2c17','#3a4934']},
 stone:{name:'Stone',light:['#e8e6e1','#faf9f6','#ddd9d2','#383b37','#6c7068','#d0d0c9','#5c6865','#faf8f2','#d6dfdc'],dark:['#202423','#2b302e','#191d1c','#e5e5dc','#adb4aa','#48514a','#b1c5bd','#20342b','#3a4741']},
 ocean:{name:'Ocean',light:['#e4ebed','#f5fafb','#d5e0e3','#344650','#657b84','#c5d4d9','#44758a','#f5fafb','#d5e3e8'],dark:['#1b272d','#27353d','#142128','#deebee','#a0b6c0','#435863','#95c1d1','#18343f','#354c59']},
 plum:{name:'Plum',light:['#ede4e8','#fcf6f8','#e3d5dc','#493643','#806b79','#d7c8d1','#8b5779','#fff7fb','#e7d4df'],dark:['#2a2029','#382d36','#201820','#ecdee7','#bca4b3','#574352','#cc9cbb','#3b2233','#513b4c']},
 contrast:{name:'High contrast',light:['#f2efe7','#ffffff','#e3dfd4','#171714','#39392f','#6f7062','#353e29','#ffffff','#d5dfc7'],dark:['#101310','#191e19','#080b08','#ffffff','#e0e8db','#9aa994','#d1eba9','#17220c','#34452a']}
};
const keys=['bg','panel','rail','ink','muted','line','accent','accent-ink','soft'];
function normalize(theme,mode){const legacy=theme==='cocoa';return {theme:legacy?'linen':palettes[theme]?theme:'linen',mode:['light','dark','auto'].includes(mode)?mode:legacy?'dark':'auto'};}
function tokens(theme,mode){const p=palettes[theme]||palettes.linen,t=Object.fromEntries(keys.map((key,i)=>[key,p[mode==='dark'?'dark':'light'][i]]));return {...t,'clock-leaf':theme==='linen'?(mode==='dark'?'#b6bc93':'#70764c'):t.accent,'clock-tile':theme==='linen'?(mode==='dark'?'#454b34':'#73764f'):t.ink,'clock-paper':t.panel};}
function resolve(mode,city,now=new Date(),systemDark=false){
 if(mode==='light'||mode==='dark')return {mode,reason:'manual'};
 const lat=city&&city.latitude,lon=city&&city.longitude;
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return {mode:systemDark?'dark':'light',reason:'system'};
 // SunCalc 1.9 uses radians. The standard sunrise/sunset horizon is -0.833°.
 const dark=SunCalc.getPosition(now,lat,lon).altitude<-.833*Math.PI/180;
 const candidates=[];
 for(let offset=-1;offset<=2;offset++){
  const t=SunCalc.getTimes(new Date(+now+offset*86400000),lat,lon);
  for(const kind of ['sunrise','sunset'])if(Number.isFinite(+t[kind])&&+t[kind]>+now)candidates.push({kind,at:+t[kind]});
 }
 candidates.sort((a,b)=>a.at-b.at);
 return {mode:dark?'dark':'light',reason:'sun',next:candidates[0]||null};
}
function displayTokens(profile){return {'ui-scale':profile==='large'?'1.15':'1'};}
return {palettes,normalize,tokens,resolve,displayTokens};
});
