/* Sign data + SVG renderers.
 * Colors and shapes follow the U.S. MUTCD conventions, simplified for clarity. */
(function () {
  const C = {
    red: '#c8102e',
    yellow: '#fcd116',
    yellowGreen: '#a3c642',
    orange: '#ff7d1a',
    green: '#0a6b3b',
    blue: '#0d3b8c',
    white: '#ffffff',
    black: '#111111',
    brown: '#7a4f1f',
  };

  // Shape primitives — each returns SVG markup for the sign's outer plate
  // and accepts an `inner` string with the symbology drawn on top.
  function svg(inner, viewBox = '0 0 100 100') {
    return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`;
  }

  function octagonPath(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI / 180) * (22.5 + i * 45);
      pts.push(`${(cx + r * Math.cos(ang)).toFixed(2)},${(cy + r * Math.sin(ang)).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  // Plate helpers
  const plate = {
    octagon: (inner) => svg(
      `<polygon points="${octagonPath(50, 50, 48)}" fill="${C.red}" stroke="${C.white}" stroke-width="3"/>
       <polygon points="${octagonPath(50, 50, 44)}" fill="none" stroke="${C.white}" stroke-width="2"/>
       ${inner}`),
    yieldTri: (inner) => svg(
      `<polygon points="50,8 94,86 6,86" fill="${C.white}" stroke="${C.red}" stroke-width="8" stroke-linejoin="round"/>
       <polygon points="50,22 84,80 16,80" fill="${C.white}" stroke="none"/>
       ${inner}`),
    diamond: (color, inner, borderColor = C.black) => svg(
      `<polygon points="50,4 96,50 50,96 4,50" fill="${color}" stroke="${borderColor}" stroke-width="3"/>
       <polygon points="50,11 89,50 50,89 11,50" fill="none" stroke="${borderColor}" stroke-width="1.2"/>
       ${inner}`),
    pentagon: (inner) => svg(
      // School pentagon: pointed top
      `<polygon points="50,4 94,32 86,96 14,96 6,32" fill="${C.yellowGreen}" stroke="${C.black}" stroke-width="3"/>
       ${inner}`),
    rectV: (color, inner, border = C.black) => svg(
      `<rect x="6" y="4" width="88" height="92" rx="4" fill="${color}" stroke="${border}" stroke-width="3"/>
       ${inner}`),
    rectH: (color, inner, border = C.black) => svg(
      `<rect x="4" y="18" width="92" height="64" rx="4" fill="${color}" stroke="${border}" stroke-width="3"/>
       ${inner}`),
    circle: (color, inner, border = C.black) => svg(
      `<circle cx="50" cy="50" r="46" fill="${color}" stroke="${border}" stroke-width="3"/>
       ${inner}`),
    pennant: (inner) => svg(
      `<polygon points="4,18 96,50 4,82" fill="${C.yellow}" stroke="${C.black}" stroke-width="3" stroke-linejoin="round"/>
       ${inner}`),
    crossbuck: (inner) => svg(
      `<g transform="translate(50,50) rotate(45)">
         <rect x="-46" y="-9" width="92" height="18" fill="${C.white}" stroke="${C.black}" stroke-width="2"/>
       </g>
       <g transform="translate(50,50) rotate(-45)">
         <rect x="-46" y="-9" width="92" height="18" fill="${C.white}" stroke="${C.black}" stroke-width="2"/>
       </g>
       ${inner}`),
  };

  // Common content snippets
  const txt = (x, y, t, opts = {}) => {
    const { size = 14, color = C.black, weight = 700, anchor = 'middle', family = 'Arial Black, Arial, sans-serif', letterSpacing = 0 } = opts;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="${family}" font-weight="${weight}" font-size="${size}" letter-spacing="${letterSpacing}">${t}</text>`;
  };

  // "No" overlay: red circle + slash (for prohibitive signs)
  const noOverlay = `
    <circle cx="50" cy="52" r="34" fill="none" stroke="${C.red}" stroke-width="7"/>
    <line x1="26" y1="76" x2="74" y2="28" stroke="${C.red}" stroke-width="7" stroke-linecap="round"/>`;

  // Icon library — simple geometric symbols
  const icon = {
    arrowRight: (cx, cy, scale = 1, color = C.white) => {
      const s = scale;
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M -22 -5 L 8 -5 L 8 -14 L 24 0 L 8 14 L 8 5 L -22 5 Z" fill="${color}" stroke="${color}" stroke-width="1"/>
      </g>`;
    },
    arrowDownRight: (cx, cy, scale = 1, color = C.white) => `
      <g transform="translate(${cx},${cy}) rotate(45) scale(${scale})">
        <path d="M -22 -5 L 8 -5 L 8 -14 L 24 0 L 8 14 L 8 5 L -22 5 Z" fill="${color}"/>
      </g>`,
    leftTurn: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 14 18 L 14 -2 Q 14 -14 2 -14 L -14 -14"/>
        <polyline points="-8,-22 -18,-14 -8,-6" stroke-linejoin="round"/>
      </g>`,
    rightTurn: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy}) scale(-1,1)" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 14 18 L 14 -2 Q 14 -14 2 -14 L -14 -14"/>
        <polyline points="-8,-22 -18,-14 -8,-6" stroke-linejoin="round"/>
      </g>`,
    uTurn: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M -14 22 L -14 0 Q -14 -16 2 -16 Q 18 -16 18 0 L 18 8"/>
        <polyline points="10,4 18,12 26,4"/>
      </g>`,
    curveArrow: (cx, cy, mirror = false, color = C.black) => `
      <g transform="translate(${cx},${cy}) scale(${mirror ? -1 : 1},1)" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M -10 26 Q -10 -6 14 -10"/>
        <polyline points="6,-18 18,-10 10,2"/>
      </g>`,
    sharpTurn: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M -8 26 L -8 -2 L 14 -2"/>
        <polyline points="6,-10 18,-2 6,6"/>
      </g>`,
    windingArrow: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M -2 26 Q -16 12 -2 0 Q 12 -12 -2 -24"/>
        <polyline points="-10,-18 -2,-26 6,-18"/>
      </g>`,
    pedestrian: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <circle cx="0" cy="-22" r="6"/>
        <path d="M -4 -14 L -10 4 L -8 16 L -4 16 L -2 4 L 2 4 L 6 16 L 10 16 L 6 4 L 8 -10 L 12 -2 L 14 -4 L 8 -16 L 0 -14 Z"/>
      </g>`,
    bicycle: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="3" fill="none">
        <circle cx="-14" cy="10" r="10"/>
        <circle cx="14" cy="10" r="10"/>
        <path d="M -14 10 L 0 -8 L 14 10 M -2 -8 L 14 10 M -8 -16 L 4 -16 L 0 -8"/>
        <circle cx="0" cy="-8" r="2" fill="${color}"/>
      </g>`,
    deer: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <!-- body -->
        <ellipse cx="0" cy="6" rx="22" ry="9"/>
        <!-- legs -->
        <rect x="-18" y="10" width="4" height="16"/>
        <rect x="-10" y="10" width="4" height="16"/>
        <rect x="6" y="10" width="4" height="16"/>
        <rect x="14" y="10" width="4" height="16"/>
        <!-- neck -->
        <path d="M 16 0 L 22 -14 L 28 -14 L 26 -2 Z"/>
        <!-- head -->
        <circle cx="27" cy="-16" r="5"/>
        <!-- antlers -->
        <path d="M 24 -22 L 22 -28 L 20 -24 M 28 -22 L 30 -28 L 32 -24" stroke="${color}" stroke-width="2" fill="none"/>
        <!-- tail -->
        <path d="M -22 0 L -28 -4 L -22 6 Z"/>
      </g>`,
    cow: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <ellipse cx="0" cy="6" rx="24" ry="11"/>
        <rect x="-20" y="12" width="5" height="16"/>
        <rect x="-12" y="12" width="5" height="16"/>
        <rect x="6" y="12" width="5" height="16"/>
        <rect x="14" y="12" width="5" height="16"/>
        <!-- head -->
        <ellipse cx="-26" cy="0" rx="10" ry="8"/>
        <path d="M -34 -6 L -38 -10 M -34 -6 L -36 -2 M -18 -6 L -14 -10 M -18 -6 L -16 -2" stroke="${color}" stroke-width="2"/>
      </g>`,
    trafficLight: (cx, cy) => `
      <g transform="translate(${cx},${cy})">
        <rect x="-10" y="-22" width="20" height="44" rx="3" fill="${C.black}"/>
        <circle cx="0" cy="-12" r="5" fill="#e63946"/>
        <circle cx="0" cy="0" r="5" fill="#fcd116"/>
        <circle cx="0" cy="12" r="5" fill="#2a9d4a"/>
      </g>`,
    miniStop: (cx, cy) => `
      <g transform="translate(${cx},${cy})">
        <polygon points="${octagonPath(0, 0, 18)}" fill="${C.red}" stroke="${C.white}" stroke-width="1.5"/>
        <text x="0" y="4" text-anchor="middle" fill="${C.white}" font-family="Arial Black" font-weight="900" font-size="9">STOP</text>
      </g>`,
    miniYield: (cx, cy) => `
      <g transform="translate(${cx},${cy})">
        <polygon points="0,-16 16,12 -16,12" fill="${C.white}" stroke="${C.red}" stroke-width="3" stroke-linejoin="round"/>
      </g>`,
    train: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <rect x="-22" y="-12" width="40" height="20" rx="2"/>
        <rect x="-8" y="-22" width="14" height="10"/>
        <circle cx="-14" cy="12" r="4"/>
        <circle cx="0" cy="12" r="4"/>
        <circle cx="14" cy="12" r="4"/>
        <rect x="20" y="-6" width="6" height="14"/>
      </g>`,
    worker: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <!-- hardhat head -->
        <path d="M -7 -22 Q -7 -28 0 -28 Q 7 -28 7 -22 L 9 -20 L -9 -20 Z"/>
        <circle cx="0" cy="-15" r="5"/>
        <!-- body -->
        <path d="M -8 -10 L 8 -10 L 10 14 L 4 14 L 2 0 L -2 0 L -4 14 L -10 14 Z"/>
        <!-- shovel -->
        <line x1="14" y1="-8" x2="22" y2="20" stroke="${color}" stroke-width="3"/>
        <path d="M 18 16 L 28 22 L 26 28 L 16 22 Z"/>
      </g>`,
    car: (cx, cy, color = '#2a6fdb') => `
      <g transform="translate(${cx},${cy})">
        <rect x="-14" y="-6" width="28" height="14" rx="3" fill="${color}"/>
        <rect x="-10" y="-12" width="20" height="8" rx="2" fill="${color}"/>
        <rect x="-8" y="-10" width="16" height="6" fill="#cce6ff"/>
        <circle cx="-9" cy="9" r="3" fill="${C.black}"/>
        <circle cx="9" cy="9" r="3" fill="${C.black}"/>
      </g>`,
    skidMarks: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M -16 6 Q -8 -2 0 6 Q 8 14 16 6"/>
        <path d="M -16 -8 Q -8 -16 0 -8 Q 8 0 16 -8"/>
      </g>`,
    twoChildren: (cx, cy, color = C.black) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <!-- child 1 (smaller, left) -->
        <circle cx="-8" cy="-12" r="5"/>
        <path d="M -12 -7 L -16 8 L -12 12 L -10 4 L -6 4 L -8 12 L -4 12 L -4 -4 L -2 -2 L 0 -4 L -4 -7 Z"/>
        <!-- child 2 (taller, right) -->
        <circle cx="10" cy="-16" r="6"/>
        <path d="M 4 -10 L 0 12 L 4 14 L 6 4 L 10 4 L 10 14 L 14 14 L 14 4 L 18 14 L 20 12 L 16 -10 Z"/>
      </g>`,
    wheelchair: (cx, cy, color = C.white) => `
      <g transform="translate(${cx},${cy})" fill="${color}">
        <circle cx="0" cy="-22" r="5"/>
        <path d="M -4 -16 L -8 -2 L 4 -2 L 4 8 L 12 8 L 12 4 L 6 4 L 6 -6 L -2 -6 L 0 -16 Z"/>
        <circle cx="2" cy="14" r="11" fill="none" stroke="${color}" stroke-width="3"/>
      </g>`,
  };

  // ---------- Sign list ----------
  const SIGNS = [
    /* ============ REGULATORY ============ */
    {
      id: 'stop', name: 'Stop', category: 'regulatory', scenario: 'intersection-stop',
      meaning: 'A full stop is required at the marked line, crosswalk, or before the intersection. After stopping, you may proceed when it is safe and you have the right of way.',
      where: 'At intersections without a traffic light, exits from parking lots, school zones, and uncontrolled rural crossings.',
      expected: ['Come to a complete stop — wheels not moving.', 'Stop at the painted line; if none, before the crosswalk; if none, before the intersection.', 'Yield to pedestrians and any cross traffic that has the right of way.', 'Proceed only when the path is clearly safe.'],
      mistakes: ['Performing a "California roll" — slowing without stopping.', 'Stopping past the line, blocking the crosswalk.', 'Assuming a 4-way stop is "first to arrive, first to go" without watching for cross traffic.'],
      design: 'The octagon shape is unique to stop signs so drivers can recognize it from the back or in poor visibility. Red signals required action.',
      render: () => plate.octagon(txt(50, 58, 'STOP', { size: 22, color: C.white, family: 'Arial Black', letterSpacing: 1 })),
    },
    {
      id: 'yield', name: 'Yield', category: 'regulatory', scenario: 'intersection-yield',
      meaning: 'Slow down and give the right of way to any vehicles, bicycles, or pedestrians on the road you are entering or merging onto. Stop only if necessary.',
      where: 'Freeway on-ramps, T-intersections onto a major road, traffic circles, and roads merging from a side street.',
      expected: ['Reduce speed as you approach.', 'Be ready to stop completely if traffic requires it.', 'Yield to all cross or merging traffic and pedestrians.', 'Enter the road only when there is a safe gap.'],
      mistakes: ['Treating yield as "merge at speed" — entering without checking traffic.', 'Stopping on the ramp when traffic is clear (this can cause rear-ends).', 'Forgetting that pedestrians always have priority.'],
      design: 'The downward-pointing triangle is unique to yield signs so it is recognizable from any angle.',
      render: () => plate.yieldTri(txt(50, 70, 'YIELD', { size: 13, color: C.red, family: 'Arial Black' })),
    },
    {
      id: 'do-not-enter', name: 'Do Not Enter', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'You must not enter past this sign. The road ahead is one-way coming toward you, or restricted to authorized vehicles.',
      where: 'Freeway exit ramps, one-way streets, restricted service roads.',
      expected: ['Do not enter under any circumstances.', 'Find an alternate route.', 'If you mistakenly entered, stop, back out carefully, or pull over and call for help.'],
      mistakes: ['Following a navigation app onto a wrong-way ramp.', 'Entering at night when one-way signs may be missed.', 'Assuming a clear road means it is open in both directions.'],
      design: 'A solid red square with a bold white horizontal bar is visible at long range and unmistakable even at speed.',
      render: () => plate.rectV(C.red,
        `<rect x="14" y="42" width="72" height="14" fill="${C.white}"/>
         ${txt(50, 80, 'DO NOT ENTER', { size: 8.5, color: C.white, family: 'Arial Black' })}`),
    },
    {
      id: 'wrong-way', name: 'Wrong Way', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'You are traveling against traffic. Stop and turn around immediately.',
      where: 'Posted on freeway off-ramps facing drivers who entered going the wrong direction, often paired with Do Not Enter.',
      expected: ['Stop as safely as possible.', 'Turn around (in many cases the safest action is to back up off the ramp).', 'Turn on hazard lights to alert other drivers.'],
      mistakes: ['Continuing forward hoping it is a mistake — head-on collisions on freeways are often fatal.', 'Trying to U-turn into oncoming highway traffic.'],
      design: 'Red rectangle with white text is large, contrasting, and meant to break a driver out of inattention.',
      render: () => plate.rectV(C.red,
        txt(50, 42, 'WRONG', { size: 16, color: C.white, family: 'Arial Black' }) +
        txt(50, 64, 'WAY', { size: 16, color: C.white, family: 'Arial Black' })),
    },
    {
      id: 'one-way', name: 'One Way', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'Traffic on this road flows only in the direction of the arrow.',
      where: 'Downtown grids, divided highways, and restricted business districts.',
      expected: ['Travel only in the direction the arrow points.', 'When turning onto the road, turn into the correct lane.'],
      mistakes: ['Turning the wrong way out of a parking lot onto a one-way street.', 'Changing lanes across a centerline that does not exist (one-ways may have multiple same-direction lanes).'],
      design: 'Black background with white arrow keeps the directional message obvious from any angle.',
      render: () => plate.rectH(C.black,
        icon.arrowRight(50, 50, 1.6, C.white) +
        txt(50, 76, 'ONE WAY', { size: 8.5, color: C.white, family: 'Arial Black' })),
    },
    {
      id: 'speed-limit', name: 'Speed Limit', category: 'regulatory', scenario: 'speed-trap',
      meaning: 'The maximum legal speed under ideal conditions. Drive slower in rain, snow, fog, or heavy traffic.',
      where: 'Every public road in the U.S. has a posted or implied speed limit. New limits begin at the sign.',
      expected: ['Do not exceed the posted speed.', 'Slow further when conditions reduce visibility or traction.', 'Adjust speed when entering school or construction zones.'],
      mistakes: ['Treating the limit as a target rather than a maximum.', 'Speeding in school zones — fines often double.', 'Assuming "with the flow of traffic" is a legal defense (it is not).'],
      design: 'White rectangle with black text is the standard for regulatory speed messages, prioritizing readability.',
      render: () => plate.rectV(C.white,
        txt(50, 26, 'SPEED', { size: 13, color: C.black, family: 'Arial Black' }) +
        txt(50, 44, 'LIMIT', { size: 13, color: C.black, family: 'Arial Black' }) +
        txt(50, 80, '35', { size: 38, color: C.black, family: 'Arial Black' })),
    },
    {
      id: 'no-u-turn', name: 'No U-Turn', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'U-turns are prohibited at this location.',
      where: 'Busy intersections, divided highways, and locations with poor sight lines.',
      expected: ['Do not make a U-turn here.', 'Continue forward and find a legal place to reverse direction (parking lot, next intersection).'],
      mistakes: ['Attempting a U-turn from the right lane across multiple lanes of traffic.', 'Confusing "No U-Turn" with "No Left Turn" — they are separate signs.'],
      design: 'White square with the international "no" symbol — a red circle and slash — over the prohibited maneuver.',
      render: () => plate.rectV(C.white, icon.uTurn(50, 56) + noOverlay),
    },
    {
      id: 'no-left-turn', name: 'No Left Turn', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'Left turns are not permitted from this approach.',
      where: 'Intersections with restricted turn windows, downtown one-ways, and locations with insufficient sight distance for a safe left.',
      expected: ['Continue straight or turn right where allowed.', 'Find an alternate route to your destination.'],
      mistakes: ['Turning left because the green ball is showing — the regulatory sign overrides the signal default.', 'Missing a "No Left Turn 7am-9am" qualifier sign.'],
      design: 'White plate with a black left-turn arrow inside the red circle/slash overlay.',
      render: () => plate.rectV(C.white, icon.leftTurn(50, 50) + noOverlay),
    },
    {
      id: 'no-right-turn', name: 'No Right Turn', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'Right turns are not permitted from this approach.',
      where: 'Intersections that conflict with pedestrian flow, transit lanes, or one-way streets.',
      expected: ['Continue straight or turn left where allowed.', 'Note time-of-day qualifiers if posted.'],
      mistakes: ['Treating "right on red" as universal — many intersections post a No Right Turn that overrides it.'],
      design: 'White plate with a black right-turn arrow under the red circle/slash overlay.',
      render: () => plate.rectV(C.white, icon.rightTurn(50, 50) + noOverlay),
    },
    {
      id: 'no-parking', name: 'No Parking', category: 'regulatory', scenario: 'speed-trap',
      meaning: 'You may not park here. Brief stops to drop off passengers may or may not be allowed depending on local rules.',
      where: 'Fire lanes, bus stops, narrow streets, hydrant zones, and any space marked by red curbs.',
      expected: ['Do not leave your vehicle parked.', 'Watch for time-of-day or day-of-week qualifiers.', 'Move along if a sub-plate restricts standing or stopping too.'],
      mistakes: ['Parking "just for a minute" in a fire lane — towed vehicles take hours and hundreds of dollars to recover.', 'Ignoring street-cleaning day signs.'],
      design: 'White plate with a bold red "P" inside the red circle/slash.',
      render: () => plate.rectV(C.white,
        txt(50, 64, 'P', { size: 56, color: C.black, family: 'Arial Black' }) +
        noOverlay),
    },
    {
      id: 'no-passing-zone', name: 'No Passing Zone', category: 'regulatory', scenario: 'speed-trap',
      meaning: 'Passing other vehicles by crossing the center line is prohibited ahead.',
      where: 'Two-lane rural highways approaching curves, hills, intersections, or other places with limited sight distance.',
      expected: ['Do not move into the oncoming lane to pass.', 'Wait for a passing zone (broken yellow line) before attempting to pass.'],
      mistakes: ['Passing on a hill where oncoming traffic is hidden — head-on collisions are often fatal.', 'Confusing the warning pennant with a yield sign.'],
      design: 'A unique pennant shape — pointing right — distinguishes this from any other sign and is placed on the left side of the road.',
      render: () => plate.pennant(
        txt(38, 46, 'NO', { size: 10, color: C.black, family: 'Arial Black' }) +
        txt(38, 60, 'PASSING', { size: 9, color: C.black, family: 'Arial Black' })),
    },
    {
      id: 'keep-right', name: 'Keep Right', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'Pass to the right side of the obstacle, traffic island, or divider ahead.',
      where: 'Median noses, traffic circles, narrow bridges, and divided road ends.',
      expected: ['Move into the right side of the lane or the right lane before reaching the obstacle.', 'Do not split the divider on either side.'],
      mistakes: ['Late lane changes that swerve into adjacent traffic.', 'Treating the sign as optional — striking the obstacle is the most common collision type at these locations.'],
      design: 'Vertical black sign with a downward-right arrow. Some variants use a yellow background where the obstacle itself is hazardous.',
      render: () => plate.rectV(C.black, icon.arrowDownRight(50, 50, 1.8, C.white)),
    },
    {
      id: 'stop-here-on-red', name: 'Stop Here on Red', category: 'regulatory', scenario: 'intersection-stop',
      meaning: 'When the signal is red, your vehicle must be stopped behind this line, not in the crosswalk or beyond.',
      where: 'Intersections with crosswalks set well back from the signal, or with sensor-triggered lights.',
      expected: ['Stop with the front of your vehicle behind the line.', 'Hold position until the signal turns green and the way is clear.'],
      mistakes: ['Inching forward into the crosswalk while waiting.', 'Stopping past sensors so the signal never changes.'],
      design: 'Vertical white plate with simple text — placed exactly at the stop line.',
      render: () => plate.rectV(C.white,
        txt(50, 28, 'STOP', { size: 13, color: C.black, family: 'Arial Black' }) +
        txt(50, 46, 'HERE ON', { size: 11, color: C.black, family: 'Arial Black' }) +
        txt(50, 70, 'RED', { size: 18, color: C.red, family: 'Arial Black' })),
    },
    {
      id: 'two-way-left-turn', name: 'Two-Way Left Turn Lane', category: 'regulatory', scenario: 'wrong-way',
      meaning: 'The center lane is shared by drivers going both directions for left turns only — never for through traffic.',
      where: 'Multi-lane streets through commercial corridors with many driveways.',
      expected: ['Use the center lane only to turn left across oncoming traffic.', 'Do not travel in the lane.', 'Yield to oncoming traffic also turning left into the same lane.'],
      mistakes: ['Treating the center lane as a passing lane.', 'Making a left turn from the wrong lane.'],
      design: 'White plate showing two opposing left-turn arrows.',
      render: () => plate.rectV(C.white,
        `<g transform="translate(50,40)">${icon.leftTurn(0, 0)}</g>` +
        `<g transform="translate(50,72) scale(-1,1)">${icon.leftTurn(0, 0)}</g>`),
    },
    {
      id: 'handicapped-parking', name: 'Handicapped Parking', category: 'regulatory', scenario: 'speed-trap',
      meaning: 'Parking reserved for vehicles displaying a valid disabled placard or license plate.',
      where: 'Parking lots, on-street near accessible building entrances.',
      expected: ['Park here only with a valid placard or plate.', 'Keep adjacent striped access aisles clear — they are not parking spaces.'],
      mistakes: ['Borrowing a relative\'s placard.', 'Parking in the access aisle while waiting for a passenger.'],
      design: 'Blue background with the international symbol of access.',
      render: () => plate.rectV(C.blue, icon.wheelchair(50, 60, C.white)),
    },

    /* ============ WARNING ============ */
    {
      id: 'curve-ahead', name: 'Curve Ahead', category: 'warning', scenario: 'speed-trap',
      meaning: 'A gentle curve in the road is approaching. Reduce speed and stay in your lane.',
      where: 'Rural highways, scenic routes, and approaches to overpasses.',
      expected: ['Slow before the curve, not in it.', 'Keep both hands on the wheel and stay in your lane.'],
      mistakes: ['Braking mid-curve (transfers weight forward, can cause skids).', 'Crossing the center line on the inside of the curve.'],
      design: 'Yellow diamond — the universal warning shape — with a curving black arrow.',
      render: () => plate.diamond(C.yellow, icon.curveArrow(50, 36)),
    },
    {
      id: 'sharp-turn', name: 'Sharp Turn', category: 'warning', scenario: 'speed-trap',
      meaning: 'A sharp 90-degree turn is approaching. Slow significantly before entering.',
      where: 'Country roads, mountain passes, and former T-intersections that have been re-aligned.',
      expected: ['Reduce speed substantially.', 'Watch for an advisory speed plate beneath the warning.'],
      mistakes: ['Attempting the turn at the posted speed limit instead of the advisory speed.'],
      design: 'Yellow diamond with a hard right-angle arrow.',
      render: () => plate.diamond(C.yellow, icon.sharpTurn(50, 36)),
    },
    {
      id: 'winding-road', name: 'Winding Road', category: 'warning', scenario: 'speed-trap',
      meaning: 'A series of three or more curves is ahead. Stay alert and reduce speed.',
      where: 'Mountain passes, river-following roads, and rural areas.',
      expected: ['Slow down and stay attentive for the entire stretch.', 'Watch for slower vehicles in your lane.'],
      mistakes: ['Trying to pass on a winding section — sight distance is limited.', 'Speeding up between curves.'],
      design: 'Yellow diamond with a serpentine arrow.',
      render: () => plate.diamond(C.yellow, icon.windingArrow(50, 36)),
    },
    {
      id: 'hill', name: 'Hill (Steep Grade)', category: 'warning', scenario: 'speed-trap',
      meaning: 'A steep downhill grade is ahead. Trucks and heavy vehicles should downshift.',
      where: 'Mountain highways, freeway descents.',
      expected: ['Engage a lower gear before descending.', 'Avoid riding the brakes — they can overheat and fail.'],
      mistakes: ['Descending in neutral or with continuous brake pressure.', 'Tailgating slower trucks.'],
      design: 'Yellow diamond showing a downhill slope with the grade percentage.',
      render: () => plate.diamond(C.yellow,
        `<polygon points="20,68 80,68 80,30" fill="${C.black}"/>
         ${txt(50, 86, '7%', { size: 14, color: C.black, family: 'Arial Black' })}`),
    },
    {
      id: 'slippery-when-wet', name: 'Slippery When Wet', category: 'warning', scenario: 'speed-trap',
      meaning: 'The road surface becomes especially slick during rain, ice, or snow.',
      where: 'Bridges (which freeze before roads), shaded curves, and roads with poor drainage.',
      expected: ['Slow down in any wet conditions.', 'Increase following distance.', 'Avoid sudden steering or braking inputs.'],
      mistakes: ['Driving at posted speed during the first rain after a dry spell — oil residue makes roads exceptionally slick.'],
      design: 'Yellow diamond with a car silhouette and skid lines under the tires.',
      render: () => plate.diamond(C.yellow,
        icon.car(50, 50, C.black) +
        icon.skidMarks(50, 72, C.black)),
    },
    {
      id: 'stop-ahead', name: 'Stop Ahead', category: 'warning', scenario: 'intersection-stop',
      meaning: 'A stop sign is ahead, often where it is hidden by a hill, curve, or vegetation.',
      where: 'Country roads, areas with heavy foliage, hidden intersections.',
      expected: ['Begin braking immediately.', 'Be ready to come to a complete stop.'],
      mistakes: ['Not slowing soon enough — the stop sign may appear suddenly after a curve.'],
      design: 'Yellow diamond containing a small stop-sign symbol.',
      render: () => plate.diamond(C.yellow, icon.miniStop(50, 50)),
    },
    {
      id: 'yield-ahead', name: 'Yield Ahead', category: 'warning', scenario: 'intersection-yield',
      meaning: 'A yield sign is approaching. Begin slowing and prepare to give the right of way.',
      where: 'Approaches to merges and minor-major intersections in rural areas.',
      expected: ['Reduce speed.', 'Prepare to yield or stop entirely.'],
      mistakes: ['Maintaining speed because the road appears clear.'],
      design: 'Yellow diamond with a small yield-sign symbol.',
      render: () => plate.diamond(C.yellow, icon.miniYield(50, 50)),
    },
    {
      id: 'signal-ahead', name: 'Signal Ahead', category: 'warning', scenario: 'intersection-stop',
      meaning: 'A traffic signal is ahead. Be prepared to stop on red or yellow.',
      where: 'High-speed approaches to signaled intersections, especially after curves or hills.',
      expected: ['Cover the brake.', 'Watch the signal — do not assume it will stay green.'],
      mistakes: ['Speeding up to "beat" a yellow on a high-speed road.'],
      design: 'Yellow diamond with a stylized traffic light.',
      render: () => plate.diamond(C.yellow, icon.trafficLight(50, 50)),
    },
    {
      id: 'pedestrian-crossing', name: 'Pedestrian Crossing', category: 'warning', scenario: 'pedestrian-crosswalk',
      meaning: 'Pedestrians may be crossing here. Slow down and yield to anyone in or about to enter the crosswalk.',
      where: 'Mid-block crosswalks, school routes, parks, transit stops.',
      expected: ['Slow down approaching the crosswalk.', 'Stop completely if a pedestrian is present.', 'Do not pass another vehicle that has stopped at a crosswalk.'],
      mistakes: ['Passing a stopped vehicle at a crosswalk and striking the pedestrian it stopped for.', 'Honking at pedestrians who have the right of way.'],
      design: 'Yellow (or fluorescent yellow-green) diamond with a walking-person symbol. The yellow-green color indicates a vulnerable user.',
      render: () => plate.diamond(C.yellowGreen, icon.pedestrian(50, 50)),
    },
    {
      id: 'bicycle-crossing', name: 'Bicycle Crossing', category: 'warning', scenario: 'pedestrian-crosswalk',
      meaning: 'Cyclists frequently cross or share the road here. Watch for bikes from both sides.',
      where: 'Trail crossings, bike-route streets, college campuses.',
      expected: ['Slow down and check for cyclists before turning.', 'Give cyclists at least 3 feet when passing.'],
      mistakes: ['Right-turning across a cyclist in a bike lane (the "right hook").', 'Opening a car door without checking for bikes ("dooring").'],
      design: 'Yellow-green diamond with a bicycle symbol.',
      render: () => plate.diamond(C.yellowGreen, icon.bicycle(50, 50)),
    },
    {
      id: 'deer-crossing', name: 'Deer Crossing', category: 'warning', scenario: 'speed-trap',
      meaning: 'Deer frequently cross the road in this area, especially at dawn and dusk.',
      where: 'Rural highways near woods, parks, and along migration paths.',
      expected: ['Slow down, especially at dawn and dusk.', 'Use high beams when alone on the road.', 'If a deer appears, brake — do not swerve into oncoming traffic.'],
      mistakes: ['Swerving and hitting a tree or another car instead of the deer.', 'Assuming a single deer means the herd is gone — others usually follow.'],
      design: 'Yellow diamond with a leaping-deer silhouette.',
      render: () => plate.diamond(C.yellow, icon.deer(50, 50)),
    },
    {
      id: 'cattle-crossing', name: 'Cattle Crossing', category: 'warning', scenario: 'speed-trap',
      meaning: 'Livestock may be on or near the road, sometimes herded across it.',
      where: 'Open-range roads in the West, dairy regions, agricultural areas.',
      expected: ['Slow down and be ready to stop.', 'Wait patiently for the herd to clear.', 'Never honk to disperse animals — they may panic into the road.'],
      mistakes: ['Speeding past a herd and spooking them.'],
      design: 'Yellow diamond with a cow silhouette.',
      render: () => plate.diamond(C.yellow, icon.cow(50, 56)),
    },
    {
      id: 'two-way-traffic', name: 'Two-Way Traffic', category: 'warning', scenario: 'wrong-way',
      meaning: 'A divided or one-way road is ending. Oncoming traffic will share your roadway ahead.',
      where: 'End of one-way streets, end of divided sections of rural highways.',
      expected: ['Stay in your lane.', 'Watch for oncoming traffic.', 'Do not pass on the new section without checking sight lines.'],
      mistakes: ['Drifting across the centerline because there had not been one for a while.'],
      design: 'Yellow diamond showing two opposing arrows.',
      render: () => plate.diamond(C.yellow,
        `<g stroke="${C.black}" stroke-width="5" fill="${C.black}" stroke-linejoin="round" stroke-linecap="round">
           <path d="M 38 26 L 38 70 L 32 70 L 40 80 L 48 70 L 42 70 L 42 26 Z"/>
           <path d="M 62 74 L 62 30 L 68 30 L 60 20 L 52 30 L 58 30 L 58 74 Z"/>
         </g>`),
    },
    {
      id: 'lane-ends', name: 'Lane Ends / Merge', category: 'warning', scenario: 'intersection-yield',
      meaning: 'A travel lane is ending soon. Drivers in that lane must merge into the continuing lane.',
      where: 'Highway construction zones, end of acceleration lanes, road narrows after bridges.',
      expected: ['Match speed with the continuing lane.', 'Use turn signal and merge in a smooth gap.', 'If you are in the continuing lane, allow others to merge — alternate (zipper) merging.'],
      mistakes: ['Speeding up to block a merging vehicle.', 'Last-second merges that force others to brake.'],
      design: 'Yellow diamond showing two converging lane lines.',
      render: () => plate.diamond(C.yellow,
        `<g stroke="${C.black}" stroke-width="6" fill="none" stroke-linecap="round">
           <path d="M 36 84 L 36 50 Q 36 34 50 28"/>
           <path d="M 64 84 L 64 50 Q 64 34 50 28"/>
         </g>`),
    },
    {
      id: 'divided-highway', name: 'Divided Highway Begins', category: 'warning', scenario: 'wrong-way',
      meaning: 'The road ahead splits into separate roadways with a median in between.',
      where: 'Highway upgrade points, approaches to interchanges.',
      expected: ['Keep right of the median.', 'Watch for other drivers crossing into the wrong direction.'],
      mistakes: ['Turning left across the median where it is not allowed.'],
      design: 'Yellow diamond with two diverging arrows around a black median strip.',
      render: () => plate.diamond(C.yellow,
        `<rect x="46" y="22" width="8" height="56" fill="${C.black}"/>
         <g stroke="${C.black}" stroke-width="5" fill="${C.black}" stroke-linejoin="round" stroke-linecap="round">
           <path d="M 36 78 L 36 30 L 30 30 L 38 20 L 46 30 L 40 30 L 40 78 Z"/>
           <path d="M 64 78 L 64 30 L 70 30 L 62 20 L 54 30 L 60 30 L 60 78 Z"/>
         </g>`),
    },
    {
      id: 'divided-highway-ends', name: 'Divided Highway Ends', category: 'warning', scenario: 'wrong-way',
      meaning: 'The divided portion of the road is ending — opposing traffic will share the same roadway.',
      where: 'Transition from highway to two-lane road.',
      expected: ['Move right.', 'Be alert for oncoming traffic.', 'Stay out of the now-shared centerline.'],
      mistakes: ['Continuing to use the left lane as a passing lane.'],
      design: 'Yellow diamond with two lanes converging into one.',
      render: () => plate.diamond(C.yellow,
        `<g stroke="${C.black}" stroke-width="5" fill="${C.black}" stroke-linejoin="round" stroke-linecap="round">
           <path d="M 36 22 L 36 70 Q 36 80 50 80 L 50 86"/>
           <path d="M 64 22 L 64 70 Q 64 80 50 80"/>
           <polygon points="50,90 44,80 56,80"/>
         </g>`),
    },
    {
      id: 'railroad-crossing', name: 'Railroad Crossing (Crossbuck)', category: 'warning', scenario: 'railroad',
      meaning: 'You are at a railroad crossing. Trains have absolute right of way.',
      where: 'Active rail lines that intersect public roads.',
      expected: ['Slow down and look both ways.', 'Stop if a train is approaching, lights flash, or gates lower.', 'Never stop on the tracks themselves.', 'Wait until the gate fully raises before crossing.'],
      mistakes: ['Trying to beat the gate.', 'Stopping on the tracks at a red light past the crossing.', 'Driving around lowered gates — illegal and almost always lethal.'],
      design: 'White X-shaped crossbuck with "RAILROAD CROSSING" lettering. A round yellow advance sign with "RR" precedes it.',
      render: () => plate.crossbuck(
        `${txt(50, 47, 'RAIL', { size: 7, color: C.black, family: 'Arial Black' })}
         ${txt(50, 56, 'ROAD', { size: 7, color: C.black, family: 'Arial Black' })}
         ${txt(28, 30, 'X', { size: 12, color: C.black, family: 'Arial Black' })}
         ${txt(72, 76, 'X', { size: 12, color: C.black, family: 'Arial Black' })}`),
    },
    {
      id: 'railroad-advance', name: 'Railroad Advance Warning', category: 'warning', scenario: 'railroad',
      meaning: 'A railroad crossing is ahead. Be prepared to stop for an approaching train.',
      where: 'Several hundred feet before any active rail crossing.',
      expected: ['Reduce speed.', 'Look and listen for trains.', 'Be prepared to stop at the crossbuck or gate.'],
      mistakes: ['Accelerating to clear the crossing before a perceived train.', 'Ignoring crossings on rural roads where trains are infrequent — but possible.'],
      design: 'A round yellow plate with a black "X" and "RR" — its circular shape is unique to railroad warnings.',
      render: () => plate.circle(C.yellow,
        `<line x1="20" y1="20" x2="80" y2="80" stroke="${C.black}" stroke-width="6"/>
         <line x1="80" y1="20" x2="20" y2="80" stroke="${C.black}" stroke-width="6"/>
         ${txt(30, 56, 'R', { size: 18, color: C.black, family: 'Arial Black' })}
         ${txt(70, 56, 'R', { size: 18, color: C.black, family: 'Arial Black' })}`),
    },
    {
      id: 'low-clearance', name: 'Low Clearance', category: 'warning', scenario: 'wrong-way',
      meaning: 'The structure ahead has limited vertical clearance. Vehicles taller than the posted height cannot fit.',
      where: 'Bridges, tunnels, parking garages.',
      expected: ['Know your vehicle height — including roof racks and antennas.', 'Take an alternate route if uncertain.'],
      mistakes: ['Trusting GPS for trucks.', 'Forgetting that pickup trucks with campers can exceed posted heights.'],
      design: 'Yellow diamond posting the height in feet and inches.',
      render: () => plate.diamond(C.yellow,
        txt(50, 46, '12 FT', { size: 14, color: C.black, family: 'Arial Black' }) +
        txt(50, 66, '6 IN', { size: 14, color: C.black, family: 'Arial Black' })),
    },
    {
      id: 'dead-end', name: 'Dead End', category: 'warning', scenario: 'wrong-way',
      meaning: 'The street ends without an outlet. You must turn around to leave.',
      where: 'Cul-de-sacs, residential streets, dead-end alleys.',
      expected: ['Plan to turn around at the end.', 'Watch for children playing — dead ends are common play areas.'],
      mistakes: ['Speeding into a dead-end street.', 'Doing a U-turn across someone\'s lawn.'],
      design: 'Yellow diamond with the words DEAD END in black.',
      render: () => plate.diamond(C.yellow,
        txt(50, 46, 'DEAD', { size: 14, color: C.black, family: 'Arial Black' }) +
        txt(50, 66, 'END', { size: 14, color: C.black, family: 'Arial Black' })),
    },
    {
      id: 't-intersection', name: 'T-Intersection', category: 'warning', scenario: 'intersection-stop',
      meaning: 'The road ahead ends at a perpendicular road. You must turn left or right.',
      where: 'Approaches to county-road junctions, end of subdivision roads.',
      expected: ['Reduce speed.', 'Yield to traffic on the cross road.'],
      mistakes: ['Realizing too late and overshooting into the cross road.'],
      design: 'Yellow diamond with a T-shaped road symbol.',
      render: () => plate.diamond(C.yellow,
        `<g stroke="${C.black}" stroke-width="8" fill="none" stroke-linecap="square">
           <line x1="50" y1="86" x2="50" y2="42"/>
           <line x1="22" y1="42" x2="78" y2="42"/>
         </g>`),
    },
    {
      id: 'y-intersection', name: 'Y-Intersection', category: 'warning', scenario: 'intersection-yield',
      meaning: 'The road ahead splits into a Y. Choose either branch.',
      where: 'Rural junctions, roads splitting around a feature.',
      expected: ['Reduce speed and pick a branch early.', 'Signal the branch you are taking.'],
      mistakes: ['Last-second lane changes between branches.'],
      design: 'Yellow diamond with a Y-shaped road symbol.',
      render: () => plate.diamond(C.yellow,
        `<g stroke="${C.black}" stroke-width="8" fill="none" stroke-linecap="square">
           <line x1="50" y1="86" x2="50" y2="56"/>
           <line x1="50" y1="56" x2="28" y2="24"/>
           <line x1="50" y1="56" x2="72" y2="24"/>
         </g>`),
    },

    /* ============ SCHOOL ============ */
    {
      id: 'school-zone', name: 'School Zone', category: 'school', scenario: 'speed-trap',
      meaning: 'You are entering an area near a school. A reduced speed limit applies, often when children are present or during posted hours.',
      where: 'Within several hundred feet of any school, at the start and end of the zone.',
      expected: ['Reduce speed to the posted school zone limit.', 'Watch for children near the curb.', 'Be ready to stop for school buses or crossing guards.'],
      mistakes: ['Maintaining the regular limit because no children are visible.', 'Missing the time-of-day rule on the qualifier sign.'],
      design: 'A unique pentagon shape (pointed top) and yellow-green color identify school-related warnings.',
      render: () => plate.pentagon(icon.twoChildren(50, 60)),
    },
    {
      id: 'school-crossing', name: 'School Crossing', category: 'school', scenario: 'pedestrian-crosswalk',
      meaning: 'A school-related crosswalk is ahead. Children may be crossing.',
      where: 'Marked pedestrian crossings on school routes, often with a crossing guard.',
      expected: ['Slow down and prepare to stop.', 'Yield to all pedestrians and the crossing guard\'s instructions.', 'Do not block the crosswalk.'],
      mistakes: ['Stopping inside the crosswalk.', 'Passing another vehicle that has stopped for children.'],
      design: 'Yellow-green pentagon with two figures (often a school guard and a child) and crosswalk lines.',
      render: () => plate.pentagon(icon.twoChildren(50, 50) +
        `<g stroke="${C.black}" stroke-width="2">
           <line x1="22" y1="86" x2="78" y2="86"/>
           <line x1="28" y1="80" x2="28" y2="92"/>
           <line x1="42" y1="80" x2="42" y2="92"/>
           <line x1="58" y1="80" x2="58" y2="92"/>
           <line x1="72" y1="80" x2="72" y2="92"/>
         </g>`),
    },

    /* ============ CONSTRUCTION ============ */
    {
      id: 'road-work-ahead', name: 'Road Work Ahead', category: 'construction', scenario: 'speed-trap',
      meaning: 'A construction zone is ahead. Expect changed lane patterns, reduced speed, and workers near the road.',
      where: 'Active road construction, utility work, and short-term maintenance zones.',
      expected: ['Slow to the posted work-zone speed.', 'Watch for workers and equipment.', 'Move over a lane when possible.', 'Fines often double in work zones.'],
      mistakes: ['Speeding through because no workers are immediately visible.', 'Tailgating in a single-lane construction shift.'],
      design: 'Orange diamond — the dedicated color for temporary construction or work zone signs.',
      render: () => plate.diamond(C.orange,
        txt(50, 36, 'ROAD', { size: 11, color: C.black, family: 'Arial Black' }) +
        txt(50, 52, 'WORK', { size: 11, color: C.black, family: 'Arial Black' }) +
        txt(50, 70, 'AHEAD', { size: 11, color: C.black, family: 'Arial Black' })),
    },
    {
      id: 'flagger-ahead', name: 'Flagger Ahead', category: 'construction', scenario: 'intersection-stop',
      meaning: 'A flagger (worker with a hand-held STOP/SLOW paddle) is directing traffic ahead.',
      where: 'Single-lane construction sections, utility work, accident scenes.',
      expected: ['Slow down and prepare to stop.', 'Obey the flagger — their direction overrides any signal or sign.'],
      mistakes: ['Ignoring the flagger because the road appears clear.', 'Driving past after a "SLOW" sign without checking traffic ahead.'],
      design: 'Orange diamond with a worker silhouette holding a flag.',
      render: () => plate.diamond(C.orange,
        icon.worker(46, 56, C.black) +
        `<rect x="58" y="22" width="14" height="14" fill="${C.red}" stroke="${C.black}" stroke-width="2"/>
         <line x1="58" y1="22" x2="58" y2="60" stroke="${C.black}" stroke-width="2"/>`),
    },
    {
      id: 'detour', name: 'Detour', category: 'construction', scenario: 'wrong-way',
      meaning: 'The normal route is closed. Follow the detour to bypass the closure.',
      where: 'Closed bridges, parade routes, major construction projects.',
      expected: ['Follow the detour signs in sequence.', 'Do not attempt to "shortcut" through the closure.'],
      mistakes: ['Stopping following detour signs after one or two and getting lost.', 'Driving around barricades.'],
      design: 'Orange rectangle with the word DETOUR and an arrow pointing in the bypass direction.',
      render: () => plate.rectH(C.orange,
        txt(38, 56, 'DETOUR', { size: 12, color: C.black, family: 'Arial Black' }) +
        icon.arrowRight(80, 50, 0.7, C.black)),
    },
    {
      id: 'lane-closed', name: 'Lane Closed', category: 'construction', scenario: 'intersection-yield',
      meaning: 'A specific lane ahead is closed. Merge into the open lane before reaching the closure.',
      where: 'Highway maintenance, paving, lane shifts.',
      expected: ['Merge early and smoothly using your signal.', 'Use the zipper merge when traffic is congested — alternate one car at a time.'],
      mistakes: ['Waiting until the very end of the closed lane (cutting drivers off).', 'Refusing to let zipper-mergers in.'],
      design: 'Orange diamond showing a closed lane with a merging arrow.',
      render: () => plate.diamond(C.orange,
        `<g stroke="${C.black}" stroke-width="3" fill="none">
           <line x1="36" y1="20" x2="36" y2="80"/>
           <line x1="64" y1="20" x2="64" y2="80"/>
         </g>
         <g stroke="${C.black}" stroke-width="6" fill="none" stroke-linecap="round">
           <path d="M 64 76 Q 50 60 36 60"/>
           <polyline points="42,54 36,60 42,66"/>
         </g>
         ${txt(64, 50, '✕', { size: 22, color: C.red, family: 'Arial Black' })}`),
    },

    /* ============ GUIDE ============ */
    {
      id: 'hospital', name: 'Hospital', category: 'guide', scenario: 'speed-trap',
      meaning: 'A hospital is nearby. Quiet and cautious driving is expected.',
      where: 'Roads approaching medical centers and emergency rooms.',
      expected: ['Reduce speed if posted.', 'Avoid horn use.', 'Yield to ambulances entering or exiting.'],
      mistakes: ['Parking in ambulance bays.', 'Honking near a hospital entrance.'],
      design: 'Blue square with a white H — blue is the standard for motorist services.',
      render: () => plate.rectV(C.blue,
        txt(50, 70, 'H', { size: 64, color: C.white, family: 'Arial Black' })),
    },
    {
      id: 'rest-area', name: 'Rest Area', category: 'guide', scenario: 'speed-trap',
      meaning: 'A roadside rest area with restrooms and parking is ahead.',
      where: 'Interstates and major state highways at regular intervals.',
      expected: ['Use it for breaks on long drives — fatigue causes thousands of crashes per year.', 'Do not camp overnight unless permitted.'],
      mistakes: ['Skipping rest areas on long drives because "I\'m almost there."'],
      design: 'Blue rectangle — the standard for motorist services.',
      render: () => plate.rectV(C.blue,
        txt(50, 36, 'REST', { size: 14, color: C.white, family: 'Arial Black' }) +
        txt(50, 60, 'AREA', { size: 14, color: C.white, family: 'Arial Black' }) +
        txt(50, 84, '2 MI', { size: 11, color: C.white, family: 'Arial Black' })),
    },
  ];

  // Expose
  window.SIGNS = SIGNS;
  window.SIGN_COLORS = C;
  window.findSign = (id) => SIGNS.find(s => s.id === id);
})();
