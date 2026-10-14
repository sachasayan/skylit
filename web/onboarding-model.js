(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitOnboardingModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>({
 shouldOpen:(stored,personal,done,route)=>!stored&&!personal&&!done&&!route,
 progress:(city,album,email,calendars,received=0,refreshed=0)=>({city:city?'City set':'City needed',photos:received>0?'Picture received · Check playback on frame':email?'Configured · Send a test picture':album?'Album configured · Open to verify playback':'Choose a photo source',calendar:refreshed>0?'Calendar refreshed · Check your events':calendars>0?`${calendars} calendar${calendars===1?'':'s'} added`:'Optional · no calendar added'})
}));
