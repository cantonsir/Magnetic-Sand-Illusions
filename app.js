import { noiseFrame } from './noise.js';
import { content } from './content.js?v=hands4';
import { createHandGuide } from './hand-guide.js?v=hands4';
const $ = id => document.getElementById(id);
const grains = [1,2,4,8,16], colors = ['#edc77a','#ee9b8f','#89d9cd','#b2a4ee'];
const storageKey = 'magnetic-sand-real-hands-v2';
let persisted = {};
try { persisted=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}; } catch {}
const observations = Array.from({length:4},(_,i)=>{
  const v=persisted.observations?.[i]; return v&&Number.isInteger(v.answer)&&v.answer>=0&&v.answer<=3?v:null;
});
const state={
 language:persisted.language==='zh'?'zh':persisted.language==='en'?'en':navigator.language?.startsWith('zh')?'zh':'en',
 mode:0,input:'hand',started:false,running:false,dynamic:!matchMedia('(prefers-reduced-motion: reduce)').matches,
 grain:2,rate:60,contrast:80,seed:0x6d2b79f5,frame:0,
 elapsed:0,lastTime:0,lastNoise:0,delivered:0,measured:0,measureStart:0,
 reportable:[false,false,false,false],observations,revealed:false,loop:0,
 tutorialPlaying:false,tutorialProgress:0,tutorialLastTime:0,tutorialLoop:0
};
const ctx=$('noise').getContext('2d',{alpha:false});
let handGuide;
const t=key=>content[state.language][key];
function save(){try{localStorage.setItem(storageKey,JSON.stringify({language:state.language,observations:state.observations}));}catch{}}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},5000);}
function drawNoise(){
 const c=$('noise');ctx.putImageData(new ImageData(noiseFrame(c.width,c.height,state.seed,state.frame,state.contrast),c.width,c.height),0,0);
}
function setText(id,value){if($(id).textContent!==value)$(id).textContent=value;}
function resize(){
 const r=$('noise-viewport').getBoundingClientRect();if(r.width<1||r.height<1)return;
 $('noise').width=Math.max(1,Math.ceil(r.width/state.grain));$('noise').height=Math.max(1,Math.ceil(r.height/state.grain));
 drawNoise();
}
function updateStatus(){
 const seconds=String(Math.floor(state.elapsed/1000)).padStart(2,'0');
 setText('status-text',!state.started?t('ready'):state.running?t(state.dynamic?'running':'still')+' · 00:'+seconds+' / 00:45':t('paused'));
 $('status-light').classList.toggle('running',state.running);
 setText('play-icon',state.running?'Ⅱ':'▶');setText('play-label',t(state.running?'pause':'play'));
 $('play').setAttribute('aria-label',t(state.running?'pause':'play'));
 $('quick-stop').hidden=!state.running;setText('quick-stop',t('pause'));
 for(const id of ['dynamic','static']){const active=id==='dynamic'?state.dynamic:!state.dynamic;$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
 setText('rate-note',t('rateNote')+(state.dynamic&&state.measured?' '+state.measured+' Hz '+t('measured')+'.':''));
 $('condition-note').hidden=state.dynamic||state.mode===0;
 setText('condition-note',t('stillCaveat'));
}
function stop(reason){state.running=false;cancelAnimationFrame(state.loop);state.loop=0;updateStatus();if(reason)toast(reason);}
function start(){
 if($('science-dialog').open)return;
 stopTutorial();
 state.started=true;state.running=true;state.reportable[state.mode]=true;state.elapsed=0;state.lastTime=0;state.lastNoise=0;
 state.delivered=0;state.measured=0;state.measureStart=0;$('stage-gate').hidden=true;$('stage').classList.remove('is-ready');
 cancelAnimationFrame(state.loop);state.loop=requestAnimationFrame(animate);renderObservation();updateStatus();
}
function animate(now){
 if(!state.running)return;
 if(!state.lastTime){state.lastTime=now;state.lastNoise=now;state.measureStart=now;}
 state.elapsed+=Math.min(now-state.lastTime,100);state.lastTime=now;
 if(state.elapsed>=45000){stop(t('timedPause'));return;}
 if(state.dynamic&&now-state.lastNoise>=1000/state.rate-.75){
  const steps=Math.max(1,Math.floor((now-state.lastNoise)/(1000/state.rate)));
  state.lastNoise+=steps*(1000/state.rate);state.frame+=steps;drawNoise();state.delivered++;
 }
 if(now-state.measureStart>=1500){state.measured=Math.round(state.delivered*1000/(now-state.measureStart));state.delivered=0;state.measureStart=now;}
 updateStatus();state.loop=requestAnimationFrame(animate);
}
function renderHandInstructions(){
 const instructions=content[state.language].modes[state.mode].hand;
 $('instructions').replaceChildren(...instructions.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
 $('ready-body').textContent=content[state.language].modes[state.mode].gate;
 const help=t('handHelp');
 $('noise-viewport').setAttribute('aria-description',help);
 $('noise-viewport').setAttribute('aria-label',t('canvasLabel'));
 $('stage').dataset.help=help;
 resize();
}
function renderTutorial(){
 const phase=handGuide?.render(state.tutorialProgress)||0;
 const mode=content[state.language].modes[state.mode];
 setText('tutorial-caption',mode.phases[phase]);
 setText('tutorial-step','0'+(phase+1)+' / 03');
 setText('tutorial-view',t(state.mode===3?'diagramBack':state.mode===1?'diagramDepth':'diagramFront'));
 setText('tutorial-note',t(state.mode===3?'tutorialHiddenNote':'tutorialNote'));
 $('guide-steps').setAttribute('aria-label',t('tutorialStep'));
 for(let i=0;i<3;i++){const id='tutorial-phase-'+i;setText(id,'0'+(i+1)+' '+mode.phaseLabels[i]);$(id).classList.toggle('active',i===phase);$(id).setAttribute('aria-pressed',String(i===phase));$(id).setAttribute('aria-label',mode.phases[i]);}
 setText('tutorial-toggle',t(state.tutorialPlaying?'tutorialPause':state.tutorialProgress>=1?'tutorialReplay':state.tutorialProgress>0?'tutorialResume':'tutorialPlay'));
 $('tutorial-toggle').setAttribute('aria-pressed',String(state.tutorialPlaying));
 $('tutorial-progress').style.width=(state.tutorialProgress*100)+'%';
}
function stopTutorial(){
 state.tutorialPlaying=false;cancelAnimationFrame(state.tutorialLoop);state.tutorialLoop=0;
 if(handGuide)renderTutorial();
}
function animateTutorial(now){
 if(!state.tutorialPlaying)return;
 if(!state.tutorialLastTime)state.tutorialLastTime=now;
 state.tutorialProgress=Math.min(1,state.tutorialProgress+Math.min(now-state.tutorialLastTime,100)/8000);
 state.tutorialLastTime=now;renderTutorial();
 if(state.tutorialProgress>=1){stopTutorial();return;}
 state.tutorialLoop=requestAnimationFrame(animateTutorial);
}
function toggleTutorial(){
 if(state.tutorialPlaying){stopTutorial();return;}
 stop();if(state.tutorialProgress>=1)state.tutorialProgress=0;
 state.tutorialLastTime=0;state.tutorialPlaying=true;renderTutorial();
 state.tutorialLoop=requestAnimationFrame(animateTutorial);
}
function selectMode(mode,focus=false){
 stop();stopTutorial();state.mode=mode;state.elapsed=0;state.tutorialProgress=0;
 handGuide=createHandGuide($('hand-guide'),mode);
 document.documentElement.style.setProperty('--accent',colors[mode]);
 document.querySelectorAll('.mode-tab').forEach((tab,i)=>{tab.classList.toggle('selected',i===mode);tab.setAttribute('aria-selected',String(i===mode));tab.tabIndex=i===mode?0:-1;});
 $('experiment').setAttribute('aria-labelledby','tab-'+mode);$('guide-index').textContent='0'+(mode+1)+' / 04';
 const info=content[state.language].modes[mode];$('guide-title').textContent=info.name;$('guide-subtitle').textContent=info.subtitle;$('attention-text').textContent=info.attention;
 renderHandInstructions();renderTutorial();renderObservation();renderReveal();updateStatus();if(focus)$('tab-'+mode).focus();
}
function renderObservation(){
 const selected=state.observations[state.mode]?.answer;
 $('observation-options').replaceChildren(...t('observationLabels').map((label,i)=>{
  const button=document.createElement('button');button.textContent=label;button.className=selected===i?'chosen':'';
  button.setAttribute('aria-pressed',String(selected===i));button.disabled=!state.reportable[state.mode];
  button.addEventListener('click',()=>recordObservation(i));return button;
 }));
 $('observation-feedback').textContent=selected!==undefined?t('feedback'):state.reportable[state.mode]?'':t('tryFirst');
 $('next').disabled=selected===undefined;$('next').textContent=t(state.mode===3?'finish':'next');
}
function recordObservation(answer){
 if(!state.reportable[state.mode])return;
 stop();stopTutorial();state.observations[state.mode]={answer,noise:state.dynamic?'dynamic':'still',input:state.input,grain:state.grain,rate:state.rate,contrast:state.contrast};
 save();renderObservation();renderPassport();
}
function renderPassport(){
 const count=state.observations.filter(Boolean).length;$('passport-count').textContent=count+' / 4';
 $('passport-title').textContent=t(count===4?'completeTitle':'passportTitle');$('passport-description').textContent=t(count===4?'completeDescription':'passportDescription');
 $('stamps').replaceChildren(...state.observations.map((entry,i)=>{
  const stamp=document.createElement('button');stamp.className='stamp'+(entry?' done':'');stamp.textContent=entry?'✓':'0'+(i+1);stamp.style.setProperty('--accent',colors[i]);
  stamp.setAttribute('aria-label',content[state.language].modes[i].name+(entry?' · '+t('saved')+' · '+t('observationLabels')[entry.answer]:''));
  stamp.title=stamp.getAttribute('aria-label');stamp.addEventListener('click',()=>{selectMode(i);$('experiment').scrollIntoView({block:'start',behavior:'auto'});});return stamp;
 }));
}
function renderReveal(){
 $('reveal-panel').hidden=!state.revealed;$('reveal').setAttribute('aria-expanded',String(state.revealed));$('reveal').textContent=t(state.revealed?'hideReveal':'reveal');
 if(state.revealed)$('reveal-panel').innerHTML='<h3>'+t('revealTitle')+'</h3><p>'+t('revealBody')+'</p><p>'+content[state.language].modes[state.mode].explanation+'</p><p>'+t('revealStatic')+'</p><p>'+t('noCapture')+'</p>';
}
function translate(){
 document.documentElement.lang=state.language==='zh'?'zh-CN':'en';document.title=t('title');
 document.querySelectorAll('[data-i18n]').forEach(element=>{element.innerHTML=t(element.dataset.i18n);});
 $('language').innerHTML=state.language==='en'?'EN <span>/ 中文</span>':'中文 <span>/ EN</span>';$('language').setAttribute('aria-label',t('languageLabel'));
 document.querySelector('.mode-tabs').setAttribute('aria-label',t('modeGroup'));document.querySelector('.segmented').setAttribute('aria-label',t('noiseGroup'));
 for(const [id,key]of[['noise','canvasLabel'],['grain','grainLabel'],['rate','rateLabel'],['contrast','contrastLabel'],['science-close','closeScience']])$(id).setAttribute('aria-label',t(key));
 $('fullscreen').setAttribute('aria-label',t(document.fullscreenElement?'exitFullscreen':'fullscreen'));
 document.querySelector('.skip-link').textContent=state.language==='en'?'Skip to experiment':'跳到实验';
 document.querySelector('.brand').setAttribute('aria-label',state.language==='en'?'Magnetic Sand home':'磁性沙粒首页');
 document.querySelector('nav').setAttribute('aria-label',state.language==='en'?'Main navigation':'主要导航');
 $('fullscreen').title=t(document.fullscreenElement?'exitFullscreen':'fullscreen');
 document.querySelector('.experience').setAttribute('aria-label',state.language==='en'?'Illusion playground':'错觉互动乐园');
 document.querySelectorAll('.mode-tab').forEach((tab,i)=>{tab.querySelector('b').textContent=content[state.language].modes[i].name;tab.querySelector('small').textContent=content[state.language].modes[i].scientific;});
 $('science-content').innerHTML=t('scienceHTML');selectMode(state.mode);renderPassport();renderReveal();updateFullscreenLabels();save();
}
function setDynamic(value){
 state.dynamic=value;state.measured=0;state.delivered=0;
 if(!value&&state.mode!==0)toast(t('stillCaveat'));updateStatus();
}
function updateSliders(){
 $('grain').value=String(grains.indexOf(state.grain)+1);$('rate').value=String(state.rate);$('contrast').value=String(state.contrast);
 $('grain-output').textContent=state.grain+' px';$('rate-output').textContent=state.rate+' Hz';$('contrast-output').textContent=state.contrast+'%';
 $('grain').setAttribute('aria-valuetext',state.grain+' CSS px');
}
function restoreSettings(){
 stop();stopTutorial();state.grain=2;state.rate=60;state.contrast=80;state.dynamic=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 updateSliders();resize();updateStatus();toast(t('resetToast'));
}
$('tutorial-toggle').addEventListener('click',toggleTutorial);
for(let i=0;i<3;i++)$('tutorial-phase-'+i).addEventListener('click',()=>{stop();stopTutorial();state.tutorialProgress=[0,.5,1][i];renderTutorial();});
$('guide-try').addEventListener('click',()=>{start();$('experiment').scrollIntoView({block:'start',behavior:'auto'});});
$('gate-tutorial').addEventListener('click',()=>{state.tutorialProgress=0;if(state.tutorialPlaying)stopTutorial();toggleTutorial();$('hand-guide-card').scrollIntoView({block:'center',behavior:'auto'});});
$('start').addEventListener('click',start);$('still-start').addEventListener('click',()=>{setDynamic(false);start();});
$('play').addEventListener('click',()=>state.running?stop():start());$('quick-stop').addEventListener('click',()=>stop());
$('dynamic').addEventListener('click',()=>setDynamic(true));$('static').addEventListener('click',()=>setDynamic(false));
document.querySelectorAll('.mode-tab').forEach((tab,i)=>{
 tab.addEventListener('click',()=>selectMode(i));tab.addEventListener('keydown',event=>{
  if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();selectMode(event.key==='Home'?0:event.key==='End'?3:(i+(event.key==='ArrowRight'?1:3))%4,true);}
 });
});
$('next').addEventListener('click',()=>{
 if(state.mode<3){selectMode(state.mode+1,true);$('experiment').scrollIntoView({block:'start',behavior:'auto'});}
 else if(state.observations.every(Boolean)){stop();toast(t('completeToast'));document.querySelector('.passport').scrollIntoView({block:'center',behavior:'auto'});}
 else selectMode(state.observations.findIndex(v=>!v),true);
});
for(const id of['grain','rate','contrast'])$(id).addEventListener('input',()=>{
 state[id]=id==='grain'?grains[Number($(id).value)-1]:Number($(id).value);updateSliders();
 if(id==='grain')resize();if(id==='contrast')drawNoise();
 if(id==='rate'){state.lastNoise=performance.now();state.measureStart=performance.now();state.delivered=0;state.measured=0;}updateStatus();
});
$('preset').addEventListener('click',restoreSettings);$('reset').addEventListener('click',restoreSettings);
$('restart').addEventListener('click',()=>{stop();state.observations.fill(null);state.reportable.fill(false);save();selectMode(0);renderPassport();toast(t('restartToast'));});
$('reveal').addEventListener('click',()=>{stop();stopTutorial();state.revealed=!state.revealed;renderReveal();});
for(const id of['science-open','science-more'])$(id).addEventListener('click',()=>{stop();stopTutorial();$('science-dialog').showModal();});
$('science-close').addEventListener('click',()=>$('science-dialog').close());
$('science-dialog').addEventListener('click',event=>{
 if(event.target===$('science-dialog')){const r=$('science-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('science-dialog').close();}
});
$('language').addEventListener('click',()=>{stop();stopTutorial();state.language=state.language==='en'?'zh':'en';translate();});
$('fullscreen').addEventListener('click',async()=>{
 stopTutorial();try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experiment').requestFullscreen();}
 catch{toast(state.language==='en'?'Fullscreen is unavailable here. Try a larger browser window.':'此浏览器无法全屏，可尝试放大窗口。');}
});
$('guide-expand').addEventListener('click',async()=>{
 stop();try{if(document.fullscreenElement)await document.exitFullscreen();else await $('hand-guide-card').requestFullscreen();}
 catch{toast(t('guideFullscreenUnavailable'));}
});
function updateFullscreenLabels(){
 const noiseFull=document.fullscreenElement===$('experiment'),guideFull=document.fullscreenElement===$('hand-guide-card');
 $('fullscreen').setAttribute('aria-label',t(noiseFull?'exitFullscreen':'fullscreen'));
 $('fullscreen').title=t(noiseFull?'exitFullscreen':'fullscreen');
 $('guide-expand').setAttribute('aria-label',t(guideFull?'exitGuideFullscreen':'guideFullscreen'));
 $('guide-expand').title=t(guideFull?'exitGuideFullscreen':'guideFullscreen');
}
document.addEventListener('fullscreenchange',()=>{resize();updateFullscreenLabels();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state.running)stop(t('hiddenPause'));stopTutorial();}});window.addEventListener('pagehide',()=>{stop();stopTutorial();});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){stop();stopTutorial();return;}
 if($('science-dialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target.tagName))return;
 if(event.code==='Space'){event.preventDefault();state.running?stop():start();}

});
new ResizeObserver(resize).observe($('noise-viewport'));translate();updateSliders();resize();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)toast(t('reduced'));
// Optional agent tools use the same interface actions; selecting never starts flicker.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tools=[
  {name:'read_illusion_state',title:'Read illusion state',description:'Read the chosen experiment, playback, frame index, settings and number of local observations.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){return{mode:state.mode+1,input:state.input,running:state.running,frame:state.frame,elapsed:state.elapsed,dynamic:state.dynamic,grain:state.grain,rate:state.rate,contrast:state.contrast,tutorialPlaying:state.tutorialPlaying,completed:state.observations.filter(Boolean).length};}},
  {name:'select_illusion',title:'Choose an illusion',description:'Choose one of four experiments. Pauses noise. Does not start flicker or record an observation.',inputSchema:{type:'object',properties:{mode:{type:'integer',minimum:1,maximum:4}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.mode)||input.mode<1||input.mode>4)throw new Error('mode must be an integer from 1 to 4');selectMode(input.mode-1);return{mode:state.mode+1,name:content[state.language].modes[state.mode].name,running:state.running};}}
 ];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

