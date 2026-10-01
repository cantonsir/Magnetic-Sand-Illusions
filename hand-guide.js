/** Instructional scenes only. These images are never part of the noise stimulus. */
export function createHandGuide(container, mode) {
  const assets = ['hand-open-v3.webp', 'hand-closed-v3.webp', 'hand-point-v3.webp', 'hand-palm-v4.webp'];
  const chinese = document.documentElement.lang.startsWith('zh');
  const words = chinese
    ? { screen: '屏幕', farther: '远一些', nearer: '靠近', you: '你的视线', behind: '手藏在屏幕后', palm: '掌心朝向你' }
    : { screen: 'SCREEN', farther: 'FARTHER', nearer: 'CLOSER', you: 'YOUR VIEW', behind: 'HAND BEHIND SCREEN', palm: 'PALM FACING YOU' };
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
  const frontScreen = `<g class="scene-device">
    <path d="M166 224H194L198 249H162Z" fill="url(#${id}-stand)"/>
    <path d="M130 250Q180 243 230 250L232 255H128Z" fill="#b8b8bf"/>
    <rect x="24" y="23" width="312" height="207" rx="12" fill="url(#${id}-frame)"/>
    <rect x="27" y="26" width="306" height="201" rx="9" fill="#151517"/>
    <rect x="33" y="32" width="294" height="188" rx="5" fill="url(#${id}-glass)"/>
    <rect x="33" y="32" width="294" height="188" rx="5" fill="url(#${id}-grain)" opacity=".33"/>
    <path d="M42 37H308" stroke="#dedee3" opacity=".15"/>
  </g>`;
  const sideScreen = (left = 214, rear = false) => {
    const right = left + 69;
    return `<g class="scene-device ${rear ? 'scene-occluding-device' : ''}">
      <path d="M${left + 26} 216L${left + 29} 250L${left + 46} 255L${left + 44} 220Z" fill="url(#${id}-stand)"/>
      <path d="M${left + 8} 255L${left + 58} 269L${left + 79} 260L${left + 32} 248Z" fill="#b5b5bd"/>
      <path d="M${left - 5} 34L${right} 58L${right} 233L${left - 5} 209Z" fill="#a3a3ab" stroke="#cfcfd4" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M${left} 37L${right - 4} 58L${right - 4} 226L${left} 205Z" fill="#202024" stroke="#74747c" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M${left + 5} 46L${right - 9} 63L${right - 9} 215L${left + 5} 198Z" fill="url(#${id}-glass)"/>
      <path d="M${left + 5} 46L${right - 9} 63L${right - 9} 215L${left + 5} 198Z" fill="url(#${id}-grain)" opacity=".32"/>
      <path d="M${left - 5} 34V209" stroke="#eeeeef" opacity=".6"/>
    </g>`;
  };
  const arrow = (path, extra = '') => `<path d="${path}" class="scene-arrow" fill="none" marker-end="url(#${id}-arrow)" ${extra}/>`;
  let scene;
  if (mode === 0) {
    scene = `${frontScreen}
      <path d="M177 56C229 40 231 81 182 90C130 103 136 139 183 143" class="scene-teaching-path"/>
      <g data-hand>${photo(assets[2], '', 185, true)}</g>`;
  } else if (mode === 1) {
    scene = `${sideScreen()}
      ${text(250, 23, words.screen, 'text-anchor="middle"')}
      <g class="scene-depth-axis">
        <path d="M69 245H191" class="scene-axis"/>
        ${arrow('M112 245H186', 'data-toward')}
        ${arrow('M155 245H74', 'data-away')}
        ${text(66, 266, words.farther)}${text(191, 266, words.nearer, 'text-anchor="end"')}
      </g>
      <g data-hand>${photo(assets[1], 'closed', 195)}${photo(assets[0], 'open', 195)}</g>`;
  } else if (mode === 2) {
    scene = `${frontScreen}
      <g class="scene-small-motion">
        ${arrow('M145 47H112', 'data-left')}${arrow('M215 47H248', 'data-right')}
      </g>
      <g data-hand>${photo(assets[0], '', 198)}</g>`;
  } else {
    scene = `<path d="M40 131L150 36V209Z" class="scene-sight-cone"/>
      <path d="M42 130H145" class="scene-sight-line"/>
      <g class="scene-eye" transform="translate(29 130)"><path d="M-13 0Q0-13 13 0Q0 13-13 0Z"/><circle r="4"/></g>
      ${text(29, 155, words.you, 'text-anchor="middle"')}
      <g data-hand>${photo(assets[3], '', 204)}</g>
      ${sideScreen(154, true)}
      ${text(184, 23, words.screen, 'text-anchor="middle"')}
      <g class="scene-hidden-motion">
        ${arrow('M112 100V59', 'data-up')}${arrow('M112 161V202', 'data-down')}
      </g>
      ${text(280, 18, words.behind, 'text-anchor="middle"')}
      ${text(280, 33, words.palm, 'text-anchor="middle"')}`;
  }
  container.dataset.scene = ['trace', 'depth', 'lateral', 'hidden'][mode];
  container.innerHTML = `<svg class="hand-scene" viewBox="0 0 360 292" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${defs}${scene}</svg>`;
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
      hand.setAttribute('transform', `matrix(.64 .19 0 1 ${104 + closer * 64} 42)`);
      open.setAttribute('opacity', String(pose));
      closed.setAttribute('opacity', String(1 - pose));
      emphasize(cue('toward'), cue('away'), phase);
    } else if (mode === 2) {
      const x = p < .51 ? 180 - 16 * ease((p - .18) / .33) : 164 + 32 * ease((p - .51) / .39);
      hand.setAttribute('transform', `translate(${x},47)`);
      emphasize(cue('left'), cue('right'), phase);
    } else {
      const y = p < .51 ? 143 - 24 * ease((p - .18) / .33) : 119 + 48 * ease((p - .51) / .39);
      // Horizontal hand: fingertips point into the area behind the screen;
      // the wrist and forearm extend sideways, with the palm toward the viewer.
      hand.setAttribute('transform', `matrix(0 -.68 1 0 155 ${y})`);
      emphasize(cue('up'), cue('down'), phase);
    }
    return phase;
  }
  render();
  return { render };
}
