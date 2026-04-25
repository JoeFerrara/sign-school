/* Scenario library — each builds a world for a given user action.
 * Action is 'comply' (obey the sign) or 'ignore' (don't). */
(function () {
  const W = 900, H = 640;

  // helpers
  function approachSpeed(a, dt) {
    if (a.speed < a.targetSpeed) a.speed = Math.min(a.targetSpeed, a.speed + a.maxAccel * dt);
    else if (a.speed > a.targetSpeed) a.speed = Math.max(a.targetSpeed, a.speed - a.maxDecel * dt);
  }
  function moveForward(a, dt) {
    a.x += Math.cos(a.angle) * a.speed * dt;
    a.y += Math.sin(a.angle) * a.speed * dt;
  }
  function pickRandom(weights) {
    // weights: [{key, w}]
    const sum = weights.reduce((s, w) => s + w.w, 0);
    let r = Math.random() * sum;
    for (const w of weights) { r -= w.w; if (r <= 0) return w.key; }
    return weights[0].key;
  }

  function addTrees(world, count, exclusionRects) {
    let attempts = 0;
    let placed = 0;
    while (placed < count && attempts < 200) {
      attempts++;
      const x = 30 + Math.random() * (W - 60);
      const y = 30 + Math.random() * (H - 60);
      const blocked = exclusionRects.some(r => x > r.x - 30 && x < r.x + r.w + 30 && y > r.y - 30 && y < r.y + r.h + 30);
      if (!blocked) {
        world.decor.push({ kind: Math.random() < 0.6 ? 'tree' : 'bush', x, y });
        placed++;
      }
    }
  }

  /* ---------- Scenario 1: Intersection — Yield ---------- */
  function buildYield(world, action) {
    // Vertical major road (north-south)
    const major = { x: 480, y: 0, w: 100, h: H, dir: 'v', dashedCenter: true };
    // Horizontal minor road (east, dead-ending into major)
    const minor = { x: 0, y: 320, w: 580, h: 70, dir: 'h', dashedCenter: false };
    world.roads.push(major, minor);
    addTrees(world, 14, [major, minor]);

    world.signs.push({ x: 460, y: 312, signId: 'yield', size: 70 });

    // Cross car: comes from north going south
    const cross = window.Sim.makeCar({
      x: 510, y: -70, angle: Math.PI / 2,
      bodyColor: '#d97706', label: null, role: 'cross',
      maxAccel: 100, maxDecel: 200,
      targetSpeed: 100, speed: 100,
    });
    cross.update = (w, dt) => {
      cross.targetSpeed = 100;
      approachSpeed(cross, dt);
      moveForward(cross, dt);
    };

    // Player car
    const player = window.Sim.makeCar({
      x: 40, y: 355, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 200, maxDecel: 360,
      targetSpeed: 0, speed: 0,
      fsmState: 'approach',
    });

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Approaching yield sign — slowing down', 'info');
      player.update = (w, dt) => {
        switch (player.fsmState) {
          case 'approach':
            player.targetSpeed = 95;
            if (player.x > 400) { player.fsmState = 'slow'; window.Sim.showBanner(w, 'Yielding to cross traffic'); }
            break;
          case 'slow':
            player.targetSpeed = 0;
            if (player.speed < 5) {
              player.fsmState = 'wait'; player.waitStart = w.time;
            }
            break;
          case 'wait':
            player.targetSpeed = 0;
            if (cross.y > 460 || !cross.alive) {
              player.fsmState = 'go';
              window.Sim.showBanner(w, 'Clear — proceeding');
            }
            break;
          case 'go':
            player.targetSpeed = 130;
            break;
        }
        approachSpeed(player, dt);
        moveForward(player, dt);
        if (player.x > W - 40 && !w.ended) {
          window.Sim.endWith(w, 'good', 'Safe merge',
            'You yielded, waited for the gap, and merged with the flow of traffic. That is exactly what a yield sign asks for.');
        }
      };
    } else {
      window.Sim.showBanner(world, 'Ignoring the yield sign — full speed ahead', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 130;
        approachSpeed(player, dt);
        moveForward(player, dt);
      };
      world.onCarCollision = (w) => {
        window.Sim.endWith(w, 'bad', 'T-Boned',
          'You merged onto the busy road without yielding and were struck broadside by cross traffic. Side-impact crashes have one of the highest fatality rates because doors offer little crumple space.');
      };
    }

    world.agents.push(cross, player);
  }

  /* ---------- Scenario 2: Intersection — Stop ---------- */
  function buildStop(world, action) {
    const major = { x: 480, y: 0, w: 100, h: H, dir: 'v', dashedCenter: true };
    const minor = { x: 0, y: 320, w: 580, h: 70, dir: 'h', dashedCenter: false };
    world.roads.push(major, minor);
    addTrees(world, 12, [major, minor]);

    // stop line
    world.decor.push({ kind: 'stopline', x: 462, y: 322, w: 4, h: 66 });
    world.signs.push({ x: 446, y: 312, signId: 'stop', size: 70 });

    // Hidden cop in bushes — only revealed on certain ignore outcomes
    const copHidden = window.Sim.makeCop({
      x: 720, y: 460, angle: Math.PI, hidden: true, role: 'cop',
      maxAccel: 280, maxDecel: 360,
    });

    const cross = window.Sim.makeCar({
      x: 510, y: -70, angle: Math.PI / 2,
      bodyColor: '#7e3ad6', role: 'cross',
      maxAccel: 100, maxDecel: 200,
      targetSpeed: 100, speed: 100,
    });
    cross.update = (w, dt) => {
      cross.targetSpeed = 100;
      approachSpeed(cross, dt); moveForward(cross, dt);
    };

    const player = window.Sim.makeCar({
      x: 40, y: 355, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 200, maxDecel: 380,
      fsmState: 'approach',
    });

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Stopping completely at the line');
      player.update = (w, dt) => {
        switch (player.fsmState) {
          case 'approach':
            player.targetSpeed = 90;
            if (player.x > 400) player.fsmState = 'brake';
            break;
          case 'brake':
            player.targetSpeed = 0;
            if (player.speed < 1) {
              player.fsmState = 'stopped';
              player.stopAt = w.time;
              window.Sim.showBanner(w, 'Full stop — checking for traffic');
            }
            break;
          case 'stopped':
            player.targetSpeed = 0;
            if (w.time - player.stopAt > 1.5 && (cross.y > 460 || !cross.alive)) {
              player.fsmState = 'go';
              window.Sim.showBanner(w, 'Way is clear — go');
            }
            break;
          case 'go':
            player.targetSpeed = 120;
            break;
        }
        approachSpeed(player, dt); moveForward(player, dt);
        if (player.x > W - 40 && !w.ended) {
          window.Sim.endWith(w, 'good', 'Stopped fully — safe',
            'You came to a complete stop, checked traffic, and proceeded only when safe. Officer would have nothing to say.');
        }
      };
    } else {
      // Ignore: pick an outcome up front
      const fate = pickRandom([
        { key: 'tbone', w: 50 },
        { key: 'cop',   w: 35 },
        { key: 'lucky', w: 15 },
      ]);

      window.Sim.showBanner(world, 'Rolling through the stop sign…', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 130;
        approachSpeed(player, dt); moveForward(player, dt);
      };

      if (fate === 'tbone') {
        // make sure cross car is timed to collide
        cross.x = 510; cross.y = -50;
        world.onCarCollision = (w) => {
          window.Sim.endWith(w, 'bad', 'T-Boned',
            'Running the stop sent you straight into cross traffic. T-bone collisions are among the deadliest crash types — there is almost no protection on the side of a car.');
        };
      } else if (fate === 'cop') {
        // remove or move cross car off-path so no collision
        cross.x = 510; cross.y = -800; cross.targetSpeed = 0; cross.alive = false;
        // cop hidden, will pursue once player passes intersection
        copHidden.hidden = true;
        copHidden.x = 720; copHidden.y = 460;
        let chasing = false;
        copHidden.update = (w, dt) => {
          if (!chasing && player.x > 600) {
            chasing = true; copHidden.hidden = false;
            copHidden.angle = 0; // east
            copHidden.x = 600; copHidden.y = 355;
            copHidden.targetSpeed = 180;
            window.Sim.showBanner(w, '🚨 Police pursuit', 'warn');
          }
          if (chasing) {
            // Catch up to player
            if (Math.abs(copHidden.x - player.x) < 60 && copHidden.x > 720) {
              copHidden.targetSpeed = 0;
              player.targetSpeed = 0;
              if (player.speed < 5 && copHidden.speed < 5) {
                if (!w.ended) {
                  window.Sim.endWith(w, 'warn', 'Pulled Over',
                    'An officer was watching from a side street. Running a stop sign in California is a $238 base fine plus court and DMV costs, and a point on your record.');
                }
              }
            }
            approachSpeed(copHidden, dt); moveForward(copHidden, dt);
          }
        };
        world.agents.push(copHidden);
      } else {
        // lucky: nothing happens, but stern message
        cross.alive = false; cross.y = -800;
        world.onTick = (w) => {
          if (player.x > W - 40 && !w.ended) {
            window.Sim.endWith(w, 'warn', 'Lucky This Time',
              'Nothing was coming — but next time it might be a school bus. The stop sign exists because sight lines are limited; never gamble on being lucky.');
          }
        };
      }
    }

    world.agents.push(cross, player);
  }

  /* ---------- Scenario 3: Pedestrian Crosswalk ---------- */
  function buildCrosswalk(world, action) {
    const road = { x: 0, y: 300, w: W, h: 80, dir: 'h', dashedCenter: true };
    world.roads.push(road);
    world.crosswalks.push({ x: 520, y: 300, w: 50, h: 80, dir: 'h' });
    world.signs.push({ x: 580, y: 290, signId: 'pedestrian-crossing', size: 70 });
    addTrees(world, 16, [road, { x: 510, y: 280, w: 70, h: 120 }]);

    const ped = window.Sim.makePed({
      x: 545, y: 460, vx: 0, vy: -28,
      shirt: '#e76f51', pants: '#264653',
    });
    ped.update = (w, dt) => {
      ped.x += ped.vx * dt;
      ped.y += ped.vy * dt;
      // ped exits scene safely
      if (ped.y < 240) {
        ped.alive = false;
      }
    };

    const player = window.Sim.makeCar({
      x: 40, y: 340, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 180, maxDecel: 360,
      fsmState: 'drive',
    });

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Pedestrian crossing ahead — slowing');
      player.update = (w, dt) => {
        switch (player.fsmState) {
          case 'drive':
            player.targetSpeed = 100;
            if (player.x > 460) { player.fsmState = 'brake'; }
            break;
          case 'brake':
            player.targetSpeed = 0;
            if (player.speed < 1) {
              player.fsmState = 'wait';
              window.Sim.showBanner(w, 'Stopped — yielding to pedestrian');
            }
            break;
          case 'wait':
            player.targetSpeed = 0;
            if (!ped.alive) {
              player.fsmState = 'go';
              window.Sim.showBanner(w, 'Pedestrian is clear — proceeding');
            }
            break;
          case 'go':
            player.targetSpeed = 110;
            break;
        }
        approachSpeed(player, dt); moveForward(player, dt);
        if (player.x > W - 40 && !w.ended) {
          window.Sim.endWith(w, 'good', 'Yielded safely',
            'You stopped, the pedestrian crossed unharmed, and you continued. That is the law in every U.S. state.');
        }
      };
    } else {
      window.Sim.showBanner(world, 'Speeding past the crosswalk…', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 130;
        approachSpeed(player, dt); moveForward(player, dt);
      };
    }

    world.agents.push(ped, player);
  }

  /* ---------- Scenario 4: Speed Trap ---------- */
  function buildSpeed(world, action) {
    const road = { x: 0, y: 300, w: W, h: 80, dir: 'h', dashedCenter: true };
    world.roads.push(road);
    world.signs.push({ x: 280, y: 290, signId: 'speed-limit', size: 70 });
    addTrees(world, 12, [road]);
    // bushes hiding cop
    world.decor.push({ kind: 'bush', x: 580, y: 430 });
    world.decor.push({ kind: 'bush', x: 615, y: 440 });
    world.decor.push({ kind: 'bush', x: 645, y: 425 });

    const cop = window.Sim.makeCop({
      x: 615, y: 440, angle: -Math.PI / 2, hidden: true,
      maxAccel: 320, maxDecel: 380, role: 'cop',
    });

    const player = window.Sim.makeCar({
      x: 40, y: 340, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 180, maxDecel: 320,
    });

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Cruising at the posted limit');
      player.update = (w, dt) => {
        player.targetSpeed = 95;
        approachSpeed(player, dt); moveForward(player, dt);
        if (player.x > W - 40 && !w.ended) {
          window.Sim.endWith(w, 'good', 'Smooth and legal',
            'You held the limit. The officer in the bushes will let you pass without a glance.');
        }
      };
    } else {
      const fate = pickRandom([
        { key: 'cop', w: 75 },
        { key: 'lucky', w: 25 },
      ]);

      window.Sim.showBanner(world, 'Speeding — well over the limit', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 220;
        approachSpeed(player, dt); moveForward(player, dt);
      };

      if (fate === 'cop') {
        let chasing = false;
        cop.update = (w, dt) => {
          if (!chasing && player.x > 540) {
            chasing = true;
            cop.hidden = false;
            cop.angle = 0;
            cop.x = 615; cop.y = 340;
            cop.targetSpeed = 280;
            window.Sim.showBanner(w, '🚨 Speed enforcement', 'warn');
          }
          if (chasing) {
            if (cop.x < player.x - 10) {
              cop.targetSpeed = 280;
            } else {
              cop.targetSpeed = 0;
              player.targetSpeed = 0;
              if (player.speed < 5 && cop.speed < 5 && !w.ended) {
                window.Sim.endWith(w, 'warn', 'Pulled Over for Speeding',
                  'A typical 25-over ticket runs $250–$500, raises insurance for 3 years, and may add points or a court appearance. School-zone fines often double.');
              }
            }
            approachSpeed(cop, dt); moveForward(cop, dt);
          }
        };
        world.agents.push(cop);
      } else {
        // lucky
        world.onTick = (w) => {
          if (player.x > W - 40 && !w.ended) {
            window.Sim.endWith(w, 'warn', 'You Got Away — This Time',
              'No officer today. But the limit exists because of crash data on this stretch — and at 65 mph in a 35 zone, your stopping distance triples.');
          }
        };
      }
    }

    world.agents.push(player);
  }

  /* ---------- Scenario 5: Wrong Way ---------- */
  function buildWrongWay(world, action) {
    const road = { x: 0, y: 300, w: W, h: 80, dir: 'h', dashedCenter: false };
    world.roads.push(road);
    // arrows on road indicating one-way west
    for (let i = 0; i < 6; i++) {
      world.decor.push({ kind: 'stopline', x: 100 + i * 130, y: 338, w: 30, h: 4 });
    }
    world.signs.push({ x: 80, y: 290, signId: 'do-not-enter', size: 70 });
    world.signs.push({ x: 160, y: 290, signId: 'wrong-way', size: 70 });
    addTrees(world, 12, [road]);

    const oncoming = window.Sim.makeCar({
      x: 920, y: 340, angle: Math.PI,
      bodyColor: '#d12f2c', role: 'cross',
      maxAccel: 100, maxDecel: 200,
      targetSpeed: 110, speed: 110,
    });
    oncoming.update = (w, dt) => {
      oncoming.targetSpeed = 110;
      approachSpeed(oncoming, dt); moveForward(oncoming, dt);
    };

    const player = window.Sim.makeCar({
      x: -20, y: 340, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 200, maxDecel: 360,
      fsmState: 'enter',
    });

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Do Not Enter — turning around');
      player.update = (w, dt) => {
        switch (player.fsmState) {
          case 'enter':
            player.targetSpeed = 60;
            if (player.x > 50) { player.fsmState = 'stop'; window.Sim.showBanner(w, 'Spotted the sign — stopping'); }
            break;
          case 'stop':
            player.targetSpeed = 0;
            if (player.speed < 1) {
              player.fsmState = 'turn'; player.turnStart = w.time;
            }
            break;
          case 'turn':
            // rotate over 1.2s
            player.angle = Math.PI * (w.time - player.turnStart) / 1.2;
            if (w.time - player.turnStart > 1.2) {
              player.angle = Math.PI; player.fsmState = 'leave';
              window.Sim.showBanner(w, 'Turned around — heading back');
            }
            break;
          case 'leave':
            player.targetSpeed = 100;
            break;
        }
        if (player.fsmState === 'enter' || player.fsmState === 'stop' || player.fsmState === 'leave')
          approachSpeed(player, dt);
        moveForward(player, dt);
        if (player.x < -30 && player.fsmState === 'leave' && !w.ended) {
          window.Sim.endWith(w, 'good', 'Crisis avoided',
            'You spotted the sign in time, stopped, and turned around. Wrong-way crashes are dramatically more lethal than other freeway collisions.');
        }
      };
    } else {
      window.Sim.showBanner(world, 'Ignoring Do Not Enter — driving onto the wrong way', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 110;
        approachSpeed(player, dt); moveForward(player, dt);
      };
      world.onCarCollision = (w) => {
        window.Sim.endWith(w, 'bad', 'Head-On Collision',
          'You drove the wrong way down a one-way road. Head-on crashes combine the speed of both vehicles — at highway speeds the impact often exceeds 130 mph and is rarely survivable.');
      };
    }

    world.agents.push(oncoming, player);
  }

  /* ---------- Scenario 6: Railroad Crossing ---------- */
  function buildRailroad(world, action) {
    const road = { x: 0, y: 300, w: W, h: 80, dir: 'h', dashedCenter: true };
    world.roads.push(road);
    world.rails = { x: 540, y: 0, w: 60, h: H, dir: 'v' };
    world.signs.push({ x: 380, y: 290, signId: 'railroad-advance', size: 68 });
    world.signs.push({ x: 460, y: 290, signId: 'railroad-crossing', size: 68 });
    // gate post at side of road, bar across the road (down)
    world.decor.push({ kind: 'gate', x: 530, y: 290, angle: Math.PI / 2, length: 80 });
    addTrees(world, 10, [road, { x: 520, y: 0, w: 100, h: H }]);

    const player = window.Sim.makeCar({
      x: 40, y: 340, angle: 0,
      bodyColor: '#1f6feb', label: 'YOU', role: 'player',
      maxAccel: 200, maxDecel: 360,
      fsmState: 'drive',
    });

    const train = window.Sim.makeTrain({
      x: 570, y: -460, angle: Math.PI / 2,
      width: 280, height: 60, speed: 180,
    });
    train.update = (w, dt) => {
      train.y += train.speed * dt;
      if (!train.announced && train.y > -150) {
        train.announced = true;
        window.Sim.showBanner(w, '🚂 Train approaching!', 'warn');
      }
    };

    if (action === 'comply') {
      window.Sim.showBanner(world, 'Approaching railroad — slowing');
      player.update = (w, dt) => {
        switch (player.fsmState) {
          case 'drive':
            player.targetSpeed = 90;
            if (player.x > 440) { player.fsmState = 'brake'; }
            break;
          case 'brake':
            player.targetSpeed = 0;
            if (player.speed < 1) {
              player.fsmState = 'wait';
              window.Sim.showBanner(w, 'Stopped at crossing — waiting for train');
            }
            break;
          case 'wait':
            player.targetSpeed = 0;
            if (train.y > 720) {
              player.fsmState = 'go';
              window.Sim.showBanner(w, 'Train has passed — proceeding');
            }
            break;
          case 'go':
            player.targetSpeed = 110;
            break;
        }
        approachSpeed(player, dt); moveForward(player, dt);
        if (player.x > W - 40 && !w.ended) {
          window.Sim.endWith(w, 'good', 'Crossing made safely',
            'You stopped, waited for the train, and crossed only after the gate raised. That is the only safe way to handle a rail crossing.');
        }
      };
    } else {
      window.Sim.showBanner(world, 'Trying to beat the train…', 'warn');
      player.update = (w, dt) => {
        player.targetSpeed = 110;
        approachSpeed(player, dt); moveForward(player, dt);
      };
    }

    world.agents.push(train, player);
  }

  // ---------- Registry ----------
  window.SCENARIOS = {
    'intersection-yield': {
      id: 'intersection-yield', name: 'Yield to Cross Traffic',
      description: 'A side road merges onto a busy through-road. Will you yield, or push through?',
      build: buildYield,
    },
    'intersection-stop': {
      id: 'intersection-stop', name: 'Four-Way at a Stop Sign',
      description: 'A stop sign at a hidden intersection. Full stop and look — or roll the dice?',
      build: buildStop,
    },
    'pedestrian-crosswalk': {
      id: 'pedestrian-crosswalk', name: 'Pedestrian in the Crosswalk',
      description: 'Someone is crossing the road ahead. Stop and yield, or drive through?',
      build: buildCrosswalk,
    },
    'speed-trap': {
      id: 'speed-trap', name: 'Speed Limit (Officer Watching)',
      description: 'A posted limit and a cruiser hidden in the bushes. Match the limit, or floor it?',
      build: buildSpeed,
    },
    'wrong-way': {
      id: 'wrong-way', name: 'Do Not Enter (Wrong Way)',
      description: 'A Do Not Enter sign protects you from oncoming traffic. Heed it, or test fate?',
      build: buildWrongWay,
    },
    'railroad': {
      id: 'railroad', name: 'Railroad Crossing',
      description: 'A train is approaching. Stop and let it pass, or try to beat it?',
      build: buildRailroad,
    },
  };
})();
