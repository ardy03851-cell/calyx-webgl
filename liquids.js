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

  // ============================================================
  // MOLTEN CORE — raymarched SDF metaball with PBR lighting
  // ============================================================
  {
    name: "Molten Core",
    cat: "matter",
    desc: "Raymarched metaball · PBR lighting + emissive cracks",
    a: "#160300",
    b: "#ffd090",
    motion: -1,
    speed: 0.5,
    glow: 1.5,
    soft: 0.1,
    custom: `
      // ---- SDF primitives ----
      float sdSph(vec3 q, float r) { return length(q) - r; }
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
        return mix(b, a, h) - k*h*(1.0-h);
      }
      // ---- Animated metaball field ----
      float map(vec3 q) {
        float d = sdSph(q, 0.38);
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          vec3 c = vec3(sin(t*0.6 + fi*1.7),
                        cos(t*0.4 + fi*2.3),
                        sin(t*0.8 + fi*1.3)) * 0.32;
          d = smin(d, sdSph(q - c, 0.20), 0.24);
        }
        d += (fbm(q.xy * 3.0 + t * 0.5) - 0.5) * 0.06;
        return d;
      }
      vec3 calcN(vec3 q) {
        vec2 e = vec2(0.0015, 0.0);
        return normalize(vec3(
          map(q+e.xyy) - map(q-e.xyy),
          map(q+e.yxy) - map(q-e.yxy),
          map(q+e.yyx) - map(q-e.yyx)));
      }
      // ---- Ray setup ----
      vec3 ro = vec3(0.0, 0.0, -1.7);
      vec3 rd = normalize(vec3(p * 0.9, 1.5));
      float tt = 0.0;
      float hitD = -1.0;
      vec3 hp = vec3(0.0);
      for (int i = 0; i < 56; i++) {
        vec3 pos = ro + rd * tt;
        float dd = map(pos);
        if (dd < 0.002) { hitD = tt; hp = pos; break; }
        if (tt > 5.0) break;
        tt += dd * 0.85;
      }
      float v = 0.0;
      if (hitD > 0.0) {
        vec3 n = calcN(hp);
        vec3 L = normalize(vec3(0.6, 0.7, -0.4));
        float diff = max(0.0, dot(n, L));
        vec3 hv = normalize(L - rd);
        float spec = pow(max(0.0, dot(n, hv)), 56.0);
        float fres = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
        // Emissive cracks — ridged noise glow
        float crack = smoothstep(0.42, 0.62, fbm(hp.xy * 7.0 + t * 0.5));
        // Depth attenuation so far parts fade
        float depthFade = exp(-hitD * 0.15);
        v = clamp((diff * 0.35 + spec * 0.7 + fres * 0.35) * depthFade
                  + crack * 0.9, 0.0, 1.0);
      }
    `
  },

  // ============================================================
  // CRYSTAL PRISM — raymarched octahedron with refraction
  // ============================================================
  {
    name: "Crystal Prism",
    cat: "matter",
    desc: "Raymarched crystal · refraction + dispersion iridescence",
    a: "#05060e",
    b: "#c0e8ff",
    motion: -1,
    speed: 0.4,
    glow: 1.4,
    soft: 0.05,
    custom: `
      float sdOct(vec3 q, float s) {
        q = abs(q);
        return (q.x + q.y + q.z - s) * 0.577350269;
      }
      float map(vec3 q) {
        // Slow rotation
        float ca = cos(t*0.3), sa = sin(t*0.3);
        q.xz = mat2(ca, -sa, sa, ca) * q.xz;
        // Two overlapping octahedra
        float d = sdOct(q, 0.52);
        float d2 = sdOct(q * 1.4 + vec3(0.1, 0.2, 0.0), 0.52) * 0.7;
        d = min(d, d2);
        // Facet cut
        float facet = abs(q.x + q.y) * 0.4 + abs(q.z - q.x) * 0.3;
        d = max(d, -facet + 0.16);
        return d;
      }
      vec3 calcN(vec3 q) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
          map(q+e.xyy)-map(q-e.xyy),
          map(q+e.yxy)-map(q-e.yxy),
          map(q+e.yyx)-map(q-e.yyx)));
      }
      vec3 ro = vec3(0.0, 0.0, -1.65);
      vec3 rd = normalize(vec3(p * 0.85, 1.5));
      float tt = 0.0;
      float hitD = -1.0;
      vec3 hp = vec3(0.0);
      for (int i = 0; i < 48; i++) {
        vec3 pos = ro + rd * tt;
        float dd = map(pos);
        if (dd < 0.002) { hitD = tt; hp = pos; break; }
        if (tt > 5.0) break;
        tt += dd * 0.85;
      }
      float v = 0.0;
      if (hitD > 0.0) {
        vec3 n = calcN(hp);
        vec3 L1 = normalize(vec3(0.5, 0.8, -0.5));
        float diff = max(0.0, dot(n, L1));
        vec3 hv = normalize(L1 - rd);
        float spec = pow(max(0.0, dot(n, hv)), 120.0);
        float fres = pow(1.0 - max(0.0, dot(n, -rd)), 5.0);
        // Refraction into RGB-split directions (fake dispersion)
        vec3 refrR = refract(rd, n, 0.62);
        vec3 refrG = refract(rd, n, 0.66);
        vec3 refrB = refract(rd, n, 0.70);
        float iridR = 0.5 + 0.5*sin(dot(refrR, vec3(18.0, 12.0, 24.0)) + t*2.0);
        float iridG = 0.5 + 0.5*sin(dot(refrG, vec3(18.0, 12.0, 24.0)) + t*2.0 + 2.09);
        float iridB = 0.5 + 0.5*sin(dot(refrB, vec3(18.0, 12.0, 24.0)) + t*2.0 + 4.18);
        float irid = (iridR + iridG + iridB) / 3.0;
        v = clamp(diff * 0.22 + spec * 1.2 + fres * 0.85 + irid * 0.45, 0.0, 1.0);
      }
    `
  },

  // ============================================================
  // DEEP OCEAN — volumetric underwater with caustics + light shafts
  // ============================================================
  {
    name: "Deep Ocean",
    cat: "organic",
    desc: "Volumetric underwater · caustics + god rays",
    a: "#010a15",
    b: "#5ad0e8",
    motion: -1,
    speed: 0.35,
    glow: 1.3,
    soft: 0.45,
    custom: `
      vec3 rayDir = normalize(vec3(p * 1.1, 1.4));
      vec3 acc = vec3(0.0);
      float trans = 1.0;
      vec3 sunDir = normalize(vec3(0.25, 1.0, 0.3));

      for (int i = 0; i < 40; i++) {
        float z = float(i) * 0.08;
        vec3 pos = rayDir * z;

        // Caustics: project the ray up onto the water surface, then fbm
        float surfY = 1.2;
        float sx = pos.x + rayDir.x * (surfY - pos.y) / max(rayDir.y, 0.05);
        float sz = pos.z + rayDir.z * (surfY - pos.y) / max(rayDir.y, 0.05);
        float caustic = fbm(vec2(sx, sz) * 4.0 + t * 0.6);
        caustic = pow(caustic, 2.0);

        // Density: fbm modulated, falls off with depth
        float dens = 0.4 + 0.6 * fbm(pos.xy * 1.5 + pos.z + t * 0.2);
        dens *= exp(-pos.y * 0.5);

        float w = dens * 0.05;

        // God ray: alignment of the ray with the sun
        float lit = max(0.0, dot(rayDir, sunDir));
        float shaft = pow(lit, 4.0);

        acc += (caustic * 0.6 + shaft * 0.8) * trans * w;
        trans *= exp(-w * 1.2);
      }
      float v = clamp(dot(acc, vec3(0.4, 0.9, 1.2)) * 1.5, 0.0, 1.0);
    `
  },

  // ============================================================
  // THUNDER HEAD — volumetric storm cloud + lightning flashes
  // ============================================================
  {
    name: "Thunder Head",
    cat: "energy",
    desc: "Volumetric storm cloud · sun scatter + lightning",
    a: "#05070f",
    b: "#b8c8e8",
    motion: -1,
    speed: 0.3,
    glow: 1.6,
    soft: 0.5,
    custom: `
      vec3 rayDir = normalize(vec3(p * 1.0, 0.8));
      vec3 sunDir = normalize(vec3(0.6, 0.4, 0.4));
      vec3 acc = vec3(0.0);
      float trans = 1.0;

      // Lightning: discrete flashes
      float flashPhase = floor(t * 3.0);
      float flashAmt = pow(fract(t * 3.0), 6.0)
                     * step(0.72, hash(vec2(flashPhase, 3.7)));
      vec3 flashPos = vec3(sin(flashPhase * 1.7), 0.4, cos(flashPhase * 1.3)) * 0.6;

      for (int i = 0; i < 40; i++) {
        float z = float(i) * 0.10 + 0.5;
        vec3 pos = rayDir * z;

        // Cloud density: layered fbm
        float dens = fbm(pos.xy * 1.8 + vec2(t * 0.15, -t * 0.1));
        dens *= fbm(pos.xy * 3.5 + vec2(pos.z * 0.6, 0.0) + t * 0.2);
        dens = smoothstep(0.3, 0.7, dens);
        dens *= smoothstep(2.0, 0.3, z);

        float w = dens * 0.12;

        // Sun-occlusion: march toward the sun
        float lightDepth = 0.0;
        for (int j = 0; j < 4; j++) {
          float lz = float(j) * 0.4;
          vec3 lp = pos + sunDir * lz;
          lightDepth += fbm(lp.xy * 1.8 + t * 0.15) * 0.25;
        }
        float sunLit = exp(-lightDepth * 2.5);

        // Lightning burst
        float flashDist = length(pos - flashPos);
        float flash = flashAmt * exp(-flashDist * 2.0) * 3.0;

        // Silver lining on rim
        float rim = pow(1.0 - smoothstep(0.3, 0.9, dens), 2.0);

        acc += (vec3(0.4, 0.5, 0.7) * sunLit * 0.6
               + vec3(0.7, 0.8, 1.0) * rim * 0.9
               + vec3(1.0, 0.9, 1.0) * flash) * trans * w;
        trans *= exp(-w * 1.5);
      }
      float v = clamp(dot(acc, vec3(0.5, 0.9, 1.0)) * 1.6, 0.0, 1.0);
    `
  },

  // ============================================================
  // LIQUID CHROME — raymarched reflective surface, fake env map
  // ============================================================
  {
    name: "Liquid Chrome",
    cat: "matter",
    desc: "Raymarched mirror surface · procedural environment",
    a: "#080a10",
    b: "#ffffff",
    motion: -1,
    speed: 0.4,
    glow: 1.2,
    soft: 0.05,
    custom: `
      float height(vec2 q) {
        return fbm(q * 1.2 + t * 0.15) * 0.5
             + fbm(q * 2.8 + vec2(5.0, 3.0)) * 0.25;
      }
      // Fake environment: sky gradient + horizon sun
      vec3 env(vec3 dir) {
        float sky = dir.y * 0.5 + 0.5;
        vec3 topCol = vec3(0.65, 0.78, 1.0);
        vec3 botCol = vec3(0.04, 0.06, 0.10);
        vec3 skyCol = mix(botCol, topCol, sky);
        vec3 sunDir = normalize(vec3(0.3, 0.7, -0.5));
        float sunDot = max(0.0, dot(dir, sunDir));
        skyCol += vec3(1.0, 0.9, 0.7) * pow(sunDot, 200.0) * 3.0;
        skyCol += vec3(1.0) * pow(1.0 - abs(dir.y), 8.0) * 0.3;
        return skyCol;
      }
      vec3 ro = vec3(0.0, 0.6, -1.5);
      vec3 rd = normalize(vec3(p * 1.1, 1.0));
      float tt = 0.0;
      float hit = -1.0;
      vec3 hp = vec3(0.0);
      for (int i = 0; i < 32; i++) {
        vec3 pos = ro + rd * tt;
        float dd = (pos.y - height(pos.xz)) * 0.5;
        if (dd < 0.005) { hit = tt; hp = pos; break; }
        if (tt > 6.0 || pos.y < -1.0) break;
        tt += max(dd, 0.01);
      }
      float v = 0.0;
      if (hit > 0.0) {
        // Normal via finite differences of the height field
        float e = 0.01;
        float h = height(hp.xz);
        float hx = height(hp.xz + vec2(e, 0.0));
        float hz = height(hp.xz + vec2(0.0, e));
        vec3 n = normalize(vec3(h - hx, e, h - hz));
        vec3 refr = reflect(rd, n);
        vec3 envCol = env(refr);
        float fres = pow(1.0 - max(0.0, dot(n, -rd)), 5.0);
        float depthFade = exp(-tt * 0.15);
        float envLum = dot(envCol, vec3(0.299, 0.587, 0.114));
        v = clamp(envLum * depthFade + fres * 0.4, 0.0, 1.0);
      }
    `
  },

  // ============================================================
  // WET ASPHALT — 2.5D parallax city reflected in a wet street
  // ============================================================
  {
    name: "Wet Asphalt",
    cat: "matter",
    desc: "2.5D parallax skyline · wet mirror reflection",
    a: "#05070c",
    b: "#c8e0ff",
    motion: -1,
    speed: 0.35,
    glow: 1.2,
    soft: 0.25,
    custom: `
      float horizon = -0.05;
      float v = 0.0;

      // ---- Skyline sampler: 3 parallax layers of buildings ----
      float skyline(vec2 coord, float timeShift) {
        float buildings = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float scale = 4.0 + fi * 6.0;
          float parallax = timeShift * (0.02 + fi * 0.03);
          float col = floor((coord.x + parallax) * scale);
          float h = hash(vec2(col, fi)) * 0.4;
          float topY = 0.05 + h;
          float row = step(coord.y, topY);
          // Window lights
          vec2 wuv = vec2((coord.x + parallax) * scale, coord.y * 10.0);
          vec2 wid = floor(wuv);
          float lit = step(0.7, hash(wid + fi * 3.7))
                    * (0.5 + 0.5 * sin(timeShift * 2.0 + hash(wid) * 20.0));
          buildings += row * (0.15 + lit * 0.4) * (1.0 - fi * 0.25);
        }
        return buildings;
      }

      if (p.y > horizon) {
        // ---- Above the horizon: sky ----
        vec2 skyCoord = vec2(p.x, p.y - horizon);
        v = skyline(skyCoord, t);
      } else {
        // ---- Below: wet street with mirror reflection ----
        float yb = horizon - p.y;              // distance below horizon
        float depth = 1.0 / (yb + 0.05);       // pseudo-perspective

        // Asphalt grain
        float grain = fbm(vec2(p.x * depth * 3.0, depth * 2.0) + t * 0.1);
        grain = smoothstep(0.4, 0.7, grain) * 0.25;

        // Mirror: sample the skyline using the mirrored y
        float refY = horizon + (horizon - p.y) * 0.75;
        vec2 refCoord = vec2(p.x * depth * 0.9, 0.3 - (refY - horizon) * 2.0);
        float refl = skyline(refCoord, t);

        // Wet ripple distortion on the reflection
        float ripple = fbm(refCoord * 2.0 + t * 0.8) * 0.15;
        refl *= 0.7 + ripple;

        // Puddle mask so it's not uniformly wet
        float puddle = smoothstep(0.3, 0.7, fbm(p * 3.0 + t * 0.2));

        v = clamp(grain * 0.5 + refl * puddle * 1.3, 0.0, 1.0);
      }
    `
  },

  // ============================================================
  // FROZEN HEART — ice with subsurface scattering and cracks
  // ============================================================
  {
    name: "Frozen Heart",
    cat: "matter",
    desc: "Ice with subsurface glow · ridged fracture network",
    a: "#040b16",
    b: "#c0e8ff",
    motion: -1,
    speed: 0.25,
    glow: 1.4,
    soft: 0.2,
    custom: `
      // Ridged fbm → crack network
      float crack = 0.0;
      float freq = 1.0;
      float amp = 1.0;
      for (int i = 0; i < 4; i++) {
        float n = fbm(p * freq + t * 0.05);
        crack += (1.0 - abs(n - 0.5) * 2.0) * amp;
        freq *= 2.0;
        amp *= 0.55;
      }
      crack = pow(crack, 3.0);

      // Subsurface: soft inner core bleeding through
      float core = exp(-length(p) * 2.5);
      float corePulse = 0.7 + 0.3 * sin(t * 1.2);

      // Frost sparkle on the surface
      float frost = fbm(p * 12.0 + t * 0.05);
      frost = smoothstep(0.4, 0.7, frost) * 0.3;

      // Refraction: sample the noise at an offset position
      vec2 refrOffset = vec2(fbm(p * 2.0 + t * 0.1) - 0.5,
                             fbm(p * 2.0 + 3.7 + t * 0.1) - 0.5) * 0.4;
      float inner = fbm((p + refrOffset) * 1.5 + t * 0.05);
      inner = pow(inner, 1.5);

      v = clamp(crack * 0.75 + core * corePulse * 0.85 + frost + inner * 0.3,
                0.0, 1.0);
    `
  },

  // ============================================================
  // COSMIC VOID — layered parallax starfield, DOF, nebula bloom
  // ============================================================
  {
    name: "Cosmic Void",
    cat: "strange",
    desc: "5-layer parallax starfield · DOF + nebula bloom",
    a: "#010109",
    b: "#b090ff",
    motion: -1,
    speed: 0.3,
    glow: 1.6,
    soft: 0.5,
    custom: `
      // ---- Parallax star layers with per-layer DOF ----
      float stars = 0.0;
      float totalWeight = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float scale = 8.0 + fi * 8.0;
        float drift = t * (0.02 + fi * 0.015);
        vec2 sq = (p + vec2(drift, 0.0)) * scale;
        vec2 si = floor(sq);
        vec2 sf = fract(sq) - 0.5;
        float star = step(0.94, hash(si));
        float tw = 0.5 + 0.5 * sin(t * (1.5 + fi) + hash(si + 1.3) * 20.0);
        float dot_ = exp(-dot(sf, sf) * 60.0);
        float size = 1.0 - fi * 0.1;
        // Deeper layers get fuzzier (fake DOF)
        float blurred = mix(dot_, fbm(sq * 0.3 + t * 0.05) * 0.4, fi / 5.0);
        float contrib = star * tw * blurred * size;
        stars += contrib;
        totalWeight += size;
      }
      stars /= max(totalWeight, 1.0);

      // ---- Layered nebula ----
      vec2 nq = p * 1.2;
      float n1 = fbm(nq + vec2(t * 0.03, -t * 0.02));
      float n2 = fbm(nq * 2.3 + vec2(3.0) + t * 0.04);
      float n3 = fbm(nq * 4.7 - vec2(1.0) + t * 0.05);
      float nebula = n1 * 0.6 + n2 * 0.3 + n3 * 0.2;
      nebula = pow(nebula, 2.5);
      float nebulaIntensity = nebula * (0.5 + 0.5 * n3);

      // ---- Central bloom ----
      float bloom = exp(-length(p) * 0.8) * 0.4;
      bloom *= (0.7 + 0.3 * sin(t * 0.5));

      v = clamp(stars * 1.4 + nebulaIntensity * 0.6 + bloom, 0.0, 1.0);
    `
  },

  // ============================================================
  // BALATRO — faithful port of background.fs
  // ============================================================
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

  // ============================================================
  // SILK — ported from 21st.dev Shader Builder
  // ============================================================
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

  // ============================================================
  // FOG BANK — ported from the ANGLE/Metal volumetric fog raymarcher
  // ============================================================
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
      vec3 Z = vec3(6.0 * t, 0.0, 0.0);
      vec3 O = vec3(0.0);
      float z = 0.0;

      vec3 rd = normalize(vec3(2.0 * gl_FragCoord.xy - u_resolution.xy,
                               -u_resolution.y));

      for (int i = 0; i < 50; i++) {
        vec3 pPos = z * rd;
        pPos.z += 9.0;
        vec3 tSaved = pPos;

        float d = 2.0;
        float a = (pPos.y - length(pPos.xz)) / d - t;

        vec4 cosV = cos(a + t + vec4(0.0, 5.0, 8.0, 0.0));
        mat2 rotM = mat2(cosV.x, cosV.y, cosV.z, cosV.w);
        pPos.xz = rotM * pPos.xz;

        for (int j = 0; j < 6; j++) {
          if (d >= 4.0) break;
          d /= 0.9;
          pPos += sin(pPos.yzx * d - Z) / d;
        }

        d = min(length(pPos.xz), 8.0 - abs(pPos.y))
            / 15.0
            / (2.0 + cos(a));
        z += d;

        vec2 w = tSaved.xz - (pPos.xz * 0.5 + 3.0) * sin(a);
        O += vec3(7.0, 5.0, z) * d / max(length(w), 0.001);
      }

      O = tanh(O * O / 1000.0);
      float fogLum = dot(O, vec3(0.299, 0.587, 0.114));
      v = clamp(fogLum * 3.0, 0.0, 1.0);
    `
  },

  // ============================================================
  // ORGANIC
  // ============================================================
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

  // ============================================================
  // ENERGY
  // ============================================================
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

  // ============================================================
  // MATTER
  // ============================================================
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
        float dd = length(f - g - o);
        if (dd < md1) { md2 = md1; md1 = dd; id1 = i + g; }
        else if (dd < md2) { md2 = dd; }
      }
      float border = md2 - md1;
      float spikes = smoothstep(0.1, 0.0, border);
      vec3 n = normalize(vec3(f - 0.5, 0.5));
      float lit = max(0.0, dot(n, normalize(vec3(0.5, 0.5, 0.7))));
      float metal = 0.5 + 0.5 * hash(id1);
      v = clamp(lit * 0.6 + spikes * 1.2 * metal, 0.0, 1.0);
    `
  },

  // ============================================================
  // STRANGE
  // ============================================================
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
