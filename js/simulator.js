/* Canvas simulator engine.
 * Top-down 2D scenes. Each scenario builds a world; the engine runs the loop,
 * handles drawing, collision checks, and outcome callbacks. */
(function () {
  const W = 900; // logical width
  const H = 640; // logical height

  const C = {
    grass: '#6ea96e',
    grassDark: '#5e9a5e',
    road: '#3a3f48',
    roadEdge: '#dbe2ea',
    laneLine: '#f6c648',
    crosswalk: '#f4f4f4',
    rail: '#5a4a3a',
    railTie: '#3a2c20',
    sky: '#aee0ff',
  };

  // ------- Cache for sign SVG → image -------
  const signImageCache = new Map();
  function getSignImage(signId) {
    if (signImageCache.has(signId)) return signImageCache.get(signId);
    const sign = window.findSign(signId);
    if (!sign) return null;
    const svgStr = sign.render();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    signImageCache.set(signId, img);
    return img;
  }

  // ------- Default world factory -------
  function makeWorld() {
    return {
      width: W, height: H,
      time: 0,
      agents: [],
      roads: [],
      crosswalks: [],
      rails: null,
      signs: [], // {x,y,signId,size}
      decor: [], // {kind, x, y, ...}
      ended: false,
      outcome: null, // {type:'good'|'bad'|'warn', title, detail}
      pendingBanners: [], // {time, text, kind}
      bannerNow: null,
      effects: [], // explosions, sirens, etc
    };
  }

  // ------- Agent helpers -------
  // angle in radians, 0 = facing east, π/2 = south (canvas y-down)
  function makeCar(opts) {
    return Object.assign({
      kind: 'car',
      x: 0, y: 0, angle: 0,
      speed: 0,           // px/s
      targetSpeed: 0,
      maxAccel: 220, maxDecel: 320,
      width: 22, height: 38,
      bodyColor: '#2a6fdb',
      roofColor: null,
      alive: true,
      hit: false,
      label: null,
      fsm: null,
    }, opts);
  }

  function makePed(opts) {
    return Object.assign({
      kind: 'ped',
      x: 0, y: 0,
      vx: 0, vy: 0,
      width: 14, height: 14,
      shirt: '#e76f51',
      pants: '#264653',
      hit: false,
      alive: true,
    }, opts);
  }

  function makeTrain(opts) {
    return Object.assign({
      kind: 'train',
      x: 0, y: 0, angle: 0,
      speed: 0,
      width: 280, height: 60,
      alive: true,
    }, opts);
  }

  function makeCop(opts) {
    return Object.assign({
      kind: 'cop',
      x: 0, y: 0, angle: 0,
      speed: 0,
      width: 22, height: 38,
      alive: true,
      sirenPhase: 0,
      hidden: false,
    }, opts);
  }

  // ------- Physics & control -------
  function approachSpeed(a, dt) {
    if (a.speed < a.targetSpeed) {
      a.speed = Math.min(a.targetSpeed, a.speed + a.maxAccel * dt);
    } else if (a.speed > a.targetSpeed) {
      a.speed = Math.max(a.targetSpeed, a.speed - a.maxDecel * dt);
    }
  }

  function moveForward(a, dt) {
    a.x += Math.cos(a.angle) * a.speed * dt;
    a.y += Math.sin(a.angle) * a.speed * dt;
  }

  // OBB approximated as AABB after rotation — adequate for this simulation
  function carRect(a) {
    const cos = Math.abs(Math.cos(a.angle));
    const sin = Math.abs(Math.sin(a.angle));
    const w = a.width * cos + a.height * sin;
    const h = a.width * sin + a.height * cos;
    return { x: a.x - w / 2, y: a.y - h / 2, w, h };
  }

  function rectsOverlap(a, b, pad = 0) {
    return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  }

  function checkCollisions(world) {
    if (world.ended) return;
    const cars = world.agents.filter(a => (a.kind === 'car' || a.kind === 'cop') && a.alive);
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const A = cars[i], B = cars[j];
        if (A.ignoreCollisions || B.ignoreCollisions) continue;
        const ra = carRect(A), rb = carRect(B);
        if (rectsOverlap(ra, rb)) {
          A.hit = B.hit = true;
          A.speed = B.speed = 0;
          spawnExplosion(world, (A.x + B.x) / 2, (A.y + B.y) / 2);
          if (typeof world.onCarCollision === 'function') world.onCarCollision(world, A, B);
          else endWith(world, 'bad', 'Collision', 'Two vehicles crashed.');
          return;
        }
      }
    }
    // Train vs car (train moves on cardinal axes; swap w/h if rotated 90°)
    const train = world.agents.find(a => a.kind === 'train' && a.alive);
    if (train) {
      const horiz = Math.abs(Math.cos(train.angle)) > 0.5;
      const trW = horiz ? train.width : train.height;
      const trH = horiz ? train.height : train.width;
      const tr = { x: train.x - trW / 2, y: train.y - trH / 2, w: trW, h: trH };
      for (const car of cars) {
        if (car.role !== 'player' || car.hit) continue;
        if (rectsOverlap(carRect(car), tr)) {
          car.hit = true; car.speed = 0;
          spawnExplosion(world, car.x, car.y);
          endWith(world, 'bad', 'Struck by Train',
            'A train traveling 60+ mph cannot stop in time. Survival rate of car-vs-train is grim — never race a train.');
          return;
        }
      }
    }
    // Pedestrian vs player car
    const player = world.agents.find(a => a.kind === 'car' && a.role === 'player' && a.alive);
    const ped = world.agents.find(a => a.kind === 'ped' && a.alive);
    if (player && ped && !ped.hit) {
      const pr = { x: ped.x - ped.width / 2, y: ped.y - ped.height / 2, w: ped.width, h: ped.height };
      if (rectsOverlap(carRect(player), pr)) {
        ped.hit = true; ped.alive = false;
        spawnExplosion(world, ped.x, ped.y, '#c8102e', 14);
        endWith(world, 'bad', 'Pedestrian Struck',
          'At 35 mph a pedestrian struck has roughly an 85% chance of severe injury or death. Always yield at crosswalks.');
        return;
      }
    }
  }

  function spawnExplosion(world, x, y, color = '#ff7d1a', size = 28) {
    world.effects.push({ kind: 'explosion', x, y, t: 0, color, size });
  }

  function endWith(world, type, title, detail) {
    world.ended = true;
    world.outcome = { type, title, detail };
  }

  function showBanner(world, text, kind = 'info') {
    world.bannerNow = { text, kind, until: world.time + 1.4 };
  }

  // ------- Drawing -------
  function drawWorld(ctx, world) {
    // background grass
    ctx.fillStyle = C.grass;
    ctx.fillRect(0, 0, W, H);
    // grass texture: dappled darker patches
    ctx.fillStyle = C.grassDark;
    for (let i = 0; i < 30; i++) {
      const x = (i * 137) % W;
      const y = (i * 211) % H;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // rails (drawn under roads where they cross)
    if (world.rails) drawRails(ctx, world.rails);

    // roads
    for (const r of world.roads) drawRoad(ctx, r);

    // crosswalks (drawn over road)
    for (const cw of world.crosswalks) drawCrosswalk(ctx, cw);

    // decor (trees, bushes, signposts art)
    for (const d of world.decor) drawDecor(ctx, d);

    // signs
    for (const s of world.signs) drawSign(ctx, s);

    // agents (sort by y for a bit of depth)
    const sorted = [...world.agents].sort((a, b) => a.y - b.y);
    for (const a of sorted) {
      if (!a.alive) {
        if (a.kind === 'ped') drawDownedPed(ctx, a);
        continue;
      }
      if (a.kind === 'car') drawCar(ctx, a);
      else if (a.kind === 'cop') drawCop(ctx, a);
      else if (a.kind === 'ped') drawPed(ctx, a);
      else if (a.kind === 'train') drawTrain(ctx, a);
    }

    // effects
    for (const e of world.effects) drawEffect(ctx, e);

    // banner
    const banner = document.getElementById('sim-banner');
    if (banner) {
      if (world.bannerNow && world.time < world.bannerNow.until) {
        banner.textContent = world.bannerNow.text;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  function drawRoad(ctx, r) {
    // r: {x,y,w,h, dir:'h'|'v', laneCount?:1|2, edgeLine?:bool, dashedCenter?:bool}
    ctx.fillStyle = C.road;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = C.roadEdge;
    ctx.lineWidth = 2;
    if (r.dir === 'h') {
      // edge lines (top + bottom)
      ctx.beginPath(); ctx.moveTo(r.x, r.y + 3); ctx.lineTo(r.x + r.w, r.y + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h - 3); ctx.lineTo(r.x + r.w, r.y + r.h - 3); ctx.stroke();
      // center dashed
      if (r.dashedCenter !== false) {
        ctx.strokeStyle = C.laneLine; ctx.lineWidth = 3;
        ctx.setLineDash([18, 14]);
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.h / 2);
        ctx.lineTo(r.x + r.w, r.y + r.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      ctx.beginPath(); ctx.moveTo(r.x + 3, r.y); ctx.lineTo(r.x + 3, r.y + r.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r.x + r.w - 3, r.y); ctx.lineTo(r.x + r.w - 3, r.y + r.h); ctx.stroke();
      if (r.dashedCenter !== false) {
        ctx.strokeStyle = C.laneLine; ctx.lineWidth = 3;
        ctx.setLineDash([18, 14]);
        ctx.beginPath();
        ctx.moveTo(r.x + r.w / 2, r.y);
        ctx.lineTo(r.x + r.w / 2, r.y + r.h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawCrosswalk(ctx, cw) {
    // cw: {x,y,w,h, dir:'h'|'v'}
    ctx.fillStyle = C.crosswalk;
    if (cw.dir === 'h') {
      // stripes go vertically along a horizontal road
      const stripeW = 8, gap = 6;
      let x = cw.x;
      while (x < cw.x + cw.w) {
        ctx.fillRect(x, cw.y, stripeW, cw.h);
        x += stripeW + gap;
      }
    } else {
      const stripeH = 8, gap = 6;
      let y = cw.y;
      while (y < cw.y + cw.h) {
        ctx.fillRect(cw.x, y, cw.w, stripeH);
        y += stripeH + gap;
      }
    }
  }

  function drawDecor(ctx, d) {
    if (d.kind === 'tree') {
      ctx.fillStyle = '#5e3b1f';
      ctx.fillRect(d.x - 3, d.y, 6, 8);
      ctx.fillStyle = '#2f6b2f';
      ctx.beginPath(); ctx.arc(d.x, d.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3d8e3d';
      ctx.beginPath(); ctx.arc(d.x - 4, d.y - 4, 10, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'bush') {
      ctx.fillStyle = '#3d8e3d';
      ctx.beginPath(); ctx.arc(d.x, d.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + 8, d.y - 4, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x - 8, d.y - 2, 11, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'stopline') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    } else if (d.kind === 'gate') {
      // railroad gate
      const len = d.length || 80;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle || 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -3, len, 6);
      ctx.fillStyle = '#c8102e';
      for (let i = 0; i < len; i += 18) {
        ctx.fillRect(i, -3, 9, 6);
      }
      // post
      ctx.fillStyle = '#888';
      ctx.fillRect(-6, -16, 6, 32);
      ctx.restore();
    }
  }

  function drawRails(ctx, rails) {
    // rails: {dir:'h'|'v', x,y,w,h}
    if (rails.dir === 'h') {
      // ties
      ctx.fillStyle = C.railTie;
      const cy = rails.y + rails.h / 2;
      for (let x = rails.x; x < rails.x + rails.w; x += 22) {
        ctx.fillRect(x, cy - 22, 14, 44);
      }
      // rails
      ctx.strokeStyle = C.rail; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(rails.x, cy - 14); ctx.lineTo(rails.x + rails.w, cy - 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rails.x, cy + 14); ctx.lineTo(rails.x + rails.w, cy + 14); ctx.stroke();
    } else {
      ctx.fillStyle = C.railTie;
      const cx = rails.x + rails.w / 2;
      for (let y = rails.y; y < rails.y + rails.h; y += 22) {
        ctx.fillRect(cx - 22, y, 44, 14);
      }
      ctx.strokeStyle = C.rail; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 14, rails.y); ctx.lineTo(cx - 14, rails.y + rails.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 14, rails.y); ctx.lineTo(cx + 14, rails.y + rails.h); ctx.stroke();
    }
  }

  function drawSign(ctx, s) {
    // s: {x, y, signId, size}
    const size = s.size || 80;
    const img = getSignImage(s.signId);
    // signpost
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(s.x - 2, s.y, 4, 26);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, s.x - size / 2, s.y - size, size, size);
    } else {
      // fallback placeholder
      ctx.fillStyle = '#999';
      ctx.fillRect(s.x - size / 2, s.y - size, size, size);
    }
  }

  function drawCar(ctx, a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle + Math.PI / 2); // sprite drawn pointing up; angle 0 means moving east, need rotation
    const w = a.width, h = a.height;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
    // body
    roundRect(ctx, -w / 2, -h / 2, w, h, 5);
    ctx.fillStyle = a.bodyColor; ctx.fill();
    // window
    ctx.fillStyle = '#a8d6ff';
    roundRect(ctx, -w / 2 + 3, -h / 2 + 6, w - 6, h * 0.32, 3); ctx.fill();
    roundRect(ctx, -w / 2 + 3, h / 2 - h * 0.32 - 6, w - 6, h * 0.28, 3); ctx.fill();
    // hood line
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 3, 0); ctx.lineTo(w / 2 - 3, 0); ctx.stroke();
    // headlights (front = -y in sprite frame)
    ctx.fillStyle = '#fff8b8';
    ctx.fillRect(-w / 2 + 2, -h / 2 - 1, 5, 3);
    ctx.fillRect(w / 2 - 7, -h / 2 - 1, 5, 3);
    // tail lights
    ctx.fillStyle = '#a92020';
    ctx.fillRect(-w / 2 + 2, h / 2 - 2, 5, 3);
    ctx.fillRect(w / 2 - 7, h / 2 - 2, 5, 3);
    if (a.hit) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
    if (a.label) {
      ctx.fillStyle = '#fff'; ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(a.label, a.x, a.y - 28);
    }
  }

  function drawCop(ctx, a) {
    if (a.hidden) return;
    drawCar(ctx, Object.assign({}, a, { bodyColor: '#1a1a1a' }));
    // light bar
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle + Math.PI / 2);
    const phase = Math.floor(a.sirenPhase * 4) % 2;
    ctx.fillStyle = phase === 0 ? '#2a6fdb' : '#c8102e';
    ctx.fillRect(-8, -5, 16, 4);
    ctx.fillStyle = phase === 0 ? '#c8102e' : '#2a6fdb';
    ctx.fillRect(-8, 0, 16, 4);
    ctx.restore();
  }

  function drawPed(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(2, 6, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    // legs (pants)
    ctx.fillStyle = p.pants;
    ctx.fillRect(-4, 2, 3, 6);
    ctx.fillRect(1, 2, 3, 6);
    // body (shirt)
    ctx.fillStyle = p.shirt;
    roundRect(ctx, -5, -5, 10, 8, 2); ctx.fill();
    // head
    ctx.fillStyle = '#f4cba0';
    ctx.beginPath(); ctx.arc(0, -8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawDownedPed(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-7, -3, 14, 6);
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-6, -2, 12, 4);
    ctx.restore();
  }

  function drawTrain(ctx, t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-t.width / 2 + 4, -t.height / 2 + 6, t.width, t.height);
    // locomotive
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(-t.width / 2, -t.height / 2, t.width * 0.32, t.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-t.width / 2, -t.height / 2, 12, t.height);
    // windows
    ctx.fillStyle = '#a8d6ff';
    ctx.fillRect(-t.width / 2 + 22, -t.height / 2 + 8, 30, 14);
    // cars
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-t.width / 2 + t.width * 0.34, -t.height / 2, t.width * 0.32, t.height);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(-t.width / 2 + t.width * 0.68, -t.height / 2, t.width * 0.30, t.height);
    // light
    ctx.fillStyle = '#fff8b8';
    ctx.beginPath(); ctx.arc(t.width / 2 - 4, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawEffect(ctx, e) {
    if (e.kind === 'explosion') {
      const r = e.size + e.t * 80;
      ctx.fillStyle = `rgba(255, 165, 0, ${Math.max(0, 1 - e.t)})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 80, 30, ${Math.max(0, 0.9 - e.t * 1.4)})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 240, 180, ${Math.max(0, 0.8 - e.t * 1.8)})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // ------- Main loop -------
  let canvas, ctx, world, last, rafId, onEnd;

  function init(c) {
    canvas = c;
    ctx = c.getContext('2d');
    canvas.width = W; canvas.height = H;
    drawIdle();
  }

  function drawIdle() {
    ctx.fillStyle = C.grass;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.grassDark;
    for (let i = 0; i < 30; i++) {
      const x = (i * 137) % W;
      const y = (i * 211) % H;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, W / 2 - 220, H / 2 - 36, 440, 72, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px -apple-system, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pick a sign, then Obey or Ignore', W / 2, H / 2 - 4);
    ctx.font = '14px -apple-system, Arial, sans-serif';
    ctx.fillText('The simulator will show what happens next.', W / 2, H / 2 + 18);
  }

  function start(scenarioId, action, opts = {}) {
    if (rafId) cancelAnimationFrame(rafId);
    onEnd = opts.onEnd || null;
    world = makeWorld();
    const sc = window.SCENARIOS[scenarioId];
    if (!sc) {
      console.warn('Unknown scenario', scenarioId);
      return;
    }
    sc.build(world, action);
    last = performance.now();
    loop();
  }

  function loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!world.ended) {
      world.time += dt;
      // update agents
      for (const a of world.agents) {
        if (!a.alive) continue;
        if (a.update) a.update(world, dt);
        else {
          approachSpeed(a, dt);
          moveForward(a, dt);
        }
        if (a.kind === 'cop') a.sirenPhase += dt * 4;
      }
      // update effects
      for (const e of world.effects) e.t += dt;
      world.effects = world.effects.filter(e => e.t < 1.5);
      // remove off-screen agents
      for (const a of world.agents) {
        if (!a.alive) continue;
        if (a.x < -300 || a.x > W + 300 || a.y < -300 || a.y > H + 300) {
          if (a.role !== 'player') a.alive = false;
        }
      }
      checkCollisions(world);
      // scenario tick (for endings without crashes, custom logic)
      if (typeof world.onTick === 'function') world.onTick(world, dt);
    }
    drawWorld(ctx, world);
    if (world.ended && onEnd) {
      const cb = onEnd; onEnd = null;
      setTimeout(() => cb(world.outcome), 600);
    }
    rafId = requestAnimationFrame(loop);
  }

  function reset() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (canvas && ctx) drawIdle();
    const banner = document.getElementById('sim-banner');
    if (banner) banner.classList.add('hidden');
  }

  // ------- Public API -------
  window.Sim = {
    init, start, reset,
    // helpers exposed to scenarios:
    makeCar, makePed, makeTrain, makeCop,
    approachSpeed, moveForward,
    showBanner, endWith, spawnExplosion,
    W, H,
  };
})();
