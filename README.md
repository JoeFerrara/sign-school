# Sign School

An interactive web tool that teaches U.S. street signs — what each one means, what it expects from you, and what happens when drivers ignore them.

**[▶ Try it live](https://joeferrara.github.io/sign-school/)**

## What it does

Sign School has three modes:

- **Browse** — a filterable gallery of 45 U.S. street signs across five categories (regulatory, warning, school, construction, guide).
- **Learn** — click any sign to read a full lesson: meaning, where you'll see it, what's expected of you, common mistakes, and why the sign is shaped and colored the way it is.
- **Simulate** — pick a sign, choose to **obey** or **ignore** it, and watch a top-down 2D scene play out. Comply and the scenario resolves safely. Ignore it and you'll see a realistic consequence — a T-bone collision at a yield, a pedestrian struck at a crosswalk, a train hitting a stalled car at a railroad crossing, or a police cruiser pulling out of the bushes after a speeding stretch.

Six simulator scenarios power outcomes for all 45 signs:

| Scenario | Comply outcome | Ignore outcome |
| --- | --- | --- |
| Intersection — Yield | Safe merge after gap | T-boned by cross traffic |
| Intersection — Stop | Clean stop, then go | T-bone (50%) / police pull-over (35%) / lucky (15%) |
| Pedestrian Crosswalk | Pedestrian crosses, you proceed | Pedestrian struck |
| Speed Limit | Cruise past the cruiser | Police pursuit (75%) / got away (25%) |
| Wrong Way / Do Not Enter | Spot the sign, U-turn out | Head-on collision |
| Railroad Crossing | Wait for train, cross safely | Struck by train |

## Tech

Pure HTML / CSS / vanilla JavaScript — no build step, no dependencies. Signs are drawn procedurally as inline SVG following U.S. MUTCD conventions; the simulator uses the HTML5 Canvas 2D API.

## Running locally

```bash
git clone https://github.com/JoeFerrara/sign-school.git
cd sign-school
open index.html      # macOS — or just double-click the file
```

That's it. No `npm install`, no server required. Any modern browser will do.

## Project structure

```
sign-school/
├── index.html         App shell + tab navigation
├── styles.css         Layout and theming
└── js/
    ├── signs.js       45 signs: data + procedural SVG renderers
    ├── scenarios.js   6 simulator scenarios with comply/ignore branches
    ├── simulator.js   Canvas engine: agents, physics, collisions, drawing
    └── app.js         Mode switching, gallery, learn detail, sim wiring
```

## Contributing

**Pull requests are very welcome — for improvements, bug fixes, or new content.** A few ideas if you're looking for a place to start:

- Add a sign that isn't yet covered (state-specific, school-zone variants, transit-only, etc.).
- Improve a sign's SVG artwork — many of the icons (deer, bicycle, worker, etc.) are simplified and could use a better silhouette.
- Add a new simulator scenario — currently many signs share one of six scenes, so a dedicated scenario for a sign type would be a real upgrade.
- Add a quiz mode that shows a sign and asks what action is required.
- Add sound effects — engine, brakes, sirens, train horn.
- Make the simulator scenes feel more alive: more ambient traffic, animated pedestrians on sidewalks, weather variants.
- Polish the visual design, accessibility, or mobile layout.
- Fix a bug. Spotted something off? Open an issue or jump straight to a PR.

### How to contribute

1. Fork the repo and clone your fork.
2. Create a branch: `git checkout -b your-improvement`.
3. Make the change. For new signs, add an entry to `js/signs.js` (with `meaning`, `where`, `expected`, `mistakes`, `design`, `scenario`, and a `render()` function). For new scenarios, add an entry to `js/scenarios.js` and the registry at the bottom.
4. Open `index.html` and walk through Browse, Learn, and Simulate modes to verify your change works.
5. Commit and push, then open a pull request describing what you changed and why.

No issue template, no CLA, no review checklist — just clear changes with enough context for a reviewer to understand them.

## Disclaimer

Sign School is an educational tool. Sign artwork is simplified for clarity and may not match every state's exact design. Always consult your state DMV handbook for the authoritative rules of the road.
