// liquids.js — Calyx fluid definitions (REBUILT with 5 new shaders)
//
// Every liquid carries its own hand-written GLSL in `custom`. The host
// renderer injects it into main() at `// __CUSTOM_CODE__`, then computes:
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
  // BALATRO
  // =============================================================
  {
    name: "Balatro",
    cat: "strange",
    desc: "Psychedelic card suits and swirling chaos",
    a: "#1a0b2e",
    b: "#ff4d6d",
    motion: -1,
    speed: 0.55,
    glow: 1.6,
    pulse: 1.2,
    custom: `
      vec2 q = p * 1.2;
      // Swirling background
      float swirl = fbm(q + vec2(t * 0.15, -t * 0.1));
      float angle = atan(q.y, q.x) + swirl * 4.0;
      float radius = length(q);
      float spiral = sin(angle * 4.0 + radius * 6.0 - t * 3.0) * 0.5 + 0.5;
      float bg = spiral * 0.5 + swirl * 0.5;

      // Card suits (simplified diamonds and circles)
      float suits = 0.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        vec2 pos = vec2(hash(vec2(fi, 1.0)) - 0.5, hash(vec2(fi, 2.0)) - 0.5) * 3.0;
        pos += vec2(sin(t * 0.4 + fi * 1.3) * 0.3, cos(t * 0.5 + fi * 0.7) * 0.3);
        vec2 rel = p - pos;
        float rotAngle = t * (0.3 + hash(vec2(fi, 3.0)) * 0.5) + hash(vec2(fi, 4.0)) * 6.28;
        rel = rot(rel, rotAngle);
        float size = 0.07 + hash(vec2(fi, 5.0)) * 0.06;
        // Diamond shape
        float d = abs(rel.x) + abs(rel.y);
        float diamond = 1.0 - smoothstep(size, size + 0.01, d);
        // Circle for variety
        float circle = 1.0 - smoothstep(size * 0.8, size * 0.8 + 0.01, length(rel));
        float shape = max(diamond, circle * 0.7);
        suits += shape * (0.6 + 0.4 * sin(t * 2.0 + fi));
      }
      suits = clamp(suits, 0.0, 1.0);

      // Sparkle accents
      float sparkle = pow(max(0.0, sin(bg * 20.0 + t * 5.0)), 20.0) * 0.5;

      v = clamp(bg * 0.6 + suits * 0.9 + sparkle, 0.0, 1.0);
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

      // Branching lines
      float branches = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 offset = vec2(hash(vec2(fi, 1.1)) - 0.5, hash(vec2(fi, 2.2)) - 0.5) * 2.0;
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
        float arc = exp(-perp * perp / 0.02) * (0.5 + 0.5 * sin(t * 3.0 + fi * 2.0));
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
        float string = exp(-perp * perp * 30.0) * (0.5 + 0.5 * sin(proj * 5.0 + t * 2.0 + fi));
        strings += string;
      }
      float glow = fbm(q * 0.5 + t * 0.05) * 0.5;
      float stars = step(0.98, hash(floor(q * 20.0))) * 0.8;

      v = clamp(strings * 0.8 + glow + stars, 0.0, 1.0);
    `
  }

];
