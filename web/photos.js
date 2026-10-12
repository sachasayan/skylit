'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const native = window.Skylit;
  const model = window.SkylitPhotoModel;
  const playback = window.SkylitPhotoPlayback, frame=window.SkylitFrameModel;
  let curated={},epoch='',showHidden=false,previousHidden=null,settingsPhoto='',migratedExclusions=false;
  try{const saved=JSON.parse(localStorage.getItem('skylit.photoChoices')||'{}');curated=saved.choices||{};epoch=saved.epoch||'';}catch(_){}
  const preferences=()=>{try{return frame.preferences(JSON.parse(localStorage.getItem('skylit.frame')||'{}'));}catch(_){return frame.preferences();}};
  const choice=photo=>curated[frame.photoId(photo)]||{favourite:false,hidden:false,fit:'auto',caption:''};
  function saveChoices(){try{localStorage.setItem('skylit.photoChoices',JSON.stringify({epoch,choices:curated}));return true;}catch(_){window.SkylitApp.notify('Could not save photo choices.');return false;}}


  const page = $('photos');
  const detailsRow=page.querySelector('.two-cards');
  const heroStatus=document.createElement('p');heroStatus.className='photo-hero-status';page.querySelector('.photo-copy').append(heroStatus);
  const photoSettingsButton=document.createElement('button');photoSettingsButton.className='secondary';photoSettingsButton.textContent='Photo settings';photoSettingsButton.id='photo-settings-open';page.querySelector('.page-heading').append(photoSettingsButton);
  const sourceKey = 'skylit.photoSource';
  let source = localStorage.getItem(sourceKey)==='email'?'email':'album';
  let state = model.normalize({});
  let interval=Number(localStorage.getItem('skylit.photoSpeed'))||30000,disconnectArmed=false;
  let style=playback.style(localStorage.getItem('skylit.photoStyle'));

  const workspace=document.createElement('div');workspace.className='photo-workspace';
  page.querySelector('.page-heading').after(workspace);

  const mailCard = document.createElement('article');
  mailCard.className = 'card photo-mail-card';
  mailCard.innerHTML = '<div class="photo-mail-head"><div><p class="eyebrow">PICTURES ON THIS FRAME</p><h2>Photo library</h2><p id="photo-mail-status" role="status"></p></div><div class="photo-mail-actions"><button class="primary" id="photo-play"><span data-icon="play"></span>Slideshow</button><button class="secondary" id="photo-check">Check now</button></div></div><button id="photo-undo" class="quiet" hidden>Undo exclusion</button><p id="photo-curation-status" class="photo-curation-status" role="status"></p><div class="photo-tiles" id="photo-tiles"></div><p class="subtle small">Tap a picture to browse and zoom. Saved pictures stay on this frame; messages stay in your inbox.</p>';
  workspace.append(mailCard);

  const settings = document.createElement('details');
  settings.className = 'card setting-block photo-settings';
  settings.innerHTML = '<summary>Photo settings <span aria-hidden="true">⌄</span></summary><div class="photo-settings-content"><p class="subtle small">Choose the source and how your slideshow looks. Email pictures use a dedicated Gmail account and an app password.</p><label for="photo-source">Photo source</label><select id="photo-source"><option value="album">Google Photos shared album</option><option value="email">Pictures on this frame</option></select><div id="photo-mail-setup"><label for="photo-email">Gmail address</label><input id="photo-email" type="email" inputmode="email" autocomplete="off" placeholder="Gmail address"><label for="photo-password">Google app password</label><input id="photo-password" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="16-character app password"><button id="photo-connect" class="secondary">Connect and check mail</button><p class="tiny">The app password is encrypted in Android’s private storage. Skylit never shows it again or includes it in backups.</p><div class="photo-options"><div><label for="photo-style">Slideshow style</label><select id="photo-style"><option value="fade">Soft fade</option><option value="stack">Falling prints</option><option value="collage">Photo collage</option><option value="gentle">Gentle pan &amp; zoom</option><option value="still">Still gallery</option></select></div><div><label for="photo-speed">Seconds per picture</label><select id="photo-speed"><option value="5">5</option><option value="8">8</option><option value="12">12</option><option value="20">20</option><option value="30">30</option><option value="60">1 minute</option><option value="300">5 minutes</option><option value="900">15 minutes</option></select></div><div><label for="photo-age">Keep pictures from</label><select id="photo-age"><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div><div><label for="photo-limit">Maximum pictures</label><select id="photo-limit"><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="40">40</option><option value="50">50</option><option value="100">100</option><option value="200">200</option></select></div></div><button id="photo-disconnect" class="quiet">Disconnect email and erase saved pictures</button><p id="photo-setup-status" class="small" role="status"></p></div></div>';
  workspace.append(settings);
  const presentation=document.createElement('div');presentation.className='photo-presentation';
  presentation.innerHTML='<h3>Slideshow</h3>';
  const optionFields=settings.querySelectorAll('.photo-options > div');
  presentation.append(optionFields[0],optionFields[1]);
  optionFields[2].innerHTML='<label for="photo-retention">Gallery retention</label><select id="photo-retention"><optgroup label="By received date"><option value="d7">Last 7 days</option><option value="d30">Last 30 days</option><option value="d90">Last 90 days</option><option value="d180">Last 180 days</option></optgroup><optgroup label="By photo count"><option value="n10">Last 10 photos</option><option value="n20">Last 20 photos</option><option value="n30">Last 30 photos</option><option value="n40">Last 40 photos</option><option value="n50">Last 50 photos</option><option value="n100">Last 100 photos</option><option value="n200">Last 200 photos</option></optgroup></select><p id="photo-retention-note" class="small subtle"></p>';
  optionFields[3].id='photo-limit-row';optionFields[3].querySelector('label').textContent='Maximum shown photos';
  settings.querySelector('.photo-settings-content').insertBefore(presentation,settings.querySelector('label[for="photo-source"]'));

  const visibility=document.createElement('details');visibility.id='photo-choices';visibility.className='photo-visibility-settings';visibility.innerHTML='<summary>Local picture choices</summary><p class="small subtle">Picture choices apply to pictures saved on this frame. They never delete email.</p><p id="photo-visibility" class="small subtle"></p><div id="photo-choice-editor"><label for="photo-choice-select">Picture</label><select id="photo-choice-select"></select><div class="photo-choice-fields"><img id="photo-choice-preview" alt="Selected picture"><div><button id="photo-favourite" class="secondary">Favourite</button><label class="cal-check"><input id="photo-hide" type="checkbox"> Exclude from gallery</label><label for="photo-fit">Picture framing</label><select id="photo-fit"><option value="contain">Fit · show the whole picture</option><option value="cover">Fill · crop to the frame</option></select><label for="photo-caption">Caption · on this frame</label><input id="photo-caption" maxlength="120" autocomplete="off"><p id="photo-received" class="small subtle"></p></div></div></div><label class="cal-check"><input id="photo-show-hidden" type="checkbox"> Show excluded pictures in the library</label><button id="photo-restore-hidden" class="secondary">Restore all excluded pictures</button>';settings.querySelector('.photo-settings-content').append(visibility);
  const overlay = document.createElement('div');
  overlay.id = 'photo-player';
  overlay.hidden = true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Photo slideshow');
  overlay.innerHTML = '<div class="photo-player-stage"><img class="photo-slide" alt="Picture from your email"><img class="photo-slide" alt="" aria-hidden="true"><div class="photo-collage" aria-hidden="true"><img alt=""><img alt=""><img alt=""></div></div><div class="photo-player-bar"><div class="photo-player-label"><strong id="photo-viewer-title">Family photos</strong><span id="photo-counter"></span></div><div class="photo-player-controls"><button id="photo-prev" aria-label="Previous picture">‹</button><button id="photo-pause" aria-label="Pause slideshow">Pause</button><button id="photo-zoom" aria-label="Zoom into picture">Zoom</button><button id="photo-next" aria-label="Next picture">›</button><button id="photo-close" aria-label="Close slideshow">Close</button></div></div><p id="photo-caption-display"></p><span id="photo-idle-hint">Touch to return to your dashboard</span>';
  document.body.append(overlay);
  const layers=overlay.querySelectorAll('.photo-slide');

  const controlPaths={previous:'M15 18l-6-6 6-6',next:'M9 18l6-6-6-6',play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',zoom:'M21 21l-5-5M10 7v6M7 10h6',fit:'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',close:'M6 6l12 12M18 6L6 18'};
  function control(id,name,label){const button=$(id);button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(name==='zoom'?'<circle cx="10" cy="10" r="7"/>':'')+'<path d="'+controlPaths[name]+'"/></svg>'+(id==='photo-play'?'<span>'+label+'</span>':'');button.setAttribute('aria-label',label==='Fit'?'Fit picture to screen':label==='Play'?'Play slideshow':label==='Pause'?'Pause slideshow':label+' picture');}
  control('photo-play','play','Slideshow');$('photo-play').setAttribute('aria-label','Start slideshow');control('photo-prev','previous','Previous');control('photo-next','next','Next');control('photo-close','close','Close');$('photo-close').setAttribute('aria-label','Close photo viewer');
  function paintChoice(){const select=$('photo-choice-select'),current=state.photos.find(p=>frame.photoId(p)===settingsPhoto)||state.photos[0];settingsPhoto=current?frame.photoId(current):'';select.replaceChildren();state.photos.forEach((photo,i)=>{const option=document.createElement('option');option.value=frame.photoId(photo);option.textContent='Picture '+(i+1)+(choice(photo).hidden?' · Excluded':'')+(choice(photo).favourite?' · Favourite':'');select.append(option);});select.value=settingsPhoto;$('photo-choice-editor').hidden=!current;if(!current){$('photo-choice-preview').removeAttribute('src');return;}const selected=choice(current);$('photo-choice-preview').src=current.url;$('photo-favourite').textContent=selected.favourite?'Unfavourite':'Favourite';$('photo-favourite').setAttribute('aria-pressed',String(selected.favourite));$('photo-hide').checked=selected.hidden;$('photo-fit').value=selected.fit;if(document.activeElement!==$('photo-caption'))$('photo-caption').value=selected.caption;$('photo-received').textContent=current.at?'Received '+new Date(current.at).toLocaleDateString(undefined,{timeZone:window.SkylitApp.calendarPreferences().timezone}):'Received date unavailable';}

  function selectedSource(){return source;}
  function setSource(value){if(value!=='album'&&value!=='email')return;source=value;localStorage.setItem(sourceKey,source);if(native&&native.photoSource)native.photoSource(source);render();}
  function receive(raw){let next=model.normalize(raw);
    // Current native rules win over a status callback queued before an exclusion.
    if(native&&native.photoExclude&&native.photoStatus)next=model.normalize(native.photoStatus());
    if(epoch&&next.epoch&&epoch!==next.epoch){curated={};migratedExclusions=true;}
    if(!migratedExclusions&&native&&native.photoExclude){for(const [id,entry] of Object.entries(curated))if(/^[a-f0-9]{64}$/.test(id)&&entry.hidden&&!next.excluded.includes(id))native.photoExclude(id,true);next=model.normalize(native.photoStatus());migratedExclusions=true;}
    state=next;epoch=state.epoch||epoch;curated=frame.curation(curated,state.photos);
    if(native&&native.photoExclude){const excluded=new Set(state.excluded);for(const photo of state.photos){const id=frame.photoId(photo);if(excluded.has(id)||curated[id])curated[id]=Object.assign({},choice(photo),{hidden:excluded.has(id)});}}
    saveChoices();render();if(window.SkylitLibrary)window.SkylitLibrary.receive(state,curated);if(window.SkylitPlayer)window.SkylitPlayer.receive(state,curated);window.dispatchEvent(new Event('skylit-service-status'));}
  function refresh(){if(!native||!native.photoStatus)return;try{receive(native.photoStatus());}catch(e){$('photo-mail-status').textContent='Could not read the photo status from this frame.';}}
  function renderOverviewPhotos(){
    const items=source==='email'?frame.overviewPictures(state.photos,curated,preferences()):[];
    const button=$('overview-photos'),host=$('overview-photo-stack');
    button.hidden=!items.length;
    document.querySelector('.overview-grid').classList.toggle('with-photos',items.length>0);
    host.replaceChildren();
    items.forEach((photo,i)=>{const image=document.createElement('img');image.src=photo.url;image.alt='';image.style.setProperty('--photo-angle',playback.angle(i)+'deg');host.append(image)});
  }
  function render(){
    const album=source==='album';
    $('photo-source').value=source;
    $('photo-mail-setup').hidden=source!=='email';
    workspace.hidden=album;
    page.querySelector('.photo-feature').hidden=!album;
    detailsRow.hidden=!album;
    const timezone=window.SkylitApp.calendarPreferences().timezone;
    $('photo-mail-status').textContent=native?model.caption(state,timezone):'Email photo delivery is available in the Android frame app.';
    $('photo-check').disabled=!native||!state.connected||state.busy;
    $('photo-play').disabled=window.SkylitLibrary?!window.SkylitLibrary.playlist().length:!frame.pictures(state.photos,curated,preferences()).length;
    if(document.activeElement!==$('photo-email'))$('photo-email').value='';
    const retention=(state.days?'d'+state.days:'n'+state.maximum);if(!Array.from($('photo-retention').options).some(o=>o.value===retention)){const option=document.createElement('option');option.value=retention;option.textContent='Last '+state.maximum+' photos';$('photo-retention').append(option);}$('photo-retention').value=retention;$('photo-limit-row').hidden=state.days===0;$('photo-retention-note').textContent=state.days?'Uses the email received date, up to the capacity below. Reducing retention removes older cached pictures.':'Newest non-excluded pictures, regardless of age. Check now to refresh the gallery.';
    $('photo-limit').value=String(state.maximum);
    $('photo-speed').value=String(interval/1000);
    $('photo-style').value=style;
    $('photo-disconnect').hidden=!state.connected;
    const tiles=$('photo-tiles');const scroll=window.scrollY;tiles.replaceChildren();
    if(!state.photos.length){const empty=document.createElement('p');empty.className='photo-empty';empty.textContent=state.connected?'No pictures saved yet. Tap Check now after sending one to your inbox.':'Import pictures or connect a dedicated inbox in Photo settings to start your library.';tiles.append(empty)}
    const visible=state.photos.filter(photo=>!photo.pending&&(showHidden||!choice(photo).hidden));
    if(state.photos.length&&!visible.length){const empty=document.createElement('p');empty.className='photo-empty';empty.textContent='All saved pictures are excluded. Restore them in Photo settings or check for new pictures.';tiles.append(empty);}
    visible.forEach((photo,i)=>{const card=document.createElement('div');card.className='photo-tile-card';const button=document.createElement('button');button.type='button';button.className='photo-tile';button.dataset.photoId=frame.photoId(photo)||'';button.setAttribute('aria-label','Open picture '+(i+1)+(choice(photo).favourite?' · Favourite':'')+(choice(photo).hidden?' · Excluded':''));button.classList.toggle('is-hidden',choice(photo).hidden);if(choice(photo).favourite){const badge=document.createElement('span');badge.textContent='★';badge.className='photo-favourite-badge';button.append(badge);}const image=document.createElement('img');image.src=photo.url;image.alt='';image.loading='lazy';button.append(image);button.onclick=()=>{if(native&&native.photoBrowse)native.photoBrowse(state.photos.indexOf(photo));else open(false,state.photos.indexOf(photo),false)};
      const exclude=document.createElement('button');exclude.type='button';exclude.className='photo-exclude';exclude.dataset.photoId=frame.photoId(photo);exclude.setAttribute('aria-label',(choice(photo).hidden?'Restore':'Exclude')+' picture '+(i+1)+(choice(photo).hidden?'':' from gallery'));exclude.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(choice(photo).hidden?'M3 10h6M3 10V4M3 10a9 9 0 1 1 1 9':'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7')+'"/></svg>';
      exclude.onclick=()=>{if(!updateChoice(frame.photoId(photo),{hidden:!choice(photo).hidden}))return;const remaining=Array.from(tiles.querySelectorAll('.photo-exclude'));(remaining[Math.min(i,remaining.length-1)]||$('photo-undo')).focus({preventScroll:true});};card.append(button,exclude);tiles.append(card);
    });
    renderOverviewPhotos();paintChoice();if(scroll)window.scrollTo(0,scroll);const visibility=$('photo-visibility');if(visibility)visibility.textContent=(native&&native.photoExclude?state.excluded.length:state.photos.filter(p=>choice(p).hidden).length)+' excluded · Checks and retention pruning keep exclusions. Restore to allow import again. Email is never deleted.';
    const headline=page.querySelector('.photo-copy .eyebrow'),title=page.querySelector('.photo-copy h2'),description=page.querySelector('.photo-copy p:not(.eyebrow)');
    headline.textContent=album?'YOUR SHARED GOOGLE PHOTOS ALBUM':'PICTURES ON THIS FRAME';
    title.textContent=album?'Shared album':'Recent photos';
    description.textContent=album?'Play your Google Photos album full screen.':'A private slideshow of recent and kept pictures stored on this frame.';
    heroStatus.textContent=album||state.photos.length?'':model.caption(state,timezone);
    const action=album?'Start slideshow':state.photos.length?'Start slideshow':state.connected?'Check for photos':'Set up email photos';
    const actionButton=$('start-photos');Array.from(actionButton.childNodes).filter(n=>n.nodeType===3).forEach(n=>n.remove());actionButton.append(document.createTextNode(action));const playIcon=actionButton.querySelector('svg');if(playIcon)playIcon.style.display=action==='Start slideshow'?'':'none';
    page.querySelector('.photo-copy .quiet').textContent=album?'Album and timing settings →':'Delivery settings →';
    $('album-status').textContent=album?($('album-url').value?'Your shared album is ready to open.':'Add a shared album link in Settings to get started.'):(state.photos.length?state.photos.length+' pictures are ready to play.':'No saved pictures yet. Connect an account and check mail.');
    const details=page.querySelectorAll('.detail');
    if(details[1]){details[1].querySelector('h3').textContent=album?'One shared album':'Private photo cache';details[1].querySelector('.subtle').textContent=album?'Uses Google’s slideshow. Skylit stores no copies.':'Old pictures are removed automatically. Only resized pictures are saved, without email contents or image metadata.';}
  }
  function open(asIdle,start=0,autoplay=true){return window.SkylitPlayer?window.SkylitPlayer.open(asIdle,start,autoplay):false;}
  function close(){if(window.SkylitPlayer)window.SkylitPlayer.close();}
  window.SkylitPhotos={open,close,receive,refresh,selectedSource,setSource,health:()=>({configured:state.connected,updated:state.lastSync,busy:state.busy,error:!!state.error,count:state.photos.length,imported:state.imported,skipped:state.skipped}),updateChoices,isOpen:()=>!!(window.SkylitPlayer&&window.SkylitPlayer.isOpen()),snapshot:()=>({state,curated,showHidden}),updateChoice,selectedPicture:()=>settingsPhoto,selectPicture:id=>{if(state.photos.some(photo=>frame.photoId(photo)===id))settingsPhoto=id;paintChoice();},render};
  $('photo-source').onchange=()=>setSource($('photo-source').value);
  $('overview-photos').onclick=()=>window.SkylitApp.go('photos');
  $('photo-play').onclick=()=>{if(native&&native.photoOpen)native.photoOpen(false);else open(false)};
  function openSettings(){if(window.SkylitApp.openSettings)window.SkylitApp.openSettings('photos','photos');else {window.SkylitApp.go('settings');settings.open=true;settings.scrollIntoView();}}
  photoSettingsButton.onclick=openSettings;page.querySelector('.photo-copy .quiet').onclick=openSettings;
  $('photo-check').onclick=()=>{if(native&&native.photoRefresh){native.photoRefresh();$('photo-setup-status').textContent='Checking mail…';setTimeout(refresh,300)}};
  $('photo-connect').onclick=()=>{if(!native||!native.photoConnect){$('photo-setup-status').textContent='Connect from the Android frame.';return;}const email=$('photo-email').value.trim(),password=$('photo-password').value;$('photo-password').value='';if(!native.photoConnect(email,password)){$('photo-setup-status').textContent='Use a Gmail address and its 16-character app password. Wait for any current check to finish.';return;}$('photo-setup-status').textContent='Connection saved. Checking mail…';setSource('email');refresh();};
  function configureRetention(){const value=$('photo-retention').value,count=value.startsWith('n'),days=count?0:Number(value.slice(1)),maximum=count?Number(value.slice(1)):Number($('photo-limit').value);if(native&&native.photoConfigure&&native.photoConfigure(days,maximum)){$('photo-setup-status').textContent='Gallery retention saved. Check now to refill if needed.';refresh();}else{$('photo-setup-status').textContent='Could not save retention on this frame.';render();}}
  $('photo-retention').onchange=configureRetention;$('photo-limit').onchange=configureRetention;
  $('photo-style').onchange=()=>{style=playback.style($('photo-style').value);localStorage.setItem('skylit.photoStyle',style);if(window.SkylitLibrary)window.SkylitLibrary.setOptions({style});};
  $('photo-speed').onchange=()=>{interval=Number($('photo-speed').value)*1000;localStorage.setItem('skylit.photoSpeed',String(interval));if(window.SkylitLibrary)window.SkylitLibrary.setOptions({duration:interval/1000})};
  const savedSpeed=Number(localStorage.getItem('skylit.photoSpeed'));if([5000,8000,12000,20000,30000,60000,300000,900000].includes(savedSpeed))interval=savedSpeed;
  $('photo-disconnect').onclick=()=>{if(!disconnectArmed){disconnectArmed=true;$('photo-disconnect').textContent='Tap again to erase the photo cache';setTimeout(()=>{disconnectArmed=false;$('photo-disconnect').textContent='Disconnect email and erase saved pictures'},8000);return;}disconnectArmed=false;if(native&&native.photoDisconnect&&native.photoDisconnect()){$('photo-setup-status').textContent='Email disconnected. Saved pictures erased.';refresh();}else $('photo-setup-status').textContent='Wait for the current mail check to finish, then try again.';};
  function updateChoice(id,update){if(!id)return false;const photo=state.photos.find(p=>frame.photoId(p)===id),current=photo?choice(photo):curated[id]||{};
    if(typeof update.hidden==='boolean'&&native&&native.photoExclude&&!native.photoExclude(id,update.hidden)){window.SkylitApp.notify('Could not save the exclusion. Restore old exclusions in Photo settings if the list is full.');return false;}
    const before=curated[id];curated[id]=Object.assign({},current,update);
    if(!current.hidden&&update.hidden){previousHidden=id;$('photo-undo').hidden=false;$('photo-curation-status').textContent='Excluded from this frame. Undo here or restore in Photo settings.';}
    if(!saveChoices()){if(before)curated[id]=before;else delete curated[id];return false;}refresh();render();return true;
  }
  function updateChoices(updates){const keys=Object.keys(updates);if(!keys.length||keys.length>300||keys.some(id=>!state.photos.some(photo=>frame.photoId(photo)===id)))return false;
    const excluded=keys.filter(id=>typeof updates[id].hidden==='boolean'),before=Object.assign({},curated);
    if(excluded.length&&native&&native.photoExcludeMany){const hide=updates[excluded[0]].hidden;if(excluded.some(id=>updates[id].hidden!==hide)||!native.photoExcludeMany(JSON.stringify(excluded),hide)){window.SkylitApp.notify('Could not save exclusions.');return false;}}
    else if(excluded.length&&native&&native.photoExclude)return false;
    for(const id of keys)curated[id]=Object.assign({},curated[id]||{},updates[id]);if(!saveChoices()){curated=before;refresh();return false;}refresh();render();return true;
  }
  function editChoice(update){return updateChoice(settingsPhoto,update);}
  $('photo-choice-select').onchange=()=>{settingsPhoto=$('photo-choice-select').value;paintChoice();};
  $('photo-favourite').onclick=()=>{const photo=state.photos.find(p=>frame.photoId(p)===settingsPhoto);if(photo)editChoice({favourite:!choice(photo).favourite});};
  $('photo-fit').onchange=()=>editChoice({fit:$('photo-fit').value});
  $('photo-caption').onchange=()=>editChoice({caption:$('photo-caption').value.slice(0,120)});
  $('photo-hide').onchange=()=>editChoice({hidden:$('photo-hide').checked});
  $('photo-undo').onclick=()=>{if(previousHidden&&!updateChoice(previousHidden,{hidden:false}))return;$('photo-undo').hidden=true;previousHidden=null;$('photo-curation-status').textContent='Exclusion undone. Check now if the picture is no longer cached.';};
  $('photo-show-hidden').onchange=()=>{showHidden=$('photo-show-hidden').checked;render();};
  $('photo-restore-hidden').onclick=()=>{if(native&&native.photoRestoreExcluded&&!native.photoRestoreExcluded()){window.SkylitApp.notify('Could not restore exclusions.');return;}Object.values(curated).forEach(x=>x.hidden=false);saveChoices();refresh();render();$('photo-undo').hidden=true;previousHidden=null;$('photo-curation-status').textContent='Exclusions restored. Check now to reload pictures no longer cached.';};

  $('start-photos').onclick=()=>{if(source==='email'){if(!state.connected&&!state.photos.length){page.querySelector('.photo-copy .quiet').click();return;}if(!state.photos.length){$('photo-check').click();return;}if(native&&native.photoOpen)native.photoOpen(false);else open(false)}else if(!$('album-url').value)page.querySelector('.photo-copy .quiet').click();else if(native)native.openPhotos($('album-url').value,false);else window.open($('album-url').value,'_blank','noopener')};
  $('test-idle').onclick=()=>{if(source==='email'){if(native&&native.photoOpen)native.photoOpen(true);else open(true)}else if(native)native.openPhotos($('album-url').value,true);else if($('album-url').value)window.open($('album-url').value,'_blank','noopener')};
  if(native&&native.photoSource)native.photoSource(source);
  refresh();render();
  window.addEventListener('skylit-preferences',render);window.addEventListener('skylit-display',()=>{render();if(window.SkylitPlayer)window.SkylitPlayer.preferencesChanged();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
