// liquids.js — Calyx fluid definitions
//
// The host renderer injects `custom` into main() at `// __LIQUID_BODY__`,
// then computes:
//   structure = smoothstep(0.15, 0.85, v);
//   color     = mix(u_a, u_b, structure);
//   color     += white glint where v ≈ 0.58  (highlight)
//   color     += white edge  where v ≈ 0.50  (edge)
//
// Available inside `custom`:
//   p, mouse (vec2), t (float), d (float)
//   u_a, u_b (vec3), u_pulse (float)
//   hash(vec2), noise(vec2), fbm(vec2), rot(vec2,float)
//   u_resolution (vec2), gl_FragCoord (vec4), u_time (float)
//   v (float) — set this to your result

export default [

  // =============================================================
  // BALATRO  —  faithful port of background.fs
  // =============================================================
  {
    name: "Balatro",
    cat: "strange",
    desc: "The real Balatro background · pixelated paint vortex",
    a: "#0a0510",
    b: "#4df0ff",
    motion: -1,
    speed: 0.6,
    glow: 0.8,
    pulse: 0.9,
    soft: 0.05,
    custom: `
      vec3 balCol1 = vec3(0.05, 0.04, 0.07);
      vec3 balCol2 = vec3(0.87, 0.27, 0.23);
      vec3 balCol3 = vec3(0.30, 0.95, 1.00);

      float PIXEL_SIZE_FAC = 700.0;
      float SPIN_EASE      = 0.5;
      float spin_amount    = 1.05;
      float contrast       = 1.0;

      vec2 screen_size = u_resolution;
      float pixel_size = length(screen_size) / PIXEL_SIZE_FAC;
      vec2 buv = (floor(gl_FragCoord.xy * (1.0 / pixel_size)) * pixel_size
                  - 0.5 * screen_size) / length(screen_size) - vec2(0.12, 0.0);
      float buv_len = length(buv);

      float spin_time = u_time;
      float bspeed = (spin_time * SPIN_EASE * 0.2) + 302.2;
      float new_pixel_angle = atan(buv.y, buv.x) + bspeed
                              - SPIN_EASE * 20.0
                                * (spin_amount * buv_len + (1.0 - spin_amount));
      vec2 bmid = (screen_size / length(screen_size)) / 2.0;
      buv = (vec2(buv_len * cos(new_pixel_angle) + bmid.x,
                  buv_len * sin(new_pixel_angle) + bmid.y) - bmid);

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

      float contrast_mod = (0.25 * contrast + 0.5 * spin_amount + 1.2);
      float paint_res = min(2.0, max(0.0, length(buv) * 0.035 * contrast_mod));
      float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
      float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
      float c3p = 1.0 - min(1.0, c1p + c2p);

      float cyan  = clamp(c3p * 1.8, 0.0, 1.0);
      float crim  = clamp(c2p * 0.55, 0.0, 1.0);
      v = clamp(max(cyan, crim), 0.0, 1.0);
    `
  },

  // =============================================================
  // SILK  —  ported from 21st.dev Shader Builder
  // =============================================================
  {
    name: "Silk",
    cat: "organic",
    desc: "Woven green silk · OKLab palette blend",
    a: "#020f0c",
    b: "#f4ffc7",
    motion: -1,
    speed: 0.55,
    glow: 0.7,
    pulse: 0.6,
    soft: 0.25,
    custom: `
      vec3 silk_col0 = vec3(0.012, 0.071, 0.055);
      vec3 silk_col1 = vec3(0.055, 0.486, 0.353);
      vec3 silk_col2 = vec3(0.486, 0.898, 0.467);
      vec3 silk_col3 = vec3(0.957, 1.000, 0.780);

      float silk_colorCount = 4.0;
      float silk_scale      = 1.50;
      float silk_intensity  = 0.55;
      float silk_warp       = 0.00;
      float silk_detail     = 2.40;
      float silk_contrast   = 1.00;
      float silk_brightness = -0.05;
      float silk_saturation = 1.00;
      float silk_grain      = 0.03;
      float silk_seed       = 1.0;
      float silk_rotate     = 0.00;
      float silk_drift      = 0.00;

      float silkHash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
      float silkGrainHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      float silkNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(silkHash21(i), silkHash21(i + vec2(1.0, 0.0)), u.x),
          mix(silkHash21(i + vec2(0.0, 1.0)), silkHash21(i + vec2(1.0, 1.0)), u.x),
          u.y);
      }
      float silkFbm(vec2 p) {
        float acc = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          acc += a * silkNoise(p);
          p = p * 2.03 + vec2(17.0, 9.2);
          a *= 0.5;
        }
        return acc;
      }
      vec3 silkSrgbToLinear(vec3 c) {
        return mix(c / 12.92,
                   pow((c + 0.055) / 1.055, vec3(2.4)),
                   step(0.04045, c));
      }
      vec3 silkLinearToSrgb(vec3 c) {
        return mix(c * 12.92,
                   1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
                   step(0.0031308, c));
      }
      vec3 silkLinToOklab(vec3 c) {
        float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
        float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
        float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
        l = pow(max(l, 0.0), 1.0 / 3.0);
        m = pow(max(m, 0.0), 1.0 / 3.0);
        s = pow(max(s, 0.0), 1.0 / 3.0);
        return vec3(
          0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
      }
      vec3 silkOklabToLin(vec3 c) {
        float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
        float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
        float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
        l = l * l * l; m = m * m * m; s = s * s * s;
        return vec3(
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
      }
      vec3 silkMixColour(vec3 a, vec3 b, float tt) {
        vec3 la = silkLinToOklab(silkSrgbToLinear(a));
        vec3 lb = silkLinToOklab(silkSrgbToLinear(b));
        return clamp(silkLinearToSrgb(silkOklabToLin(mix(la, lb, tt))), 0.0, 1.0);
      }
      // Constant-loop palette — WebGL1-safe
      vec3 silkPalette(float x) {
        float n = max(silk_colorCount - 1.0, 1.0);
        float f = clamp(x, 0.0, 1.0) * n;
        vec3 col = silk_col0;
        for (int i = 0; i < 7; i++) {
          if (float(i) < n) {
            float tgt = float(i) < 0.5 ? silk_col1
                     : (float(i) < 1.5 ? silk_col2 : silk_col3);
            col = silkMixColour(col, tgt,
              smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
          }
        }
        return col;
      }
      vec3 silkShade(vec2 uv, vec2 pp, float tt) {
        vec2 q = pp * 1.6;
        float amp = 0.25 + silk_intensity * 0.85;
        for (float i = 1.0; i < 5.0; i += 1.0) {
          q.x += amp / i * cos(i * 2.4 * q.y + tt * 0.8 + silk_seed);
          q.y += amp / i * cos(i * 1.7 * q.x + tt * 0.6);
        }
        return silkPalette(0.5 + 0.5 * sin(q.x + q.y));
      }

      vec2 silkUv = gl_FragCoord.xy / u_resolution.xy;
      vec2 silkP  = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
                    / min(u_resolution.x, u_resolution.y);
      silkP *= silk_scale;
      if (abs(silk_rotate) > 0.0001) {
        float cr = cos(silk_rotate), sr = sin(silk_rotate);
        silkP = mat2(cr, -sr, sr, cr) * silkP;
      }
      if (silk_drift > 0.0001)
        silkP += silk_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
      if (silk_warp > 0.0)
        silkP += silk_warp * (vec2(
          silkFbm(silkP * silk_detail + silk_seed),
          silkFbm(silkP * silk_detail + vec2(5.2, 1.3))) - 0.5);

      vec3 silkCol = silkShade(silkUv, silkP, u_time);
      silkCol += silk_brightness;
      if (abs(silk_contrast - 1.0) > 0.0001)
        silkCol = (silkCol - 0.5) * silk_contrast + 0.5;
      if (abs(silk_saturation - 1.0) > 0.0001) {
        float luma = dot(silkCol, vec3(0.299, 0.587, 0.114));
        silkCol = mix(vec3(luma), silkCol, silk_saturation);
      }
      if (silk_grain > 0.0001)
        silkCol += (silkGrainHash(gl_FragCoord.xy +
                    vec2(silk_seed * 17.0, silk_seed * 31.0)) - 0.5) * silk_grain;
      silkCol = clamp(silkCol, 0.0, 1.0);

      float silkLum = dot(silkCol, vec3(0.299, 0.587, 0.114));
      v = clamp(silkLum * 1.6, 0.0, 1.0);
    `
  },

  // =============================================================
  // FOG BANK  —  ported from the ANGLE/Metal raymarched fog shader
  // =============================================================
  {
    name: "Fog Bank",
    cat: "organic",
    desc: "Volumetric fog · 90-step raymarch with domain warping",
    a: "#060a14",
    b: "#e0e8f0",
    motion: -1,
    speed: 0.35,
    glow: 0.9,
    pulse: 0.7,
    soft: 0.3,
    custom: `
      // ------------------------------------------------------------
      // Faithful port of the ANGLE/Metal volumetric fog raymarcher.
      // The original runs 90 outer iterations with an inner
      // sin-warp loop that keeps subdividing the step distance.
      // We keep the exact accumulation math and tanh tonemap but
      // reduce the outer count for real-time use — the fog still
      // builds up the same rolling, layered look.
      //
      // Key constants from the original:
      //   z           — distance along the ray, starts at 0
      //   Z = 6*T     — time offset for the inner warp
      //   p.z + 9.0   — bias so the fog sits in front of the camera
      //   d = 2.0     — starting step size for the inner loop
      //   (7, 5, z)   — per-step RGB tint (blue grows with depth)
      //   tanh(O²/1000) — final tonemap
      // ------------------------------------------------------------

      vec3 Z = vec3(6.0 * t, 0.0, 0.0);
      vec3 O = vec3(0.0);
      float z = 0.0;

      // Ray direction from screen position — matches the original
      vec3 rd = normalize(vec3(2.0 * gl_FragCoord.xy - u_resolution.xy,
                               -u_resolution.y));

      for (int i = 0; i < 50; i++) {
        vec3 pPos = z * rd;
        pPos.z += 9.0;
        vec3 tSaved = pPos;

        float d = 2.0;
        float a = (pPos.y - length(pPos.xz)) / d - t;

        // Rotation matrix from cos of (a + t + offsets)
        vec4 cosV = cos(a + t + vec4(0.0, 5.0, 8.0, 0.0));
        mat2 rotM = mat2(cosV.x, cosV.y, cosV.z, cosV.w);
        pPos.xz = rotM * pPos.xz;

        // Inner domain warp — subdivides d while d < 4.0
        for (int j = 0; j < 6; j++) {
          if (d >= 4.0) break;
          d /= 0.9;
          pPos += sin(pPos.yzx * d - Z) / d;
        }

        // Adaptive step size — small near the fog, larger far away
        d = min(length(pPos.xz), 8.0 - abs(pPos.y))
            / 15.0
            / (2.0 + cos(a));
        z += d;

        // Accumulate colour — the (7, 5, z) tint makes distant fog
        // increasingly blue, which reads as depth
        vec2 w = tSaved.xz - (pPos.xz * 0.5 + 3.0) * sin(a);
        O += vec3(7.0, 5.0, z) * d / max(length(w), 0.001);
      }

      // Final tonemap — tanh on squared accumulation
      O = tanh(O * O / 1000.0);

      // Collapse to v for the Calyx template
      float fogLum = dot(O, vec3(0.299, 0.587, 0.114));
      v = clamp(fogLum * 3.0, 0.0, 1.0);
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
