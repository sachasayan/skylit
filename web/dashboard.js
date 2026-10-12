'use strict';
(() => {
  const $=id=>document.getElementById(id),model=window.SkylitDashboardModel,app=window.SkylitApp;
  const key='skylit.dashboard',grid=document.querySelector('.overview-grid'),panel=$('settings-dashboard-panel');
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const legacy=()=>{try{return SkylitFrameModel.preferences(JSON.parse(localStorage.getItem('skylit.frame')||'{}'));}catch(_){return {};}};
  let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch(_){}
  let saved=model.normalize(raw,legacy()),draft=model.copy(saved),selected=draft.modules[0]?.type,history=[],drag=null,ignoreClick=false,scrollFrame=0;
  const wrappers=new Map(),originals=new Map([
    ['clock',document.querySelector('.overview-heading')],['weather',document.querySelector('.overview-weather')],
    ['photos',$('overview-photos')],['plans',document.querySelector('.overview-plans')]
  ]);
  grid.classList.add('dashboard-grid');
  for(const definition of model.catalog){
    const wrapper=node('section','dashboard-module');wrapper.dataset.module=definition.type;wrapper.setAttribute('aria-label',definition.name);
    if(originals.has(definition.type))wrapper.append(originals.get(definition.type));
    else {
      wrapper.classList.add('card','dashboard-utility');const heading=node('div','section-title'),title=node('h2',null,definition.name),action=node('button','quiet');
      action.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
      action.setAttribute('aria-label',definition.type==='forecast'?'Open full weather forecast':'Manage '+definition.name.toLowerCase());
      action.onclick=()=>definition.type==='forecast'?app.go('weather'):definition.type==='note'||definition.type==='countdowns'?app.openSettings('household','overview'):app.go('household');
      heading.append(title,action);wrapper.append(heading,node('div','dashboard-module-content'));
    }
    wrapper.hidden=true;wrappers.set(definition.type,wrapper);grid.append(wrapper);
  }
  const clockVisual=SkylitClock.create(document);originals.get('clock').prepend(clockVisual.root);
  let clockSample=null,sampleVisual=null;
  function sizeClock(host,w,h,chosen,data){
    const ui=Number(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'))||1,ratio=w/h,strip=ratio>3.7,portrait=ratio<.8,small=w<300||h<170;
    host.dataset.clockStyle=chosen;host.dataset.composition=strip?'strip':portrait?'portrait':ratio>2.15?'wide':'balanced';host.dataset.small=String(small);
    const pad=Math.max(h<120?8:small?10:12,Math.min(38,Math.min(w,h)*.075)),date=Math.min(32,Math.max(14,Math.min(w*.035,h*.055)*ui)),period=Math.min(31,Math.max(14,Math.min(w*.04,h*.055)*ui)),gap=Math.max(4,Math.min(22,h*.035));
    const set=(key,value)=>host.style.setProperty('--'+key,value+'px');set('clock-pad',pad);set('clock-date-size',date);set('clock-period-size',period);set('clock-gap',gap);
    const sideScene=strip||(chosen==='classic'&&ratio>2.15),scene=sideScene?h:portrait?h*.42:Math.min(h*(small?.26:.32),w*.36);set('module-landscape',scene);SkylitClock.composeLandscape(host.querySelector('.clock-landscape'),sideScene?w*.54:portrait?w*1.6:w,scene);
    // Measure the exact lining/tabular glyphs used by CSS. Canvas's default
    // OpenType numerals have different advances and can under-estimate the time.
    if(!sizeClock.measure){const m=node('span','clock-font-measure');m.setAttribute('aria-hidden','true');m.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;white-space:nowrap;font:500 100px "Skylit Serif",Georgia;letter-spacing:-2.5px;font-feature-settings:"lnum" 1,"tnum" 1;pointer-events:none';document.body.append(m);sizeClock.measure=m;}
    sizeClock.measure.textContent=data.hourText+':'+data.minuteText;const glyphWidth=sizeClock.measure.getBoundingClientRect().width/100;
    const inlinePeriod=strip||(small&&!portrait),dateLines=chosen==='digital'&&!inlinePeriod?2:1,periodHeight=data.period?period*1.2:0;
    let availableWidth=w-2*pad,availableHeight=h-2*pad-date*1.4*dateLines-gap-(inlinePeriod?0:periodHeight+gap);
    if(chosen==='classic'){if(sideScene){availableWidth=w*.46-pad*2;}else availableHeight-=scene;}
    if(chosen==='digital'){availableWidth=w*(small?.76:portrait?.87:.68)-pad;if(strip){availableWidth=w*.54-pad*2;availableHeight=h-pad*2;}else if(portrait)availableHeight=Math.min(availableHeight,h*.36);}
    set('module-clock',Math.max(24,Math.min(availableWidth/(glyphWidth+(inlinePeriod&&data.period?.45:0)),availableHeight/.92)));
    const side=ratio>2.4;host.dataset.sideDate=String(side);
    const dial=Math.max(44,Math.min(side?w*.55:w-pad*2,h-pad*2-(side?0:date*1.5+gap)));set('module-dial',dial);set('dial-x',side?Math.max(pad,(w-dial-w*.29)/2):(w-dial)/2);set('dial-y',(h-dial-(side?0:date*1.5+gap))/2);
    const plant=small?'sprig':'full';host.dataset.ornament=plant;
    let tilesWidth=(w-pad*2-(small?0:w*.12))/2.91,tilesHeight=(h-pad*2-date*1.4-periodHeight-(data.period?5:0)-gap)/(data.period?1.65:1.55);
    if(portrait){tilesWidth=(w-pad*2)/1.4;tilesHeight=(h-pad*2-date*1.4-periodHeight-(data.period?5:0)-gap)/(data.period?3.3:3.2);}
    if(strip){tilesWidth=(w*.43-pad)/2.91;tilesHeight=(h-pad*2-periodHeight-(data.period?5:0))/(data.period?1.65:1.55);}
    set('module-stack',Math.max(24,Math.min(tilesWidth,tilesHeight)));set('flip-plant',Math.min(w*.20,h*.45));set('flip-side',small||strip?0:w*.12);
  }
  function paintDate(host,data){
    const date=host.querySelector('.clock-date');date.setAttribute('aria-label',data.date);date.replaceChildren(node('span','clock-weekday',data.date.split(', ')[0]),node('span','clock-date-separator',', '),node('span','clock-monthday',data.date.split(', ').slice(1).join(', ')));
  }
  originals.get('clock').classList.add('clock-frame');$('clock').classList.add('clock-time');$('date').classList.add('clock-date');
  let clockData=null;
  function paintClock(instant=Date.now()){
    const prefs=app.calendarPreferences(),data=SkylitClock.read(instant,prefs.timezone,prefs.clock),style=SkylitClock.style(saved.modules.find(item=>item.type==='clock')?.style);clockData=data;
    wrappers.get('clock').dataset.clockStyle=style;clockVisual.update(style,data);paintDate(originals.get('clock'),data);$('clock-period').textContent=data.period.replace(/[.\s]/g,'').toUpperCase();
    if(clockSample){const choice=SkylitClock.style(draft.modules.find(item=>item.type==='clock')?.style);clockSample.dataset.clockStyle=choice;sampleVisual.update(choice,data);clockSample.querySelector('.clock-sample-digits').textContent=data.hourText+':'+data.minuteText;clockSample.querySelector('.clock-sample-period').textContent=data.period.replace(/[.\s]/g,'').toUpperCase();paintDate(clockSample,data);clockSample.setAttribute('aria-label',choice+' clock preview: '+data.label+', '+data.date);}
    sizeModules();
  }
  window.addEventListener('skylit-clock',e=>paintClock(e.detail.instant));
  const photoEmpty=node('button','dashboard-photo-empty');photoEmpty.textContent='Choose photos';photoEmpty.onclick=()=>app.openSettings('photos','overview');wrappers.get('photos').append(photoEmpty);
  const empty=node('div','dashboard-empty');empty.append(node('h2',null,'Your dashboard is empty'));const configure=node('button','secondary','Choose modules');configure.onclick=()=>app.openSettings('dashboard','overview');empty.append(configure);grid.append(empty);
  function position(n,item){n.style.gridColumn=(item.x+1)+' / span '+item.w;n.style.gridRow=(item.y+1)+' / span '+item.h;}
  function applyLayout(){
    for(const [type,n] of wrappers){const item=saved.modules.find(item=>item.type===type);n.hidden=!item;if(item)position(n,item);}
    // Match reading and keyboard order to the visible arrangement.
    saved.modules.slice().sort((a,b)=>a.y-b.y||a.x-b.x).forEach(item=>grid.append(wrappers.get(item.type)));
    empty.hidden=!!saved.modules.length;paintClock();sizeModules();renderUtilities();
  }
  function sizeModules(){
    for(const [type,n] of wrappers){if(n.hidden)continue;const rect=n.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)continue;
      n.dataset.density=w<340||h<220?'compact':'regular';n.dataset.short=String(h<280);n.dataset.narrow=String(w<340);
      if(type==='clock'&&clockData)sizeClock(originals.get('clock'),w,h,n.dataset.clockStyle,clockData);
      n.style.setProperty('--module-temperature',Math.max(36,Math.min(100,w*.17,h*.28))+'px');
    }
    if(clockSample&&clockData){const r=clockSample.getBoundingClientRect();if(r.width&&r.height)sizeClock(clockSample,r.width,r.height,clockSample.dataset.clockStyle,clockData);}
  }
  if(document.fonts)document.fonts.ready.then(sizeModules);
  const observer=new ResizeObserver(sizeModules);wrappers.forEach(n=>observer.observe(n));
  new MutationObserver(()=>{photoEmpty.hidden=!$('overview-photos').hidden;}).observe($('overview-photos'),{attributes:true,attributeFilter:['hidden']});
  photoEmpty.hidden=!$('overview-photos').hidden;
  function renderForecast(){
    const host=wrappers.get('forecast').querySelector('.dashboard-module-content');host.replaceChildren();
    const hours=Array.from($('hourly').children).slice(0,6),list=node('div','dashboard-hours');
    hours.forEach(hour=>list.append(hour.cloneNode(true)));host.append(list);
    const status=app.status();if(status.weatherError||!navigator.onLine)host.append(node('p','small subtle','Saved forecast · Open Weather for its fetched time.'));
  }
  new MutationObserver(renderForecast).observe($('hourly'),{childList:true,subtree:true,characterData:true});
  new MutationObserver(renderForecast).observe($('weather-status'),{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  const today=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:app.calendarPreferences().timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),get=key=>parts.find(p=>p.type===key).value;return get('year')+'-'+get('month')+'-'+get('day');};
  let renderedDay=today();
  function renderUtilities(){
    renderedDay=today();const house=app.householdState();
    for(const type of ['note','shopping','countdowns','timers']){
      const host=wrappers.get(type).querySelector('.dashboard-module-content');host.replaceChildren();
      if(type==='note')host.append(node('p','dashboard-note',house.note||'Add a pinned note in Household settings.'));
      if(type==='shopping'){
        const items=house.shopping.filter(item=>!item.done);
        if(!items.length)host.append(node('p','subtle',house.shopping.length?'Everything is checked off.':'Add items in Household.'));
        items.forEach(item=>{const button=node('button','dashboard-shopping');button.setAttribute('aria-label','Check off '+item.text);button.append(node('span',null,'○'),node('span',null,item.text));button.onclick=()=>{app.toggleShopping(item.id);const next=host.querySelector('button')||wrappers.get(type).querySelector('.quiet');next.focus({preventScroll:true});};host.append(button);});
      }
      if(type==='countdowns'){
        if(!house.countdowns.length)host.append(node('p','subtle','Add a date in Household settings.'));
        house.countdowns.forEach(item=>{const row=node('div','dashboard-countdown'),delta=SkylitFrameModel.dayDelta(item.date,today());row.append(node('strong',null,item.title),node('span',null,delta===0?'Today':delta>0?delta+' days away':Math.abs(delta)+' days ago'));host.append(row);});
      }
      if(type==='timers'){
        if(!house.timers.length)host.append(node('p','subtle','Start a timer in Household.'));
        house.timers.forEach(item=>{const row=node('div','dashboard-timer');row.append(node('strong',null,item.title));const remaining=node('span');remaining.dataset.dashboardTimer=item.id;row.append(remaining);host.append(row);});
      }
    }
    paintTimers();
  }
  function paintTimers(){const timers=app.householdState().timers;document.querySelectorAll('[data-dashboard-timer]').forEach(n=>{const item=timers.find(item=>item.id===n.dataset.dashboardTimer);if(!item)return;const seconds=Math.max(0,Math.ceil((item.end-Date.now())/1000));n.textContent=seconds?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'Time is up';});}
  window.addEventListener('skylit-household',renderUtilities);window.addEventListener('skylit-preferences',()=>{renderUtilities();renderForecast();});
  window.addEventListener('skylit-display',sizeModules);window.addEventListener('skylit-tab',sizeModules);window.addEventListener('online',renderForecast);window.addEventListener('offline',renderForecast);
  setInterval(()=>{if(app.status().tab==='overview'&&!app.settingsOpen()){if(today()!==renderedDay)renderUtilities();else paintTimers();}},1000);

  panel.innerHTML='<article class="card setting-block dashboard-editor"><h3>Dashboard</h3><p class="small subtle">Drag modules to place them; drag a corner to resize. Changes stay in this preview until you save.</p><div class="dashboard-editor-toolbar"><div id="dashboard-starting-layout"></div><button id="dashboard-arrange" class="secondary">Arrange neatly</button><button id="dashboard-undo" class="quiet">Undo</button></div><div id="dashboard-editor-grid" class="dashboard-editor-grid" role="group" aria-label="Dashboard layout preview"></div><p id="dashboard-editor-status" class="small" role="status"></p><div id="dashboard-selection" class="dashboard-selection"><h4 id="dashboard-selection-title"></h4><p class="tiny subtle">Arrow keys on a module move it. Shift + arrows resize it.</p><div class="dashboard-fields"><div><label for="dashboard-column">Column</label><input id="dashboard-column" type="number" min="1" max="12"></div><div><label for="dashboard-row">Row</label><input id="dashboard-row" type="number" min="1" max="12"></div><div><label for="dashboard-width">Width</label><input id="dashboard-width" type="number" max="12"></div><div><label for="dashboard-height">Height</label><input id="dashboard-height" type="number" max="12"></div></div><div id="dashboard-clock-options"><label for="dashboard-clock-style">Clock style</label><select id="dashboard-clock-style"></select><div id="dashboard-clock-preview" class="clock-sample" role="img" aria-label="Clock style preview"></div></div><button id="dashboard-remove" class="quiet">Remove module</button></div><div class="dashboard-editor-actions"><button id="dashboard-save" class="primary">Save dashboard</button><button id="dashboard-discard" class="quiet">Discard changes</button></div></article><article class="card setting-block"><h3>Module gallery</h3><p class="small subtle">Tap to add, or drag into an empty space above. One of each module. Adding to a full layout arranges modules to make room.</p><div id="dashboard-gallery" class="dashboard-gallery"></div></article>';
  const clockOptions=$('dashboard-clock-options'),stylePicker=$('dashboard-clock-style');
  SkylitClock.styles.forEach(style=>{const option=node('option',null,style.name);option.value=style.id;stylePicker.append(option);});
  clockSample=$('dashboard-clock-preview');sampleVisual=SkylitClock.create(document);clockSample.classList.add('clock-frame');const sampleTime=node('div','clock-sample-time clock-time'),sampleDate=node('p','clock-sample-date clock-date');sampleTime.append(node('span','clock-sample-digits'),node('span','clock-sample-period'));observer.observe(clockSample);sampleTime.setAttribute('aria-hidden','true');sampleDate.setAttribute('aria-hidden','true');clockSample.append(sampleVisual.root,sampleTime,sampleDate);
  stylePicker.onchange=()=>{const next=model.change(draft,'clock',{style:stylePicker.value});if(next){remember();draft=next;preset.value='custom';paintPositions();message('Clock style changed. Save to apply it.');}};
  const start=$('dashboard-starting-layout'),presetLabel=document.querySelector('label[for=overview-preset]'),preset=$('overview-preset');
  presetLabel.textContent='Starting layout';start.append(presetLabel,preset);const custom=node('option',null,'Custom');custom.value='custom';custom.disabled=true;preset.prepend(custom);
  preset.value='custom';preset.onchange=()=>{remember();const style=draft.modules.find(item=>item.type==='clock')?.style||'classic';draft=model.change(model.preset(preset.value),'clock',{style});selected='clock';paintEditor();message('Starting layout selected. Save to apply it.');};
  // The old optional excerpt migrates to a real Note module; configuration now lives here.
  $('household-excerpt').closest('label').remove();
  const preview=$('dashboard-editor-grid'),tiles=new Map();
  function message(text){$('dashboard-editor-status').textContent=text;}
  function remember(){history.push(model.copy(draft));if(history.length>30)history.shift();}
  function dirty(){return JSON.stringify(draft)!==JSON.stringify(saved);}
  function paintSelection(){
    const item=draft.modules.find(item=>item.type===selected);$('dashboard-selection').hidden=!item;
    tiles.forEach((tile,type)=>{tile.classList.toggle('selected',type===selected);tile.querySelector('.dashboard-move').setAttribute('aria-pressed',String(type===selected));});
    clockOptions.hidden=selected!=='clock'||!item;if(!item)return;const definition=model.definition(selected);stylePicker.value=SkylitClock.style(item.style);paintClock();$('dashboard-selection-title').textContent=definition.name;
    for(const [field,value] of [['column',item.x+1],['row',item.y+1],['width',item.w],['height',item.h]])$('dashboard-'+field).value=value;
    $('dashboard-width').min=definition.minW;$('dashboard-height').min=definition.minH;
  }
  function paintPositions(){draft.modules.forEach(item=>{const tile=tiles.get(item.type);position(tile,item);tile.querySelector('.dashboard-editor-size').textContent=item.w+' × '+item.h;});paintSelection();$('dashboard-save').disabled=!dirty();$('dashboard-discard').disabled=!dirty();$('dashboard-undo').disabled=!history.length;if(app.settingsFeedback)app.settingsFeedback(dirty()?'Unsaved dashboard changes':'Saved on this frame');}
  function paintEditor(){
    preview.replaceChildren();tiles.clear();
    draft.modules.forEach(item=>{const definition=model.definition(item.type),tile=node('div','dashboard-editor-tile'),move=node('button','dashboard-move',definition.name),size=node('span','dashboard-editor-size'),resize=node('button','dashboard-resize','⤡');
      tile.dataset.module=item.type;move.type=resize.type='button';move.setAttribute('aria-label','Move '+definition.name);move.setAttribute('aria-pressed',String(item.type===selected));resize.setAttribute('aria-label','Resize '+definition.name);
      move.onclick=()=>{selected=item.type;paintSelection();};move.onpointerdown=e=>begin(e,item.type,'move');resize.onpointerdown=e=>begin(e,item.type,'resize');
      move.onkeydown=e=>keyboard(e,item.type,false);resize.onkeydown=e=>keyboard(e,item.type,true);
      tile.append(move,size,resize);tiles.set(item.type,tile);preview.append(tile);
    });
    for(const button of $('dashboard-gallery').querySelectorAll('.dashboard-gallery-item')){const included=draft.modules.some(item=>item.type===button.dataset.type);button.disabled=included;button.querySelector('small').textContent=included?'Added':'Add module';button.parentElement.querySelector('.dashboard-gallery-drag').disabled=included;}
    paintPositions();
  }
  function keyboard(e,type,resizing){const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!steps[e.key])return;e.preventDefault();selected=type;const item=draft.modules.find(item=>item.type===type),[dx,dy]=steps[e.key],resize=resizing||e.shiftKey;const next=model.change(draft,type,resize?{w:item.w+dx,h:item.h+dy}:{x:item.x+dx,y:item.y+dy});if(next){remember();draft=next;preset.value='custom';paintPositions();message('Unsaved layout changes.');}else message('That position or size would overlap a module or leave the dashboard.');}
  function begin(e,type,mode){if(e.button!==0||drag)return;e.preventDefault();selected=type;paintSelection();const item=draft.modules.find(item=>item.type===type);drag={type,mode,startX:e.clientX,startY:e.clientY,start:model.copy(draft),item:{...item},last:model.copy(draft),previewTop:preview.getBoundingClientRect().top};e.currentTarget.setPointerCapture(e.pointerId);trackScroll(e);}
  function trackScroll(e){drag.clientX=e.clientX;drag.clientY=e.clientY;const scroll=document.querySelector('.settings-content');function step(){if(!drag)return;if(!app.settingsOpen()){finish({clientX:drag.clientX,clientY:drag.clientY},true);return;}const rect=scroll.getBoundingClientRect();if(drag.clientY<rect.top+45)scroll.scrollTop-=10;else if(drag.clientY>rect.bottom-45)scroll.scrollTop+=10;scrollFrame=requestAnimationFrame(step);}scrollFrame=requestAnimationFrame(step);}
  function cellDelta(e){const rect=preview.getBoundingClientRect();return [Math.round((e.clientX-drag.startX)/rect.width*model.columns),Math.round((e.clientY-drag.startY+drag.previewTop-rect.top)/rect.height*model.rows)];}
  document.addEventListener('pointermove',e=>{if(!drag)return;drag.clientX=e.clientX;drag.clientY=e.clientY;
    if(drag.mode==='gallery'){const rect=preview.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;const x=Math.min(8,Math.max(0,Math.floor((e.clientX-rect.left)/rect.width*12))),y=Math.min(8,Math.max(0,Math.floor((e.clientY-rect.top)/rect.height*12)));drag.position={x,y};preview.classList.add('drop-active');return;}
    const [dx,dy]=cellDelta(e),item=drag.item,patch=drag.mode==='resize'?{w:item.w+dx,h:item.h+dy}:{x:item.x+dx,y:item.y+dy};const next=model.change(drag.start,drag.type,patch);
    if(next){draft=next;drag.last=next;paintPositions();}
  });
  function finish(e,cancelled=false){if(!drag)return;const operation=drag;drag=null;cancelAnimationFrame(scrollFrame);preview.classList.remove('drop-active');
    if(operation.mode==='gallery'){ignoreClick=Math.hypot(e.clientX-operation.startX,e.clientY-operation.startY)>8;
      const rect=preview.getBoundingClientRect(),inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
      if(!cancelled&&inside&&operation.position){const result=model.add(draft,operation.type,operation.position);if(result.added){remember();draft=result.layout;selected=operation.type;paintEditor();message('Module added. Save to apply it.');}else message('No room here. Resize or move a module, or tap Add to arrange automatically.');}setTimeout(()=>ignoreClick=false,0);return;
    }
    if(cancelled){draft=operation.start;paintPositions();return;}
    if(JSON.stringify(operation.start)!==JSON.stringify(draft)){history.push(operation.start);if(history.length>30)history.shift();preset.value='custom';paintPositions();message('Unsaved layout changes.');}
  }
  document.addEventListener('pointerup',e=>finish(e));document.addEventListener('pointercancel',e=>finish(e,true));
  for(const definition of model.catalog){const card=node('div','dashboard-gallery-card'),button=node('button','dashboard-gallery-item');button.type='button';button.dataset.type=definition.type;button.append(node('strong',null,definition.name),node('span','small subtle',definition.description),node('small',null,'Add module'));button.setAttribute('aria-label','Add '+definition.name);
    button.onclick=()=>{if(ignoreClick)return;const result=model.add(draft,definition.type);if(!result.added)return;remember();draft=result.layout;selected=definition.type;preset.value='custom';paintEditor();message(result.rearranged?'Module added. Modules were arranged to make room; Undo restores the earlier layout.':'Module added. Save to apply it.');};
    const handle=node('button','dashboard-gallery-drag','⠿');handle.type='button';handle.setAttribute('aria-label','Drag '+definition.name+' to dashboard');
    function startGallery(e){if(e.button!==0||drag)return;e.preventDefault();drag={type:definition.type,mode:'gallery',startX:e.clientX,startY:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);trackScroll(e);}
    button.onpointerdown=e=>{if(e.pointerType!=='touch')startGallery(e);};handle.onpointerdown=startGallery;card.append(button,handle);$('dashboard-gallery').append(card);
  }
  for(const [field,property,offset] of [['column','x',1],['row','y',1],['width','w',0],['height','h',0]])$('dashboard-'+field).onchange=()=>{const next=model.change(draft,selected,{[property]:Number($('dashboard-'+field).value)-offset});if(next){remember();draft=next;preset.value='custom';paintPositions();message('Unsaved layout changes.');}else{paintSelection();message('That size or position does not fit. Modules cannot overlap.');}};
  $('dashboard-remove').onclick=()=>{remember();draft=model.remove(draft,selected);selected=draft.modules[0]?.type;preset.value='custom';paintEditor();message('Module removed from this layout. Its data stays saved.');};
  $('dashboard-arrange').onclick=()=>{remember();draft=model.arrange(draft);preset.value='custom';paintEditor();message('Modules arranged. Save to apply it.');};
  $('dashboard-undo').onclick=()=>{if(!history.length)return;draft=history.pop();selected=draft.modules.find(item=>item.type===selected)?.type||draft.modules[0]?.type;preset.value='custom';paintEditor();message('Layout change undone.');};
  $('dashboard-discard').onclick=()=>{draft=model.copy(saved);history=[];selected=draft.modules[0]?.type;preset.value='custom';paintEditor();message('Unsaved changes discarded.');};
  $('dashboard-save').onclick=()=>{try{localStorage.setItem(key,JSON.stringify(draft));}catch(_){message('Could not save. Your current dashboard is unchanged.');return;}saved=model.copy(draft);history=[];applyLayout();paintPositions();message('Dashboard saved on this frame.');};
  window.SkylitDashboard={isDirty:dirty,layout:()=>model.copy(saved),draft:()=>model.copy(draft)};
  paintEditor();applyLayout();renderForecast();
})();
