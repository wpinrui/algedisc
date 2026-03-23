# Algedisc — Game Design Document

## Overview
A GitHub Pages microsite providing an interactive algebra disc manipulative for secondary mathematics education. Users drag, flip, and arrange colour-coded discs to visualise algebraic expressions, perform operations, and solve expansion/factorisation problems.

## Disc Types
| Disc | Positive side | Negative side |
|------|--------------|---------------|
| 1 (constant) | +1 | −1 |
| x (linear) | +x | −x |
| x² (quadratic) | +x² | −x² |

Each disc is a circular, coin-like element. The two sides are visually distinct (colour-coded). Double-clicking flips a disc to its opposite side.

## Tab 1 — Algebra Disc Workspace

### Toolbox
A persistent panel containing one of each disc type. Users drag a disc from the toolbox onto the workspace to create a new instance. The toolbox disc stays in place (it spawns a copy).

### Workspace Interactions
- **Drag from toolbox:** creates a new disc on the workspace
- **Click and drag:** repositions a disc
- **Double-click:** flips a disc (positive ↔ negative)
- **Marquee select:** click and drag on empty space to draw a selection rectangle; all discs within are selected
- **Ctrl-click:** toggle-add/remove individual discs to/from the current selection
- **Bulk move:** drag any selected disc to move the entire selection
- **Delete:** remove selected discs (keyboard shortcut or button)
- **Snap-to-grid:** toggle on/off; when enabled, discs align to a grid

### Problem Generation
A control panel for generating problems. The user solves them by arranging discs on the workspace.

#### Simple Sums
- Toggles: constant / linear / quadratic terms
- Toggle: allow negative numbers
- Generates addition/subtraction expressions to evaluate
- Example: "What is 3x + (−2x)?"

#### Expansion
- Generates problems of the form:
  - a(b + c)
  - (a + b)(c + d)
  - (ax + b)(cx + d)
- User expands using disc manipulation

#### Factorisation
- Generates quadratic expressions to factorise
- User arranges discs to find factors
- Optional: multiplication frame guide overlay to assist with layout

### Multiplication Frame Guide
An optional visual overlay that provides the rectangular frame structure for organising discs during expansion/factorisation. When enabled, it helps users set up the frame correctly.

## Tab 2 — Multiplication Frame

### Purpose
Provides an alternative representation for the same problem. The user solves a problem with discs in Tab 1, then switches to Tab 2 to solve it using the multiplication frame, and compares approaches.

### Problem Persistence
The currently active problem in Tab 1 carries over to Tab 2. Switching tabs does not reset the problem.

### Multiplication Frame
A structured grid/table where:
- Row headers represent one factor
- Column headers represent the other factor
- Cells contain the products (disc representations or numeric)
- Users fill in the frame to expand or identify factors

## Tech Constraints
- Static site: HTML + CSS + JS (no server)
- Hosted on GitHub Pages
- No framework requirement specified (keep it simple)
- Must be performant with dozens of discs on screen
