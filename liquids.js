// liquids.js — Calyx fluid definitions
//
// Every liquid now carries its own hand-written GLSL motion code in the
// `custom` field. The host renderer should check `liquid.custom` first:
// if present, that code is injected into the fragment shader's main()
// at the marker `// __CUSTOM_CODE__` and `motion` is ignored.
//
// Interface available inside `custom`:
//   p       vec2   position, origin at centre, ~-1..1
//   mouse   vec2   mouse position, same space
//   t       float  time * speed
//   d       float  distance from centre  (length(p))
//   u_a     vec3   base colour   (0..1)
//   u_b     vec3   accent colour (0..1)
//   hash(vec2)     → 0..1 pseudo-random
//   noise(vec2)    → smooth 0..1 noise
//   fbm(vec2)      → fractal brownian motion ~0..1
//   rot(vec2, a)   → rotate a vec2 by a radians
//
// Set `v` (float) to your result (0..1). The host smoothsteps and mixes
// u_a / u_b based on it.
//
// The optional fields glow / soft / scale / warp / pulse are honoured by
// the editor's shader and by the main page's renderer if it supports them.

export default [

  // ==================================================================
  //  ORGANIC
  // ==================================================================

  {
    name: "Deep Obsidian",
    cat: "organic",
    desc: "Flowing strata",
    a: "#17243d",
    b: "#5c82c9",
    motion: -1,
    speed: 0.65,
    glow: 0.55,
    soft: 0.35,
    custom: `
      // Five layered strata, each moving at a slightly different rate.
      // Combined into a "depth field" so nearby layers dominate.
      vec2 q = p;
      float acc = 0.0;
      float depth = 0.0;
      float amp = 0.55;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 qq = q + vec2(t * 0.05 * (1.0 - fi * 0.12),
                           -t * 0.03 * (1.0 - fi * 0.06));
        float layer = fbm(qq * (1.4 + fi * 0.7));
        acc += layer * amp;
        depth += amp * (1.0 - abs(layer - 0.5) * 2.0);
        amp *= 0.58;
      }
      v = clamp(mix(acc * 0.75, depth * 0.6, 0.4), 0.0, 1.0);
    `
  },

  {
    name: "Ink Tendrils",
    cat: "organic",
    desc: "Soft branching ink",
    a: "#100d1c",
    b: "#71538f",
    motion: -1,
    speed: 0.55,
    soft: 0.4,
    custom: `
      // Domain warp creates organic branching veins.
      vec2 q = p * 1.8;
      vec2 w = vec2(fbm(q + 1.3), fbm(q + 5.7));
      q += w * 1.4;
      float ink = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 qq = q + vec2(sin(t * 0.2 + fi * 1.7),
                           cos(t * 0.17 + fi * 2.1)) * 0.12;
        ink += 1.0 - abs(fbm(qq * (1.0 + fi * 0.55)) - 0.5) * 2.0;
      }
      ink /= 4.0;
      float branches = smoothstep(0.55, 0.85, ink);
      v = mix(ink * 0.6, branches, 0.55);
    `
  },

  {
    name: "Emerald Vortex",
    cat: "organic",
    desc: "Quiet rotational fluid",
    a: "#06231b",
    b: "#3a9f7b",
    motion: -1,
    speed: 0.55,
    soft: 0.3,
    custom: `
      // Logarithmic spiral modulated by fbm, radial fade.
      float a = atan(p.y, p.x);
      float r = length(p);
      float spiral = sin(a * 5.0 - log(r + 0.32) * 8.0 + t * 1.4) * 0.5 + 0.5;
      float detail = fbm(p * 4.0 + vec2(a * 2.0, r * 3.0) + t * 0.05);
      v = (spiral * 0.6 + detail * 0.4) * smoothstep(1.6, 0.15, r);
    `
  },

  {
    name: "Biolume Spores",
    cat: "organic",
    desc: "Dim living particles",
    a: "#06201d",
    b: "#37a996",
    motion: -1,
    speed: 0.55,
    glow: 0.9,
    pulse: 1.3,
    custom: `
      // Floating glowing spores — Worley cells, brightest at centre.
      vec2 q = p * 4.0;
      q.y -= t * 0.22;
      q.x += sin(t * 0.3 + q.y * 0.5) * 0.16;
      vec2 i = floor(q), f = fract(q);
      float md = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g + 1.1), hash(i + g + 3.7));
          md = min(md, length(f - g - o));
        }
      }
      float spore = smoothstep(0.42, 0.05, md);
      float glow  = smoothstep(0.42, 0.0,  md) * 0.35;
      v = clamp(spore + glow, 0.0, 1.0);
    `
  },

  {
    name: "Sakura Petals",
    cat: "organic",
    desc: "Gentle petal drift",
    a: "#240f19",
    b: "#b86c8d",
    motion: -1,
    speed: 0.38,
    soft: 0.5,
    custom: `
      // Three drifting petal clusters — polar petal shapes.
      vec2 q = p * 2.0;
      q.y -= t * 0.14;
      q.x += sin(t * 0.4 + q.y * 0.8) * 0.3;
      float many = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 off = vec2(sin(fi * 2.3 + t * 0.3),
                        cos(fi * 1.7 + t * 0.25));
        vec2 qq = q + off * 1.5;
        float aa = atan(qq.y, qq.x);
        float rr = length(qq);
        float pet = abs(sin(aa * 5.0)) * 0.5 + 0.5;
        many = max(many, smoothstep(0.62, 0.1, rr) * pet);
      }
      v = many * 0.75 + fbm(p * 4.0 + t * 0.03) * 0.3;
    `
  },

  {
    name: "Coffee",
    cat: "organic",
    desc: "Warm, slow crema flow",
    a: "#170d07",
    b: "#8b4f2e",
    motion: -1,
    speed: 0.28,
    soft: 0.35,
    custom: `
      // Slow vortex with a faint crema pattern on the surface.
      float r = length(p);
      float a = atan(p.y, p.x);
      vec2 q = rot(p, a * 0.35 + r * 2.0 + t * 0.1);
      float swirl = fbm(q * 2.0 + t * 0.04);
      float crema = fbm(p * 6.0 + t * 0.02) * 0.5 + 0.5;
      v = (swirl * 0.75 + crema * 0.25) * smoothstep(1.5, 0.25, r);
    `
  },

  {
    name: "Swamp Spores",
    cat: "organic",
    desc: "Suspended earthy growth",
    a: "#101a0b",
    b: "#6f8f49",
    motion: -1,
    speed: 0.4,
    soft: 0.4,
    custom: `
      // Thick domain-warped blobs with small spores flecked on top.
      vec2 q = p * 2.0;
      q.x += fbm(q * 1.5 + t * 0.05) * 0.42;
      q.y += fbm(q * 1.5 + 3.7 + t * 0.04) * 0.42;
      float blob = smoothstep(0.35, 0.7, fbm(q * 2.0 + t * 0.03));
      float spores = fbm(q * 12.0 + t * 0.15);
      float dots = smoothstep(0.75, 0.87, spores);
      v = blob * 0.75 + dots * 0.3;
    `
  },

  {
    name: "Blood",
    cat: "organic",
    desc: "Deep red viscous waves",
    a: "#260508",
    b: "#a51e2b",
    motion: -1,
    speed: 0.24,
    soft: 0.3,
    custom: `
      // Slow warped Worley cells — viscous plasma.
      vec2 q = p * 2.0;
      vec2 w = vec2(fbm(q * 0.8 + t * 0.02),
                    fbm(q * 0.8 + 3.3 + t * 0.02));
      q += w * 0.55;
      vec2 i = floor(q), f = fract(q);
      float md = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 2.7));
          md = min(md, length(f - g - o));
        }
      }
      float cell = smoothstep(0.35, 0.15, md);
      float plasma = fbm(q * 3.0 + t * 0.03);
      v = cell * 0.45 + plasma * 0.55;
    `
  },

  {
    name: "Oat Milk",
    cat: "organic",
    desc: "Soft creamy surface",
    a: "#242018",
    b: "#b9a98c",
    motion: -1,
    speed: 0.2,
    soft: 0.65,
    custom: `
      // Very soft warp, low-frequency cream.
      vec2 q = p * 1.5;
      q += vec2(fbm(q * 0.8 + t * 0.02),
                fbm(q * 0.8 + 5.5 + t * 0.02)) * 0.4;
      float cream = fbm(q * 1.8 + t * 0.03);
      v = cream * 0.7 + pow(cream, 2.0) * 0.3;
    `
  },

  {
    name: "Black Tea",
    cat: "organic",
    desc: "Calm amber-brown flow",
    a: "#1b1009",
    b: "#7d4d2c",
    motion: -1,
    speed: 0.22,
    soft: 0.35,
    custom: `
      // Gentle swirl with fine leaf specks suspended.
      float r = length(p);
      vec2 q = rot(p, r * 1.5 + t * 0.1);
      float swirl = fbm(q * 2.0 + t * 0.03);
      float leaf  = smoothstep(0.82, 0.92, fbm(q * 15.0 + t * 0.1));
      v = swirl * 0.65 + leaf * 0.2 + smoothstep(0.0, 0.7, r) * 0.15;
    `
  },

  {
    name: "Lavender Water",
    cat: "organic",
    desc: "Quiet violet diffusion",
    a: "#171323",
    b: "#766b91",
    motion: -1,
    speed: 0.18,
    soft: 0.7,
    custom: `
      // Slow diffusion — heavy domain warp of a low-frequency fbm.
      vec2 q = p;
      q += vec2(fbm(q * 0.6 + t * 0.01),
                fbm(q * 0.6 + 6.6 + t * 0.01)) * 0.85;
      v = smoothstep(0.3, 0.72, fbm(q * 1.2 + t * 0.02));
    `
  },

  {
    name: "Honey",
    cat: "organic",
    desc: "Thick golden current",
    a: "#2b1b06",
    b: "#b18438",
    motion: -1,
    speed: 0.18,
    soft: 0.25,
    glow: 0.7,
    custom: `
      // Thick viscous flow with a specular highlight from a fake normal.
      vec2 q = p;
      q += vec2(fbm(q * 0.8 + t * 0.01),
                fbm(q * 0.8 + 4.4 + t * 0.01)) * 0.5;
      float h = fbm(q * 1.5 + t * 0.015);
      float e = 0.02;
      float hx = fbm((q + vec2(e, 0.0)) * 1.5 + t * 0.015);
      float hy = fbm((q + vec2(0.0, e)) * 1.5 + t * 0.015);
      vec3 n = normalize(vec3((hx - h) * 5.0, (hy - h) * 5.0, 1.0));
      float spec = pow(max(0.0, dot(n, normalize(vec3(0.5, 0.5, 1.0)))), 8.0);
      v = clamp(h * 0.7 + spec * 0.55, 0.0, 1.0);
    `
  },

  // ==================================================================
  //  ENERGY
  // ==================================================================

  {
    name: "Solar Plasma",
    cat: "energy",
    desc: "Muted flare turbulence",
    a: "#301d0b",
    b: "#c77832",
    motion: -1,
    speed: 0.75,
    glow: 1.0,
    custom: `
      // Fake sphere lit from upper-left, covered in turbulent plasma.
      float r = length(p);
      float sphere = sqrt(max(0.0, 1.0 - r * r));
      float heat = fbm(p * 3.0 + vec2(t * 0.15, -t * 0.1));
      heat = fbm(p * 2.0 + heat * 1.5 + t * 0.05);
      float lit = sphere * 0.6 + 0.4;
      float limb = smoothstep(1.0, 0.85, r);
      v = clamp(heat * lit * limb, 0.0, 1.0);
    `
  },

  {
    name: "Matrix Rain",
    cat: "energy",
    desc: "Quiet digital cascade",
    a: "#07190b",
    b: "#4f9b62",
    motion: -1,
    speed: 0.5,
    glow: 0.75,
    custom: `
      // Falling glyph columns with random per-column speeds, heads and trails.
      vec2 q = p * 3.0;
      float col = floor(q.x);
      float speedMod = 0.5 + hash(vec2(col, 0.0)) * 0.9;
      float yy = fract(q.y * 0.5 + t * 0.4 * speedMod);
      float drop  = smoothstep(0.98, 0.7, yy) * smoothstep(0.0, 0.1, yy);
      float head  = smoothstep(0.02, 0.0, yy);
      float trail = smoothstep(0.55, 0.05, yy) * 0.3;
      float glow  = drop + head + trail;
      v = clamp(glow * 0.75 + fbm(vec2(q.x * 4.0, q.y * 2.0 + t * 0.3)) * 0.3,
                0.0, 1.0);
    `
  },

  {
    name: "Neon Sunset",
    cat: "energy",
    desc: "Soft ribbon plasma",
    a: "#25120b",
    b: "#b85f3e",
    motion: -1,
    speed: 0.65,
    glow: 0.85,
    soft: 0.3,
    custom: `
      // Horizontal ribbons — sine bands warped by fbm, hot cores on crests.
      vec2 q = p;
      float bands = sin(q.y * 8.0 + fbm(q * 2.0) * 3.0 + t * 0.3) * 0.5 + 0.5;
      float glow = smoothstep(0.3, 1.0, bands);
      float hot  = pow(bands, 3.0);
      float streak = fbm(vec2(q.x * 4.0, q.y * 1.5) + t * 0.1);
      v = (glow * 0.5 + hot * 0.3 + streak * 0.2) * smoothstep(1.5, 0.5, length(p));
    `
  },

  {
    name: "Aurora Curtains",
    cat: "energy",
    desc: "Muted magnetic sheets",
    a: "#071b1b",
    b: "#54aaa0",
    motion: -1,
    speed: 0.48,
    soft: 0.45,
    glow: 0.9,
    custom: `
      // Vertical curtains modulated by two fbm layers, faded top/bottom.
      vec2 q = p;
      float v1 = fbm(vec2(q.x * 3.0, q.y * 1.2 + t * 0.1));
      float v2 = fbm(vec2(q.x * 6.0, q.y * 1.5 - t * 0.07));
      float curtain = sin(q.x * 10.0 + v1 * 6.0 + t * 0.4) * 0.5 + 0.5;
      float fade = smoothstep(-1.2, -0.3, q.y) * smoothstep(1.2, 0.3, q.y);
      v = (v2 * 0.6 + curtain * 0.4) * fade;
    `
  },

  {
    name: "Electric Spiral",
    cat: "energy",
    desc: "Gentle charged vortex",
    a: "#120c22",
    b: "#8066bd",
    motion: -1,
    speed: 0.55,
    glow: 0.85,
    custom: `
      // Spiral warped by noise, sharpened into bright arcing filaments.
      float a = atan(p.y, p.x);
      float r = length(p);
      float warp = fbm(vec2(a * 2.0, r * 3.0) + t * 0.1);
      float spiral = sin(a * 8.0 + r * 10.0 + warp * 4.0 - t * 2.0) * 0.5 + 0.5;
      float branch = pow(spiral, 3.0);
      float ring   = sin(r * 15.0 - t * 3.0) * 0.5 + 0.5;
      v = (spiral * 0.5 + branch * 0.3 + ring * 0.2) * smoothstep(1.35, 0.1, r);
    `
  },

  {
    name: "Fire Veins",
    cat: "energy",
    desc: "Dim branching heat",
    a: "#240e08",
    b: "#b84f2d",
    motion: -1,
    speed: 0.6,
    glow: 1.0,
    custom: `
      // Ridged fbm — bright thin filaments with hot cores.
      vec2 q = p * 2.0;
      float ridged = 0.0, amp = 0.5, freq = 1.0;
      for (int i = 0; i < 5; i++) {
        float n = fbm(q * freq + t * 0.05);
        n = 1.0 - abs(n - 0.5) * 2.0;
        ridged += n * amp;
        freq *= 2.0;
        amp  *= 0.5;
      }
      float veins = pow(ridged, 2.5);
      float hot   = smoothstep(0.6, 0.92, ridged);
      v = veins * 0.7 + hot * 0.35;
    `
  },

  {
    name: "Cyan Shock",
    cat: "energy",
    desc: "Low-energy pressure waves",
    a: "#052023",
    b: "#43a9ad",
    motion: -1,
    speed: 0.6,
    glow: 1.0,
    pulse: 1.4,
    custom: `
      // Four expanding shockwave rings, each fading as it grows.
      float r = length(p);
      float rings = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float phase = fract(t * 0.15 + fi * 0.25);
        float radius = phase * 1.5;
        float ring = exp(-abs(r - radius) * 12.0);
        rings += ring * (1.0 - phase);
      }
      vec2 q = p + vec2(fbm(p * 3.0 + t * 0.05),
                        fbm(p * 3.0 + 5.5 + t * 0.05)) * 0.2;
      v = clamp(rings * 0.7 + fbm(q * 4.0 + t * 0.1) * 0.3, 0.0, 1.0);
    `
  },

  {
    name: "Solar Wind",
    cat: "energy",
    desc: "Charged particle stream",
    a: "#1a1208",
    b: "#ffaa33",
    motion: -1,
    speed: 0.8,
    glow: 1.1,
    warp: 0.15,
    custom: `
      // Elongated particles streaking in +X, with a flowing background.
      vec2 q = p * 3.0;
      q.x -= t * 0.8;
      q.y += sin(q.x * 0.5 + t * 0.1) * 0.3;
      vec2 i = floor(q), f = fract(q);
      float streak = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 5.5));
          vec2 d = f - g - o;
          d.x *= 0.3;
          float p2 = exp(-length(d) * 8.0);
          float life = hash(i + g + 3.3);
          p2 *= smoothstep(0.0, 0.2, life) * smoothstep(1.0, 0.8, life);
          streak = max(streak, p2);
        }
      }
      v = clamp(streak * 0.75 + fbm(p * 2.0 - vec2(t * 0.2, 0.0)) * 0.3,
                0.0, 1.0);
    `
  },

  // ==================================================================
  //  MATTER
  // ==================================================================

  {
    name: "Molten Gold",
    cat: "matter",
    desc: "Warm cellular heat",
    a: "#2b1705",
    b: "#b47b32",
    motion: -1,
    speed: 0.7,
    glow: 0.9,
    custom: `
      // Voronoi cells with glowing borders (hot cracks).
      vec2 q = p * 2.5 + vec2(t * 0.05, -t * 0.03);
      vec2 i = floor(q), f = fract(q);
      float md1 = 8.0, md2 = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 7.7));
          float dd = length(f - g - o);
          if (dd < md1) { md2 = md1; md1 = dd; }
          else if (dd < md2) { md2 = dd; }
        }
      }
      float border = md2 - md1;
      float cells  = smoothstep(0.02, 0.15, border);
      v = mix(1.0 - cells * 0.7, cells, 0.6);
    `
  },

  {
    name: "Crystal Melt",
    cat: "matter",
    desc: "Slow geometric facets",
    a: "#171326",
    b: "#8d7dbd",
    motion: -1,
    speed: 0.55,
    soft: 0.2,
    custom: `
      // Two overlapping square grids (45° apart) forming faceted crystal.
      vec2 q = rot(p, t * 0.05) * 3.0;
      vec2 g1 = abs(fract(q) - 0.5);
      vec2 q2 = rot(q, 1.5708);
      vec2 g2 = abs(fract(q2) - 0.5);
      float facet = min(max(g1.x, g1.y), max(g2.x, g2.y));
      float shimmer = fbm(p * 2.0 + t * 0.06);
      v = facet * 0.7 + shimmer * 0.3;
    `
  },

  {
    name: "Arctic Waves",
    cat: "matter",
    desc: "Frozen ribbons",
    a: "#081a24",
    b: "#6caec1",
    motion: -1,
    speed: 0.45,
    soft: 0.25,
    custom: `
      // Long horizontal ribbons warped by three layered sine modifiers.
      vec2 q = p;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        q.y += sin(q.x * (3.0 + fi) + t * 0.3 * (1.0 + fi * 0.3)) * 0.06;
      }
      float base = fbm(q * vec2(1.2, 3.0) + vec2(t * 0.03, 0.0));
      float streak = fbm(q * vec2(6.0, 1.0));
      v = base * 0.7 + streak * 0.3;
    `
  },

  {
    name: "Toxic Bubbles",
    cat: "matter",
    desc: "Low-key gas pockets",
    a: "#152006",
    b: "#79a33d",
    motion: -1,
    speed: 0.55,
    glow: 0.8,
    custom: `
      // Rising bubble field — Worley cells with rim + inner glow + highlight.
      vec2 q = p * 3.0;
      q.y += t * 0.3;
      vec2 i = floor(q), f = fract(q);
      float md = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 3.14));
          md = min(md, length(f - g - o));
        }
      }
      float rim       = smoothstep(0.35, 0.15, md);
      float inside    = smoothstep(0.15, 0.05, md);
      float highlight = smoothstep(0.08, 0.0, md - 0.05);
      v = rim * 0.7 + inside * 0.2 + highlight * 0.35;
    `
  },

  {
    name: "Copper Oxide",
    cat: "matter",
    desc: "Oxidized flow",
    a: "#21140b",
    b: "#8e8064",
    motion: -1,
    speed: 0.5,
    soft: 0.3,
    custom: `
      // Worley patina pattern blended with medium-frequency noise.
      vec2 q = p * 2.0 + vec2(t * 0.02, -t * 0.03);
      vec2 i = floor(q), f = fract(q);
      float md = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 2.3));
          md = min(md, length(f - g - o));
        }
      }
      float patina = smoothstep(0.05, 0.3, md);
      float noise  = fbm(p * 5.0 + t * 0.03);
      v = patina * 0.5 + noise * 0.5;
    `
  },

  {
    name: "Liquid Mercury",
    cat: "matter",
    desc: "Cool reflective waves",
    a: "#1c2025",
    b: "#b7c0c7",
    motion: -1,
    speed: 0.45,
    soft: 0.15,
    glow: 0.75,
    custom: `
      // Fake normal from height derivative → fresnel + lit metal.
      vec2 q = p;
      float h = fbm(q * 2.5 + t * 0.05);
      float e = 0.012;
      float hx = fbm((q + vec2(e, 0.0)) * 2.5 + t * 0.05);
      float hy = fbm((q + vec2(0.0, e)) * 2.5 + t * 0.05);
      vec3 n = normalize(vec3(hx - h, hy - h, e * 3.0));
      float fres = pow(1.0 - abs(n.z), 2.0);
      float lit  = dot(n, normalize(vec3(0.5, 0.7, 0.5))) * 0.5 + 0.5;
      v = lit * 0.55 + fres * 0.55;
    `
  },

  {
    name: "Carbon Lattice",
    cat: "matter",
    desc: "Dense hard-surface flow",
    a: "#0c1017",
    b: "#657080",
    motion: -1,
    speed: 0.35,
    soft: 0.1,
    custom: `
      // Hexagonal grid with subtle inner-cell glow.
      vec2 q = p * 4.0 + t * 0.05;
      vec2 h = vec2(1.0, 1.7320508);
      vec2 a1 = mod(q, h) - h * 0.5;
      vec2 a2 = mod(q + h * 0.5, h) - h * 0.5;
      vec2 a = length(a1) < length(a2) ? a1 : a2;
      float d = length(a);
      float cell = smoothstep(0.45, 0.48, d);
      float inner = smoothstep(0.45, 0.25, d) * 0.15;
      v = clamp((1.0 - cell) + inner, 0.0, 1.0);
    `
  },

  {
    name: "Liquid Chrome",
    cat: "matter",
    desc: "Soft mirror distortion",
    a: "#20252b",
    b: "#c4ccd2",
    motion: -1,
    speed: 0.4,
    soft: 0.15,
    glow: 0.8,
    custom: `
      // Chrome — environment reflection pattern with sharp specular.
      vec2 q = p;
      float h  = fbm(q * 3.0 + vec2(t * 0.04, -t * 0.03));
      float e  = 0.015;
      float hx = fbm((q + vec2(e, 0.0)) * 3.0 + vec2(t * 0.04, -t * 0.03));
      float hy = fbm((q + vec2(0.0, e)) * 3.0 + vec2(t * 0.04, -t * 0.03));
      vec3 n = normalize(vec3((hx - h) * 8.0, (hy - h) * 8.0, 1.0));
      float refl  = 0.5 + 0.5 * n.y;
      float sharp = pow(max(0.0, n.z), 4.0);
      v = refl * 0.6 + sharp * 0.45;
    `
  },

  {
    name: "Rain Glass",
    cat: "matter",
    desc: "Vertical fluid sheets",
    a: "#081a22",
    b: "#71a7ba",
    motion: -1,
    speed: 0.38,
    soft: 0.2,
    glow: 0.7,
    custom: `
      // Falling droplet field with refraction inside each drop.
      vec2 q = p * 3.0;
      vec2 i = floor(q), f = fract(q);
      float md = 8.0;
      vec2 mdId = vec2(0.0);
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 5.5));
          o.y += fract(t * 0.3 + hash(i + g + 2.2) * 10.0);
          float dd = length(f - g - o);
          if (dd < md) { md = dd; mdId = i + g; }
        }
      }
      vec2 refr = (f - fract(mdId) - 0.5) * 0.2;
      float bg = fbm(p * 2.0 + refr + t * 0.03);
      float drop = smoothstep(0.4, 0.15, md);
      float edge = smoothstep(0.4, 0.35, md) * smoothstep(0.2, 0.3, md);
      v = bg * 0.55 + drop * 0.3 + edge * 0.3;
    `
  },

  {
    name: "Amber Lava",
    cat: "matter",
    desc: "Slow cracked convection",
    a: "#281708",
    b: "#bd7b2f",
    motion: -1,
    speed: 0.55,
    glow: 1.0,
    custom: `
      // Convection cells — 3D fake lighting per cell + hot cracks between.
      vec2 q = p * 2.0 + vec2(t * 0.03, -t * 0.02);
      vec2 i = floor(q), f = fract(q);
      float md1 = 8.0, md2 = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 4.4));
          float dd = length(f - g - o);
          if (dd < md1) { md2 = md1; md1 = dd; }
          else if (dd < md2) { md2 = dd; }
        }
      }
      float crack = md2 - md1;
      float cellHeight = 1.0 - md1;
      vec3 n = normalize(vec3(f.x - 0.5, f.y - 0.5, cellHeight * 2.0));
      float lit = dot(n, normalize(vec3(0.4, 0.6, 0.7))) * 0.5 + 0.5;
      float glow = smoothstep(0.15, 0.0, crack);
      v = clamp(lit * 0.6 + glow * 0.55, 0.0, 1.0);
    `
  },

  {
    name: "Dirty Water",
    cat: "matter",
    desc: "Heavy surface current",
    a: "#10191b",
    b: "#496d72",
    motion: -1,
    speed: 0.22,
    soft: 0.4,
    custom: `
      // Domain-warped mud with fine sediment flecks.
      vec2 q = p * 1.5;
      q += vec2(fbm(q + 1.2), fbm(q + 5.7)) * 0.7;
      float mud = fbm(q * 2.0 + t * 0.02);
      float sed = smoothstep(0.7, 0.85, fbm(q * 8.0 + t * 0.05));
      v = mud * 0.75 + sed * 0.3;
    `
  },

  {
    name: "Black Oil",
    cat: "matter",
    desc: "Very slow viscous flow",
    a: "#050607",
    b: "#252a2d",
    motion: -1,
    speed: 0.18,
    soft: 0.2,
    glow: 0.8,
    custom: `
      // Dark slick with an interference sheen and sharp highlights.
      vec2 q = p;
      float h = fbm(q * 2.5 + vec2(t * 0.03, -t * 0.02));
      float sheen = fbm(q * 6.0 + h * 2.0 + t * 0.04);
      float slick = smoothstep(0.45, 0.55, h);
      float highlight = pow(max(0.0, h - 0.7), 2.0) * 4.0;
      v = clamp(slick * 0.4 + sheen * 0.3 + highlight * 0.45, 0.0, 1.0);
    `
  },

  {
    name: "Industrial Coolant",
    cat: "matter",
    desc: "Steady chemical flow",
    a: "#071817",
    b: "#43867f",
    motion: -1,
    speed: 0.28,
    soft: 0.3,
    custom: `
      // Steady horizontal flow with banded edges.
      vec2 q = p;
      q.x += t * 0.4;
      float bands = sin(q.x * 5.0 + fbm(q * 2.0 + t * 0.05) * 4.0) * 0.5 + 0.5;
      float flow  = fbm(q * 3.0 - vec2(t * 0.2, 0.0));
      float edge  = smoothstep(0.4, 0.5, bands) * smoothstep(0.6, 0.5, bands);
      v = (flow * 0.5 + bands * 0.3 + edge * 0.3) * smoothstep(1.4, 0.3, length(p));
    `
  },

  {
    name: "Rust Slurry",
    cat: "matter",
    desc: "Dense sediment flow",
    a: "#21110b",
    b: "#8c4d35",
    motion: -1,
    speed: 0.28,
    soft: 0.3,
    custom: `
      // Warped crystalline grid over rough noise — sediment in suspension.
      vec2 q = p * 2.5;
      q.x += fbm(q * 1.2 + t * 0.03) * 0.5;
      q.y += fbm(q * 1.2 + 3.7 + t * 0.04) * 0.5;
      vec2 g = abs(fract(q) - 0.5);
      float crystal = max(g.x, g.y);
      float rough = fbm(q * 3.0 + t * 0.05);
      v = clamp(crystal * 0.5 + rough * 0.6, 0.0, 1.0);
    `
  },

  {
    name: "Sewage",
    cat: "matter",
    desc: "Murky particulate flow",
    a: "#10160a",
    b: "#55613a",
    motion: -1,
    speed: 0.18,
    soft: 0.5,
    custom: `
      // Slow muddy warp with coarse particulates.
      vec2 q = p * 1.2;
      q.x += fbm(q * 1.5 + t * 0.04) * 0.6;
      q.y += fbm(q * 1.5 + 4.1 + t * 0.03) * 0.6;
      float murky = fbm(q * 2.0 + t * 0.02);
      float chunks = smoothstep(0.72, 0.88, fbm(q * 10.0 + t * 0.15));
      v = murky * 0.7 + chunks * 0.35;
    `
  },

  {
    name: "Sea Glass",
    cat: "matter",
    desc: "Slow cool translucent drift",
    a: "#07191b",
    b: "#4b8e8d",
    motion: -1,
    speed: 0.22,
    soft: 0.35,
    glow: 0.6,
    custom: `
      // Fake refraction — noise offsets the sampling position of a second noise.
      vec2 q = p;
      vec2 refr = vec2(fbm(q * 2.0 + t * 0.05),
                       fbm(q * 2.0 + 3.1 + t * 0.05)) - 0.5;
      float refracted = fbm(q * 1.5 + refr * 0.9 + t * 0.02);
      float edges = smoothstep(0.55, 0.78, fbm(q * 6.0 + refr * 0.3 + t * 0.04));
      v = refracted * 0.6 + edges * 0.45;
    `
  },

  {
    name: "Rainwater",
    cat: "matter",
    desc: "Barely moving clear water",
    a: "#07131a",
    b: "#568493",
    motion: -1,
    speed: 0.2,
    soft: 0.25,
    glow: 0.5,
    custom: `
      // Concentric ripples from the centre — three overlapping frequencies.
      float r = length(p);
      float r1 = sin(r * 20.0 - t * 3.0) * 0.5 + 0.5;
      float r2 = sin(r * 30.0 - t * 4.5) * 0.5 + 0.5;
      float r3 = sin(r * 12.0 - t * 2.0) * 0.5 + 0.5;
      float combined = (r1 + r2 * 0.5 + r3 * 0.7) / 2.2;
      float water = fbm(p * 3.0 + t * 0.1) * 0.3;
      v = (combined * 0.7 + water) * smoothstep(1.5, 0.3, r);
    `
  },

  {
    name: "Clay Wash",
    cat: "matter",
    desc: "Earthy suspended flow",
    a: "#1e120c",
    b: "#795c47",
    motion: -1,
    speed: 0.17,
    soft: 0.4,
    custom: `
      // Swirling clay — polar rotation plus chunky low-frequency noise.
      vec2 q = p * 1.5;
      float r = length(q);
      float a = atan(q.y, q.x);
      q = rot(q, a * 0.4 + r * 1.5 + t * 0.05);
      float clay = fbm(q * 2.0 + t * 0.03);
      float chunk = smoothstep(0.6, 0.75, fbm(q * 8.0 + t * 0.06));
      v = clay * 0.7 + chunk * 0.35;
    `
  },

  // ==================================================================
  //  STRANGE
  // ==================================================================

  {
    name: "Midnight Nebula",
    cat: "strange",
    desc: "Quiet orbital clouds",
    a: "#0b0820",
    b: "#645a9f",
    motion: -1,
    speed: 0.5,
    soft: 0.6,
    glow: 0.7,
    custom: `
      // Multi-layer clouds with twinkling stars baked in.
      vec2 q = p;
      float clouds = 0.0, amp = 0.5;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 qq = q + vec2(t * 0.02 * (1.0 + fi * 0.3),
                           -t * 0.015 * (1.0 - fi * 0.1));
        clouds += fbm(qq * (1.0 + fi * 0.5)) * amp;
        amp *= 0.6;
      }
      vec2 sp = p * 25.0;
      vec2 si = floor(sp);
      float star = step(0.985, hash(si));
      float twinkle = 0.5 + 0.5 * sin(t * 3.0 + hash(si) * 100.0);
      v = clamp(clouds * 0.7 + star * twinkle * 0.5, 0.0, 1.0);
    `
  },

  {
    name: "Eclipse Ink",
    cat: "strange",
    desc: "Soft reactive ring",
    a: "#210d13",
    b: "#a84459",
    motion: -1,
    speed: 0.45,
    soft: 0.3,
    glow: 0.85,
    custom: `
      // Moire of two close-frequency rings — soft reactive ink.
      float r = length(p);
      float ring  = sin(r * 15.0 - t * 2.0) * 0.5 + 0.5;
      float ring2 = sin(r * 17.0 + t * 1.5) * 0.5 + 0.5;
      float moire = ring * ring2;
      float ink   = fbm(p * 3.0 + t * 0.05);
      v = (moire * 0.5 + ink * 0.5) * smoothstep(1.25, 0.1, r);
    `
  },

  {
    name: "Rose Smoke",
    cat: "strange",
    desc: "Floral low-density turbulence",
    a: "#220c17",
    b: "#ad4f78",
    motion: -1,
    speed: 0.4,
    soft: 0.6,
    custom: `
      // Recursive domain warp — soft smoke that curls back on itself.
      vec2 q = p;
      float smoke = 0.0, amp = 0.5;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 qq = q + vec2(t * 0.03 * fi, -t * 0.02 * (1.0 + fi * 0.2));
        qq += vec2(fbm(qq * 0.8 + fi * 3.0),
                   fbm(qq * 0.8 + fi * 3.0 + 2.1)) * 0.6;
        smoke += fbm(qq * (1.5 + fi * 0.4)) * amp;
        amp *= 0.6;
      }
      v = smoke;
    `
  },

  {
    name: "Moon Milk",
    cat: "strange",
    desc: "Pale nocturnal drift",
    a: "#171922",
    b: "#9aa1b2",
    motion: -1,
    speed: 0.18,
    soft: 0.65,
    custom: `
      // Very soft drifting clouds, biased toward mid-bright.
      vec2 q = p;
      q += vec2(fbm(q * 0.7 + t * 0.02),
                fbm(q * 0.7 + 8.8 + t * 0.02)) * 0.9;
      float clouds = fbm(q * 1.3 + t * 0.025);
      v = smoothstep(0.25, 0.75, clouds) * 0.7 + clouds * 0.3;
    `
  },

  {
    name: "Quantum Foam",
    cat: "strange",
    desc: "Subatomic shimmer",
    a: "#0a0a1a",
    b: "#7a8cff",
    motion: -1,
    speed: 0.6,
    glow: 1.1,
    custom: `
      // Grid of bubbles that pop and reform — bright popping rims.
      vec2 q = p * 6.0;
      vec2 i = floor(q), f = fract(q);
      float glow = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          float hh = hash(i + g);
          float life = fract(t * 0.6 + hh * 3.0);
          float radius = 0.1 + 0.25 * sin(life * 3.14159);
          vec2 o = vec2(0.5) + (vec2(hash(i + g + 1.7),
                                     hash(i + g + 3.2)) - 0.5) * 0.4;
          float dd = length(f - g - o);
          float ring = exp(-abs(dd - radius) * 25.0) * (1.0 - life);
          glow = max(glow, ring);
        }
      }
      v = clamp(glow, 0.0, 1.0);
    `
  },

  {
    name: "Nebula Bloom",
    cat: "organic",
    desc: "Expansive cosmic cloud",
    a: "#120a1e",
    b: "#b57aff",
    motion: -1,
    speed: 0.4,
    soft: 0.55,
    glow: 1.0,
    warp: 0.15,
    custom: `
      // Volumetric-style layered clouds with parallax depth + central bloom.
      float acc = 0.0, amp = 0.5;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 qq = p * (1.0 + fi * 0.4)
                + vec2(t * 0.03 / (1.0 + fi * 0.5),
                       -t * 0.02 / (1.0 + fi * 0.5));
        float density = smoothstep(0.4, 0.75, fbm(qq + fi * 3.0));
        acc += density * amp;
        amp *= 0.65;
      }
      float bloom = exp(-length(p) * 1.5) * 0.3;
      v = clamp(acc * 0.8 + bloom * 0.4, 0.0, 1.0);
    `
  },

  {
    name: "Magma Core",
    cat: "matter",
    desc: "Deep planetary heat",
    a: "#1a0602",
    b: "#ff6b2b",
    motion: -1,
    speed: 0.5,
    glow: 1.3,
    warp: 0.25,
    pulse: 1.4,
    custom: `
      // Fake 3D sphere with a hot fbm surface, lit from upper-right with rim.
      float r = length(p);
      float sphere = sqrt(max(0.0, 1.0 - r * r));
      vec3 n = normalize(vec3(p, sphere));
      float heat = fbm(n.xy * 2.0 + n.z + vec2(t * 0.1, -t * 0.08));
      heat = fbm(n.xy * 3.0 + heat * 1.5 + t * 0.05);
      float lit = max(0.0, dot(n, normalize(vec3(0.5, 0.7, 0.6))));
      float rim = pow(1.0 - sphere, 2.0) * 0.55;
      v = clamp(heat * (lit * 0.6 + 0.25) + rim, 0.0, 1.0) * smoothstep(1.1, 0.95, r);
    `
  },

  {
    name: "Frost Crystal",
    cat: "matter",
    desc: "Icy geometric growth",
    a: "#0a1420",
    b: "#a8d8ff",
    motion: -1,
    speed: 0.35,
    soft: 0.1,
    glow: 0.9,
    scale: 1.2,
    custom: `
      // Three overlapping rotated grids → faceted ice, with sparkle highlights.
      vec2 q = rot(p, t * 0.03);
      vec2 g1 = abs(fract(q * 4.0) - 0.5);
      vec2 g2 = abs(fract(rot(q, 1.05) * 5.0) - 0.5);
      vec2 g3 = abs(fract(rot(q, 2.10) * 3.5) - 0.5);
      float facet = min(min(max(g1.x, g1.y),
                            max(g2.x, g2.y)),
                            max(g3.x, g3.y));
      float light = smoothstep(0.5, 0.0, facet);
      float sparkle = pow(max(0.0, fbm(q * 20.0 + t * 0.2) - 0.7), 2.0) * 6.0;
      v = clamp(light * 0.7 + facet * 0.4 + sparkle * 0.4, 0.0, 1.0);
    `
  },

  {
    name: "Void Silk",
    cat: "strange",
    desc: "Dark elegant folds",
    a: "#08080c",
    b: "#6a4c93",
    motion: -1,
    speed: 0.3,
    soft: 0.6,
    glow: 0.7,
    custom: `
      // Domain-warped cloth with directional fake lighting.
      vec2 q = p;
      q += vec2(fbm(q * 1.2 + t * 0.02),
                fbm(q * 1.2 + 4.4 + t * 0.02)) * 0.8;
      float h  = fbm(q * 2.0 + t * 0.025);
      float e  = 0.02;
      float hx = fbm((q + vec2(e, 0.0)) * 2.0 + t * 0.025);
      float hy = fbm((q + vec2(0.0, e)) * 2.0 + t * 0.025);
      vec3 n = normalize(vec3((hx - h) * 4.0, (hy - h) * 4.0, 1.0));
      float lit = max(0.0, dot(n, normalize(vec3(-0.5, 0.6, 0.6))));
      float shadow = max(0.0, dot(n, normalize(vec3(0.5, -0.4, 0.6)))) * 0.2;
      v = clamp(lit * 0.7 + shadow + h * 0.3, 0.0, 1.0);
    `
  },

  {
    name: "Abyssal Glow",
    cat: "organic",
    desc: "Deep sea bioluminescence",
    a: "#021a1a",
    b: "#2ee6c8",
    motion: -1,
    speed: 0.25,
    glow: 1.4,
    pulse: 1.5,
    soft: 0.4,
    custom: `
      // Three drifting bioluminescent worm-creatures — Worley blobs at
      // offset positions, each with its own motion path.
      vec2 q = p * 1.8;
      q.x += fbm(q * 1.5 + t * 0.04) * 0.5;
      q.y += fbm(q * 1.5 + 6.1 + t * 0.03) * 0.5;
      float glow = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 off = vec2(sin(t * 0.2 + fi * 2.3),
                        cos(t * 0.15 + fi * 1.7)) * 0.8;
        vec2 qq = q + off;
        vec2 i2 = floor(qq), f2 = fract(qq);
        float md = 8.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y));
            vec2 o = vec2(hash(i2 + g + fi * 3.3),
                          hash(i2 + g + fi * 5.5));
            md = min(md, length(f2 - g - o));
          }
        }
        glow += smoothstep(0.35, 0.05, md) * (1.0 - fi * 0.3);
      }
      v = clamp(glow, 0.0, 1.0);
    `
  },

  {
    name: "Chromatic Oil",
    cat: "matter",
    desc: "Iridescent thin film",
    a: "#101018",
    b: "#c77dff",
    motion: -1,
    speed: 0.4,
    soft: 0.2,
    glow: 0.85,
    scale: 0.9,
    custom: `
      // Thin-film interference — two coupled fbm layers drive a fast
      // sine phase that produces a rainbow-like band structure.
      vec2 q = p;
      float film  = fbm(q * 2.0 + vec2(t * 0.03, -t * 0.02));
      float film2 = fbm(q * 3.5 + film * 1.5 + t * 0.04);
      float phase = film * 8.0 + film2 * 4.0 + t * 0.1;
      float bands = abs(sin(phase)) * 0.5 + 0.5;
      float slick = smoothstep(0.35, 0.65, film);
      v = clamp(bands * 0.55 + slick * 0.5, 0.0, 1.0);
    `
  }

];
