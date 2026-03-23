# Algedisc — Implementation Plan

## Cross-Cutting Architecture

**Tech stack:** Vanilla HTML + CSS + JS. No framework, no build step. Native ES modules (`<script type="module">`). Hosted on GitHub Pages.

**Rendering:** Single `<canvas>` element for the workspace. Dirty-flag rendering — only re-render when state changes (disc moved, selection changed, etc.), not on every frame. A `dirty` flag is set by any state mutation; a single `requestAnimationFrame` call is scheduled when dirty, and clears the flag after drawing.

**Accessibility:** Not a concern.

**Mobile / touch:** Explicitly out of scope.

**Project structure:**
```
index.html
css/
  style.css
js/
  main.js          — entry point, tab switching, init
  canvas.js        — canvas setup, dirty-flag render loop, event dispatch
  disc.js          — disc model (type, position, side, selected)
  workspace.js     — disc collection, add/remove/move/flip/select
  toolbox.js       — toolbox strip rendered on canvas (left side)
  grid.js          — snap-to-grid logic
  problem.js       — problem generation & solution display
  frame.js         — multiplication frame (Tab 2)
```

**Toolbox:** Rendered as a left strip on the canvas — not an HTML panel. Same coordinate system as the workspace. Toolbox discs are drawn at fixed positions in the strip; dragging from a toolbox disc spawns a new disc into the workspace area. This eliminates DOM-to-canvas drag handoff complexity.

**Panning:** The canvas/workspace is larger than the viewport. Right-click drag pans the viewport across the workspace. The toolbox strip stays fixed (does not scroll with the workspace).

**Hit-testing:** Circle-point distance check. Discs are circles with known center and radius. Iterate in reverse z-order so topmost disc wins.

**Z-ordering:** Array order = z-order. Moving/creating a disc pushes it to the end of the array (top of stack).

**State model:**
- `discs[]` — array of `{ id, type, x, y, side, selected }`
- `problem` — current problem object (type, expression, solution text), or null
- `activeTab` — `"workspace"` | `"frame"`
- `gridEnabled` — boolean
- `viewport` — `{ x, y }` (pan offset)

The state model must be **snapshot-friendly from Iteration 1**. All mutable state lives in a single serializable object (or a small set of them). This enables future undo/redo — capturing a snapshot before each mutation and restoring on undo. Undo/redo itself ships in a later iteration (TBD), but the state shape must support it from day one. Guideline: no hidden state in closures or DOM; everything that affects rendering must be in the state object.

**Answer checking:** There is no programmatic verification of disc arrangements. "Check Answer" = reveal the stored solution so the user can self-compare. The app never reads or evaluates what's on the workspace.

**Interaction state machine:**
`IDLE` | `DRAGGING_DISC` | `DRAGGING_SELECTION` | `MARQUEE` | `DRAGGING_FROM_TOOLBOX` | `PANNING`

---

## Iteration 1 — Core Workspace (1 PR)

### Problem Statement
Get the foundational canvas rendering and disc interaction working. A user should be able to create discs from the toolbox, move them around, flip them, and pan the workspace.

### Scope — In
- Project scaffold: `index.html`, CSS, JS module structure, GitHub Pages deploy
- Canvas rendering engine: dirty-flag render, coordinate system, resize handling
- Snapshot-friendly state model (all mutable state in a serializable object)
- Disc model and rendering (3 types x 2 sides = 6 visual variants)
- Toolbox strip rendered on canvas (left side) with one disc per type
- Drag-from-toolbox: spawns a new disc at drop location
- Click-drag on existing disc: repositions it
- Double-click on disc: flips positive <-> negative
- Right-click drag on empty space: pans the workspace viewport
- Visual distinction: unique colour per disc type, distinct positive/negative appearances

### Scope — Out
- Selection (marquee, ctrl-click), delete, grid snapping
- Problem generation
- Tab 2
- Undo/redo (but state model is designed to support it later)

