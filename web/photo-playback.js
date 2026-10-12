'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitPhotoPlayback=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const styles=['fade','stack','collage','gentle','still'];
  function style(value){return styles.includes(value)?value:'fade';}
  function collage(index,count){if(!Number.isInteger(count)||count<1)return [];return Array.from({length:Math.min(3,count)},(_,offset)=>(index+offset)%count);}
  function angle(index){return [-5,4,-3,6,-2][Math.abs(index)%5];}
  return {styles,style,collage,angle};
});
