# Delta Archives — Personal History & Lore Blog

Public static website for interactive personal history and lore (course project: Programare Web).

**Live repository:** [github.com/ArchiveNodeR/New-vision](https://github.com/ArchiveNodeR/New-vision)

## Features

- **Home** (`index.html`) — hero, Chronicle ticker, searchable/filterable story grid, Plot & About sections
- **Story detail** (`story.html?story=<id>`) — full text rendered from JS data array, per-story theme
- **Account** (`account.html`) — profile form with client-side validation, background preset + density/frequency controls, localStorage persistence
- **Site-wide** animated cosmic background (stars + comets on canvas)
- **Responsive** from 320px to 1440px+, mobile burger navigation
- Vanilla HTML5, CSS3 (Flexbox/Grid/custom properties), ES6+ modules — no frameworks

## How to run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or: python -m http.server 8080
```

Then visit `http://localhost:3000` (or the port shown).

## Technologies

- HTML5 (semantic structure)
- CSS3 (custom properties, Grid, Flexbox, animations)
- Vanilla JavaScript (ES modules)
- Canvas API for stars & comets
- localStorage for preferences
- Google Fonts: Cinzel + Lora

## Structure

```
delta-archives/
├── index.html
├── story.html
├── account.html
├── css/style.css
├── js/
│   ├── main.js      # app logic, filtering, form, localStorage
│   ├── data.js      # stories + theme palettes
│   └── scene.js     # canvas background engine
└── README.md
```

## Functional requirements covered (ToR)

| ID    | Requirement                          | Status |
|-------|--------------------------------------|--------|
| FR-01 | Identical header/nav                 | ✓      |
| FR-02 | Home hero + latest-entry card        | ✓      |
| FR-03 | Chronicle ticker                     | ✓      |
| FR-04 | Story grid from JS array             | ✓      |
| FR-05 | Category/tag filter                  | ✓      |
| FR-06 | Text search                          | ✓      |
| FR-07 | No-results state                     | ✓      |
| FR-08 | Story detail via id param            | ✓      |
| FR-09 | Site-wide canvas background          | ✓      |
| FR-10 | Account background settings          | ✓      |
| FR-11 | Client-side form validation          | ✓      |
| FR-12 | localStorage persistence             | ✓      |
| FR-13 | Mobile burger menu                   | ✓      |

## Author

Dodon Alexandru · Group IT11Z · Supervisor: Sergiu Chilat  
Version 2.0 · Planned defence: 11.12.2026