### Key Decisions
- **Disc colour scheme** — Designer to propose (6 distinct appearances: 3 types x 2 sides) and await owner approval before implementation starts. Routed to Designer in the handoff.
- **Disc size** — Fixed pixel radius (e.g., 30px). Dozens of discs need to fit on screen.
- **Toolbox on canvas** — the toolbox strip is drawn on the canvas in a fixed left-side region. Toolbox coordinates are in screen space (not affected by panning); workspace discs are in world space (affected by panning). Hit-testing must account for this distinction.
- **Viewport / world coordinates** — disc positions are stored in world space. Rendering transforms world coordinates by the viewport offset. Mouse events convert screen coordinates to world coordinates for hit-testing.

### Risks
- **Double-click vs. click-drag ambiguity** — a double-click starts with a single click. Mitigation: small movement threshold (~5px); if mouse moves less than threshold between down and up, treat as click. Track click timing for double-click detection.
- **Right-click context menu** — browser shows a context menu on right-click. Mitigation: `preventDefault()` on `contextmenu` event over the canvas.

### Assumptions
- Modern browsers only (ES modules, canvas 2D — no polyfills)
- No offline/PWA requirements

---

## Iteration 2 — Selection & Grid (1 PR)

### Problem Statement
Enable multi-disc manipulation and optional grid alignment.

### Scope — In
- Marquee select: click-drag on empty canvas space draws a selection rectangle; discs within are selected on release
- Ctrl-click: toggle individual disc in/out of selection
- Visual selection indicator (e.g., highlight ring around selected discs)
- Bulk move: dragging any selected disc moves all selected discs
- Delete: keyboard shortcut (Delete/Backspace) and a UI button remove selected discs
- Snap-to-grid toggle: button; when on, discs snap to nearest grid point on drop
- Grid visual: faint grid lines on canvas when snap is enabled

### Scope — Out
- Problem generation
- Tab 2

### Key Decisions
- **Marquee vs. move vs. pan disambiguation** — `mousedown` hit-tests discs first (left-click on disc = move). Left-click on empty space = marquee. Right-click drag = pan. Clear, unambiguous rules.
- **Marquee selection mode** — plain marquee replaces current selection; Ctrl+marquee adds to it.
- **Grid cell size** — disc diameter + small gap (e.g., 70px for 30px-radius discs).
- **Snap behavior** — snap on drop (disc moves freely during drag, snaps when released).

### Risks
- **Interaction state complexity** — six states now: `IDLE`, `DRAGGING_DISC`, `DRAGGING_SELECTION`, `MARQUEE`, `DRAGGING_FROM_TOOLBOX`, `PANNING`. Mitigation: explicit state machine with clear transition rules.
- **Ctrl-click during drag** — Mitigation: Ctrl-click only toggles selection in IDLE state.

---

## Iteration 3 — Simple Sum Generation (1 PR)

### Problem Statement
The app can generate simple addition/subtraction problems and reveal solutions for self-checking.

### Scope — In
- Problem panel UI (HTML): toggles for constant/linear/quadratic terms, toggle for negative numbers, "Generate" button
- Problem display: shows the expression (e.g., "What is 3x + (-2x)?")
- Problem generation logic: random expressions using enabled term types, respecting negative toggle
- "Check Answer" button: reveals the stored solution (e.g., "Answer: x")
- "Clear Workspace" button: removes all discs

### Scope — Out
- Expansion/factorisation problems
- Multiplication frame, Tab 2

### Key Decisions
- **Coefficient range** — **-9 to 9** (including 0). Discs get messy with big numbers.
- **Number of terms** — start with 2 terms per problem.
- **Workspace clearing** — "Generate" does not auto-clear. User clears manually.

### Risks
- **Trivial or confusing problems** — e.g., generating "0" as the answer, or problems with all-positive terms when negative toggle is off. Mitigation: ensure generated problems are non-trivial (at least one addition and one subtraction when negatives are enabled; nonzero answer).

---

## Iteration 4A — Expansion (1 PR)

### Problem Statement
Add expansion problem types and the multiplication frame visual guide overlay.

### Scope — In
- Problem type selector in the problem panel (simple sum / expansion)
- Expansion problem generator — three forms:
  - `a(b + c)`
  - `(a + b)(c + d)`
  - `(ax + b)(cx + d)`
