/** A shared orthographic camera for the monitor, hand plane and depth motion. */
export function createGuideProjection(cx = 226, cy = 122) {
  const yaw = 38 * Math.PI / 180, pitch = 12 * Math.PI / 180;
  const x = [Math.cos(yaw), Math.sin(yaw) * Math.sin(pitch)];
  const y = [0, Math.cos(pitch)];
  const z = [-Math.sin(yaw), Math.cos(yaw) * Math.sin(pitch)];
  const point = (u, v, depth = 0) => [cx + u*x[0] + v*y[0] + depth*z[0], cy + u*x[1] + v*y[1] + depth*z[1]];
  const matrix = (u, v, depth = 0, horizontal = false) => {
    const p = point(u,v,depth);
    return `matrix(${horizontal ? -y[0] : x[0]} ${horizontal ? -y[1] : x[1]} ${horizontal ? x[0] : y[0]} ${horizontal ? x[1] : y[1]} ${p[0]} ${p[1]})`;
  };
  return { x, y, z, point, matrix };
}

/** Instructional scenes only. These images are never part of the noise stimulus. */
export function createHandGuide(container, mode) {
  const assets = ['hand-open-v3.webp', 'hand-closed-v3.webp', 'hand-point-v3.webp', 'hand-palm-v4.webp'];
  const chinese = document.documentElement.lang.startsWith('zh');
  const words = chinese
    ? { screen: '屏幕', farther: '远离', nearer: '靠近', reveal: '透视查看手的位置', hide: '恢复不透明屏幕', cutaway: '透视示意：掌心朝向参与者', opaque: '不透明屏幕：手被遮住' }
    : { screen: 'SCREEN', farther: 'AWAY', nearer: 'TOWARD', reveal: 'See through the screen', hide: 'Make the screen opaque', cutaway: 'See-through setup · palm faces you', opaque: 'Opaque monitor · hand hidden' };
  const projection = createGuideProjection(mode === 3 ? 180 : 226, mode === 3 ? 126 : 122);
  const id = `hand-scene-${mode}`;
  const speckles = Array.from({ length: 44 }, (_, n) => {
    const x = (n * 17 + 3) % 48, y = (n * 29 + 7) % 48;
    return `<rect x="${x}" y="${y}" width="${n % 3 + 1}" height="2" fill="${n % 2 ? '#e5e5e7' : '#111113'}" opacity=".38"/>`;
  }).join('');
  const defs = `<defs>
    <linearGradient id="${id}-frame" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e0e0e3"/><stop offset=".43" stop-color="#a3a3aa"/><stop offset="1" stop-color="#73737b"/></linearGradient>
    <linearGradient id="${id}-glass" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#343438"/><stop offset="1" stop-color="#1d1d20"/></linearGradient>
    <linearGradient id="${id}-stand" x1="0" x2="1"><stop stop-color="#96969d"/><stop offset=".45" stop-color="#e4e4e7"/><stop offset="1" stop-color="#a8a8ae"/></linearGradient>
    <pattern id="${id}-grain" width="48" height="48" patternUnits="userSpaceOnUse">${speckles}</pattern>
    <filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".14"/></filter>
    <marker id="${id}-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="scene-arrowhead" d="M1 1L6 4L1 7" fill="none" stroke-width="1.5" stroke-linejoin="round"/></marker>
  </defs>`;
  const text = (x, y, value, extra = '') => `<text x="${x}" y="${y}" class="scene-label" ${extra}>${value}</text>`;
  const photo = (file, pose = '', size = 190, fingertip = false) => `<image ${pose ? `data-pose="${pose}"` : ''} href="${file}" x="${-size * (fingertip ? 215 / 512 : .5)}" y="${fingertip ? -size * 17 / 512 : 0}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" filter="url(#${id}-shadow)"/>`;
  const wristPhoto = (file, pose = '', size = 196, palm = false) => `<image ${pose ? `data-pose="${pose}"` : ''} href="${file}" x="${-size * (palm ? 252 : 267) / 512}" y="${-size * (palm ? 367 : 368) / 512}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  const frontScreen = `<g class="scene-device">
    <path d="M166 224H194L198 249H162Z" fill="url(#${id}-stand)"/>
    <path d="M130 250Q180 243 230 250L232 255H128Z" fill="#b8b8bf"/>
    <rect x="24" y="23" width="312" height="207" rx="12" fill="url(#${id}-frame)"/>
    <rect x="27" y="26" width="306" height="201" rx="9" fill="#151517"/>
    <rect x="33" y="32" width="294" height="188" rx="5" fill="url(#${id}-glass)"/>
    <rect x="33" y="32" width="294" height="188" rx="5" fill="url(#${id}-grain)" opacity=".33"/>
    <path d="M42 37H308" stroke="#dedee3" opacity=".15"/>
  </g>`;
  const polygon = (points, fill, extra = '') => `<polygon points="${points.map(p => projection.point(...p).join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
  const projectedScreen = (hidden = false) => `<g class="scene-device">
    ${polygon([[-11,70,-9],[11,70,-9],[15,113,-9],[-15,113,-9]], `url(#${id}-stand)`)}
    ${polygon([[-47,113,-29],[47,113,-29],[47,113,27],[-47,113,27]], '#b5b5bd')}
    <g data-screen-cover ${hidden ? 'opacity=".22"' : ''}>
      ${polygon([[-116,-75,0],[-116,-75,-6],[-116,75,-6],[-116,75,0]], '#919199')}
      <g transform="${projection.matrix(0,0)}">
        <rect x="-116" y="-75" width="232" height="150" rx="7" fill="url(#${id}-frame)"/>
        <rect x="-113" y="-72" width="226" height="144" rx="5" fill="#17171a"/>
        <rect x="-108" y="-67" width="216" height="134" rx="3" fill="url(#${id}-glass)"/>
        <rect x="-108" y="-67" width="216" height="134" rx="3" fill="url(#${id}-grain)" opacity=".3"/>
      </g>
    </g>
    <rect transform="${projection.matrix(0,0)}" x="-116" y="-75" width="232" height="150" rx="7" fill="none" stroke="#96969e" stroke-width="1.5"/>
  </g>`;
  const arrow = (path, extra = '') => `<path d="${path}" class="scene-arrow" fill="none" marker-end="url(#${id}-arrow)" ${extra}/>`;
  let scene;
  if (mode === 0) {
    scene = `${frontScreen}
      <path d="M177 56C229 40 231 81 182 90C130 103 136 139 183 143" class="scene-teaching-path"/>
      <g data-hand>${photo(assets[2], '', 185, true)}</g>`;
  } else if (mode === 1) {
    scene = `${projectedScreen()}
      ${text(246, 28, words.screen, 'text-anchor="middle"')}
      <g class="scene-depth-axis">
        ${arrow(`M${projection.point(-36,128,143)}L${projection.point(-36,128,42)}`, 'data-toward')}
        ${arrow(`M${projection.point(-36,143,42)}L${projection.point(-36,143,143)}`, 'data-away')}
        ${text(90, 290, words.farther, 'text-anchor="middle"')}${text(192, 265, words.nearer, 'text-anchor="middle"')}
      </g>
      <g data-hand>${wristPhoto(assets[1], 'closed')}${wristPhoto(assets[0], 'open')}</g>`;
  } else if (mode === 2) {
    scene = `${frontScreen}
      <g class="scene-small-motion">
        ${arrow('M145 47H112', 'data-left')}${arrow('M215 47H248', 'data-right')}
      </g>
      <g data-hand>${photo(assets[0], '', 198)}</g>`;
  } else {
    scene = `<g data-hand>${wristPhoto(assets[3], '', 176, true)}</g>
      ${projectedScreen(true)}
      ${text(180, 24, words.screen, 'text-anchor="middle"')}
      <g class="scene-hidden-motion">
        ${arrow('M66 116V72', 'data-up')}${arrow('M66 150V194', 'data-down')}
      </g>`;
  }
  container.dataset.scene = ['trace', 'depth', 'lateral', 'hidden'][mode];
  container.innerHTML = `<svg class="hand-scene" viewBox="0 0 360 306" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${defs}${scene}</svg>${mode === 3 ? `<div class="scene-cutaway-controls"><p class="scene-view-caption" aria-live="polite">${words.cutaway}</p><button type="button" class="scene-cutaway-toggle" aria-pressed="true">${words.hide}</button></div>` : ''}`;
  if(mode === 3) {
    const button = container.querySelector('.scene-cutaway-toggle');
    let cutaway = true;
    button.addEventListener('click', () => {
      cutaway = !cutaway;
      container.querySelector('[data-screen-cover]').setAttribute('opacity', cutaway ? '.22' : '1');
      container.querySelector('.scene-view-caption').textContent = cutaway ? words.cutaway : words.opaque;
      button.textContent = cutaway ? words.hide : words.reveal;
      button.setAttribute('aria-pressed', String(cutaway));
    });
  }
  const hand = container.querySelector('[data-hand]');
  const open = container.querySelector('[data-pose="open"]');
  const closed = container.querySelector('[data-pose="closed"]');
  const cue = name => container.querySelector(`[data-${name}]`);
  const ease = value => { const n = Math.max(0, Math.min(1, value)); return n * n * (3 - 2 * n); };
  const emphasize = (first, second, phase) => {
    first?.setAttribute('opacity', phase === 1 ? '1' : '.35');
    second?.setAttribute('opacity', phase === 2 ? '1' : '.35');
  };
  function render(progress = 0) {
    const p = Math.max(0, Math.min(1, progress));
    const phase = p < .18 ? 0 : p < (mode === 0 ? .85 : mode === 1 ? .58 : .51) ? 1 : 2;
    if (mode === 0) {
      const t = ease((p - .18) / .67);
      const u = t < .5 ? t * 2 : (t - .5) * 2, b = 1 - u;
      const points = t < .5 ? [[177, 56], [229, 40], [231, 81], [182, 90]] : [[182, 90], [130, 103], [136, 139], [183, 143]];
      const coordinate = dimension => b ** 3 * points[0][dimension] + 3 * b ** 2 * u * points[1][dimension] + 3 * b * u ** 2 * points[2][dimension] + u ** 3 * points[3][dimension];
      const x = coordinate(0), y = coordinate(1);
      hand.setAttribute('transform', `translate(${x},${y})`);
    } else if (mode === 1) {
      const closer = p < .58 ? ease((p - .18) / .4) : 1 - ease((p - .58) / .4);
      const pose = p < .58 ? ease((p - .24) / .08) : 1 - ease((p - .75) / .08);
      // The hand stays parallel to the screen and moves along its normal.
      // Positive depth is in front of the screen; 32 leaves a visible gap.
      hand.setAttribute('transform', projection.matrix(-50,60,156 - closer*124));
      open.setAttribute('opacity', String(pose));
      closed.setAttribute('opacity', String(1 - pose));
      emphasize(cue('toward'), cue('away'), phase);
    } else if (mode === 2) {
      const x = p < .51 ? 180 - 16 * ease((p - .18) / .33) : 164 + 32 * ease((p - .51) / .39);
      hand.setAttribute('transform', `translate(${x},47)`);
      emphasize(cue('left'), cue('right'), phase);
    } else {
      const y = p < .51 ? -18 * ease((p - .18) / .33) : -18 + 36 * ease((p - .51) / .39);
      // Negative depth stays behind the monitor. The palm faces its front;
      // image rotation is in the screen plane, keeping the forearm sideways.
      hand.setAttribute('transform', projection.matrix(90,y+8,-26,true));
      emphasize(cue('up'), cue('down'), phase);
    }
    return phase;
  }
  render();
  return { render };
}
