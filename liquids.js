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
//   u_resolution (vec2), gl_FragCoord (vec4), u_time (float)
//   v (float) — set this to your result

export default [

  // =============================================================
  // BALATRO  —  faithful port of the real background.fs
  // =============================================================
  {
    name: "Balatro",
    cat: "strange",
    desc: "The real Balatro background · pixelated paint vortex",
    a: "#0d0a12",
    b: "#de443b",
    motion: -1,
    speed: 0.6,
    glow: 0.7,
    pulse: 0.9,
    soft: 0.05,
    custom: `
      // ------------------------------------------------------------
      // Faithful port of Balatro's resources/shaders/background.fs
      // by LocalThunk. The original runs in LÖVE with love_ScreenSize,
      // love_Timer, spin_time, colour_1..3, contrast, spin_amount.
      // Here we map those to Calyx's u_resolution, u_time, and set the
      // Balatro palette internally.
      // ------------------------------------------------------------

      // --- Balatro palette (near-black + crimson + cyan) ---
      vec3 balCol1 = vec3(0.05, 0.04, 0.07);   // near-black velvet
      vec3 balCol2 = vec3(0.87, 0.27, 0.23);   // crimson / red
      vec3 balCol3 = vec3(0.30, 0.95, 1.00);   // pale cyan accent

      float PIXEL_SIZE_FAC = 700.0;
      float SPIN_EASE      = 0.5;
      float spin_amount    = 1.05;
      float contrast       = 1.0;

      // --- Pixelated screen UV (exactly as the original) ---
      vec2 screen_size = u_resolution;
      float pixel_size = length(screen_size) / PIXEL_SIZE_FAC;
      vec2 buv = (floor(gl_FragCoord.xy * (1.0 / pixel_size)) * pixel_size
                  - 0.5 * screen_size) / length(screen_size) - vec2(0.12, 0.0);
      float buv_len = length(buv);

      // --- Central swirl (the vortex) ---
      float spin_time = u_time;
      float bspeed = (spin_time * SPIN_EASE * 0.2) + 302.2;
      float new_pixel_angle = atan(buv.y, buv.x) + bspeed
                              - SPIN_EASE * 20.0
                                * (spin_amount * buv_len + (1.0 - spin_amount));
      vec2 bmid = (screen_size / length(screen_size)) / 2.0;
      buv = (vec2(buv_len * cos(new_pixel_angle) + bmid.x,
                  buv_len * sin(new_pixel_angle) + bmid.y) - bmid);

      // --- Paint effect: 5 octaves of sine/cosine warping ---
      buv *= 30.0;
      float paint_speed = u_time * 2.0;
      vec2 buv2 = vec2(buv.x + buv.y);
      for (int i = 0; i < 5; i++) {
        buv2 += sin(max(buv.x, buv.y)) + buv;
        buv += 0.5 * vec2(
          cos(5.1123314 + 0.353 * buv2.y + paint_speed * 0.131121),
          sin(buv2.x - 0.113 * paint_speed)
        );
        buv -= cos(buv.x + buv.y) - sin(buv.x * 0.711 - buv.y);
      }

      // --- Colour blending (original formula) ---
      float contrast_mod = (0.25 * contrast + 0.5 * spin_amount + 1.2);
      float paint_res = min(2.0, max(0.0, length(buv) * 0.035 * contrast_mod));
      float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
      float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
      float c3p = 1.0 - min(1.0, c1p + c2p);

      vec3 balatro_col =
          (0.3 / contrast) * balCol1
        + (1.0 - 0.3 / contrast)
          * (balCol1 * c1p + balCol2 * c2p + balCol3 * c3p);

      // --- Map the Balatro colour to Calyx's scalar v ---
      // Weight toward the bright accents so the swirls pop against
      // the near-black background.
      float lum = dot(balatro_col, vec3(0.299, 0.587, 0.114));
      v = clamp(lum * 2.4, 0.0, 1.0);
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
