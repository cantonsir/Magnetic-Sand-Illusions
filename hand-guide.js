/** A separate instructional diagram. Never drawn into the noise stimulus. */
export function createHandGuide(container, mode) {
  const hand = `
    <g class="guide-hand" stroke="#b88758" stroke-width="1.6" stroke-linejoin="round">
      <path d="M-21 55 L-22 102 Q0 109 23 102 L22 55" fill="#dbaa76"/>
      <path d="M-35-8 Q-41 3-37 30 Q-34 57-20 65 Q1 75 24 58 Q35 44 35 5 L30-10Z" fill="#f2c997"/>
      ${[-26,-9,9,26].map((x,i)=>`<g data-finger="${i}" transform="translate(${x},-5)"><path d="M-7 3V-${[57,70,61,43][i]}Q-7-${[70,83,74,56][i]} 0-${[70,83,74,56][i]}Q7-${[70,83,74,56][i]} 7-${[57,70,61,43][i]}V3" fill="#f2c997"/>${mode===1||mode===2?`<rect x="-4" y="-${[64,77,68,50][i]}" width="8" height="11" rx="3" fill="#fae0c4" stroke="#cd9e72" stroke-width="1"/>`:'<path d="M-5-18H5" opacity=".35" fill="none"/>'}</g>`).join('')}
      <path data-thumb="open" d="M-32 17 Q-49-7-61 1 Q-68 7-61 18 L-40 48 Q-29 56-19 42" fill="#f2c997"/>
      <path data-thumb="closed" d="M-32 10 Q-37-5-24-6 L8 10 Q21 15 12 28 L-14 35 Q-25 34-31 27" fill="#efbf89" opacity="0"/>
      ${mode===1||mode===2?'<path d="M-15 51L-21 11M1 54L-2 10M14 46L17 10" opacity=".16" fill="none"/>':'<path d="M-18 45Q-3 38 14 42M-11 20Q0 12 17 15" opacity=".3" fill="none"/>'}
    </g>`;
  const screen = `<g class="guide-screen"><rect x="52" y="27" width="248" height="145" rx="10" fill="#0c1624" stroke="#72849a" stroke-width="2"/><rect x="59" y="34" width="234" height="131" rx="5" fill="${mode===3?'#263446':'#1d2b3d'}"/><path d="M154 173V185M136 186H176" stroke="#72849a" stroke-width="3" stroke-linecap="round"/>${mode===3?'<path d="M174 91h-36v25h36z" fill="none" stroke="#536983" stroke-width="1.5"/>':'<path d="M74 51H94M111 51H131M148 51H168M185 51H205M222 51H242M259 51H279M74 75H94M111 75H131M148 75H168M185 75H205M222 75H242M259 75H279M74 99H94M111 99H131M148 99H168M185 99H205M222 99H242M259 99H279M74 123H94M111 123H131M148 123H168M185 123H205M222 123H242M259 123H279M74 147H94M111 147H131M148 147H168M185 147H205M222 147H242M259 147H279" stroke="#627a97" stroke-width="2" opacity=".3"/>'}</g>`;
  container.innerHTML=`<svg viewBox="0 0 352 216" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="guide-glow"><stop stop-color="#293a51" stop-opacity=".8"/><stop offset="1" stop-color="#162031" stop-opacity="0"/></radialGradient></defs><ellipse cx="176" cy="115" rx="164" ry="102" fill="url(#guide-glow)"/>${screen}<g data-hand-root>${hand}</g></svg>`;
  const root=container.querySelector('[data-hand-root]');
  const fingers=[...container.querySelectorAll('[data-finger]')];
  const openThumb=container.querySelector('[data-thumb="open"]'),closedThumb=container.querySelector('[data-thumb="closed"]');
  const ease=x=>{const n=Math.max(0,Math.min(1,x));return n*n*(3-2*n);};
  function render(progress=0) {
    const p=Math.max(0,Math.min(1,progress));
    let x=176,y=137,scale=.66,open=1;
    if(mode===0){
      const path=ease((p-.17)/.68);
      x=176+36*Math.sin(path*Math.PI*2);y=93+path*49;scale=.62;
    }
    if(mode===1){
      open=p<.18?0:p<.58?ease((p-.18)/.4):1-ease((p-.58)/.4);
      scale=.46+open*.29;y=140+open*4;
    }
    if(mode===2){
      x=p<.51?176-19*ease((p-.18)/.33):157+38*ease((p-.51)/.33);y=139;
    }
    if(mode===3){
      y=p<.51?138-22*ease((p-.18)/.33):116+44*ease((p-.51)/.33);scale=.64;
    }
    root.setAttribute('transform',`translate(${x},${y}) scale(${scale})`);
    fingers.forEach((finger,i)=>{
      const extended=mode===0?(i===0?1:.18):.2+open*.8;
      const spread=mode===0?0:(open-.25)*[-12,-3,4,13][i];
      finger.setAttribute('transform',`translate(${[-26,-9,9,26][i]},-5) rotate(${spread}) scale(1,${extended})`);
    });
    openThumb.setAttribute('opacity',mode===0?'.25':String(open));
    closedThumb.setAttribute('opacity',mode===0?'1':String(1-open));
    return p<.18?0:p<(mode===0?.85:mode===1?.58:.51)?1:2;
  }
  render();
  return {render};
}
