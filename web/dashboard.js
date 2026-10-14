'use strict';
(() => {
  const $=id=>document.getElementById(id),model=window.SkylitDashboardModel,app=window.SkylitApp;
  const key='skylit.dashboard',grid=document.querySelector('.overview-grid'),panel=$('settings-dashboard-panel');
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const legacy=()=>{try{return SkylitFrameModel.preferences(JSON.parse(localStorage.getItem('skylit.frame')||'{}'));}catch(_){return {};}};
  let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch(_){}
  let saved=model.normalize(raw,legacy()),draft=model.copy(saved),selected=null,drag=null,ignoreClick=false,scrollFrame=0,moveFrame=0,pendingMove=null,saveError=false;
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
      window.SkylitUI.renderNode(action,window.SkylitUI.template("ModuleActionIcon"));
      action.setAttribute('aria-label',definition.type==='forecast'?'Open full weather forecast':'Manage '+definition.name.toLowerCase());
      action.onclick=()=>definition.type==='forecast'?app.go('weather'):definition.type==='note'||definition.type==='countdowns'?app.openSettings('household','overview'):app.go('household');
      heading.append(title,action);wrapper.append(heading,node('div','dashboard-module-content'));
    }
    wrapper.hidden=true;wrappers.set(definition.type,wrapper);grid.append(wrapper);
  }
  const clockVisual=SkylitClock.create(document);originals.get('clock').prepend(clockVisual.root);
  let clockSample=null,sampleVisual=null,livePreview=null;
  function sizeClock(host,w,h,chosen,data){
    const ui=Number(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'))||1,ratio=w/h,strip=ratio>3.7,portrait=ratio<.8,small=w<300||h<170;
    host.dataset.clockStyle=chosen;host.dataset.composition=strip?'strip':portrait?'portrait':ratio>2.15?'wide':'balanced';host.dataset.small=String(small);
    const pad=Math.max(h<120?8:small?10:12,Math.min(38,Math.min(w,h)*.075));let date=Math.min(32,Math.max(14,Math.min(w*.035,h*.055)*ui)),period=Math.min(31,Math.max(14,Math.min(w*.04,h*.055)*ui)),gap=Math.max(4,Math.min(22,h*.035));
    const inlinePeriod=strip||(small&&!portrait)||(chosen==='digital'&&ratio>2.15),botanicalTop=portrait?pad+w*.12:!small&&!strip&&ratio<=2.15?Math.max(pad,h*.17):pad;
    if(chosen==='digital'&&!inlinePeriod){period=Math.max(14,Math.min(64,Math.min(w*.07,h*.10)*ui));gap=Math.max(4,Math.min(28,h*.055));}
    const set=(key,value)=>host.style.setProperty('--'+key,value+'px');set('clock-pad',pad);set('clock-date-size',date);set('clock-period-size',period);set('clock-gap',gap);set('clock-corner',Math.max(12,Math.min(46,Math.min(w,h)*.09)));
    const sideScene=strip||(chosen==='classic'&&ratio>2.15),scene=sideScene?h:Math.min(h*(small?.26:.32),w*.36);set('module-landscape',scene);
    // Measure the exact lining/tabular glyphs used by CSS. Canvas's default
    // OpenType numerals have different advances and can under-estimate the time.
    if(!sizeClock.measure){const m=node('span','clock-font-measure');m.setAttribute('aria-hidden','true');m.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;white-space:nowrap;font:500 100px "Skylit Serif",Georgia;letter-spacing:-2.5px;font-feature-settings:"lnum" 1,"tnum" 1;pointer-events:none';document.body.append(m);sizeClock.measure=m;}
    sizeClock.measure.style.fontFamily=chosen==='digital'?'"Skylit Display",Georgia':'"Skylit Serif",Georgia';sizeClock.measure.style.fontWeight=chosen==='digital'||chosen==='classic'?'600':'500';sizeClock.measure.textContent=data.hourText+':'+data.minuteText;const glyphWidth=sizeClock.measure.getBoundingClientRect().width/100;
    const dateLines=chosen==='digital'&&!inlinePeriod?2:1,periodHeight=data.period?period*1.2:0;
    let availableWidth=w-2*pad,availableHeight=h-pad-(chosen==='digital'?botanicalTop:pad)-date*1.4*dateLines-gap-(inlinePeriod?0:periodHeight+gap);
    if(chosen==='classic'){if(sideScene){availableWidth=w*.46-pad*2;}else{availableHeight-=scene+(portrait?0:gap*2);availableWidth=Math.min(availableWidth,w*.80);}}
    if(chosen==='digital'){availableWidth=w*(small?.76:portrait?.87:.80)-pad;if(strip){availableWidth=w*.54-pad*2;availableHeight=h-pad*2;}else if(portrait)availableHeight=Math.min(availableHeight,h*.36);}
    const clockSize=Math.max(24,Math.min(availableWidth/(glyphWidth+(inlinePeriod&&data.period?.45:0)),availableHeight/.92));set('module-clock',clockSize);
    const landscape=host.querySelector('.clock-landscape');landscape.dataset.sunRadius=String(Math.min(clockSize*.30,(sideScene?w*.54:w)*.21,scene*.42));SkylitClock.composeLandscape(landscape,sideScene?w*.54:w,scene,sideScene);
    set('botanical-top',botanicalTop);set('botanical-left',w*.14);set('botanical-art-height',Math.min(w*.52,h*(ratio>1.25?.34:.52)));
    const side=ratio>2.4;host.dataset.sideDate=String(side);
    const dial=Math.max(44,Math.min(side?w*.55:w-pad*2,h-pad*2-(side?0:date*1.5+gap)));set('module-dial',dial);const dateNode=host.querySelector('.clock-date'),dateWidth=side?Math.max(...Array.from(dateNode.querySelectorAll('.clock-weekday,.clock-monthday'),n=>n.getBoundingClientRect().width)):0;set('dial-x',side?Math.max(pad,(w-dial-dateWidth-gap*1.5)/2):(w-dial)/2);set('dial-y',(h-dial-(side?0:date*1.5+gap))/2);
    const plant=small?'sprig':'full';host.dataset.ornament=plant;
    let tilesWidth=(w-pad*2)/2.91,tilesHeight=(h-pad*2-date*1.4-periodHeight-(data.period?5:0)-gap)/(data.period?1.65:1.55);
    if(portrait){tilesWidth=(w-pad*2)/1.4;tilesHeight=(h-pad*2-date*1.4-periodHeight-(data.period?5:0)-gap)/(data.period?3.3:3.2);}
    if(strip){tilesWidth=(w*.43-pad)/2.91;tilesHeight=(h-pad*2-periodHeight-(data.period?5:0))/(data.period?1.65:1.55);}
    if(!small&&!strip&&!portrait)tilesHeight=Math.min(tilesHeight,h*.44/1.55);
    set('module-stack',Math.max(24,Math.min(tilesWidth,tilesHeight)));set('flip-plant',Math.min(w*.51,h*.57));set('flip-side',0);
    if(chosen==='stacked'){set('clock-date-size',Math.max(12,Math.min(20,date*.85)));set('clock-period-size',Math.max(14,Math.min(30,h*.05)));}
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
    sizeModules();const paletteClock=panel.querySelector('[data-preview-type=clock]');if(paletteClock?.querySelector('b'))paletteClock.querySelector('b').textContent=data.hourText+':'+data.minuteText;if(livePreview&&editorVisible())livePreview.render(draft,wrappers,data);
  }
  window.addEventListener('skylit-clock',e=>paintClock(e.detail.instant));
  // Advance only visible Analog hands between the app's coarse status ticks.
  // Do not rerender the dashboard or poll services for a seconds hand.
  setInterval(()=>{
    if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const live=saved.modules.find(m=>m.type==='clock')?.style==='analog'&&originals.get('clock').getClientRects().length>0;
    const sample=clockSample&&draft.modules.find(m=>m.type==='clock')?.style==='analog'&&clockSample.getClientRects().length>0;
    if(!live&&!sample)return;
    const prefs=app.calendarPreferences(),data=SkylitClock.read(Date.now(),prefs.timezone,prefs.clock);
    if(live)clockVisual.update('analog',data);if(sample)sampleVisual.update('analog',data);
  },1000);
  const photoEmpty=node('button','dashboard-photo-empty');photoEmpty.textContent='Choose photos';photoEmpty.onclick=()=>app.openSettings('photos','overview');wrappers.get('photos').append(photoEmpty);
  const empty=node('div','dashboard-empty');empty.append(node('h2',null,'Your dashboard is empty'));const configure=node('button','secondary','Choose modules');configure.onclick=()=>app.openSettings('dashboard','overview');empty.append(configure);grid.append(empty);
  function position(n,item){n.dataset.widgetStyle=item.style||model.styles[item.type]?.[0]||'';n.style.gridColumn=(item.x+1)+' / span '+item.w;n.style.gridRow=(item.y+1)+' / span '+item.h;}
  function applyLayout(){
    for(const [type,n] of wrappers){const item=saved.modules.find(item=>item.type===type);n.hidden=!item;if(item)position(n,item);}
    // Match reading and keyboard order to the visible arrangement.
    saved.modules.slice().sort((a,b)=>a.y-b.y||a.x-b.x).forEach(item=>grid.append(wrappers.get(item.type)));
    empty.hidden=!!saved.modules.length;paintClock();sizeModules();renderUtilities();
  }
  function sizePhotos(host,w,h){
    if(host.dataset.widgetStyle!=='prints')return;
    const images=[...host.querySelectorAll('.overview-photo-stack img')],count=images.length;
    if(!count)return;
    const tall=w<h*.8,pad=Math.max(8,Math.min(16,Math.min(w,h)*.055)),border=5,bottom=12;
    const frames=images.map(img=>{
      if(!img.complete&&!img._printLoad){img._printLoad=true;img.addEventListener('load',()=>{img._printLoad=false;sizePhotos(host,host.clientWidth,host.clientHeight);},{once:true});}
      const ratio=img.naturalWidth&&img.naturalHeight?img.naturalWidth/img.naturalHeight:1.5;
      const maxWidth=(w-pad*2)*(count===1?.94:tall?.88:.68);
      const maxHeight=tall?(h-pad*2)/(1+(count-1)*.72):(h-pad*2)*.88;
      const pw=Math.max(1,Math.min(maxWidth,(maxHeight-border-bottom)*ratio+border*2));
      return {pw,ph:(pw-border*2)/ratio+border+bottom};
    });
    images.forEach((img,i)=>{
      const {pw,ph}=frames[i],fraction=count===1?.5:i/(count-1);
      const left=tall?(w-pw)/2+(count===1?0:(fraction-.5)*pad):pad+(w-pad*2-pw)*fraction;
      const top=tall?pad+(h-pad*2-ph)*fraction:(h-ph)/2+(count===1?0:(fraction-.5)*pad*.7);
      img.style.setProperty('--print-width',pw+'px');img.style.setProperty('--print-height',ph+'px');img.style.setProperty('--print-left',left+'px');img.style.setProperty('--print-top',top+'px');
    });
  }
  function sizeModules(){
    for(const [type,n] of wrappers){if(n.hidden)continue;const rect=n.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)continue;
      n.dataset.density=w<340||h<220?'compact':'regular';n.dataset.short=String(h<280);n.dataset.narrow=String(w<340);
      if(type==='photos')sizePhotos(n,w,h);
      if(type==='clock'&&clockData)sizeClock(originals.get('clock'),w,h,n.dataset.clockStyle,clockData);
      n.style.setProperty('--module-temperature',Math.max(36,Math.min(100,w*.17,h*.28))+'px');
    }
    if(clockSample&&clockData){const r=clockSample.getBoundingClientRect();if(r.width&&r.height)sizeClock(clockSample,r.width,r.height,clockSample.dataset.clockStyle,clockData);}
  }
  if(document.fonts){document.fonts.ready.then(sizeModules);document.fonts.addEventListener('loadingdone',sizeModules);}
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
      const host=wrappers.get(type).querySelector('.dashboard-module-content');
      window.SkylitUI.dashboard.utility(host,{type,house,today:today(),dayDelta:SkylitFrameModel.dayDelta,onCheck(id){app.toggleShopping(id);(host.querySelector('button')||wrappers.get(type).querySelector('.quiet')).focus({preventScroll:true});}});
    }
    paintTimers();
  }
  function paintTimers(){const timers=app.householdState().timers;document.querySelectorAll('[data-dashboard-timer]').forEach(n=>{const item=timers.find(item=>item.id===n.dataset.dashboardTimer);if(!item)return;const seconds=Math.max(0,Math.ceil((item.end-Date.now())/1000));n.textContent=seconds?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'Time is up';});}
  window.addEventListener('skylit-household',renderUtilities);window.addEventListener('skylit-preferences',()=>{renderUtilities();renderForecast();});
  window.addEventListener('skylit-display',sizeModules);window.addEventListener('skylit-tab',sizeModules);window.addEventListener('online',renderForecast);window.addEventListener('offline',renderForecast);
  setInterval(()=>{if(app.status().tab==='overview'&&!app.settingsOpen()){if(today()!==renderedDay)renderUtilities();else paintTimers();}},1000);

  window.SkylitUI.renderNode(panel,window.SkylitUI.template("DashboardEditorFrame"));
  const clockOptions=$('dashboard-clock-options'),stylePicker=$('dashboard-clock-style');
  SkylitClock.styles.forEach(style=>{const option=node('option',null,style.name);option.value=style.id;stylePicker.append(option);});
  clockSample=$('dashboard-clock-preview');sampleVisual=SkylitClock.create(document);clockSample.classList.add('clock-frame');const sampleTime=node('div','clock-sample-time clock-time'),sampleDate=node('p','clock-sample-date clock-date');sampleTime.append(node('span','clock-sample-digits'),node('span','clock-sample-period'));observer.observe(clockSample);sampleTime.setAttribute('aria-hidden','true');sampleDate.setAttribute('aria-hidden','true');clockSample.append(sampleVisual.root,sampleTime,sampleDate);
  stylePicker.onchange=()=>{const next=model.change(draft,'clock',{style:stylePicker.value});if(next){draft=next;preset.value='custom';paintPositions();message('Clock style changed. Saved on this frame.');}};
  const start=$('dashboard-starting-layout'),presetLabel=document.querySelector('label[for=overview-preset]'),preset=$('overview-preset');
  presetLabel.textContent='Starting layout';start.append(presetLabel,preset);const custom=node('option',null,'Custom');custom.value='custom';custom.disabled=true;preset.prepend(custom);
  preset.value='custom';preset.onchange=()=>{const style=draft.modules.find(item=>item.type==='clock')?.style||'classic';draft=model.change(model.preset(preset.value),'clock',{style});selected=null;paintEditor();message('Starting layout selected. Saved on this frame.');};
  // The old optional excerpt migrates to a real Note module; configuration now lives here.
  $('household-excerpt').closest('label').remove();
  const preview=$('dashboard-editor-grid'),tiles=new Map();
  const editor=panel.querySelector('.dashboard-editor');editor.classList.add('dashboard-workbench');
  editor.querySelector('h3').textContent='Your dashboard';editor.querySelector('p').textContent='Drag to move. Use a corner to resize. Changes save automatically.';
  const work=node('div','dashboard-workspace'),side=node('aside','dashboard-context-panel'),palette=panel.querySelector('.setting-block:last-child'),center=node('div','dashboard-canvas-column'),canvas=node('div','dashboard-canvas'),inspector=$('dashboard-selection');
  palette.classList.add('dashboard-palette');palette.querySelector('.dashboard-gallery').setAttribute('aria-label','Available widgets');palette.querySelector('h3').textContent='Widgets';palette.querySelector('p').textContent='Drag a widget onto the canvas, or tap to add.';
  const ghost=node('div','dashboard-drop-ghost');ghost.hidden=true;canvas.append(preview,ghost);center.append(canvas,$('dashboard-editor-status'));side.setAttribute('aria-label','Dashboard tools');side.append(inspector,palette);work.append(center,side);const back=node('button','quiet dashboard-back-widgets','‹ Back to widgets');back.type='button';back.onclick=()=>deselect();inspector.prepend(back);canvas.addEventListener('click',e=>{if(!e.target.closest('.dashboard-editor-tile')&&!ignoreClick)deselect();});canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();deselect();}});editor.querySelector('.dashboard-editor-toolbar').after(work);
  const visualOptions=node('div','dashboard-visual-options');inspector.append(visualOptions);
  const sample=clockSample;const detail=node('details','dashboard-clock-detail');detail.append(node('summary',null,'Clock detail'),sample);clockOptions.append(detail);
  livePreview=SkylitDashboardPreview.create(canvas,{position,paintDate,sizeClock,sizePhotos});
  function editorVisible(){return app.settingsOpen()&&$('settings').dataset.area==='dashboard';}
  function fitPreview(){
    if(!editorVisible())return;
    const width=innerWidth,height=innerHeight,content=document.querySelector('.settings-content'),status=$('dashboard-editor-status');
    const desktop=width>=800,css=getComputedStyle(work),gap=parseFloat(css.columnGap)||16;
    const available=Math.max(desktop?240:120,content.getBoundingClientRect().bottom-canvas.getBoundingClientRect().top-parseFloat(getComputedStyle(content).paddingBottom)-status.getBoundingClientRect().height-(center.querySelector('.dashboard-footer')?.getBoundingClientRect().height||0)-16);
    // Size against the entire workspace, not the previously fitted center track.
    canvas.dataset.maxWidth=desktop?Math.max(100,work.clientWidth-(side.getBoundingClientRect().width+gap)):center.clientWidth;
    canvas.dataset.maxHeight=desktop?available:10000;
    work.style.setProperty('--workbench-height',available+'px');livePreview.fit(desktop?width:1280,desktop?height:720);
    editor.style.setProperty('--editor-action-inset',desktop?(canvas.getBoundingClientRect().left-editor.getBoundingClientRect().left)+'px':'0px');
  }
  new ResizeObserver(()=>{if(editorVisible())fitPreview();}).observe(document.querySelector('.settings-content'));

  new MutationObserver(records=>{const changed=new Set(records.map(r=>(r.target.nodeType===1?r.target:r.target.parentElement)?.closest('[data-module]')?.dataset.module).filter(type=>type&&type!=='clock'));if(changed.size&&livePreview&&clockData&&editorVisible())livePreview.queueRefresh(draft,wrappers,clockData,changed);}).observe(grid,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','hidden']});
  // Let Settings finish switching its workspace geometry before measuring it.
  let openFrame=0;
  window.addEventListener('skylit-settings',()=>{const revision=++openFrame;if(editorVisible())queueMicrotask(()=>{if(revision===openFrame&&editorVisible())paintPositions(false);});});

  function message(text){const value=saveError?'Could not save this change. Your previous dashboard has been restored.':text;if($('dashboard-editor-status').textContent!==value)$('dashboard-editor-status').textContent=value;}
  function deselect(){const hadSelection=!!selected;if(drag)finish({clientX:drag.clientX,clientY:drag.clientY},true);selected=null;paintSelection();fitPreview();return hadSelection;}
  function persist(){if(!dirty())return true;try{localStorage.setItem(key,JSON.stringify(draft));}catch(_){saveError=true;draft=model.copy(saved);queueMicrotask(()=>{paintEditor();message('');});return false;}saveError=false;saved=model.copy(draft);applyLayout();return true;}
  function dirty(){return JSON.stringify(draft)!==JSON.stringify(saved);}
  function paintSelection(){
    const item=draft.modules.find(item=>item.type===selected);$('dashboard-selection').hidden=!item;palette.hidden=!!item;side.dataset.mode=item?'options':'gallery';
    tiles.forEach((tile,type)=>{tile.classList.toggle('selected',type===selected);tile.querySelector('.dashboard-move').setAttribute('aria-pressed',String(type===selected));});
    clockOptions.hidden=selected!=='clock'||!item;visualOptions.hidden=!item||!['photos','weather'].includes(selected);if(!visualOptions.hidden)SkylitUI.dashboard.styles(visualOptions,{type:selected,value:item.style||model.styles[selected][0],pictures:Array.from($('overview-photos').querySelectorAll('img')).map(i=>i.src),temperature:$('overview-temperature').textContent,onChange(style){const next=model.change(draft,selected,{style});if(next){draft=next;paintPositions();message('Widget style saved.');}}});if(!item)return;const definition=model.definition(selected);stylePicker.value=SkylitClock.style(item.style);if(selected==='clock'&&clockSample.dataset.clockStyle!==stylePicker.value)paintClock();$('dashboard-selection-title').textContent=definition.name;

  }
  function paintPositions(notify=true){if(!drag&&!persist())return;draft.modules.forEach(item=>{const tile=tiles.get(item.type);position(tile,item);tile.querySelector('.dashboard-editor-size').textContent=item.w+' × '+item.h;});if(drag){if(livePreview&&clockData)livePreview.geometry(draft);return;}paintSelection();if(livePreview&&clockData&&editorVisible()){livePreview.render(draft,wrappers,clockData);fitPreview();}if(app.settingsFeedback)app.settingsFeedback(saveError?'Could not save dashboard change':'Saved on this frame');if(notify)window.dispatchEvent(new Event('skylit-dashboard-draft'));}
  function paintEditor(){
    window.SkylitUI.dashboard.tiles({modules:draft.modules,selected,definition:model.definition,onSelect(type){selected=type;paintSelection();},onRemove:removeWidget,onBegin:begin,onKey:keyboard,register(type,element){if(element)tiles.set(type,element);else tiles.delete(type);}});
    paintGallery();
    paintPositions();
  }
  function keyboard(e,type,resizing){const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!steps[e.key])return;e.preventDefault();selected=type;const item=draft.modules.find(item=>item.type===type),[dx,dy]=steps[e.key],resize=resizing||e.shiftKey;const corner=typeof resizing==='string'?resizing:'se',next=model.change(draft,type,resize?{x:item.x+(corner.includes('w')?dx:0),y:item.y+(corner.includes('n')?dy:0),w:item.w+(corner.includes('w')?-dx:dx),h:item.h+(corner.includes('n')?-dy:dy)}:{x:item.x+dx,y:item.y+dy});if(next){draft=next;preset.value='custom';paintPositions();message('Layout saved on this frame.');}else message('That position or size would overlap a module or leave the dashboard.');}
  function begin(e,type,mode){if(e.button!==0||drag)return;e.preventDefault();selected=type;paintSelection();const item=draft.modules.find(item=>item.type===type);drag={type,mode,startX:e.clientX,startY:e.clientY,start:model.copy(draft),item:{...item},last:model.copy(draft),previewTop:preview.getBoundingClientRect().top};livePreview.beginGeometry();e.currentTarget.setPointerCapture(e.pointerId);trackScroll(e);}
  function trackScroll(e){drag.clientX=e.clientX;drag.clientY=e.clientY;const scroll=document.querySelector('.settings-content'),palette=panel.querySelector('.dashboard-gallery');function step(){if(!drag)return;if(!app.settingsOpen()){finish({clientX:drag.clientX,clientY:drag.clientY},true);return;}const paletteRect=palette.getBoundingClientRect();if(drag.mode==='gallery'&&drag.clientX>=paletteRect.left&&drag.clientX<=paletteRect.right){if(drag.clientY<paletteRect.top+45)palette.scrollTop-=10;else if(drag.clientY>paletteRect.bottom-45)palette.scrollTop+=10;}const beforeScroll=scroll.scrollTop+palette.scrollTop,rect=scroll.getBoundingClientRect();if(drag.clientY<rect.top+45)scroll.scrollTop-=10;else if(drag.clientY>rect.bottom-45)scroll.scrollTop+=10;if(beforeScroll!==scroll.scrollTop+palette.scrollTop)queueMove({clientX:drag.clientX,clientY:drag.clientY});scrollFrame=requestAnimationFrame(step);}scrollFrame=requestAnimationFrame(step);}
  function cellDelta(e){const rect=preview.getBoundingClientRect();return [Math.round((e.clientX-drag.startX)/rect.width*model.columns),Math.round((e.clientY-drag.startY+drag.previewTop-rect.top)/rect.height*model.rows)];}
  function move(e){if(!drag)return;
    if(drag.mode==='gallery'){const rect=preview.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){drag.position=null;ghost.hidden=true;preview.classList.remove('invalid-drop','drop-active');return;}
      const point={x:(e.clientX-rect.left)/rect.width*12,y:(e.clientY-rect.top)/rect.height*12},slot=model.placement(draft,drag.type,point);drag.position=slot;preview.classList.toggle('invalid-drop',!slot);preview.classList.add('drop-active');ghost.hidden=!slot;if(slot){position(ghost,slot);message('Release to add '+model.definition(drag.type).name+' in the highlighted space.');}else message('No open space fits this widget yet. Resize or remove a widget.');return;}

    const [dx,dy]=cellDelta(e),item=drag.item,resizing=drag.mode.startsWith('resize'),corner=drag.mode.slice(7)||'se';
    const patch=resizing?{x:item.x+(corner.includes('w')?dx:0),y:item.y+(corner.includes('n')?dy:0),w:item.w+(corner.includes('w')?-dx:dx),h:item.h+(corner.includes('n')?-dy:dy)}:{x:item.x+dx,y:item.y+dy};
    let next=model.change(drag.start,drag.type,patch),swapped=false;
    if(!next&&!resizing&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>12){
      const r=preview.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*12,y=(e.clientY-r.top)/r.height*12;
      const target=drag.start.modules.find(m=>m.type!==drag.type&&x>=m.x+.3&&x<m.x+m.w-.3&&y>=m.y+.3&&y<m.y+m.h-.3);
      if(target){next=model.swap(drag.start,drag.type,target.type);swapped=!!next;}
    }
    preview.classList.toggle('invalid-drop',!next);if(next){const changed=JSON.stringify(draft)!==JSON.stringify(next);draft=next;drag.last=next;if(changed)paintPositions();message(swapped?'Release to swap these widgets.':'Release to keep this placement.');}else{const changed=JSON.stringify(draft)!==JSON.stringify(drag.start);draft=model.copy(drag.start);if(changed)paintPositions();message('These widgets need more room for that placement.');}

  }
  // Coalesce pointer samples, but synchronously flush the last sample on release.
  function flushMove(){cancelAnimationFrame(moveFrame);moveFrame=0;const event=pendingMove;pendingMove=null;if(event)move(event);}
  function queueMove(e){if(!drag)return;drag.clientX=e.clientX;drag.clientY=e.clientY;pendingMove={clientX:e.clientX,clientY:e.clientY};if(!moveFrame)moveFrame=requestAnimationFrame(flushMove);}
  document.addEventListener('pointermove',queueMove);
  function finish(e,cancelled=false){if(!drag)return;if(cancelled){cancelAnimationFrame(moveFrame);moveFrame=0;pendingMove=null;}else{pendingMove={clientX:e.clientX,clientY:e.clientY};flushMove();}const operation=drag;drag=null;livePreview.endGeometry();ghost.hidden=true;cancelAnimationFrame(scrollFrame);preview.classList.remove('drop-active','invalid-drop');
    if(operation.mode==='gallery'){ignoreClick=Math.hypot(e.clientX-operation.startX,e.clientY-operation.startY)>8;
      const rect=preview.getBoundingClientRect(),inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
      if(!cancelled&&inside&&operation.position){const result=model.add(draft,operation.type,operation.position);if(result.added){draft=result.layout;selected=operation.type;paintEditor();message('Module added. Saved on this frame.');}else message('No room here. Move or resize a widget to make space.');}setTimeout(()=>ignoreClick=false,0);return;
    }
    if(cancelled){draft=operation.start;paintPositions();return;}
    if(JSON.stringify(operation.start)!==JSON.stringify(draft)){preset.value='custom';paintPositions();message('Layout saved on this frame.');}else paintPositions(false);
  }
  document.addEventListener('pointerup',e=>finish(e));document.addEventListener('pointercancel',e=>finish(e,true));
  function paintGallery(){window.SkylitUI.dashboard.gallery({catalog:model.catalog,included:draft.modules.map(m=>m.type),clock:clockData?clockData.hourText+':'+clockData.minuteText:'—',temperature:$('overview-temperature').textContent,pictures:Array.from($('overview-photos').querySelectorAll('img')).slice(0,3).map(image=>image.src),onAdd(type){if(ignoreClick)return;const slot=model.placement(draft,type,{x:6,y:6}),result=slot?model.add(draft,type,slot):{added:false};if(!result.added||result.rearranged){message('Make room by moving, resizing or removing a widget first. Your layout is unchanged.');return;}draft=result.layout;selected=type;preset.value='custom';paintEditor();message('Module added. Saved on this frame.');},onBegin(e,type){if((e.button!==0&&!(e.pointerType==='touch'&&e.buttons===1))||drag)return;e.preventDefault();ghost.replaceChildren();const art=panel.querySelector('[data-preview-type='+type+']');if(art)ghost.append(art.cloneNode(true));drag={type,mode:'gallery',startX:e.clientX,startY:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);trackScroll(e);}});}
  function removeWidget(type){draft=model.remove(draft,type);selected=null;preset.value='custom';paintEditor();message('Widget removed. Its content stays saved.');}
  $('dashboard-remove').onclick=()=>removeWidget(selected);$('dashboard-remove').hidden=true;

  window.SkylitDashboard={isDirty:dirty,layout:()=>model.copy(saved),draft:()=>model.copy(draft),discard:()=>{draft=model.copy(saved);paintEditor();},save:persist,deselect,createClockPreview(target,style){const host=node('div','clock-frame clock-sample'),visual=SkylitClock.create(document),time=node('div','clock-time clock-sample-time'),digits=node('span','clock-sample-digits'),period=node('span','clock-sample-period'),date=node('p','clock-date clock-sample-date');time.append(digits,period);host.append(visual.root,time,date);target.append(host);function fit(){const data=clockData||SkylitClock.read(Date.now(),app.calendarPreferences().timezone,app.calendarPreferences().clock),w=280,h=180;host.style.width=w+'px';host.style.height=h+'px';const scale=Math.min(target.clientWidth/w,target.clientHeight/h);host.style.transform='scale('+scale+')';host.style.left=(target.clientWidth-w*scale)/2+'px';host.style.top=(target.clientHeight-h*scale)/2+'px';visual.update(style,data);digits.textContent=data.hourText+':'+data.minuteText;period.textContent=data.period.toUpperCase();paintDate(host,data);sizeClock(host,w,h,style,data);}fit();return {fit};}};
  paintEditor();applyLayout();renderForecast();
})();
