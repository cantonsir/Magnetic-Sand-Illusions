import { noiseFrame } from './noise.js';
import { content } from './content.js';
const $ = id => document.getElementById(id);
const grains = [1,2,4,8,16], colors = ['#edc77a','#ee9b8f','#89d9cd','#b2a4ee'];
const storageKey = 'magnetic-sand-playground-v1';
let persisted = {};
try { persisted=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}; } catch {}
const observations = Array.from({length:4},(_,i)=>{
  const v=persisted.observations?.[i]; return v&&Number.isInteger(v.answer)&&v.answer>=0&&v.answer<=3?v:null;
});
const state={
 language:persisted.language==='zh'?'zh':persisted.language==='en'?'en':navigator.language?.startsWith('zh')?'zh':'en',
 mode:0,input:'pointer',started:false,running:false,dynamic:!matchMedia('(prefers-reduced-motion: reduce)').matches,
 grain:2,rate:60,contrast:80,seed:0x6d2b79f5,frame:0,position:{x:.5,y:.5},
 elapsed:0,lastTime:0,lastNoise:0,delivered:0,measured:0,measureStart:0,
 reportable:[false,false,false,false],observations,revealed:false,loop:0
};
const ctx=$('noise').getContext('2d',{alpha:false}), overlay=$('occluder').getContext('2d');
const t=key=>content[state.language][key];
function save(){try{localStorage.setItem(storageKey,JSON.stringify({language:state.language,observations:state.observations}));}catch{}}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},5000);}
function drawNoise(){
 const c=$('noise');ctx.putImageData(new ImageData(noiseFrame(c.width,c.height,state.seed,state.frame,state.contrast),c.width,c.height),0,0);
}
function resize(){
 const r=$('noise-viewport').getBoundingClientRect();if(r.width<1||r.height<1)return;
 $('noise').width=Math.max(1,Math.ceil(r.width/state.grain));$('noise').height=Math.max(1,Math.ceil(r.height/state.grain));
 const dpr=Math.min(devicePixelRatio||1,2);
 $('occluder').width=Math.round(r.width*dpr);$('occluder').height=Math.round(r.height*dpr);overlay.setTransform(dpr,0,0,dpr,0,0);
 drawNoise();drawOverlay();
}
function drawOverlay(){
 const r=$('noise-viewport').getBoundingClientRect();overlay.clearRect(0,0,r.width,r.height);
 if(!state.started||state.input==='hand'||state.mode===1)return;
 if(state.mode===3){
  const pad=$('ghost-pad');$('ghost-dot').style.left=Math.max(16,Math.min(pad.clientWidth-16,state.position.x*pad.clientWidth))+'px';
  $('ghost-dot').style.top=Math.max(50,Math.min(pad.clientHeight-45,state.position.y*pad.clientHeight))+'px';return;
 }
 overlay.fillStyle='#909090';overlay.beginPath();overlay.arc(state.position.x*r.width,state.position.y*r.height,state.mode===2?22:15,0,Math.PI*2);overlay.fill();
}
function updateStatus(){
 const seconds=String(Math.floor(state.elapsed/1000)).padStart(2,'0');
 $('status-text').textContent=!state.started?t('ready'):state.running?t(state.dynamic?'running':'still')+' · 00:'+seconds+' / 00:45':t('paused');
 $('status-light').classList.toggle('running',state.running);
 $('play').innerHTML=(state.running?'Ⅱ':'▶')+' <span>'+t(state.running?'pause':'play')+'</span>';
 $('play').setAttribute('aria-label',t(state.running?'pause':'play'));
 $('quick-stop').hidden=!state.running;$('quick-stop').textContent=t('pause');
 for(const id of ['dynamic','static']){const active=id==='dynamic'?state.dynamic:!state.dynamic;$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
 $('rate-note').textContent=t('rateNote')+(state.dynamic&&state.measured?' '+state.measured+' Hz '+t('measured')+'.':'');
 $('condition-note').hidden=state.dynamic||state.mode===0;
 $('condition-note').textContent=t('stillCaveat');
}
function stop(reason){state.running=false;cancelAnimationFrame(state.loop);state.loop=0;updateStatus();if(reason)toast(reason);}
function start(){
 if($('science-dialog').open)return;
 state.started=true;state.running=true;state.reportable[state.mode]=true;state.elapsed=0;state.lastTime=0;state.lastNoise=0;
 state.delivered=0;state.measured=0;state.measureStart=0;$('stage-gate').hidden=true;
 cancelAnimationFrame(state.loop);state.loop=requestAnimationFrame(animate);drawOverlay();renderObservation();updateStatus();
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
 if(state.input==='auto'){
  const p=state.elapsed/1000;
  if(state.mode===0)state.position={x:.5+Math.sin(p*.72)*.28,y:.5+Math.sin(p*1.44)*.22};
  if(state.mode===2)state.position={x:.5+Math.sin(p*.9)*.085,y:.5};
  if(state.mode===3)state.position={x:.5,y:.5+Math.sin(p*.65)*.31};
  drawOverlay();
 }
 if(now-state.measureStart>=1500){state.measured=Math.round(state.delivered*1000/(now-state.measureStart));state.delivered=0;state.measureStart=now;}
 updateStatus();state.loop=requestAnimationFrame(animate);
}
function updateInput(){
 if(state.mode===1)state.input='hand';
 $('input-mode').value=state.input;$('input-mode').options[0].disabled=state.mode===1;$('input-mode').options[1].disabled=state.mode===1;
 $('ghost-pad').hidden=state.mode!==3||state.input==='hand';$('noise-viewport').style.cursor=state.input==='hand'?'default':'none';
 const instructions=content[state.language].modes[state.mode][state.input];
 $('instructions').replaceChildren(...instructions.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
 $('ready-body').textContent=instructions.slice(1).join(' ');
 $('adaptation-note').textContent=t(state.input==='hand'?'handNote':state.input==='auto'?'autoNote':'adaptation');
 document.querySelector('[data-i18n="signal"]').textContent=t(state.input==='hand'?'signalHand':'signal');
 const help=t(state.input==='hand'?'handHelp':state.mode===3?'hiddenHelp':'pauseHelp');
 $('noise-viewport').setAttribute('aria-description',help);$('noise-viewport').tabIndex=state.input==='hand'?-1:0;
 $('noise-viewport').setAttribute('role','application');$('noise-viewport').setAttribute('aria-label',content[state.language].modes[state.mode].name+' — '+help);
 $('stage').dataset.help=help;resize();
}
function selectMode(mode,focus=false){
 stop();state.mode=mode;state.input=mode===1?'hand':'pointer';state.position={x:.5,y:.5};state.elapsed=0;
 document.documentElement.style.setProperty('--accent',colors[mode]);
 document.querySelectorAll('.mode-tab').forEach((tab,i)=>{tab.classList.toggle('selected',i===mode);tab.setAttribute('aria-selected',String(i===mode));tab.tabIndex=i===mode?0:-1;});
 $('experiment').setAttribute('aria-labelledby','tab-'+mode);$('guide-index').textContent='0'+(mode+1)+' / 04';
 const info=content[state.language].modes[mode];$('guide-title').textContent=info.name;$('guide-subtitle').textContent=info.subtitle;$('attention-text').textContent=info.attention;
 updateInput();renderObservation();renderReveal();updateStatus();if(focus)$('tab-'+mode).focus();
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
 stop();state.observations[state.mode]={answer,noise:state.dynamic?'dynamic':'still',input:state.input,grain:state.grain,rate:state.rate,contrast:state.contrast};
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
 ['pointer','auto','hand'].forEach((key,i)=>{$('input-mode').options[i].text=t(key);});
 document.querySelector('.mode-tabs').setAttribute('aria-label',t('modeGroup'));document.querySelector('.segmented').setAttribute('aria-label',t('noiseGroup'));
 for(const [id,key]of[['noise','canvasLabel'],['ghost-pad','ghostLabel'],['grain','grainLabel'],['rate','rateLabel'],['contrast','contrastLabel'],['science-close','closeScience']])$(id).setAttribute('aria-label',t(key));
 $('fullscreen').setAttribute('aria-label',t(document.fullscreenElement?'exitFullscreen':'fullscreen'));
 document.querySelector('.skip-link').textContent=state.language==='en'?'Skip to experiment':'跳到实验';
 document.querySelector('.brand').setAttribute('aria-label',state.language==='en'?'Magnetic Sand home':'磁性沙粒首页');
 document.querySelector('nav').setAttribute('aria-label',state.language==='en'?'Main navigation':'主要导航');
 $('fullscreen').title=t(document.fullscreenElement?'exitFullscreen':'fullscreen');
 document.querySelector('.experience').setAttribute('aria-label',state.language==='en'?'Illusion playground':'错觉互动乐园');
 document.querySelectorAll('.mode-tab').forEach((tab,i)=>{tab.querySelector('b').textContent=content[state.language].modes[i].name;tab.querySelector('small').textContent=content[state.language].modes[i].scientific;});
 $('science-content').innerHTML=t('scienceHTML');const input=state.input;selectMode(state.mode);state.input=input;updateInput();renderPassport();renderReveal();save();
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
 stop();state.grain=2;state.rate=60;state.contrast=80;state.dynamic=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 updateSliders();resize();updateStatus();toast(t('resetToast'));
}
function pointer(event){
 if(!state.started||state.input!=='pointer'||state.mode===1)return;
 const element=state.mode===3?$('ghost-pad'):$('noise-viewport');if(event.currentTarget!==element)return;
 const r=element.getBoundingClientRect();state.position={x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))};drawOverlay();
}
for(const element of[$('noise-viewport'),$('ghost-pad')]){
 element.addEventListener('pointermove',pointer);
 element.addEventListener('pointerdown',event=>{if(state.input==='pointer'){element.setPointerCapture(event.pointerId);pointer(event);}});
}
$('ghost-pad').tabIndex=0;
$('start').addEventListener('click',start);$('still-start').addEventListener('click',()=>{setDynamic(false);start();});
$('play').addEventListener('click',()=>state.running?stop():start());$('quick-stop').addEventListener('click',()=>stop());
$('dynamic').addEventListener('click',()=>setDynamic(true));$('static').addEventListener('click',()=>setDynamic(false));
$('input-mode').addEventListener('change',()=>{stop();state.input=$('input-mode').value;updateInput();});
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
$('preset').addEventListener('click',restoreSettings);$('reset').addEventListener('click',()=>{restoreSettings();state.position={x:.5,y:.5};drawOverlay();});
$('restart').addEventListener('click',()=>{stop();state.observations.fill(null);state.reportable.fill(false);save();selectMode(0);renderPassport();toast(t('restartToast'));});
$('reveal').addEventListener('click',()=>{stop();state.revealed=!state.revealed;renderReveal();});
for(const id of['science-open','science-more'])$(id).addEventListener('click',()=>{stop();$('science-dialog').showModal();});
$('science-close').addEventListener('click',()=>$('science-dialog').close());
$('science-dialog').addEventListener('click',event=>{
 if(event.target===$('science-dialog')){const r=$('science-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('science-dialog').close();}
});
$('language').addEventListener('click',()=>{stop();state.language=state.language==='en'?'zh':'en';translate();});
$('fullscreen').addEventListener('click',async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experiment').requestFullscreen();}
 catch{toast(state.language==='en'?'Fullscreen is unavailable here. Try a larger browser window.':'此浏览器无法全屏，可尝试放大窗口。');}
});
document.addEventListener('fullscreenchange',()=>{resize();$('fullscreen').setAttribute('aria-label',t(document.fullscreenElement?'exitFullscreen':'fullscreen'));});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.running)stop(t('hiddenPause'));});window.addEventListener('pagehide',()=>stop());
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){stop();return;}
 if($('science-dialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target.tagName))return;
 if(event.code==='Space'){event.preventDefault();state.running?stop():start();}
 if(state.input==='pointer'&&state.started&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
  if(event.target!==$('noise-viewport')&&event.target!==$('ghost-pad'))return;event.preventDefault();
  if(event.key==='ArrowLeft')state.position.x-=.025;if(event.key==='ArrowRight')state.position.x+=.025;
  if(event.key==='ArrowUp')state.position.y-=.025;if(event.key==='ArrowDown')state.position.y+=.025;
  state.position.x=Math.max(.02,Math.min(.98,state.position.x));state.position.y=Math.max(.02,Math.min(.98,state.position.y));drawOverlay();
 }
});
new ResizeObserver(resize).observe($('noise-viewport'));translate();updateSliders();resize();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)toast(t('reduced'));
// Optional agent tools use the same interface actions; selecting never starts flicker.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tools=[
  {name:'read_illusion_state',title:'Read illusion state',description:'Read the chosen experiment, playback, settings and number of local observations.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){return{mode:state.mode+1,input:state.input,running:state.running,dynamic:state.dynamic,grain:state.grain,rate:state.rate,contrast:state.contrast,completed:state.observations.filter(Boolean).length};}},
  {name:'select_illusion',title:'Choose an illusion',description:'Choose one of four experiments. Pauses noise. Does not start flicker or record an observation.',inputSchema:{type:'object',properties:{mode:{type:'integer',minimum:1,maximum:4}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.mode)||input.mode<1||input.mode>4)throw new Error('mode must be an integer from 1 to 4');selectMode(input.mode-1);return{mode:state.mode+1,name:content[state.language].modes[state.mode].name,running:state.running};}}
 ];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

