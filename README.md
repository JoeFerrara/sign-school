# Sign School

An interactive web tool that introduces U.S. street signs — what each one means, what it expects from you, and what happens when drivers ignore them.

**[▶ Try it live](https://joeferrara.github.io/sign-school/)**

> ## ⚠️ Important: this is an entertainment / educational toy, not a study tool
>
> **Do not use Sign School to study for a driver's permit, driver's license exam, or any licensing test. Do not use it as a substitute for driver's education.** This project is a hobby learning toy, intended for entertainment and casual familiarization with how U.S. road signs look and what they generally mean.
>
> Specifically:
>
> - **Sign artwork is hand-drawn and simplified.** It is not a faithful reproduction of the official MUTCD specification. Shapes, proportions, glyphs, and text are approximations.
> - **Information has not been formally reviewed** by a licensed driving instructor, traffic engineer, or DMV authority. Wording in the "meaning," "expected," and "common mistakes" sections reflects general public knowledge and may contain inaccuracies, oversimplifications, regional bias, or outright errors.
> - **Rules of the road vary by state.** State-specific exceptions, fines, time-of-day qualifiers, and pedestrian-priority rules are not represented here.
> - **The simulator's outcomes are dramatized.** The "random chance" of a crash or pull-over is for engagement, not a real statistical model of risk.
>
> **For authoritative information, always consult your state DMV handbook, an accredited driving school, or a licensed instructor.** If you spot incorrect information here, please [open an issue](https://github.com/JoeFerrara/sign-school/issues) or send a pull request — see Contributing below.

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

Sign School is a hobby project intended for entertainment and casual familiarization. It has **not** been verified by any licensed driving instructor, traffic engineer, or state DMV. Sign artwork is simplified, the written explanations may contain inaccuracies, and the simulator outcomes are dramatized for engagement.

**Do not rely on this tool for driver's education, licensing exam preparation, or any safety-critical decision.** Always consult your state DMV handbook or an accredited driving school for the authoritative rules of the road.

The authors and contributors disclaim any liability for actions taken based on the content of this site.
