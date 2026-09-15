<div align="center">

# Calyx

**A procedural fluid laboratory for the browser.**

Live GPU shaders · Hand-written motion code · Zero build step **<span style="color: #3b82f6;">made by Ardy/Oleksandr and my man deepseek, thanks to him for adding notes and fixing bugs, true hommie</span>**

</div>

---

## What is Calyx?

Calyx is a self-contained WebGL playground where every liquid is its own
hand-written fragment shader. Instead of picking from a fixed list of
effects, each entry in the library carries the exact GLSL that produces
its look — so two liquids never behave the same way, and adding a new
one is just writing code.

The whole thing runs from a single folder. No frameworks, no bundler,
no dependencies. Open the page and it works.

---

## Highlights

- **Per-liquid shaders.** Every liquid ships its own GLSL instead of
  sharing a numbered preset. Motion, lighting, colour mixing and
  distortion are all authored by hand.
- **Live preset editor.** A dedicated workspace for designing new
  liquids with sliders, live colour pickers, and an embedded GLSL
  editor with a built-in snippet library.
- **Instant export.** Any preset can be exported as a ready-to-paste
  entry for the liquid data file, or copied directly to the clipboard.
- **Cinema mode.** Fullscreen hides every panel, the cursor fades, and
  the UI only returns when you move the mouse.
- **Auto-coloured card strokes.** Card outlines can automatically pick
  up a liquid's two defining colours and glow with a dual-corner shine.
- **Deep settings.** Transparency, blur, vignette, glow, motion speed,
  cinema behaviour, accessibility and more — all live, all persisted.
- **Native data format.** The liquid library is a plain ES module, so
  editors, tooling and future features can read it without a build step.

---

## Project layout

├── index.html Main laboratory view — the live canvas and vault
├── editor.html Preset editor — design, save, and export liquids
├── liquids.js The liquid library (each entry carries its own GLSL)
├── icon.png App icon used in the header and browser tab
├── bh.png Background image behind the vault overlay
└── setting.png Background layer behind the settings panel



Every page is standalone. Opening `index.html` is all that's needed to
run the laboratory; the editor is reached from the vault or the rail.

---

## Using the laboratory

The main view is a full-screen shader canvas with a floating UI on top.

- **Move the mouse** to push the fluid around.
- **Click or press space** to fire a pulse through the surface.
- **Open the vault** to browse the library and switch liquids.
- **Filter** by category to narrow the vault to a specific kind of
  motion.
- **Randomize** to jump to an unexpected liquid.
- **Go fullscreen** to enter cinema mode, where the UI fades away.

Every liquid can be inspected through its live preview thumbnail in the
vault, which animates independently of the main canvas.

---

## Designing new liquids

The preset editor exposes the full design surface of a liquid:

- Name, description and category
- Base and flow colours
- Motion parameters — speed, glow, softness, scale, warp, and pulse
  response
- A GLSL editor for defining entirely new motion behaviour
- Live preview that updates as you type

Custom motion code is written against a small, fixed interface. The
shader receives position, mouse, time and distance, plus a handful of
noise helpers, and simply sets a single value that drives the final
colour mix. Anything the shader computes beyond that is up to the
author — from fake 3D lighting and Voronoi cells to raymarched tunnels
and interference patterns.

Presets can be saved locally, exported as JSON, or copied out as a
complete entry ready to drop into the liquid library.

---

## The liquid library

The library is a plain JavaScript module. Each liquid is an object
describing its identity and the code that animates it. The exact shape
of an entry is documented at the top of the file itself, and the
interface available inside a liquid's custom shader is documented
alongside it.

Adding a liquid means appending one object. Removing one means deleting
it. The renderer reads whatever is in the file — nothing else needs to
change.

---

## Settings

A single preferences panel controls how the laboratory feels, grouped
into clear sections:

- **Appearance** — panel transparency, blur, and vignette intensity
- **Visuals** — glow strength, motion speed, card stroke, hover and
  preview behaviour
- **Cinema** — auto-hide timing, always-show behaviour, hint visibility
- **Accessibility** — reduced motion and high contrast modes
- **Data** — reset preferences to defaults

Everything is stored locally in the browser and applied live. No
reload, no confirmation dialogs.

---

## Browser support

Calyx targets modern evergreen browsers. It requires WebGL and a
reasonably current implementation of CSS backdrop filters — recent
versions of Chrome, Edge, Safari and Firefox all work.

---

## Philosophy

- **No build step.** The folder you clone is the folder you run.
- **No hidden magic.** Every visual effect is written in plain GLSL,
  readable and editable.
- **No lock-in.** Presets are portable, the library is a module, and
  the shader format is documented in the file itself.
- **No repetition.** Liquids are meant to feel distinct — the library
  is a gallery, not a catalogue.

---

<div align="center">

*Move through the surface.*

</div>
