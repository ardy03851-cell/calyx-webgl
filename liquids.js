// liquids.js — Calyx fluid definitions
//
// Every liquid carries its own hand-written GLSL in `custom`. The host
// renderer injects it into main() at `// __CUSTOM_CODE__`, then computes:
//   structure = smoothstep(0.15, 0.85, v);
//   color     = mix(u_a, u_b, structure);
//   color     += white glint where v ≈ 0.58  (highlight)
//   color     += white edge  where v ≈ 0.50  (edge)
//
// Available inside `custom`:
//   p, mouse (vec2), t (float), d (float)
//   u_a, u_b (vec3), u_pulse (float)
//   hash(vec2), noise(vec2), fbm(vec2), rot(vec2,float)
//   v (float) — set this to your result

export default [

  // =============================================================
  // ORGANIC
  // =============================================================

  {
    name: "Deep Obsidian",
    cat: "organic",
    desc: "Volumetric god-rays from above",
    a: "#080d1a",
    b: "#5c82c9",
    motion: -1,
    speed: 0.5,
    glow: 0.9,
    custom: `
      // Six volumetric light shafts angled across the frame + floating dust.
      float shafts = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float ang = fi * 1.05 + sin(t * 0.15 + fi) * 0.35;
        vec2 dir = vec2(sin(ang), cos(ang));
        float proj = dot(p, dir);
        float perp = abs(p.x * dir.y - p.y * dir.x);
        float w = 0.10 + 0.05 * sin(fi * 3.1);
        shafts += exp(-perp * perp / (w * w))
                * (0.5 + 0.5 * sin(proj * 4.0 + t * 0.6 + fi * 2.0));
      }
      shafts /= 6.0;
      // dust motes
      vec2 sp = p * 6.0;
      vec2 si = floor(sp), sf = fract(sp);
      float dust = 0.0;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 3.3));
        o.y += fract(t * 0.08 + hash(si + g + 1.1));
        dust += exp(-length(sf - g - o) * 24.0);
      }
      v = clamp(shafts * 0.7 + dust * 0.35 + fbm(p * 1.4 + t * 0.02) * 0.25, 0.0, 1.0);
    `
  },

  {
    name: "Ink Tendrils",
    cat: "organic",
    desc: "Living L-system branches",
    a: "#0a0814",
    b: "#8a6fd6",
    motion: -1,
    speed: 0.4,
    glow: 0.7,
    custom: `
      // Growth rings — branching fractals via iterative rotation.
      float ink = 0.0;
      vec2 q = p * 1.2;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        q = rot(q, 0.9 + fi * 0.35 + sin(t * 0.2 + fi) * 0.4);
        q += vec2(sin(t * 0.15 + fi * 1.3), cos(t * 0.12 + fi * 2.1)) * 0.09;
        float branch = abs(sin(q.x * 8.0 + fbm(q + fi) * 5.0)) * 0.5;
        ink = max(ink, branch * exp(-length(q) * 0.7) * (1.0 - fi * 0.13));
      }
      v = ink * 0.65 + fbm(p * 2.5 + t * 0.05) * 0.35;
    `
  },

  {
    name: "Emerald Vortex",
    cat: "organic",
    desc: "Tunnel down a spiral well",
    a: "#03130f",
    b: "#3fd6a8",
    motion: -1,
    speed: 0.5,
    glow: 1.1,
    custom: `
      // Fake 3D tunnel: r becomes depth. Walls warped by fbm, rippling.
      float a = atan(p.y, p.x);
      float r = length(p);
      float depth = 1.0 / (r + 0.18);
      float wall  = sin(a * 6.0 + depth * 6.0 + t * 1.5) * 0.5 + 0.5;
      wall *= fbm(vec2(a * 1.5, depth * 0.6) + t * 0.1);
      float fog = exp(-r * 2.0);
      float core = exp(-r * 22.0);
      v = clamp(wall * fog * 1.4 + core * 0.9, 0.0, 1.0);
    `
  },

  {
    name: "Biolume Spores",
    cat: "organic",
    desc: "Deep-sea jellies",
    a: "#01110f",
    b: "#4fe8c8",
    motion: -1,
    speed: 0.35,
    glow: 1.4,
    pulse: 1.5,
    custom: `
      // Three glowing jellyfish: a bell, tentacles, and drifting particles.
      float glow = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 c = vec2(sin(t * 0.2 + fi * 2.3) * 0.7,
                      cos(t * 0.17 + fi * 1.9) * 0.5
                      + sin(t * 0.9 + fi) * 0.15);
        vec2 rel = p - c;
        // bell (dome)
        float bell = exp(-length(rel * vec2(1.0, 1.6)) * 8.0);
        // tentacles: fine ripples below
        float tent = 0.0;
        for (int j = 0; j < 5; j++) {
          float fj = float(j);
          float off = (fj - 2.0) * 0.05;
          float tx = sin(rel.y * 14.0 + t * 2.0 + fj) * 0.04 + off;
          tent += exp(-abs(rel.x - tx) * 40.0) * exp(-abs(rel.y) * 3.0)
                * step(rel.y, 0.0);
        }
        glow += bell * 1.2 + tent * 0.6 * (1.0 - fi * 0.2);
      }
      v = clamp(glow, 0.0, 1.0);
    `
  },

  {
    name: "Sakura Petals",
    cat: "organic",
    desc: "Falling 3D petals",
    a: "#1a0810",
    b: "#f0a0c0",
    motion: -1,
    speed: 0.4,
    soft: 0.4,
    custom: `
      // 24 individual petals, each with its own drift and spin.
      float petals = 0.0;
      for (int i = 0; i < 24; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi, 7.7));
        float seed2 = hash(vec2(fi, 3.1));
        float seed3 = hash(vec2(fi, 11.3));
        float fallT = fract(t * 0.08 + seed);
        vec2 c = vec2(
          (seed2 - 0.5) * 2.2 + sin(t * 0.4 + seed3 * 6.28) * 0.4,
          1.2 - fallT * 2.4
        );
        vec2 rel = p - c;
        float ang = t * (0.6 + seed * 1.2) + seed3 * 6.28;
        rel = rot(rel, ang);
        rel.x *= 1.0;
        rel.y *= 1.8;   // petal elongation
        // petal shape via polar
        float aa = atan(rel.y, rel.x);
        float rr = length(rel);
        float shape = smoothstep(0.20, 0.05, rr) * abs(sin(aa * 2.0)) * 0.6 + 0.4;
        petals += shape * exp(-rr * 4.0) * (1.0 - fallT * 0.4);
      }
      v = clamp(petals, 0.0, 1.0) * smoothstep(1.6, 0.4, length(p))
        + fbm(p * 3.0 + t * 0.03) * 0.15;
    `
  },

  {
    name: "Coffee",
    cat: "organic",
    desc: "Latte art swirl",
    a: "#100803",
    b: "#a0603a",
    motion: -1,
    speed: 0.22,
    soft: 0.35,
    custom: `
      // Rosetta latte art: two symmetric spirals from the centre.
      float a = atan(p.y, p.x);
      float r = length(p);
      float ros = sin(a * 3.0 + r * 12.0 - t * 0.6) * 0.5 + 0.5;
      ros *= sin(a * 5.0 - r * 8.0 + t * 0.5) * 0.5 + 0.5;
      float crema = fbm(p * 4.0 + t * 0.05) * 0.35;
      float depth = 1.0 - smoothstep(0.9, 1.15, r);
      v = clamp((ros * 0.55 + crema) * depth, 0.0, 1.0);
    `
  },

  {
    name: "Swamp Spores",
    cat: "organic",
    desc: "Layered fog with fireflies",
    a: "#0a1406",
    b: "#7fb040",
    motion: -1,
    speed: 0.3,
    soft: 0.6,
    glow: 0.9,
    custom: `
      // Horizontal fog bands + flickering spore specks.
      float fog = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float y = sin(p.x * 1.5 + t * 0.2 + fi * 1.7) * 0.3
                + (fi - 1.5) * 0.35;
        fog += exp(-abs(p.y - y) * 6.0) * fbm(vec2(p.x * 2.0, y) + fi);
      }
      float spores = 0.0;
      vec2 sp = p * 12.0;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 2.2));
        o.y += fract(t * 0.4 + hash(si + g + 5.5));
        float flick = 0.5 + 0.5 * sin(t * 6.0 + hash(si + g) * 20.0);
        spores += exp(-length(sf - g - o) * 26.0) * flick;
      }
      v = clamp(fog * 0.35 + spores * 0.9, 0.0, 1.0);
    `
  },

  {
    name: "Blood",
    cat: "organic",
    desc: "Plasma and cells in flow",
    a: "#1a0304",
    b: "#c8202e",
    motion: -1,
    speed: 0.35,
    custom: `
      // Warped Worley + red blood cell ellipses drifting.
      vec2 q = p * 1.6;
      q += vec2(fbm(q * 1.2 + t * 0.05),
                fbm(q * 1.2 + 4.7 + t * 0.05)) * 0.5;
      // plasma filaments
      float plasma = fbm(q * 3.0 + t * 0.08);
      plasma = pow(1.0 - abs(plasma - 0.5) * 2.0, 3.0);
      // cells: ellipses with dimple
      float cells = 0.0;
      vec2 sp = q * 2.2;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 3.1));
        vec2 rel = sf - g - o;
        rel = rot(rel, hash(si + g + 7.7) * 6.28);
        rel.y *= 1.6;
        float rr = length(rel);
        float ring = exp(-abs(rr - 0.22) * 30.0);
        float dimple = exp(-rr * 8.0) * 0.3;
        cells += ring + dimple;
      }
      v = clamp(plasma * 0.5 + cells * 0.7, 0.0, 1.0);
    `
  },

  {
    name: "Oat Milk",
    cat: "organic",
    desc: "Creamy surface with soft specular",
    a: "#1f1c14",
    b: "#d9c9a8",
    motion: -1,
    speed: 0.15,
    soft: 0.6,
    custom: `
      // Very low frequency height field + a single soft specular lobe.
      vec2 q = p * 1.3;
      float h  = fbm(q + t * 0.03);
      float hx = fbm(q + vec2(0.02, 0.0) + t * 0.03);
      float hy = fbm(q + vec2(0.0, 0.02) + t * 0.03);
      vec3 n = normalize(vec3((hx - h) * 3.0, (hy - h) * 3.0, 1.0));
      float spec = pow(max(0.0, dot(n, normalize(vec3(0.3, 0.5, 0.8)))), 6.0);
      v = clamp(h * 0.85 + spec * 0.5, 0.0, 1.0);
    `
  },

  {
    name: "Black Tea",
    cat: "organic",
    desc: "Amber tea with rising leaves",
    a: "#140a04",
    b: "#c08a4e",
    motion: -1,
    speed: 0.18,
    soft: 0.35,
    custom: `
      // Gentle radial warmth + fine leaf specks drifting upward.
      float r = length(p);
      float warm = fbm(p * 1.5 + t * 0.03) * 0.7 + 0.3;
      warm *= exp(-r * 0.9);
      float leaves = 0.0;
      vec2 sp = p * 7.0;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 6.2));
        o.y -= fract(t * 0.15 + hash(si + g + 1.4));
        vec2 rel = sf - g - o;
        rel = rot(rel, hash(si + g + 3.3) * 6.28);
        rel.x *= 0.4;
        leaves += exp(-length(rel) * 14.0);
      }
      v = clamp(warm * 0.7 + leaves * 0.5, 0.0, 1.0);
    `
  },

  {
    name: "Lavender Water",
    cat: "organic",
    desc: "Diffusing violet petals",
    a: "#100a18",
    b: "#a894d6",
    motion: -1,
    speed: 0.15,
    soft: 0.75,
    custom: `
      // Very slow diffusion — heavy domain warp, then soft threshold.
      vec2 q = p;
      for (int i = 0; i < 3; i++) {
        q += vec2(fbm(q * 0.7 + float(i) * 2.0 + t * 0.015),
                  fbm(q * 0.7 + 8.8 + float(i) * 2.0 + t * 0.015)) * 0.35;
      }
      float soft = fbm(q * 1.2 + t * 0.02);
      v = smoothstep(0.28, 0.75, soft) * 0.85 + soft * 0.15;
    `
  },

  {
    name: "Honey",
    cat: "organic",
    desc: "Golden viscous light-bending",
    a: "#1e1206",
    b: "#f0b64a",
    motion: -1,
    speed: 0.14,
    soft: 0.25,
    glow: 0.9,
    custom: `
      // Viscous warp + a strong refraction-style highlight from a light beam.
      vec2 q = p * 1.1;
      q += vec2(fbm(q * 0.6 + t * 0.02),
                fbm(q * 0.6 + 4.4 + t * 0.02)) * 0.65;
      float h  = fbm(q * 1.5 + t * 0.02);
      float hx = fbm((q + vec2(0.02, 0.0)) * 1.5 + t * 0.02);
      float hy = fbm((q + vec2(0.0, 0.02)) * 1.5 + t * 0.02);
      vec3 n = normalize(vec3((hx - h) * 4.0, (hy - h) * 4.0, 1.0));
      // sun through glass
      vec3 L = normalize(vec3(0.5, 0.8, 0.9));
      float diff = max(0.0, dot(n, L));
      float spec = pow(diff, 20.0) * 1.4;
      v = clamp(h * 0.7 + diff * 0.25 + spec * 0.6, 0.0, 1.0);
    `
  },

  // =============================================================
  // ENERGY
  // =============================================================

  {
    name: "Solar Plasma",
    cat: "energy",
    desc: "Prominences and sunspots",
    a: "#1c0f03",
    b: "#ffb347",
    motion: -1,
    speed: 0.6,
    glow: 1.5,
    custom: `
      // Fake 3D sun: turbulent surface, corona ring, prominence arcs.
      float r = length(p);
      float R = 0.6;
      float sphere = sqrt(max(0.0, R * R - r * r));
      vec3 n = normalize(vec3(p, sphere));
      float turb = fbm(n.xy * 4.0 + n.z * 1.5 + t * 0.2);
      turb = fbm(n.xy * 6.0 + turb * 2.0 + t * 0.15);
      float sunspots = smoothstep(0.62, 0.68, turb);
      // corona
      float corona = exp(-abs(r - R) * 10.0) * (1.0 - sunspots);
      // prominence arcs (raised bumps)
      float prom = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float ang = fi * 1.57 + t * 0.15;
        vec2 dir = vec2(cos(ang), sin(ang));
        float proj = dot(p, dir);
        float perp = abs(p.x * dir.y - p.y * dir.x);
        prom += exp(-perp * 20.0) * exp(-abs(proj - (R + 0.15 + 0.05 * sin(t + fi))) * 8.0);
      }
      // disk lighting
      float lit = max(0.0, dot(n, normalize(vec3(0.3, 0.5, 0.8)))) * 0.5 + 0.4;
      v = clamp(turb * lit + corona * 0.9 + prom * 0.6, 0.0, 1.0)
        * smoothstep(1.05, 0.55, r);
    `
  },

  {
    name: "Matrix Rain",
    cat: "energy",
    desc: "Falling glyphs with glitch heads",
    a: "#020b05",
    b: "#66ff99",
    motion: -1,
    speed: 0.5,
    glow: 1.2,
    custom: `
      // Falling columns of glyph-shaped segments with a bright glitch head.
      vec2 q = p * 3.0;
      q.y -= t * 1.6;
      float col = floor(q.x);
      float colSpeed = 0.5 + hash(vec2(col, 1.1)) * 0.8;
      q.y -= (colSpeed - 0.9) * t * 0.4;
      vec2 i = vec2(col, floor(q.y));
      vec2 f = fract(q);
      // trail strength based on vertical position
      float head = fract(q.y * 0.5);
      float trail = smoothstep(0.7, 0.05, head) * smoothstep(0.0, 0.05, head);
      // glyph: random 5-segment pattern
      float glyph = 0.0;
      // five horizontal bars at random y
      for (int k = 0; k < 4; k++) {
        float fk = float(k);
        float yb = 0.15 + fk * 0.22 + hash(i + fk) * 0.08;
        float inBar = smoothstep(0.02, 0.0, abs(f.y - yb));
        float width = 0.35 + hash(i + fk + 5.0) * 0.4;
        glyph += inBar * step(abs(f.x - 0.5), width);
      }
      // vertical bar sometimes
      float vb = step(0.7, hash(i + 9.9));
      glyph += vb * smoothstep(0.03, 0.0, abs(f.x - 0.5));
      glyph = clamp(glyph, 0.0, 1.0);
      float headBright = smoothstep(0.05, 0.0, head);
      float lit = glyph * trail + headBright * 0.8;
      v = clamp(lit * 0.9 + trail * 0.15, 0.0, 1.0);
    `
  },

  {
    name: "Neon Sunset",
    cat: "energy",
    desc: "Synthwave sun over scanlines",
    a: "#160610",
    b: "#ff3ea5",
    motion: -1,
    speed: 0.35,
    glow: 1.6,
    custom: `
      // Retro synthwave sun with horizontal stripe cutouts, scanlines, glow.
      vec2 q = p;
      float sunY = 0.15;
      vec2 rel = q - vec2(0.0, sunY);
      float r = length(rel);
      float R = 0.55;
      float disk = smoothstep(R, R - 0.02, r);
      // horizontal cut stripes across the lower half of the sun
      float stripes = step(0.55, fract(q.y * 14.0 + 0.5));
      stripes *= smoothstep(sunY + 0.05, sunY - 0.3, q.y);   // only lower
      disk *= (1.0 - stripes);
      // outer glow
      float glow = exp(-abs(r - R) * 5.0) * 1.2;
      // scanlines
      float scan = 0.85 + 0.15 * sin(q.y * 200.0);
      // horizon grid
      float gridX = smoothstep(0.9, 1.0, abs(sin(q.x * 30.0)));
      float gridY = smoothstep(0.9, 1.0, abs(sin((q.y + t * 0.3) * 24.0)));
      float grid = (gridX + gridY) * 0.4 * smoothstep(-0.05, -0.3, q.y - sunY);
      v = clamp((disk * 0.9 + glow * 0.6 + grid) * scan, 0.0, 1.0);
    `
  },

  {
    name: "Aurora Curtains",
    cat: "energy",
    desc: "Three drifting magnetic curtains",
    a: "#031410",
    b: "#6effc1",
    motion: -1,
    speed: 0.45,
    glow: 1.4,
    soft: 0.4,
    custom: `
      // Three vertical curtains that ripple horizontally, each with a
      // different height profile and brightness pulse.
      vec2 q = p;
      float acc = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float xShift = fbm(vec2(q.x * 2.0 + fi * 5.0, t * 0.25)) * 2.2;
        float yOff = sin(q.x * 3.0 + xShift + t * 0.4 + fi * 1.7) * 0.35
                   + (fi - 1.0) * 0.35;
        float width = 0.22 + fi * 0.05;
        float curtain = exp(-pow((q.y - yOff) / width, 2.0));
        // vertical streak detail
        curtain *= 0.7 + 0.3 * fbm(vec2(q.x * 8.0, t * 0.6 + fi));
        float pulse = 0.6 + 0.4 * sin(t * 1.4 + fi * 2.1);
        acc += curtain * pulse * (1.0 - fi * 0.15);
      }
      v = clamp(acc * 0.65, 0.0, 1.0);
    `
  },

  {
    name: "Electric Spiral",
    cat: "energy",
    desc: "Tesla-coil lightning arcs",
    a: "#08061a",
    b: "#a582ff",
    motion: -1,
    speed: 0.7,
    glow: 1.6,
    pulse: 1.5,
    custom: `
      // Central electrode with bolts shooting outwards at drifting angles.
      float r = length(p);
      float a = atan(p.y, p.x);
      float core = exp(-r * 30.0);
      // 6 bolts
      float bolts = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float baseAng = fi * 1.047 + sin(t * 0.3 + fi) * 0.2;
        float adiff = a - baseAng;
        // wrap to [-PI, PI]
        adiff = atan(sin(adiff), cos(adiff));
        // bolt thickness modulates with hash-noise along radius
        float wob = fbm(vec2(r * 4.0 + fi * 3.0, t * 2.0));
        float thick = 0.05 + 0.05 * wob;
        float bolt = exp(-pow(adiff / thick, 2.0)) * exp(-r * 1.2);
        // Broken filaments (bolt flickers)
        bolt *= smoothstep(0.3, 0.7, fbm(vec2(r * 12.0, t * 6.0 + fi)));
        bolts += bolt;
      }
      float arcs = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float radius = 0.35 + fi * 0.22 + 0.05 * sin(t * 0.6 + fi);
        float ring = exp(-abs(r - radius) * 30.0);
        float broken = smoothstep(0.4, 0.7, fbm(vec2(a * 8.0 + fi * 3.0, t * 3.0)));
        arcs += ring * broken;
      }
      v = clamp(core * 1.2 + bolts * 0.9 + arcs * 0.7, 0.0, 1.0);
    `
  },

  {
    name: "Fire Veins",
    cat: "energy",
    desc: "Ridged fractal fire",
    a: "#140502",
    b: "#ff7a2a",
    motion: -1,
    speed: 0.55,
    glow: 1.5,
    custom: `
      // Ridged-multifractal flame with turbulent hot cores.
      vec2 q = p * 1.4;
      q.y -= t * 0.25;
      // domain warp upward
      q += vec2(fbm(q * 1.1 + t * 0.1) * 0.3, 0.0);
      float n1 = fbm(q * 2.0);
      float ridged = 0.0, amp = 0.55, freq = 1.0;
      for (int i = 0; i < 5; i++) {
        float v1 = fbm(q * freq + t * 0.15);
        ridged += (1.0 - abs(v1 - 0.5) * 2.0) * amp;
        freq *= 1.9;
        amp  *= 0.55;
      }
      float veins = pow(ridged, 2.6);
      float hot   = pow(max(0.0, ridged - 0.55) * 2.0, 1.5);
      // vertical plume fade
      float plume = smoothstep(1.2, 0.0, length(p * vec2(1.5, 0.8)));
      v = clamp((veins * 0.7 + hot * 0.9) * plume, 0.0, 1.0);
    `
  },

  // ── NEW: from the fire raymarcher ────────────────────────────
  {
    name: "Inferno",
    cat: "energy",
    desc: "Raymarched turbulent flame",
    a: "#0a0201",
    b: "#ffb040",
    motion: -1,
    speed: 0.7,
    glow: 1.8,
    pulse: 1.3,
    custom: `
      // Compressed ray-marched fire. The original marched 90 steps through
      // a rotating sin-soup; here we march 24 with an 8-step inner warp.
      vec2 uv = p * 0.5;
      float zz = 0.0;
      float acc = 0.0;
      for (int i = 0; i < 24; i++) {
        vec3 pp = vec3(uv, zz * 1.5 - 1.0);
        float a = (pp.y - length(pp.xz)) / 2.0 - t * 0.4;
        float c = cos(a + t * 0.4);
        float s = sin(a + t * 0.4);
        pp.xz = vec2(c * pp.x - s * pp.z, s * pp.x + c * pp.z);
        float dd = 2.0;
        for (int j = 0; j < 8; j++) {
          pp += sin(pp.yzx * dd - vec3(t * 4.0, 0.0, 0.0)) / dd;
          dd /= 0.9;
        }
        float stepSize = min(length(pp.xz), 8.0 - abs(pp.y)) / 15.0 / (2.0 + cos(a));
        zz += stepSize;
        acc += stepSize / (length(pp.xz) + 0.4);
      }
      v = clamp(acc * 1.8, 0.0, 1.0);
    `
  },

  {
    name: "Cyan Shock",
    cat: "energy",
    desc: "Cascading ripple rings",
    a: "#020e14",
    b: "#4ed4e0",
    motion: -1,
    speed: 0.6,
    glow: 1.3,
    pulse: 1.4,
    custom: `
      // Rings pulse outward continuously with warp-induced breaks.
      float r = length(p);
      float rings = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float phase = fract(t * 0.18 + fi * 0.166);
        float radius = phase * 1.4;
        float ring = exp(-pow((r - radius) * 18.0, 2.0));
        ring *= 0.5 + 0.5 * sin(atan(p.y, p.x) * 8.0 + t * 3.0 + fi);
        rings += ring * (1.0 - phase);
      }
      // ambient ripple background
      float bg = sin(r * 40.0 - t * 6.0) * 0.5 + 0.5;
      bg *= smoothstep(1.4, 0.2, r);
      v = clamp(rings * 1.0 + bg * 0.15, 0.0, 1.0);
    `
  },

  {
    name: "Solar Wind",
    cat: "energy",
    desc: "Fast particle stream",
    a: "#100a04",
    b: "#ffcf5a",
    motion: -1,
    speed: 0.8,
    glow: 1.4,
    custom: `
      // Long comet-style streaks moving right, with shimmering tails.
      vec2 q = p * 2.0;
      q.x -= t * 3.0;   // fast horizontal scroll
      vec2 i = floor(q), f = fract(q);
      float streaks = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -4; x <= 0; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 3.7));
          vec2 rel = f - g - o;
          rel.x *= 0.15;   // long horizontal
          rel.y *= 2.5;    // thin vertically
          float d2 = dot(rel, rel);
          streaks += exp(-d2 * 40.0);
        }
      }
      // background plasma stream
      float plasma = fbm(vec2(p.x * 4.0 - t * 2.0, p.y * 2.0)) * 0.4;
      v = clamp(streaks * 0.85 + plasma * 0.4, 0.0, 1.0);
    `
  },

  // =============================================================
  // MATTER
  // =============================================================

  {
    name: "Molten Gold",
    cat: "matter",
    desc: "Metallic Voronoi with pulsing cracks",
    a: "#1a0d03",
    b: "#ffc266",
    motion: -1,
    speed: 0.5,
    glow: 1.4,
    custom: `
      // 3D-lit Voronoi cells + animated glowing crack borders.
      vec2 q = p * 2.2;
      q += vec2(fbm(q * 0.8 + t * 0.05),
                fbm(q * 0.8 + 3.9 + t * 0.05)) * 0.25;
      vec2 i = floor(q), f = fract(q);
      float md1 = 8.0, md2 = 8.0;
      vec2 id1 = vec2(0.0);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 7.7));
        float dd = length(f - g - o);
        if (dd < md1) { md2 = md1; md1 = dd; id1 = i + g; }
        else if (dd < md2) { md2 = dd; }
      }
      // fake normal per cell (slopes toward cell edge)
      vec3 n = normalize(vec3(f.x - 0.5, f.y - 0.5, 0.6));
      float lit = max(0.0, dot(n, normalize(vec3(0.4, 0.6, 0.7))));
      float metal = 0.5 + 0.5 * hash(id1);
      // crack: thin bright line between cells
      float crack = smoothstep(0.06, 0.0, md2 - md1);
      // pulsing crack
      float pulse = 0.7 + 0.5 * sin(t * 2.0 + hash(id1) * 6.28);
      v = clamp(metal * lit * 0.5 + crack * pulse * 1.4, 0.0, 1.0);
    `
  },

  {
    name: "Crystal Melt",
    cat: "matter",
    desc: "Kaleidoscopic faceted frost",
    a: "#0f0a18",
    b: "#b7a2ff",
    motion: -1,
    speed: 0.4,
    soft: 0.15,
    glow: 1.1,
    custom: `
      // 6-fold kaleidoscope of a rotating facet pattern.
      float a = atan(p.y, p.x);
      float r = length(p);
      a = mod(a, 3.14159 / 3.0);
      a = abs(a - 3.14159 / 6.0);
      vec2 k = vec2(cos(a), sin(a)) * r;
      k = rot(k, t * 0.1);
      vec2 g = abs(fract(k * 5.0) - 0.5);
      float facet = 1.0 - max(g.x, g.y) * 2.0;
      // add slow melting warp
      facet += fbm(k * 2.0 + t * 0.15) * 0.3;
      v = clamp(facet, 0.0, 1.0) * smoothstep(1.6, 0.5, r);
    `
  },

  {
    name: "Arctic Waves",
    cat: "matter",
    desc: "Ice with aurora reflection",
    a: "#050e18",
    b: "#7ac8e8",
    motion: -1,
    speed: 0.4,
    soft: 0.3,
    glow: 0.9,
    custom: `
      // Layered ice sheet: long horizontal ribbons + vein cracks.
      vec2 q = p;
      for (int i = 0; i < 3; i++) {
        q.y += sin(q.x * (2.0 + float(i)) + t * 0.2 * (1.0 + float(i) * 0.3)) * 0.08;
      }
      float ice = fbm(q * vec2(1.2, 4.0) + t * 0.05);
      // crack lines
      float cracks = pow(1.0 - abs(fbm(q * 3.5 + t * 0.1) - 0.5) * 2.0, 6.0);
      v = clamp(ice * 0.7 + cracks * 0.7, 0.0, 1.0);
    `
  },

  {
    name: "Toxic Bubbles",
    cat: "matter",
    desc: "3D-lit bubbles with rims",
    a: "#081202",
    b: "#9ee83d",
    motion: -1,
    speed: 0.5,
    glow: 1.2,
    custom: `
      // Rising bubbles — SDF circles with true 3D normal lighting.
      float bubbles = 0.0;
      vec2 q = p * 3.0;
      q.y += t * 0.6;
      vec2 i = floor(q), f = fract(q);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 3.1));
        vec2 rel = f - g - o;
        float r = length(rel);
        float R = 0.28 + hash(i + g + 6.0) * 0.12;
        if (r < R) {
          // 3D sphere normal at this point
          float z = sqrt(R * R - r * r);
          vec3 n = normalize(vec3(rel, z));
          vec3 L = normalize(vec3(0.3, 0.7, 0.7));
          float dif = max(0.0, dot(n, L));
          float spc = pow(dif, 40.0) * 2.0;
          float rim = pow(1.0 - z / R, 2.5);
          bubbles += dif * 0.35 + spc + rim * 0.6;
        }
      }
      v = clamp(bubbles, 0.0, 1.0);
    `
  },

  {
    name: "Copper Oxide",
    cat: "matter",
    desc: "Patina crystals on metal",
    a: "#1a0f08",
    b: "#6ec6a6",
    motion: -1,
    speed: 0.35,
    soft: 0.3,
    custom: `
      // Two-tone: underlying copper metal + crystalline verdigris patches.
      vec2 q = p * 1.8 + vec2(t * 0.02, -t * 0.03);
      // metal underneath
      vec2 g = abs(fract(q * 3.0) - 0.5);
      float metal = 1.0 - max(g.x, g.y) * 1.5;
      float brushed = fbm(vec2(q.x * 20.0, q.y * 2.0)) * 0.15;
      metal = metal * 0.6 + brushed;
      // verdigris crystals
      float crys = smoothstep(0.55, 0.72, fbm(q * 2.5 + 8.0));
      float details = 0.0;
      for (int i = 0; i < 3; i++) {
        vec2 qq = rot(q, float(i) * 0.7) * (3.0 + float(i));
        vec2 gg = abs(fract(qq) - 0.5);
        details = max(details, (1.0 - max(gg.x, gg.y) * 1.8) * crys);
      }
      v = clamp(metal * 0.4 + details * 0.9 + crys * 0.3, 0.0, 1.0);
    `
  },

  {
    name: "Liquid Mercury",
    cat: "matter",
    desc: "True chrome reflection",
    a: "#0e1115",
    b: "#dfe6ec",
    motion: -1,
    speed: 0.3,
    soft: 0.05,
    glow: 1.0,
    custom: `
      // Chrome: compute normal from height, then reflect a fake environment.
      vec2 q = p * 1.2;
      float h  = fbm(q * 2.0 + t * 0.03);
      float e  = 0.008;
      float hx = fbm((q + vec2(e, 0.0)) * 2.0 + t * 0.03);
      float hy = fbm((q + vec2(0.0, e)) * 2.0 + t * 0.03);
      vec3 n = normalize(vec3((hx - h) * 8.0, (hy - h) * 8.0, 1.0));
      // fake env: sky gradient up, dark down
      vec3 ref = reflect(normalize(vec3(0.0, 0.0, -1.0)), n);
      float sky = ref.y * 0.5 + 0.5;
      float env = mix(0.15, 1.0, sky);
      // specular to a bright light
      vec3 L = normalize(vec3(0.6, 0.8, 0.9));
      float spec = pow(max(0.0, dot(n, L)), 80.0) * 2.5;
      v = clamp(env * 0.6 + h * 0.2 + spec, 0.0, 1.0);
    `
  },

  {
    name: "Carbon Lattice",
    cat: "matter",
    desc: "Graphene in perspective",
    a: "#05070d",
    b: "#7d8794",
    motion: -1,
    speed: 0.3,
    soft: 0.1,
    custom: `
      // Hex lattice on a fake-3D plane with parallax warping.
      vec2 q = p * 4.0;
      // perspective: scale by y
      float persp = 1.0 / (0.5 + (p.y + 1.0) * 0.7);
      q *= persp;
      q.y += t * 0.4;
      // hex grid
      vec2 h = vec2(1.0, 1.7320508);
      vec2 a1 = mod(q, h) - h * 0.5;
      vec2 a2 = mod(q + h * 0.5, h) - h * 0.5;
      vec2 aa = length(a1) < length(a2) ? a1 : a2;
      float d = length(aa);
      float edge = smoothstep(0.42, 0.48, d);
      float node = smoothstep(0.30, 0.10, d);
      // subtle warp makes it feel alive
      float warp = fbm(p * 2.0 + t * 0.05) * 0.1;
      edge += warp;
      v = clamp((1.0 - edge) * 0.5 + node * 0.9, 0.0, 1.0);
    `
  },

  {
    name: "Liquid Chrome",
    cat: "matter",
    desc: "HDR environment chrome",
    a: "#0c1015",
    b: "#ffffff",
    motion: -1,
    speed: 0.35,
    soft: 0.05,
    glow: 1.2,
    custom: `
      // Chrome with a strong environment gradient and sharp highlights.
      vec2 q = p * 1.1 + vec2(t * 0.05, 0.0);
      float h  = fbm(q * 2.5 + t * 0.04);
      float e  = 0.006;
      float hx = fbm((q + vec2(e, 0.0)) * 2.5 + t * 0.04);
      float hy = fbm((q + vec2(0.0, e)) * 2.5 + t * 0.04);
      vec3 n = normalize(vec3((hx - h) * 14.0, (hy - h) * 14.0, 1.0));
      // fake HDR env: black top, bright horizon, black bottom
      float sky = smoothstep(-0.4, 0.4, n.y);
      float horizon = 1.0 - abs(n.y);
      horizon = pow(horizon, 8.0) * 2.5;
      float spec = pow(max(0.0, dot(n, normalize(vec3(0.3, 0.9, 0.5)))), 100.0) * 3.0;
      v = clamp(sky * 0.4 + horizon * 0.7 + spec + h * 0.1, 0.0, 1.0);
    `
  },

  {
    name: "Rain Glass",
    cat: "matter",
    desc: "Drops on a window with refraction",
    a: "#060f14",
    b: "#8ec9dd",
    motion: -1,
    speed: 0.3,
    soft: 0.15,
    glow: 0.9,
    custom: `
      // Drops that slide down, refract a background fbm inside them.
      float bg = fbm(p * 2.0 + t * 0.05);
      float drops = 0.0;
      vec2 q = p * 3.0;
      // slow fall per column
      q.y += t * 0.5;
      vec2 i = floor(q), f = fract(q);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 4.4));
        vec2 rel = f - g - o;
        // slide drops downward using per-cell speed
        rel.y -= fract(t * 0.15 + hash(i + g + 2.0)) * 0.8;
        float r = length(rel);
        float R = 0.22 + hash(i + g + 7.1) * 0.10;
        if (r < R) {
          // refraction: sample bg with offset toward centre
          vec2 ref = rel / R;
          float inside = length(ref);
          float lum = 1.0 - inside * 0.6;
          drops += lum * 0.9;
          // bright rim
          drops += smoothstep(R * 0.7, R, r) * 0.6;
        }
      }
      v = clamp(bg * 0.35 + drops * 0.9, 0.0, 1.0);
    `
  },

  {
    name: "Amber Lava",
    cat: "matter",
    desc: "Cracked crust over molten flow",
    a: "#1a0d03",
    b: "#ff8a1c",
    motion: -1,
    speed: 0.4,
    glow: 1.6,
    custom: `
      // Cooled dark crust with bright glowing cracks and bubbling underneath.
      vec2 q = p * 2.0;
      vec2 i = floor(q), f = fract(q);
      float md1 = 8.0, md2 = 8.0;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 4.4));
        float dd = length(f - g - o);
        if (dd < md1) { md2 = md1; md1 = dd; } else if (dd < md2) { md2 = dd; }
      }
      float border = md2 - md1;
      // crust: lit cell interior
      vec3 n = normalize(vec3(f - 0.5, 0.6));
      float lit = max(0.0, dot(n, normalize(vec3(0.4, 0.6, 0.7)))) * 0.35 + 0.2;
      // glowing crack
      float crack = smoothstep(0.14, 0.0, border);
      // flowing hot glow beneath cracks
      float flow = fbm(p * 4.0 + vec2(t * 0.3, -t * 0.1));
      crack *= 0.7 + 0.5 * flow;
      v = clamp(lit * 0.4 + crack * 1.6, 0.0, 1.0);
    `
  },

  {
    name: "Dirty Water",
    cat: "matter",
    desc: "Underwater with rising bubbles",
    a: "#0a1215",
    b: "#5d8f96",
    motion: -1,
    speed: 0.25,
    soft: 0.5,
    custom: `
      // Slow muddy warp + suspended particles + a few rising bubbles.
      vec2 q = p * 1.4;
      q.x += fbm(q * 1.2 + t * 0.03) * 0.5;
      q.y += fbm(q * 1.2 + 4.0 + t * 0.03) * 0.5;
      float murk = fbm(q * 2.0 + t * 0.03);
      // particulates
      float parts = 0.0;
      vec2 sp = p * 10.0;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 1.1));
        o.y += fract(t * 0.3 + hash(si + g + 3.3));
        parts += exp(-length(sf - g - o) * 22.0);
      }
      v = clamp(murk * 0.65 + parts * 0.4, 0.0, 1.0);
    `
  },

  {
    name: "Black Oil",
    cat: "matter",
    desc: "True iridescent oil slick",
    a: "#030308",
    b: "#6a3ca8",
    motion: -1,
    speed: 0.25,
    glow: 1.0,
    custom: `
      // Thin-film interference: film thickness modulates a rainbow phase,
      // sampled as three sinusoids at different frequencies to fake RGB bands.
      vec2 q = p * 1.3;
      float film = fbm(q * 2.0 + t * 0.03);
      float film2 = fbm(q * 3.0 + film * 1.5 + t * 0.05);
      float phase = film * 10.0 + film2 * 6.0 + t * 0.2;
      // Three colour bands (R, G, B) offset in phase
      float r = sin(phase) * 0.5 + 0.5;
      float g = sin(phase + 2.09) * 0.5 + 0.5;
      float b = sin(phase + 4.18) * 0.5 + 0.5;
      float bands = (r + g + b) / 3.0 + max(r, max(g, b)) * 0.5;
      // dark oily base
      float base = fbm(q * 4.0 + t * 0.02) * 0.3;
      v = clamp(bands * 0.55 + base, 0.0, 1.0);
    `
  },

  {
    name: "Industrial Coolant",
    cat: "matter",
    desc: "Radioactive ooze with bubbles",
    a: "#03120e",
    b: "#3dff8a",
    motion: -1,
    speed: 0.3,
    glow: 1.5,
    custom: `
      // Glowing ooze with slow bubbles rising + chemical banding.
      vec2 q = p * 2.0;
      q.y -= t * 0.4;
      // chemical bands
      float bands = sin(q.y * 3.0 + fbm(q * 2.0 + t * 0.1) * 3.0) * 0.5 + 0.5;
      // rising bubbles
      float bubbles = 0.0;
      vec2 qq = p * 4.0;
      qq.y += t * 0.6;
      vec2 i = floor(qq), f = fract(qq);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 3.3));
        float r = length(f - g - o);
        float R = 0.20 + hash(i + g + 6.0) * 0.08;
        if (r < R) {
          float z = sqrt(R * R - r * r);
          vec3 n = normalize(vec3(f - g - o, z));
          float dif = max(0.0, dot(n, normalize(vec3(0.3, 0.6, 0.7))));
          float rim = pow(1.0 - z / R, 3.0);
          bubbles += dif * 0.5 + rim * 0.9;
        }
      }
      v = clamp(bands * 0.4 + bubbles * 1.0, 0.0, 1.0);
    `
  },

  {
    name: "Rust Slurry",
    cat: "matter",
    desc: "Suspended metal shavings",
    a: "#130a06",
    b: "#c27b45",
    motion: -1,
    speed: 0.25,
    soft: 0.35,
    custom: `
      // Muddy flow + many fine metal shavings (line segments) suspended.
      vec2 q = p * 1.3;
      q.x += fbm(q * 1.2 + t * 0.04) * 0.5;
      q.y += fbm(q * 1.2 + 5.5 + t * 0.03) * 0.5;
      float mud = fbm(q * 2.5 + t * 0.03);
      // shavings: short segments
      float shav = 0.0;
      vec2 sp = p * 8.0;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 6.6));
        vec2 rel = sf - g - o;
        rel = rot(rel, hash(si + g + 2.2) * 6.28);
        // segment along x axis
        rel.x *= 0.3;
        rel.y *= 2.0;
        shav += exp(-length(rel) * 18.0);
      }
      v = clamp(mud * 0.5 + shav * 0.6, 0.0, 1.0);
    `
  },

  {
    name: "Sewage",
    cat: "matter",
    desc: "Murky debris in flow",
    a: "#0a0f05",
    b: "#6a7a45",
    motion: -1,
    speed: 0.18,
    soft: 0.55,
    custom: `
      // Very chunky warp + dark debris + slow bubbling.
      vec2 q = p * 1.1;
      q += vec2(fbm(q * 1.5 + t * 0.03), fbm(q * 1.5 + 4.1 + t * 0.03)) * 0.7;
      float murk = fbm(q * 1.8 + t * 0.02);
      // debris
      vec2 sp = q * 5.0;
      vec2 si = floor(sp), sf = fract(sp);
      float debris = 0.0;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 2.5));
        debris += smoothstep(0.15, 0.05, length(sf - g - o));
      }
      v = clamp(murk * 0.6 + debris * 0.5, 0.0, 1.0);
    `
  },

  {
    name: "Sea Glass",
    cat: "matter",
    desc: "Frosted glass with light through it",
    a: "#051012",
    b: "#7dc4c1",
    motion: -1,
    speed: 0.22,
    soft: 0.4,
    glow: 0.9,
    custom: `
      // Frosted refraction: two-layer warp, then a soft forward-scatter glow.
      vec2 q = p;
      vec2 refr = (vec2(fbm(q * 2.0 + t * 0.04),
                        fbm(q * 2.0 + 3.1 + t * 0.04)) - 0.5) * 0.8;
      float inner = fbm(q * 1.5 + refr + t * 0.02);
      float frost = fbm(q * 8.0 + refr * 0.5 + t * 0.05);
      // forward scatter from a light source top-left
      float lite = exp(-length(p - vec2(-0.6, 0.6)) * 2.5);
      v = clamp(inner * 0.6 + frost * 0.3 + lite * 0.4, 0.0, 1.0);
    `
  },

  {
    name: "Rainwater",
    cat: "matter",
    desc: "Puddle with raindrop impacts",
    a: "#040d12",
    b: "#6ba0b5",
    motion: -1,
    speed: 0.3,
    glow: 0.8,
    custom: `
      // Multiple raindrops falling into a puddle — each spawns concentric
      // ripples that expand and fade.
      float ripples = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi, 2.7));
        float cyc = fract(t * (0.4 + seed * 0.4) + seed * 3.0);
        float radius = cyc * 0.9;
        vec2 c = vec2((hash(vec2(fi, 1.1)) - 0.5) * 1.6,
                      (hash(vec2(fi, 5.5)) - 0.5) * 1.6);
        float r = length(p - c);
        float ring = sin((r - radius) * 40.0) * 0.5 + 0.5;
        ring *= exp(-abs(r - radius) * 8.0) * (1.0 - cyc);
        ripples += ring;
      }
      float base = fbm(p * 2.5 + t * 0.05) * 0.3;
      v = clamp(ripples * 0.7 + base, 0.0, 1.0);
    `
  },

  // ── NEW: from the ocean raymarcher ───────────────────────────
  {
    name: "Swell",
    cat: "matter",
    desc: "Raymarched ocean surface",
    a: "#04161e",
    b: "#bfe4ec",
    motion: -1,
    speed: 0.45,
    glow: 1.1,
    soft: 0.15,
    custom: `
      // Flattened read of the raymarched ocean. Reuses the same sea_octave
      // construction (1 - pow(wv.x*wv.y, 0.65)) at four rotating frequencies.
      vec2 q = p * 1.2;
      float w = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 uv = q * (1.0 + fi * 0.7) + vec2(t * 0.3, -t * 0.15) * (1.0 + fi * 0.3);
        vec2 wv = 1.0 - abs(sin(uv));
        vec2 swv = abs(cos(uv));
        wv = mix(wv, swv, wv);
        w += pow(1.0 - pow(wv.x * wv.y, 0.65), 1.0) / (1.0 + fi);
        q *= 1.6;
      }
      w *= 0.4;
      float foam = pow(smoothstep(0.35, 0.75, w), 2.5);
      float glint = pow(max(0.0, sin(w * 30.0 + t * 2.0)), 20.0) * 0.7;
      v = clamp(w * 0.8 + foam * 0.6 + glint, 0.0, 1.0);
    `
  },

  {
    name: "Clay Wash",
    cat: "matter",
    desc: "Swirling mud vortex",
    a: "#150a05",
    b: "#a87a5a",
    motion: -1,
    speed: 0.15,
    soft: 0.4,
    custom: `
      // Polar swirl with hash-driven chunky sediment.
      vec2 q = p * 1.3;
      float a = atan(q.y, q.x);
      float r = length(q);
      q = rot(q, a * 0.5 + r * 2.5 + t * 0.05);
      float clay = fbm(q * 2.0 + t * 0.03);
      float chunks = smoothstep(0.55, 0.72, fbm(q * 7.0 + t * 0.05));
      v = clay * 0.7 + chunks * 0.35;
    `
  },

  // =============================================================
  // STRANGE
  // =============================================================

  {
    name: "Midnight Nebula",
    cat: "strange",
    desc: "Deep field with parallax stars",
    a: "#040211",
    b: "#7a6df0",
    motion: -1,
    speed: 0.35,
    soft: 0.6,
    glow: 0.7,
    custom: `
      // Two parallax layers of stars + drifting nebula clouds.
      float stars = 0.0;
      for (int layer = 0; layer < 3; layer++) {
        float fl = float(layer);
        float scale = 20.0 + fl * 15.0;
        vec2 q = p * scale - t * (0.05 + fl * 0.03);
        vec2 i = floor(q);
        float star = step(0.982, hash(i));
        float tw = 0.5 + 0.5 * sin(t * 3.0 + hash(i + 8.8) * 20.0);
        stars += star * tw * (1.0 - fl * 0.2);
      }
      // clouds
      vec2 q = p;
      float clouds = 0.0, amp = 0.5;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 qq = q + vec2(t * 0.02 * (1.0 + fi * 0.3), -t * 0.015 * (1.0 - fi * 0.1));
        clouds += fbm(qq * (1.0 + fi * 0.5)) * amp;
        amp *= 0.6;
      }
      v = clamp(clouds * 0.55 + stars * 1.2, 0.0, 1.0);
    `
  },

  {
    name: "Eclipse Ink",
    cat: "strange",
    desc: "Total solar eclipse with corona",
    a: "#0a0308",
    b: "#ffb0c8",
    motion: -1,
    speed: 0.3,
    glow: 1.5,
    custom: `
      // Black moon disc + streaming corona + diamond-ring flash.
      float r = length(p);
      float R = 0.55;
      // moon: dark disc
      float moon = smoothstep(R, R - 0.01, r);
      // corona: radial streaks
      float a = atan(p.y, p.x);
      float corona = 0.0;
      for (int i = 0; i < 20; i++) {
        float fi = float(i);
        float ang = fi * 0.314;
        float align = cos(a - ang);
        float strength = 0.5 + 0.5 * hash(vec2(fi, 1.1));
        corona += pow(max(0.0, align), 40.0) * strength;
      }
      corona *= exp(-abs(r - R) * 3.5);
      // diamond-ring flash (bright point at one edge)
      float flashAng = t * 0.4;
      vec2 flashPos = vec2(cos(flashAng), sin(flashAng)) * R;
      float flash = exp(-length(p - flashPos) * 30.0);
      v = clamp(corona * 0.9 + flash * 1.6 + moon * 0.02, 0.0, 1.0);
    `
  },

  {
    name: "Rose Smoke",
    cat: "strange",
    desc: "Recursive curl smoke",
    a: "#150710",
    b: "#e58ab5",
    motion: -1,
    speed: 0.35,
    soft: 0.55,
    glow: 1.0,
    custom: `
      // Curl-noise-ish smoke via 4 iterations of domain warp, then threshold.
      vec2 q = p;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 w = vec2(fbm(q * 0.9 + fi * 3.0 + t * 0.05),
                      fbm(q * 0.9 + fi * 3.0 + 2.1 + t * 0.05));
        q += w * 0.55;
      }
      float smoke = fbm(q * 1.5 + t * 0.03);
      // thickness gives a bright core
      float core = pow(smoothstep(0.4, 0.75, smoke), 1.6);
      v = clamp(smoke * 0.55 + core * 0.7, 0.0, 1.0);
    `
  },

  {
    name: "Moon Milk",
    cat: "strange",
    desc: "Cosmic milk drift",
    a: "#0d0f18",
    b: "#c5cbe0",
    motion: -1,
    speed: 0.15,
    soft: 0.7,
    custom: `
      // Pure soft drifting clouds with a faint gravity well in the middle.
      vec2 q = p;
      q += vec2(fbm(q * 0.6 + t * 0.02),
                fbm(q * 0.6 + 8.8 + t * 0.02)) * 0.9;
      float clouds = fbm(q * 1.2 + t * 0.025);
      float well = exp(-length(p) * 0.7) * 0.2;
      v = clamp(smoothstep(0.25, 0.75, clouds) * 0.7 + clouds * 0.25 + well, 0.0, 1.0);
    `
  },

  {
    name: "Quantum Foam",
    cat: "strange",
    desc: "Bubbles appearing and popping",
    a: "#03030f",
    b: "#8ea3ff",
    motion: -1,
    speed: 0.6,
    glow: 1.3,
    custom: `
      // Grid of cells; each cell runs its own bubble lifecycle.
      vec2 q = p * 6.0;
      vec2 i = floor(q), f = fract(q);
      float glow = 0.0;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 cell = i + g;
        float seed = hash(cell);
        float life = fract(t * (0.5 + seed * 0.6) + seed * 3.0);
        float radius = 0.06 + 0.24 * sin(life * 3.14159);
        vec2 center = vec2(hash(cell + 1.7), hash(cell + 3.2)) * 0.6 + 0.2;
        float r = length(f - g - center);
        // expanding bright rim that fades as bubble pops
        float rim = exp(-pow((r - radius) * 22.0, 2.0)) * (1.0 - life);
        // inner glow
        float inside = smoothstep(radius, radius - 0.02, r) * 0.4;
        glow += rim + inside;
      }
      v = clamp(glow, 0.0, 1.0);
    `
  },

  {
    name: "Nebula Bloom",
    cat: "organic",
    desc: "Spiral galaxy with arms",
    a: "#080414",
    b: "#c08bff",
    motion: -1,
    speed: 0.3,
    soft: 0.5,
    glow: 1.2,
    custom: `
      // 2-arm logarithmic spiral galaxy + dense core + scattered stars.
      float a = atan(p.y, p.x);
      float r = length(p);
      // spiral arm field
      float arms = sin(a * 2.0 - log(r + 0.15) * 4.0 + t * 0.4) * 0.5 + 0.5;
      arms = pow(arms, 1.8);
      // density falls off with radius
      float density = arms * exp(-r * 1.5);
      // core
      float core = exp(-r * 8.0) * 1.2;
      // grain: fine fbm speckle
      float grain = fbm(p * 6.0 + t * 0.08) * 0.4;
      // sprinkle stars on top
      vec2 sp = p * 26.0;
      vec2 si = floor(sp);
      float stars = step(0.984, hash(si)) * (0.5 + 0.5 * sin(t * 3.0 + hash(si) * 20.0));
      v = clamp(density * 0.6 + core + grain * 0.3 + stars * 0.6, 0.0, 1.0);
    `
  },

  {
    name: "Magma Core",
    cat: "matter",
    desc: "Planet with glowing crust cracks",
    a: "#120402",
    b: "#ff6a1a",
    motion: -1,
    speed: 0.4,
    glow: 1.8,
    pulse: 1.3,
    custom: `
      // Fake 3D planet: lit hemisphere + glowing crack network + outer haze.
      float r = length(p);
      float R = 0.6;
      float sphere = sqrt(max(0.0, R * R - r * r));
      vec3 n = normalize(vec3(p, sphere));
      // crack network from fbm ridges
      vec2 q = n.xy * 4.0;
      float ridged = 0.0, amp = 0.5, freq = 1.0;
      for (int i = 0; i < 4; i++) {
        float v1 = fbm(q * freq + t * 0.08);
        ridged += (1.0 - abs(v1 - 0.5) * 2.0) * amp;
        freq *= 2.0;
        amp  *= 0.55;
      }
      float cracks = pow(ridged, 4.0) * 3.0;
      // surface lighting
      float lit = max(0.0, dot(n, normalize(vec3(0.4, 0.6, 0.7)))) * 0.5 + 0.3;
      // outer glow
      float haze = exp(-abs(r - R) * 6.0) * 0.6;
      // disk mask
      float mask = smoothstep(R, R - 0.01, r);
      v = clamp((lit * 0.4 + cracks) * mask + haze, 0.0, 1.0);
    `
  },

  {
    name: "Frost Crystal",
    cat: "matter",
    desc: "Growing ice dendrites",
    a: "#040e18",
    b: "#b0e6ff",
    motion: -1,
    speed: 0.3,
    soft: 0.1,
    glow: 1.1,
    custom: `
      // Hexagonal ice dendrites via three rotated grids + a growing factor.
      vec2 q = p * 2.4;
      float grow = 0.6 + 0.4 * sin(t * 0.4);
      float acc = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 qq = rot(q, fi * 1.047);
        vec2 g = abs(fract(qq) - 0.5);
        float line = smoothstep(0.02, 0.0, g.x) + smoothstep(0.02, 0.0, g.y);
        acc += line * exp(-length(qq) * 0.4) * grow;
      }
      // hexagonal highlight from a fake normal on top of dendrites
      float hex = 0.0;
      vec2 h = vec2(1.0, 1.7320508);
      vec2 a1 = mod(q, h) - h * 0.5;
      vec2 a2 = mod(q + h * 0.5, h) - h * 0.5;
      vec2 aa = length(a1) < length(a2) ? a1 : a2;
      float d = length(aa);
      hex = smoothstep(0.42, 0.48, d);
      v = clamp(acc * 0.6 + (1.0 - hex) * 0.5 * grow, 0.0, 1.0);
    `
  },

  {
    name: "Void Silk",
    cat: "strange",
    desc: "Folded black silk with directional light",
    a: "#050507",
    b: "#9a7fd1",
    motion: -1,
    speed: 0.25,
    soft: 0.55,
    glow: 0.8,
    custom: `
      // Deep folds via heavy domain warp; fake light picks out the ridges.
      vec2 q = p;
      q += vec2(fbm(q * 1.0 + t * 0.02),
                fbm(q * 1.0 + 4.4 + t * 0.02)) * 1.0;
      float h  = fbm(q * 2.0 + t * 0.02);
      float e  = 0.015;
      float hx = fbm((q + vec2(e, 0.0)) * 2.0 + t * 0.02);
      float hy = fbm((q + vec2(0.0, e)) * 2.0 + t * 0.02);
      vec3 n = normalize(vec3((hx - h) * 6.0, (hy - h) * 6.0, 1.0));
      // key light: only picks up the ridges facing up-left
      vec3 L = normalize(vec3(-0.4, 0.7, 0.6));
      float lit = max(0.0, dot(n, L));
      float spec = pow(lit, 30.0) * 1.2;
      v = clamp(lit * 0.55 + spec + h * 0.25, 0.0, 1.0);
    `
  },

  {
    name: "Abyssal Glow",
    cat: "organic",
    desc: "Deep-sea creature with tendrils",
    a: "#010e0e",
    b: "#4affd6",
    motion: -1,
    speed: 0.2,
    glow: 1.6,
    pulse: 1.6,
    soft: 0.4,
    custom: `
      // Central glow + pulsing tendrils radiating outward like an anemone.
      float glow = exp(-length(p) * 5.0) * 1.2;
      float a = atan(p.y, p.x);
      float r = length(p);
      float tendrils = 0.0;
      for (int i = 0; i < 10; i++) {
        float fi = float(i);
        float baseAng = fi * 0.628;
        float dAng = abs(atan(sin(a - baseAng), cos(a - baseAng)));
        float thick = 0.05 + 0.03 * sin(t * 2.0 + fi * 2.1);
        float tendril = exp(-pow(dAng / thick, 2.0))
                      * exp(-abs(r - 0.4 - 0.15 * sin(t * 1.2 + fi)) * 3.0);
        tendrils += tendril;
      }
      // ambient particles
      vec2 sp = p * 14.0;
      vec2 si = floor(sp);
      float parts = step(0.985, hash(si)) * (0.6 + 0.4 * sin(t * 3.0 + hash(si) * 20.0));
      v = clamp(glow * 0.7 + tendrils * 0.9 + parts * 0.6, 0.0, 1.0);
    `
  },

  {
    name: "Chromatic Oil",
    cat: "matter",
    desc: "Full-spectrum thin-film rainbow",
    a: "#050508",
    b: "#e0b3ff",
    motion: -1,
    speed: 0.35,
    soft: 0.2,
    glow: 1.2,
    custom: `
      // Proper RGB-split thin-film interference: three sine phases drive
      // three independent colour channels, then we take their max.
      vec2 q = p * 1.1;
      float film  = fbm(q * 2.0 + vec2(t * 0.04, -t * 0.03));
      float film2 = fbm(q * 3.5 + film * 1.5 + t * 0.05);
      float film3 = fbm(q * 5.5 + film2 * 1.2 + t * 0.06);
      float phase = film * 12.0 + film2 * 8.0 + film3 * 6.0 + t * 0.3;
      float rr = sin(phase) * 0.5 + 0.5;
      float gg = sin(phase + 2.094) * 0.5 + 0.5;
      float bb = sin(phase + 4.188) * 0.5 + 0.5;
      float irid = max(rr, max(gg, bb));
      float base = film * 0.35;
      v = clamp(irid * 0.55 + base + pow(irid, 3.0) * 0.4, 0.0, 1.0);
    `
  },

  // ── NEW: from the space station shader ───────────────────────
  {
    name: "Orbital",
    cat: "strange",
    desc: "Earth disc, atmosphere, and a station silhouette",
    a: "#02030a",
    b: "#5e93c8",
    motion: -1,
    speed: 0.25,
    glow: 1.0,
    soft: 0.3,
    custom: `
      // Fixed: earthC is a vec2. Reversed smoothsteps rewritten as
      // 1.0 - smoothstep(lo, hi, x) for strict compilers.
      vec2  earthC = vec2(0.0, -1.6);
      float earthR = 1.5;
      float eDist  = length(p - earthC);
      float earth  = 1.0 - smoothstep(earthR - 0.01, earthR + 0.01, eDist);

      vec2 eq = (p - earthC) / earthR;
      float land = fbm(eq * 4.0 + vec2(t * 0.05, -t * 0.02));
      float landMask = smoothstep(0.48, 0.68, land) * earth;
      float clouds = fbm(eq * 8.0 + vec2(t * 0.08, 0.0)) * earth;

      // Atmosphere limb glow
      float atmo = exp(-abs(eDist - earthR) * 10.0) * 0.9;

      // Parallax starfield in the upper half
      vec2 sp = p * 18.0;
      vec2 si = floor(sp);
      float stars = step(0.985, hash(si)) *
                    (0.6 + 0.4 * sin(t * 2.0 + hash(si + 1.7) * 20.0));
      stars *= smoothstep(-0.2, 0.3, p.y);

      // Station silhouette — crossed bars slowly rotating
      vec2 sr = rot(p - vec2(0.1, 0.4), t * 0.03);
      float st = 0.0;
      st += (1.0 - smoothstep(0.035, 0.05, abs(sr.y)))
          * (1.0 - smoothstep(0.40, 0.55, abs(sr.x)));
      st += (1.0 - smoothstep(0.035, 0.05, abs(sr.x)))
          * (1.0 - smoothstep(0.22, 0.32, abs(sr.y)));
      float panels = (1.0 - smoothstep(0.03, 0.04, abs(sr.y)))
                   * step(0.25, abs(sr.x)) * step(abs(sr.x), 0.55);
      st = max(st, panels * 0.8);

      v = clamp(earth * (0.3 + landMask * 0.5 + clouds * 0.3)
              + atmo * 0.7 + stars * 0.7 + st, 0.0, 1.0);
    `
  },

  // ── NEW: from the raymarched cloud shader ────────────────────
  {
    name: "Storm Cell",
    cat: "strange",
    desc: "Raymarched cloud deck with god-rays",
    a: "#070a16",
    b: "#e8cbb0",
    motion: -1,
    speed: 0.35,
    glow: 1.4,
    soft: 0.35,
    custom: `
      // Layered cloud deck: five octaves of fbm plus three angled god-rays.
      vec2 q = p * 0.7 + vec2(t * 0.02, 0.0);
      float den = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 off = vec2(fi * 1.7, fi * 2.3) + vec2(t * 0.05, -t * 0.03);
        den += fbm(q * (1.0 + fi * 0.6) + off) * amp;
        amp *= 0.6;
      }
      den = den * 0.7 + 0.5;

      // Warm sun glow behind the clouds
      float sun = exp(-length(p - vec2(0.35, 0.35)) * 1.8) * 0.7;

      // Angled god-ray shafts
      float shafts = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float ang = -0.6 + fi * 0.5;
        vec2 dir = vec2(cos(ang), sin(ang));
        float perp = abs(p.x * dir.y - p.y * dir.x);
        shafts += exp(-perp * perp / 0.025) * (0.5 + 0.5 * sin(t * 0.4 + fi * 2.0));
      }
      shafts /= 3.0;

      v = clamp(den * 0.65 + sun * 0.5 + shafts * 0.35, 0.0, 1.0);
    `
  },

  // ── NEW: from the tree raymarcher ────────────────────────────
  {
    name: "Rootwork",
    cat: "organic",
    desc: "Iterated folds becoming branches",
    a: "#0a0410",
    b: "#e0b060",
    motion: -1,
    speed: 0.25,
    glow: 0.9,
    custom: `
      // Folded-space iteration mirroring tri0() from the tree shader:
      // rotate by a drifting angle, then reflect around a moving axis.
      vec2 vv = p * 1.4;
      float zoomed = 1.0;
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        vv = rot(vv, 0.5 + fi * 0.35 + sin(t * 0.2 + fi) * 0.25);
        vv.x = abs(vv.x) - 0.15;
        vv.y = abs(vv.y) - 0.20;
        vv *= 1.35;
        zoomed *= 1.35;
      }
      float r = length(vv / zoomed);
      float branches = exp(-abs(r - 0.02) * 30.0);
      float glow = exp(-length(p) * 2.5) * 0.6;
      float grain = fbm(p * 8.0 + t * 0.05) * 0.15;
      v = clamp(branches * 0.9 + glow + grain, 0.0, 1.0);
    `
  },

  // =============================================================
  // PREMIUM
  // =============================================================

  // ── PREMIUM 1 ────────────────────────────────────────────────
  {
    name: "Caustics Pool",
    cat: "matter",
    desc: "Layered underwater light caustics",
    a: "#020c14",
    b: "#7fe8ff",
    motion: -1,
    speed: 0.35,
    glow: 1.3,
    soft: 0.1,
    custom: `
      // Underwater caustics: four warped-Voronoi layers. The bright filament
      // is where each cell's second-nearest distance catches the nearest.
      // Warping the cell domain with fbm breaks the grid.
      vec2 q = p * 1.4;
      float caus = 0.0;
      float fine = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 w = q + vec2(fbm(q * (0.8 + fi * 0.35) + t * 0.06),
                          fbm(q * (0.8 + fi * 0.35) + 3.7 + t * 0.06));
        vec2 ii = floor(w);
        vec2 f  = fract(w);
        float md1 = 8.0, md2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(ii + g + fi * 13.0),
                        hash(ii + g + fi * 13.0 + 5.5));
          float dd = length(f - g - o);
          if (dd < md1) { md2 = md1; md1 = dd; }
          else if (dd < md2) { md2 = dd; }
        }
        float border = md2 - md1;
        caus += pow(1.0 - smoothstep(0.0, 0.16, border), 1.4) / (1.0 + fi * 0.9);
        fine += pow(1.0 - smoothstep(0.0, 0.06, border), 3.0) / (1.0 + fi);
        q *= 1.55;
      }
      // Depth breathing — the pool's surface drifts
      float breathe = 0.85 + 0.15 * sin(t * 0.6 + fbm(p * 0.5) * 3.0);
      caus *= breathe;
      v = clamp(caus * 0.75 + fine * 0.55 + fbm(p * 3.0 + t * 0.05) * 0.08, 0.0, 1.0);
    `
  },

  // ── PREMIUM 2 ────────────────────────────────────────────────
  {
    name: "Aurora Borealis",
    cat: "energy",
    desc: "Volumetric curtains with ray detail",
    a: "#020a18",
    b: "#4affb0",
    motion: -1,
    speed: 0.35,
    glow: 1.6,
    soft: 0.35,
    custom: `
      // Volumetric aurora: four curtains at different altitudes, each with
      // its own meander, ray pattern, and a bright base where the rays meet
      // the atmosphere. Starfield behind, soft horizon glow on top.
      // NOTE: local name is 'dist' — do not shadow the host's 'd'.
      vec2 q = p;
      float meander = fbm(vec2(q.x * 1.2, t * 0.15)) * 1.8 + q.x * 0.4;

      float aur  = 0.0;
      float rays = 0.0;
      float tips = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float yOff = -0.5 + fi * 0.35
                   + sin(meander * 1.5 + fi * 1.3 + t * 0.25) * 0.18;
        float width = 0.12 + fi * 0.03;
        float dist  = abs(q.y - yOff);
        float curtain = exp(-pow(dist / width, 2.0));
        float ray = fbm(vec2(q.x * 30.0 + fi * 5.0, t * 0.6 + fi * 2.0));
        ray = pow(0.5 + 0.5 * ray, 2.5);
        float base = exp(-pow(dist / (width * 0.5), 2.0)) * ray;
        aur  += curtain * (0.5 + 0.5 * ray) * (1.0 - fi * 0.15);
        rays += ray * exp(-dist * 2.5) * 0.35 * (1.0 - fi * 0.1);
        tips += base * 0.6;
      }

      float stars = 0.0;
      for (int layer = 0; layer < 2; layer++) {
        float fl = float(layer);
        vec2 sp = p * (22.0 + fl * 14.0) - t * (0.03 + fl * 0.02);
        vec2 si = floor(sp);
        stars += step(0.985, hash(si))
               * (0.6 + 0.4 * sin(t * 2.5 + hash(si + 1.7 + fl) * 20.0))
               * (1.0 - fl * 0.3);
      }

      float horizon = exp(-abs(q.y + 0.8) * 4.0) * 0.3;
      float fade = smoothstep(-0.9, 0.5, q.y) * (1.0 - smoothstep(0.5, 1.2, q.y));

      v = clamp((aur * 0.65 + rays * 0.5 + tips * 0.4) * fade
              + stars * 0.55 + horizon * 0.4, 0.0, 1.0);
    `
  },

  // ── PREMIUM 3 ────────────────────────────────────────────────
  {
    name: "Nebula Genesis",
    cat: "strange",
    desc: "Star-forming gas cloud with dust lanes",
    a: "#04010c",
    b: "#ff9ad4",
    motion: -1,
    speed: 0.3,
    soft: 0.5,
    glow: 1.5,
    custom: `
      // Deep-space nebula: three fbm layers. Two produce emission (aligned
      // knots glow), the third carves dark dust lanes back out. Compact
      // star-formation knots pulse on their own random phase.
      vec2 q = p * 0.8;
      vec2 warp = vec2(fbm(q * 0.7 + t * 0.02),
                       fbm(q * 0.7 + 4.1 + t * 0.02)) * 1.2;

      float n1 = fbm(q + warp + t * 0.03);
      float n2 = fbm(q * 2.3 - warp * 0.7 + t * 0.05);
      float n3 = fbm(q * 5.5 + warp * 1.3 + t * 0.08);

      float emission = pow(max(0.0, n1 * 0.5 + n2 * 0.5), 2.5) * 0.8;
      float dust = smoothstep(0.35, 0.75, n3);
      emission *= (1.0 - dust * 0.75);

      float knots = 0.0;
      vec2 sp = p * 14.0;
      vec2 si = floor(sp), sf = fract(sp);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(si + g), hash(si + g + 7.7));
        float alive = step(0.90, hash(si + g + 3.3));
        vec2 rel = sf - g - o;
        float r = length(rel);
        knots += alive * exp(-r * 22.0)
               * (0.5 + 0.5 * sin(t * 4.0 + hash(si + g) * 20.0));
      }

      vec2 bsp = p * 40.0;
      vec2 bsi = floor(bsp);
      float stars = step(0.988, hash(bsi))
                  * (0.6 + 0.4 * sin(t * 3.0 + hash(bsi + 1.1) * 20.0));

      v = clamp(emission * 0.75 + knots * 0.9 + stars * 0.5, 0.0, 1.0);
    `
  },

  // ── PREMIUM 4 ────────────────────────────────────────────────
  {
    name: "Marble Cathedral",
    cat: "matter",
    desc: "Polished marble with veined pattern",
    a: "#0d0b0a",
    b: "#f0e6d8",
    motion: -1,
    speed: 0.2,
    soft: 0.25,
    glow: 0.9,
    custom: `
      // Polished stone. Low-frequency fbm gives the base tone; three passes
      // of rotated ridged noise produce the interlocking vein pattern. A
      // finite-difference normal on a second fbm adds a soft sheen.
      vec2 q = p * 1.1;

      float base = fbm(q * 0.6 + t * 0.02) * 0.5 + 0.5;

      vec2 vq = q;
      float veins = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 r = rot(vq, fi * 1.047);
        float n = fbm(r * vec2(1.5, 0.6) + fi * 3.7 + t * 0.03);
        float ridged = 1.0 - abs(n - 0.5) * 2.0;
        veins += pow(smoothstep(0.55, 1.0, ridged), 1.8) / (1.0 + fi * 0.5);
        vq *= 1.2;
      }

      float grain = fbm(q * 12.0 + t * 0.05) * 0.08;

      float e = 0.01;
      float hL = fbm((q - vec2(e, 0.0)) * 2.0 + t * 0.02);
      float hR = fbm((q + vec2(e, 0.0)) * 2.0 + t * 0.02);
      float hD = fbm((q - vec2(0.0, e)) * 2.0 + t * 0.02);
      float hU = fbm((q + vec2(0.0, e)) * 2.0 + t * 0.02);
      vec3 n = normalize(vec3((hR - hL), (hU - hD), 0.8));
      vec3 L = normalize(vec3(0.5, 0.7, 0.6));
      float sheen = pow(max(0.0, dot(n, L)), 12.0) * 0.5;

      v = clamp(base * 0.55 + veins * 0.65 + grain + sheen, 0.0, 1.0);
    `
  }

];
