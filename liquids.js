// liquids.js — Calyx fluid definitions
//
// The host renderer injects `custom` into main() at `// __LIQUID_BODY__`,
// then computes:
//   structure = smoothstep(0.15, 0.85, v);
//   color     = mix(u_a, u_b, structure);
//   color     += white glint where v ≈ 0.58  (highlight)
//   color     += white edge  where v ≈ 0.50  (edge)
// So values of v near 0.55–0.62 will light up as brilliant white glints.
//
// Available inside `custom`:
//   p, mouse (vec2), t (float), d (float)
//   u_a, u_b (vec3), u_pulse (float)
//   hash(vec2), noise(vec2), fbm(vec2), rot(vec2,float)
//   v (float) — set this to your result

export default [

  // =============================================================
  // BALATRO  —  the star of the show
  // =============================================================
  {
    name: "Balatro",
    cat: "strange",
    desc: "Psychedelic card chaos · joker energy",
    a: "#150229",
    b: "#ff2966",
    motion: -1,
    speed: 0.65,
    glow: 1.9,
    pulse: 1.4,
    soft: 0.35,
    custom: `
      // ---------- BASE SWIRL ----------
      // The legendary Balatro vortex: two turbulent fbm layers riding on a
      // polar spiral with a slow rotation offset. This is the deep magenta
      // plasma that fills every menu and run in the game.
      vec2 q = p * 1.15;
      float ang = atan(q.y, q.x);
      float rad = length(q);

      float swirlA = fbm(vec2(ang * 1.8 + rad * 1.5, rad * 3.5 - t * 0.40));
      float swirlB = fbm(vec2(ang * 3.0 - rad * 2.0 + t * 0.15, rad * 5.0 + t * 0.22));

      float spiral = sin(ang * 4.0 + rad * 9.0 - t * 2.6 + swirlA * 5.0) * 0.5 + 0.5;
      spiral = pow(spiral, 1.35);

      float bg = spiral * 0.55 + swirlB * 0.45;
      bg *= 1.0 - smoothstep(1.1, 2.3, rad);

      // ---------- FALLING CARD SUITS ----------
      // Hearts, diamonds, spades and clubs tumbling down like a shuffling
      // deck. Each card is one of four procedurally-shaped glyphs — the
      // rotation, size, hue and fall-speed are all hash-seeded per index.
      float suits = 0.0;
      for (int i = 0; i < 18; i++) {
        float fi = float(i);
        float sX = hash(vec2(fi, 1.1)) - 0.5;
        float sY = hash(vec2(fi, 2.2));
        float fall = fract(t * 0.065 + sY);

        vec2 pos = vec2(sX * 2.6 + sin(t * 0.4 + fi * 1.3) * 0.35,
                        1.5 - fall * 3.1);
        vec2 rel = p - pos;

        float rotA = t * (0.45 + hash(vec2(fi, 3.3))) + fi * 1.7;
        rel = rot(rel, rotA);
        float sz = 0.055 + hash(vec2(fi, 4.4)) * 0.045;

        // Diamond
        float d = abs(rel.x) + abs(rel.y);
        float diamond = 1.0 - smoothstep(sz, sz + 0.006, d);

        // Circle / club-head
        float circle = 1.0 - smoothstep(sz * 0.85, sz * 0.85 + 0.006, length(rel));

        // Heart: two lobes + a point
        vec2 hr = rel - vec2(0.0, -sz * 0.10);
        float lobeL = 1.0 - smoothstep(sz * 0.50, sz * 0.50 + 0.006,
                                       length(hr + vec2(sz * 0.35, sz * 0.15)));
        float lobeR = 1.0 - smoothstep(sz * 0.50, sz * 0.50 + 0.006,
                                       length(hr - vec2(sz * 0.35, -sz * 0.15)));
        float point = 1.0 - smoothstep(sz * 0.60, sz * 0.60 + 0.006,
                                       abs(rel.x) * 1.10 + max(0.0, rel.y) * 1.40);
        float heart = max(max(lobeL, lobeR), point);

        float shape = max(max(diamond, circle * 0.80), heart);
        float fade = 1.0 - fall * 0.35;

        suits += shape * fade * (0.6 + 0.4 * sin(t * 3.0 + fi * 2.0));
      }
      suits = clamp(suits, 0.0, 1.0);

      // ---------- MULTIPLIER ORBS ----------
      // Big pulsing chip/mult orbs orbiting the middle — the "+30 ×4" energy
      // that lights up when a hand scores.
      float orbs = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 op = vec2(sin(t * 0.35 + fi * 2.1) * 1.00,
                       cos(t * 0.45 + fi * 1.7) * 0.70);
        float orb = exp(-length(p - op) * 6.0);
        orbs += orb * (0.75 + 0.35 * sin(t * 2.2 + fi * 1.7));
      }
      orbs = min(orbs, 1.2);

      // ---------- CRT / GLITCH ----------
      // Scanlines + random horizontal slice-tears: the lo-fi CRT shimmer
      // that coats the entire game.
      float scan = 0.88 + 0.12 * sin(p.y * 240.0);
      float glitch = step(0.97, hash(vec2(floor(p.y * 30.0), floor(t * 18.0)))) * 0.14;

      // ---------- ASSEMBLE ----------
      float v = bg * 0.75 + suits * 1.05 + orbs * 0.40 + glitch;
      v *= scan;
      v = clamp(v, 0.0, 1.0);
    `
  },

  // =============================================================
  // ORGANIC
  // =============================================================
  {
    name: "Mycelium",
    cat: "organic",
    desc: "Fungal network with bioluminescent glow",
    a: "#0a1a0a",
    b: "#7fff7f",
    motion: -1,
    speed: 0.35,
    glow: 1.3,
    soft: 0.3,
    custom: `
      vec2 q = p * 2.0;
      float growth = fbm(q * 1.5 + t * 0.1);

      // Branching filaments radiating from scattered spores
      float branches = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 offset = vec2(hash(vec2(fi, 1.1)) - 0.5,
                           hash(vec2(fi, 2.2)) - 0.5) * 2.0;
        vec2 dir = vec2(cos(fi * 1.5), sin(fi * 1.5));
        vec2 rel = q - offset;
        float proj = dot(rel, dir);
        float perp = abs(rel.x * dir.y - rel.y * dir.x);
        float line = exp(-perp * perp * 20.0) * smoothstep(1.0, 0.0, abs(proj));
        branches += line;
      }
      branches *= 0.5 + 0.5 * fbm(q * 4.0 + t * 0.2);

      float glow = exp(-length(p) * 1.5) * 0.5;
      v = clamp(branches * 0.8 + glow + growth * 0.3, 0.0, 1.0);
    `
  },

  // =============================================================
  // ENERGY
  // =============================================================
  {
    name: "Plasma Storm",
    cat: "energy",
    desc: "Electric arcs and roiling plasma",
    a: "#020a1a",
    b: "#4df0ff",
    motion: -1,
    speed: 0.7,
    glow: 1.8,
    pulse: 1.5,
    custom: `
      vec2 q = p * 1.5;
      float plasma = fbm(q + vec2(t * 0.2, -t * 0.1));

      float arcs = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float angle = fi * 1.256 + t * 0.5;
        vec2 dir = vec2(cos(angle), sin(angle));
        float perp = abs(p.x * dir.y - p.y * dir.x);
        float arc = exp(-perp * perp / 0.02)
                  * (0.5 + 0.5 * sin(t * 3.0 + fi * 2.0));
        arcs += arc;
      }
      arcs *= smoothstep(1.5, 0.2, length(p));

      float core = exp(-length(p) * 10.0);
      v = clamp(plasma * 0.5 + arcs * 0.9 + core * 0.8, 0.0, 1.0);
    `
  },

  // =============================================================
  // MATTER
  // =============================================================
  {
    name: "Ferrofluid",
    cat: "matter",
    desc: "Magnetic spikes with metallic sheen",
    a: "#0a0a0a",
    b: "#c0c0ff",
    motion: -1,
    speed: 0.4,
    glow: 1.2,
    soft: 0.1,
    custom: `
      vec2 q = p * 2.0;
      vec2 i = floor(q), f = fract(q);
      float md1 = 8.0, md2 = 8.0;
      vec2 id1;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 3.3));
        float d = length(f - g - o);
        if (d < md1) { md2 = md1; md1 = d; id1 = i + g; }
        else if (d < md2) { md2 = d; }
      }
      float border = md2 - md1;
      float spikes = smoothstep(0.1, 0.0, border);

      vec3 n = normalize(vec3(f - 0.5, 0.5));
      float lit = max(0.0, dot(n, normalize(vec3(0.5, 0.5, 0.7))));
      float metal = 0.5 + 0.5 * hash(id1);

      v = clamp(lit * 0.6 + spikes * 1.2 * metal, 0.0, 1.0);
    `
  },

  // =============================================================
  // STRANGE
  // =============================================================
  {
    name: "Cosmic Strings",
    cat: "strange",
    desc: "Vibrating filaments across the void",
    a: "#0a001a",
    b: "#ff4dff",
    motion: -1,
    speed: 0.5,
    glow: 1.7,
    soft: 0.4,
    custom: `
      vec2 q = p * 1.8;
      float strings = 0.0;
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float angle = fi * 0.785 + t * 0.1;
        vec2 dir = vec2(cos(angle), sin(angle));
        float offset = hash(vec2(fi, 1.1)) - 0.5;
        float proj = dot(q, dir);
        float perp = abs(q.x * dir.y - q.y * dir.x - offset);
        float string = exp(-perp * perp * 30.0)
                     * (0.5 + 0.5 * sin(proj * 5.0 + t * 2.0 + fi));
        strings += string;
      }
      float glow = fbm(q * 0.5 + t * 0.05) * 0.5;
      float stars = step(0.98, hash(floor(q * 20.0))) * 0.8;

      v = clamp(strings * 0.8 + glow + stars, 0.0, 1.0);
    `
  }

];