- "Check Answer" reveals the expanded form
- Multiplication frame guide overlay: toggleable; draws two perpendicular lines and a multiplication symbol on the canvas. Purely visual, not interactive, fixed position on the canvas.

### Scope — Out
- Factorisation problems
- Tab 2

### Key Decisions
- **Problem generation constraints** — generate with small coefficients (-9 to 9). Ensure expanded results have manageable terms.
- **Frame overlay appearance** — two lines (one horizontal, one vertical) with a x symbol at the intersection. Minimal, unobtrusive. Drawn behind discs. Fixed position (not draggable).
- **Expansion form selection** — let the user pick the form.

### Risks
- **Problem quality** — some coefficient combinations produce trivial or awkward expressions. Mitigation: validate generated problems (no zero coefficients in key positions, result has at least 2 non-zero terms).

---

## Iteration 4B — Factorisation (1 PR)

### Problem Statement
Add factorisation problem generation. The user arranges discs to explore factors, using the existing frame overlay as a visual guide.

### Scope — In
- Factorisation option added to the problem type selector
- Factorisation problem generator: generates a quadratic expression (e.g., x^2 + 5x + 6)
- "Check Answer" reveals the factored form (e.g., "(x + 2)(x + 3)")
- Frame overlay (from 4A) is available for use

### Scope — Out
- Tab 2
- Any programmatic reading of disc positions

### Key Decisions
- **Problem generation** — generate from known factor pairs to guarantee integer solutions. E.g., pick small integers a, b, generate (x + a)(x + b), present the expanded form as the problem.
- **Coefficient constraints** — factors limited so that expanded coefficients stay within -9 to 9.

### Risks
- **Limited problem variety** — with small coefficients, the pool of distinct factorable quadratics is finite. Mitigation: acceptable for an educational tool; variety isn't the primary goal.

### Assumptions
- Factorisation problems limited to quadratics factorable over integers with small coefficients.

---

## Iteration 5 — Multiplication Frame Tab (1 PR)

### Problem Statement
Add a second tab with a structured multiplication frame where users type values into cells, providing an alternative representation.

### Scope — In
- Tab UI: "Workspace" (existing) and "Multiplication Frame" (new)
- Tab switching preserves all state (discs stay, problem persists)
- Multiplication frame: HTML table
  - Row headers: terms of one factor
  - Column headers: terms of the other factor
  - Body cells: user fills in products
- Term picker for cell input: click a cell, pick from `+1`, `-1`, `+x`, `-x`, `+x^2`, `-x^2`
- "Check Answer" reveals the correct cell values (and headers, for factorisation)
- Frame dimensions adapt to the active problem
- For expansion: factor headers are pre-filled; user fills body cells
- For factorisation: headers are blank; user fills headers AND body cells

### Scope — Out
- Dragging discs into the frame

### Key Decisions
- **Frame rendering** — HTML `<table>`, not canvas. The frame is a structured form. CSS handles layout; JS handles input.
- **Tab state isolation** — workspace canvas stops rendering when Tab 2 is active (no dirty-flag checks needed). Problem state is shared; disc state and frame state are independent.
- **Term picker UX** — clicking a cell opens a small popover with buttons: `+1`, `-1`, `+x`, `-x`, `+x^2`, `-x^2`. No free-text parsing.
- **Pre-filled vs. blank headers** — expansion = pre-filled headers; factorisation = blank headers.

### Risks
- **State across tabs** — problem is shared, but workspace and frame have independent work state. Model: `workspaceState` (discs) and `frameState` (cell values) as siblings under shared `problem`.
- **Factorisation in the frame** — user fills headers AND body. "Check Answer" reveals correct headers and cells. Straightforward since it's just displaying the stored solution.

---

## Resolved Decisions

- **Disc colour scheme** — routed to Designer. Designer will propose and await owner approval.
- **Coefficient range** — -9 to 9 (including 0) across all problem types.
- **Frame overlay positioning** — fixed position on canvas. Not user-draggable.
- **Undo/redo** — state model is snapshot-friendly from Iteration 1. Undo/redo ships in a future iteration (TBD, not scoped in this plan).
