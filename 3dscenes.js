// 3dscenes.js — Calyx 3D scene definitions
//
// Each scene uses raymarched SDF geometry. The host injects the scene's
// `custom` code into a shared 3D fragment shader at `// __SCENE_BODY__`.
// Inside your custom code you must define:
//
//   float map(vec3 p)      — required. The signed distance to the scene.
//
// And you may optionally define (use `#define HAS_MATERIAL` /
// `#define HAS_EMISSION` before them so the shader knows to use them):
//
//   vec3 materialColor(vec3 p, vec3 n, vec3 rd)  — surface albedo
//   vec3 emission(vec3 p)                         — self-illumination
//
// Available globals inside custom code:
//
//   T         float  time * speed  (a #define, use freely)
//   u_a, u_b  vec3   base / accent colours (0..1)
//   u_time    float  raw seconds
//   u_pulse   float  0..1 decaying pulse value
//   u_glow    float  glow multiplier
//
// Helpers provided by the template:
//   hash(vec2), hash3(vec3), noise(vec2), noise3(vec3),
//   fbm(vec2),  fbm3(vec3),
//   rot2(float), rotX(vec3,float), rotY(vec3,float), rotZ(vec3,float),
//   sdSphere, sdBox, sdPlane, sdCylinder, sdTorus, sdCapsule,
//   smin(a, b, k)  — smooth minimum
//   opRep(p, c)    — infinite repetition
//
// Camera / lighting / physics fields (all optional, sensible defaults exist):
//   camDist    number   distance from origin      (default 3.5)
//   camHeight  number   camera elevation bias     (default 0.4)
//   camOrbit   number   auto-orbit speed          (default 0.1)
//   lightDir   [x,y,z]  direction TOWARD light    (default [0.5, 0.8, 0.6])
//   lightCol   string   hex colour of light       (default "#ffffff")
//   ambient    number   ambient light amount      (default 0.15)
//
// ---------------------------------------------------------------------------
//  PERFORMANCE NOTES (why this file looks the way it does)
// ---------------------------------------------------------------------------
//  * `map()` is evaluated dozens of times per pixel; `materialColor()` and
//    `emission()` exactly once on the hit point.  Therefore *all* expensive
//    procedural detail (fbm, ridged noise, banding) lives in the shading
//    functions and `map()` only carries the cheapest possible displacement.
//  * `noise3()` is preferred over `fbm3()` inside `map()`.
//  * `hash3()` is called once per cell and the remaining randoms are derived
//    from it with two fract() ops (3 hashes -> 1 hash).
//  * Several scenes used extra geometry (grid ridges, lattice lines) that is
//    now painted in the material instead — identical look, fewer SDF terms.
//  * Wave / ripple fields are scaled by a safety factor so the marcher never
//    oversteps (the classic "swiss cheese" artefact).
//  * u_pulse is wired into most scenes so interactions feel physical.

export default [

  // ==============================================================
  //  GLASS
  // ==============================================================
  {
    name: "Crystal Sphere",
    cat: "glass",
    desc: "Refractive orb on obsidian",
    a: "#050a14",
    b: "#7ec8ff",
    speed: 0.30,
    glow: 0.90,
    camDist: 3.4,
    camHeight: 0.5,
    camOrbit: 0.12,
    lightDir: [0.5, 0.7, 0.6],
    lightCol: "#ffffff",
    ambient: 0.15,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float floorD = p.y + 0.9;
  // NOTE: original sat 0.2 above the floor — now genuinely resting on it
  float orbD   = sdSphere(p - vec3(0.0, -0.03, 0.0), 0.87);
  return min(floorD, orbD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  vec3 L = normalize(vec3(0.5, 0.7, 0.6));
  if (p.y < -0.85){
    // polished obsidian: slow-drifting grain
    float pat = fbm(p.xz * 1.6 + T * 0.08);
    vec3 base = u_a * (0.45 + pat * 0.75);
    // light pooling out of the orb
    float pool = exp(-length(p.xz) * 1.1);
    // expanding shockwave ring on click
    float ring = 1.0 - smoothstep(0.0, 0.35,
                 abs(length(p.xz) - (1.0 - u_pulse) * 3.2));
    return base + u_b * (pool * 0.35 + ring * u_pulse * 0.7);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  // inner core reading through the glass
  float core = exp(-length(p - vec3(0.0, 0.05, 0.0)) * 2.4);
  vec3  col  = mix(u_b * 0.06, u_b, fres);
  col += u_b * core * 0.30;
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(L - rd))), 110.0) * 1.4;
  return col;
}
    `
  },
  {
    name: "Diamond Cage",
    cat: "glass",
    desc: "Faceted crystal inside a frame",
    a: "#04060c",
    b: "#a8e4ff",
    speed: 0.25,
    glow: 1.0,
    camDist: 4.0,
    camHeight: 0.6,
    camOrbit: 0.20,
    lightDir: [0.6, 0.5, 0.6],
    lightCol: "#ffffff",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
// torus of radius R / tube r whose axis is 'ax' (cheap, axis-aligned)
float cageRing(vec3 p, vec3 ax, float R, float r){
  vec3 q = p - ax * dot(p, ax);
  return length(vec2(length(q) - R, dot(p, ax))) - r;
}
float map(vec3 p){
  vec3 q = rotY(p, T * 0.35);
  q = rotX(q, T * 0.22);
  // faceted octahedral core
  float core = (abs(q.x) + abs(q.y) + abs(q.z) - 0.95) * 0.5;
  // three orthogonal rings instead of a hollow box shell —
  // cheaper AND reads much more clearly as a "cage"
  float cage = cageRing(q, vec3(1.0, 0.0, 0.0), 1.35, 0.035);
  cage = min(cage, cageRing(q, vec3(0.0, 1.0, 0.0), 1.35, 0.035));
  cage = min(cage, cageRing(q, vec3(0.0, 0.0, 1.0), 1.35, 0.035));
  return min(core, cage);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  // per-facet constant offset makes the crystal read as *cut* glass
  float facetId = fract(dot(floor(n * 2.5 + 0.5), vec3(1.0, 7.0, 13.0)) * 0.37);
  vec3  base = mix(u_b * 0.15, u_b * 1.3, facetId);
  vec3  col  = mix(base * 0.35, base, fres);
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(vec3(0.6, 0.5, 0.6) - rd))), 120.0) * 1.5;
  return col;
}
    `
  },
  {
    name: "Prism Spiral",
    cat: "glass",
    desc: "Twisted tower of glass slabs",
    a: "#060a16",
    b: "#8fd8ff",
    speed: 0.28,
    glow: 1.0,
    camDist: 4.2,
    camHeight: 0.2,
    camOrbit: 0.14,
    lightDir: [0.6, 0.6, 0.5],
    lightCol: "#ffffff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  // quantise the twist per slab so adjacent slabs share a rotation —
  // no seams, no overstepping
  float idx = floor((p.y + 0.55) / 1.10);
  float a   = idx * 0.825 + T * 0.25;
  float ca  = cos(a), sa = sin(a);
  vec3  q   = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
  q.y = mod(q.y + 0.55, 1.10) - 0.55;
  float slab = sdBox(q, vec3(0.95, 0.055, 0.30));
  float col  = length(p.xz) - 0.16;
  return min(slab, col);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  float edge = pow(1.0 - abs(n.y), 6.0);
  vec3  col  = mix(u_b * 0.05, u_b, fres);
  col += u_b * edge * 0.5;
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(vec3(0.6, 0.6, 0.5) - rd))), 100.0) * 1.2;
  return col;
}
    `
  },

  // ==============================================================
  //  METAL
  // ==============================================================
  {
    name: "Molten Core",
    cat: "metal",
    desc: "Cracked glowing sphere",
    a: "#1a0500",
    b: "#ff7722",
    speed: 0.50,
    glow: 1.6,
    camDist: 3.0,
    camHeight: 0.3,
    camOrbit: 0.10,
    lightDir: [0.4, 0.7, 0.5],
    lightCol: "#ffe2a0",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float d = sdSphere(p, 1.0);
  // single low-frequency displacement — detail lives in the shading
  d -= fbm3(p * 2.2 + T * 0.35) * 0.13;
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  // ridged noise => thin glowing veins instead of soft blobs
  float nz   = fbm3(p * 3.2 + T * 0.6);
  float vein = 1.0 - abs(nz * 2.0 - 1.0);
  float heat = smoothstep(0.78, 0.97, vein);
  vec3  rock = mix(vec3(0.06, 0.025, 0.012), vec3(0.14, 0.06, 0.03), fbm3(p * 6.0));
  return mix(rock, u_b * 1.15, heat);
}
vec3 emission(vec3 p){
  float nz   = fbm3(p * 3.2 + T * 0.6);
  float vein = 1.0 - abs(nz * 2.0 - 1.0);
  float heat = smoothstep(0.80, 0.98, vein);
  float pulse = 0.85 + 0.15 * sin(T * 2.0) + u_pulse * 0.9;
  return u_b * heat * pulse * 1.6;
}
    `
  },
  {
    name: "Chrome Ball",
    cat: "metal",
    desc: "Mirror sphere on a grid",
    a: "#05080d",
    b: "#dfe8f5",
    speed: 0.20,
    glow: 1.0,
    camDist: 3.4,
    camHeight: 0.6,
    camOrbit: 0.08,
    lightDir: [0.5, 0.6, 0.6],
    lightCol: "#ffffff",
    ambient: 0.20,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  // flat floor; the grid is painted in materialColor, not modelled
  float floorD  = p.y + 0.8;
  float sphereD = sdSphere(p - vec3(0.0, 0.03, 0.0), 0.83);
  return min(floorD, sphereD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.75){
    vec2  g    = abs(fract(p.xz) - 0.5);
    float grid = step(0.46, max(g.x, g.y));
    float fade = exp(-length(p.xz) * 0.20);
    return mix(u_a * 0.6, u_a * 2.2, grid * fade);
  }
  // fake environment: sky gradient + horizon band + two hard specular suns
  vec3  ref  = reflect(rd, n);
  float sky  = smoothstep(-0.4, 0.6, ref.y);
  float horiz = pow(1.0 - abs(ref.y), 12.0);
  vec3  env  = mix(vec3(0.02, 0.04, 0.08), u_b, sky);
  env += u_b * horiz * 0.6;
  env += vec3(1.0) * pow(max(0.0, dot(ref, normalize(vec3( 0.6, 0.7, 0.4)))), 90.0) * 1.6;
  env += u_b * 0.8 * pow(max(0.0, dot(ref, normalize(vec3(-0.5, 0.4,-0.6)))), 40.0);
  return env;
}
    `
  },
  {
    name: "Hex Lattice",
    cat: "metal",
    desc: "Endless chrome cell structure",
    a: "#060a10",
    b: "#cfe0f2",
    speed: 0.22,
    glow: 1.0,
    camDist: 2.2,
    camHeight: 0.2,
    camOrbit: 0.14,
    lightDir: [0.5, 0.6, 0.6],
    lightCol: "#ffffff",
    ambient: 0.18,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  // rotate the whole lattice so it appears to tumble
  vec3 q = rotY(p, T * 0.22);
  q = rotX(q, T * 0.15);
  q.xy = mod(q.xy + 0.85, 1.70) - 0.85;
  q.z  = mod(q.z  + 0.85, 1.70) - 0.85;
  float shell = sdBox(q, vec3(0.42)) - 0.055;
  float hole  = -sdBox(q, vec3(0.355));
  return max(shell, hole);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  vec3  ref  = reflect(rd, n);
  float sky  = smoothstep(-0.5, 0.7, ref.y);
  vec3  env  = mix(vec3(0.015, 0.02, 0.035), u_b, sky);
  env += u_b * pow(1.0 - abs(ref.y), 8.0) * 0.35;
  env += vec3(1.0) * pow(max(0.0, dot(ref, normalize(vec3(0.6, 0.7, 0.4)))), 80.0) * 1.6;
  return env;
}
    `
  },

  // ==============================================================
  //  WATER
  // ==============================================================
  {
    name: "Ocean Surface",
    cat: "water",
    desc: "Rolling waves under the sun",
    a: "#081a2e",
    b: "#78e0ff",
    speed: 0.40,
    glow: 1.1,
    camDist: 4.5,
    camHeight: 1.0,
    camOrbit: 0.05,
    lightDir: [0.3, 0.7, 0.6],
    lightCol: "#fff6d8",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
float waveH(vec2 q){
  float w = 0.0;
  w += sin(q.x * 1.10 + T * 1.30) * 0.16;
  w += sin(q.y * 1.60 - T * 1.05) * 0.12;
  w += sin((q.x + q.y) * 0.85 + T * 0.75) * 0.09;
  w += fbm(q * 0.65 + T * 0.15) * 0.30;   // one fbm instead of two
  return w;
}
float map(vec3 p){
  // 0.8 keeps the field Lipschitz-safe (no marcher overstepping)
  return (p.y - waveH(p.xz)) * 0.8;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3  L    = normalize(vec3(0.35, 0.75, 0.55));
  float spec = pow(max(0.0, dot(n, normalize(L - rd))), 140.0);
  vec3  col  = mix(u_a, u_b, fres);
  // foam riding the crests
  float crest = smoothstep(0.20, 0.42, waveH(p.xz));
  float foam  = crest * smoothstep(0.45, 0.90, fbm(p.xz * 3.0 + T * 0.3));
  col = mix(col, vec3(0.90, 0.96, 1.00), foam * 0.55);
  return col + vec3(1.0, 0.96, 0.88) * spec * 2.2;
}
    `
  },
  {
    name: "Underwater",
    cat: "water",
    desc: "Bubbles and drifting light",
    a: "#021b2a",
    b: "#4fe8c8",
    speed: 0.35,
    glow: 1.4,
    camDist: 3.6,
    camHeight: 0.4,
    camOrbit: 0.06,
    lightDir: [0.1, 0.95, 0.2],
    lightCol: "#b8f0ff",
    ambient: 0.25,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  // single-octave noise for the sea bed — far cheaper than fbm3 in the
  // hot path, and the detail is added back in materialColor
  float floorD = p.y + 1.5 + noise3(p * 0.7 + vec3(0.0, T * 0.25, 0.0)) * 0.45;

  // bubbles — ONE hash per cell, remaining randoms derived from it
  vec3  bp = p;
  bp.y += T * 0.6;
  vec3  id = floor(bp * 2.0);
  vec3  fp = fract(bp * 2.0) - 0.5;
  float s  = hash3(id);
  float s2 = fract(s * 7.13 + 0.31);
  float s3 = fract(s * 3.71 + 0.77);
  fp.x += (s2 - 0.5) * 0.45;
  fp.z += (s3 - 0.5) * 0.45;
  float bubble = sdSphere(fp, 0.09 + s2 * 0.09);

  return min(floorD, bubble);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -1.0){
    return u_a * (0.6 + fbm(p.xz * 3.0 + T * 0.4) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  vec3  col  = mix(u_b * 0.3, u_b, fres);
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(vec3(0.1, 0.95, 0.2) - rd))), 90.0) * 0.9;
  return col;
}
vec3 emission(vec3 p){
  // caustic-like shimmer from the surface above
  float c  = fbm(p.xz * 4.0 + T * 0.8);
  float c2 = fbm(p.xz * 8.0 - T * 0.5);
  return u_b * pow(smoothstep(0.6, 0.85, c * c2 * 2.0), 2.0) * 0.45;
}
    `
  },
  {
    name: "Rain Ripples",
    cat: "water",
    desc: "Still pool struck by rain",
    a: "#04121f",
    b: "#9fe8ff",
    speed: 0.35,
    glow: 1.0,
    camDist: 3.8,
    camHeight: 0.85,
    camOrbit: 0.05,
    lightDir: [0.45, 0.75, 0.50],
    lightCol: "#ffffff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
float ripples(vec2 q){
  float h = 0.0;
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    vec2  c  = vec2(hash(vec2(fi, 1.7)), hash(vec2(fi, 8.3))) * 3.2 - 1.6;
    float age = fract(T * 0.16 + hash(vec2(fi, 4.1)));
    float r   = length(q - c);
    h += sin(r * 16.0 - age * 34.0)
       * exp(-r * 1.6) * exp(-age * 3.5) * 0.050;
  }
  return h;
}
float map(vec3 p){
  float base = fbm(p.xz * 0.35 + T * 0.05) * 0.12;
  return (p.y - base - ripples(p.xz)) * 0.75;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3  col  = mix(u_a, u_b, fres);
  vec3  L    = normalize(vec3(0.45, 0.75, 0.50));
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(L - rd))), 160.0) * 2.0;
  // wet sheen darkens the troughs
  col *= 0.85 + 0.35 * smoothstep(-0.05, 0.10, p.y);
  return col;
}
    `
  },

  // ==============================================================
  //  NATURE
  // ==============================================================
  {
    name: "Crystal Forest",
    cat: "nature",
    desc: "Pillars of light",
    a: "#060a14",
    b: "#8cc8ff",
    speed: 0.30,
    glow: 1.0,
    camDist: 5.0,
    camHeight: 0.8,
    camOrbit: 0.10,
    lightDir: [0.4, 0.7, 0.5],
    lightCol: "#ffffff",
    ambient: 0.15,
    custom: `
#define HAS_MATERIAL
float sdPillar(vec3 p, float h, float r){
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float map(vec3 p){
  float floorD = p.y + 0.9;
  vec3  q = p;
  q.xz = mod(q.xz + 2.0, 4.0) - 2.0;
  vec2  cell = floor((p.xz + 2.0) / 4.0);
  float h = 0.70 + hash(cell) * 0.70;
  float r = 0.28 + hash(cell + 7.7) * 0.10;
  float pillar = sdPillar(q - vec3(0.0, -0.9 + h, 0.0), h, r);
  return min(floorD, pillar);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85 && n.y > 0.3){
    return u_a * (0.5 + fbm(p.xz * 2.0 + T * 0.05) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3  base = mix(u_b * 0.35, u_b * 1.25, fres);
  // glowing mineral veins — detail only where it costs one call
  float vein = smoothstep(0.68, 0.92, fbm3(p * 5.0 + T * 0.3));
  return base + u_b * vein * 0.6;
}
    `
  },
  {
    name: "Snow Field",
    cat: "nature",
    desc: "Rolling snow with sparse trees",
    a: "#0d1219",
    b: "#d8e4f2",
    speed: 0.20,
    glow: 0.9,
    camDist: 5.0,
    camHeight: 1.1,
    camOrbit: 0.04,
    lightDir: [0.3, 0.85, 0.4],
    lightCol: "#e8f4ff",
    ambient: 0.30,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  // rolling hills — noise3 instead of fbm3 keeps the marcher fast
  float terrain = -0.6 + noise3(p * vec3(0.45, 0.0, 0.45)) * 1.1
                      + sin(p.x * 0.3 + T * 0.05) * 0.15;
  float d = p.y - terrain;

  vec3 q = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  float seed = hash(cell);

  float trunk  = sdCylinder(q - vec3(0.0, 0.10, 0.0), 0.055, 0.45);
  vec3  top    = q - vec3(0.0, 0.75, 0.0);
  float canopy = sdSphere(vec3(top.x, top.y * 1.5, top.z), 0.34) - 0.05;

  // branchless "is there a tree in this cell?" — no warp divergence
  float tree = min(trunk, canopy) + (1.0 - step(0.55, seed)) * 50.0;
  return min(d, tree);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (n.y < -0.4) return u_a * 0.4;
  float snow = smoothstep(0.0, 0.7, n.y);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3  col  = mix(u_a, u_b, snow * 0.85 + fres * 0.35);
  // fine ice sparkle
  float glint = pow(max(0.0, noise(p.xz * 26.0)), 24.0);
  return col + vec3(1.0) * glint * 0.7;
}
    `
  },
  {
    name: "Ancient Oak",
    cat: "nature",
    desc: "A highly detailed procedural tree model",
    a: "#0c180e",
    b: "#62a856",
    speed: 0.15,
    glow: 0.9,
    camDist: 3.8,
    camHeight: 0.5,
    camOrbit: 0.08,
    lightDir: [0.5, 0.8, 0.5],
    lightCol: "#fffaf0",
    ambient: 0.20,
    custom: `
#define HAS_MATERIAL
// Trunk: analytic twist + taper + root flare.  All noise that used to live
// here has moved into materialColor, where it is evaluated once per pixel
// instead of ~80 times.
float oakTrunk(vec3 p){
  float a  = p.y * 0.85;
  float ca = cos(a), sa = sin(a);
  vec2  q  = vec2(p.x * ca - p.z * sa, p.x * sa + p.z * ca);
  float t  = clamp((p.y + 0.8) * 0.55, 0.0, 1.0);
  float r  = mix(0.30, 0.055, t);
  float d  = length(q) - r;
  float roots = length(p.xz) - 0.34 * exp(-(p.y + 0.8) * 2.6);
  return smin(d, roots, 0.22);
}
// Canopy: five lobes, no fbm inside
float oakCanopy(vec3 p){
  vec3 q = p - vec3(0.0, 1.35, 0.0);
  float d = sdSphere(q, 0.82);
  d = smin(d, sdSphere(q - vec3( 0.66, -0.20,  0.30), 0.56), 0.34);
  d = smin(d, sdSphere(q - vec3(-0.58,  0.12, -0.36), 0.52), 0.34);
  d = smin(d, sdSphere(q - vec3( 0.14,  0.58, -0.42), 0.47), 0.34);
  d = smin(d, sdSphere(q - vec3(-0.32, -0.38,  0.58), 0.45), 0.34);
  return d;
}
float map(vec3 p){
  float ground = p.y + 0.8;
  float tree   = smin(oakTrunk(p), oakCanopy(p), 0.12);
  return min(ground, tree);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.75 && n.y > 0.2){
    float pat = fbm(p.xz * 2.0 + T * 0.05);
    return u_a * (0.55 + pat * 0.55);
  }
  float fres   = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  float canopy = smoothstep(0.55, 1.05, p.y);
  if (canopy > 0.45){
    float leafN = fbm3(p * 6.0 + T * 0.25);
    vec3  leaf  = mix(u_b * 0.45, u_b * 1.35, leafN);
    leaf += u_b * pow(max(0.0, n.y), 3.0) * 0.25;      // sky-facing leaves
    return mix(leaf, u_b * 1.6, fres * 0.25);
  }
  // anisotropic noise reads as vertical wood grain
  float woodN = fbm3(p * vec3(14.0, 3.0, 14.0));
  return mix(vec3(0.17, 0.11, 0.065), vec3(0.40, 0.28, 0.17), woodN);
}
    `
  },
  {
    name: "Mushroom Grove",
    cat: "nature",
    desc: "Bioluminescent caps in the moss",
    a: "#06110c",
    b: "#7cf0c0",
    speed: 0.22,
    glow: 1.3,
    camDist: 4.0,
    camHeight: 0.55,
    camOrbit: 0.07,
    lightDir: [0.35, 0.75, 0.55],
    lightCol: "#d8fff0",
    ambient: 0.22,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float ground = p.y + 1.0 + noise(p.xz * 0.35) * 0.35;

  vec3 q = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  float s    = hash(cell);
  float s2   = hash(cell + 17.3);
  float hgt  = 0.60 + s * 0.55;
  float rad  = 0.055 + s2 * 0.030;

  float stalk = sdCylinder(q - vec3(0.0, -1.0 + hgt * 0.5, 0.0),
                           rad, hgt * 0.5 + 0.25);
  vec3  cq = q - vec3(0.0, -1.0 + hgt, 0.0);
  cq.y *= 2.6;                       // squashed cap
  float cap = sdSphere(cq, 0.30 + s2 * 0.16);

  return min(ground, min(stalk, cap));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.9 && n.y > 0.3){
    float pat = fbm(p.xz * 1.8);
    return u_a * (0.5 + pat * 0.6);
  }
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  float hgt  = 0.60 + hash(cell) * 0.55;
  float capY = -1.0 + hgt;
  float isCap = smoothstep(capY - 0.22, capY - 0.10, p.y);

  vec3 stalkCol = vec3(0.72, 0.68, 0.60) * (0.7 + fbm3(p * 8.0) * 0.5);
  vec3 capCol   = mix(vec3(0.35, 0.08, 0.14), u_b, 0.55)
                * (0.7 + fbm3(p * 4.0) * 0.5);
  return mix(stalkCol, capCol, isCap);
}
vec3 emission(vec3 p){
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  float hgt  = 0.60 + hash(cell) * 0.55;
  float capY = -1.0 + hgt;
  // soft bioluminescent halo hanging under each cap
  float glow = exp(-abs(p.y - capY) * 5.0);
  float halo = exp(-length(mod(p.xz + 3.0, 6.0) - 3.0) * 1.0);
  return u_b * glow * halo * 0.6;
}
    `
  },

  // ==============================================================
  //  SPACE
  // ==============================================================
  {
    name: "Black Hole",
    cat: "space",
    desc: "Accretion disk with lensing",
    a: "#040108",
    b: "#ffb060",
    speed: 0.35,
    glow: 1.8,
    camDist: 5.5,
    camHeight: 0.4,
    camOrbit: 0.15,
    lightDir: [0.5, 0.9, 0.5],
    lightCol: "#ffcc88",
    ambient: 0.05,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float bh = sdSphere(p, 0.62);
  // flattened annulus — no trig, no noise, just two planes and a cylinder
  vec3  q = p;
  q.y *= 7.0;
  float disk = length(q) - 1.55;
  disk = max(disk, abs(p.y) - 0.07);
  disk = max(disk, 0.85 - length(p.xz));
  return min(bh, disk);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (length(p) < 0.70) return vec3(0.0);          // event horizon eats light
  float r = length(p.xz);
  return mix(vec3(1.0, 0.85, 0.60), u_b, smoothstep(0.9, 2.6, r)) * 0.5;
}
vec3 emission(vec3 p){
  float r = length(p.xz);
  float a = atan(p.z, p.x);
  float swirl = fbm(vec2(r * 3.0 - T * 1.5, a * 2.0 + T * 0.5));
  float intensity = smoothstep(3.0, 0.9, r) * (0.7 + swirl * 0.8);
  // relativistic beaming — one side of the disk blazes far brighter
  float beam = 0.55 + 0.45 * sin(a - T * 0.4);
  vec3  hot  = mix(u_b, vec3(1.0, 0.98, 0.92), smoothstep(1.6, 0.9, r));
  return hot * intensity * beam * 2.0;
}
    `
  },
  {
    name: "Magma Planet",
    cat: "space",
    desc: "Cracked world with atmosphere",
    a: "#080208",
    b: "#ff5511",
    speed: 0.30,
    glow: 1.5,
    camDist: 3.6,
    camHeight: 0.4,
    camOrbit: 0.12,
    lightDir: [0.6, 0.5, 0.6],
    lightCol: "#ffddaa",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float d = sdSphere(p, 1.1);
  d -= fbm3(p * 2.0 + T * 0.2) * 0.15;   // single displacement, as before
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.60, 0.78, land);
  vec3  rock = mix(vec3(0.04, 0.015, 0.01), vec3(0.12, 0.05, 0.03), fbm3(p * 7.0));
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3  col  = mix(rock, u_b * 0.7, lava);
  return col + u_b * fres * 0.40;         // atmospheric rim
}
vec3 emission(vec3 p){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.62, 0.80, land);
  return u_b * lava * (0.9 + 0.25 * sin(T * 1.5 + u_pulse * 6.0));
}
    `
  },
  {
    name: "Ringed World",
    cat: "space",
    desc: "Gas giant and its ring system",
    a: "#050912",
    b: "#e0c090",
    speed: 0.25,
    glow: 1.0,
    camDist: 4.6,
    camHeight: 0.35,
    camOrbit: 0.10,
    lightDir: [0.6, 0.6, 0.5],
    lightCol: "#fff2d8",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float planet = sdSphere(p, 0.78);
  // tilt the ring plane, keep the planet spherical
  vec3  q  = rotX(p, 0.38);
  float rr = length(q.xz);
  // three explicit bands: cheaper and crisper than a noise-driven annulus
  float r1 = max(abs(q.y) - 0.013, max(0.98 - rr, rr - 1.26));
  float r2 = max(abs(q.y) - 0.009, max(1.40 - rr, rr - 1.54));
  float r3 = max(abs(q.y) - 0.006, max(1.66 - rr, rr - 1.78));
  float rings = min(min(r1, r2), r3);
  return min(planet, rings);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (length(p) < 0.86){
    // gas-giant banding + polar caps
    float land  = fbm3(p * 3.0 + T * 0.05);
    float ocean = smoothstep(0.48, 0.55, land);
    vec3  col   = mix(vec3(0.02, 0.06, 0.16), vec3(0.10, 0.16, 0.10), ocean);
    col = mix(col, vec3(0.55, 0.50, 0.42), smoothstep(0.72, 0.80, land));
    col = mix(col, vec3(0.85), smoothstep(0.62, 0.90, abs(p.y)));
    return col;
  }
  float rr   = length(p.xz);
  float band = fbm(vec2(rr * 9.0, 0.0));
  return mix(u_b * 0.35, u_b, band);
}
    `
  },

  // ==============================================================
  //  ABSTRACT
  // ==============================================================
  {
    name: "Neon Grid",
    cat: "abstract",
    desc: "Infinite synthwave grid",
    a: "#0a0410",
    b: "#ff3ec8",
    speed: 0.40,
    glow: 1.6,
    camDist: 4.0,
    camHeight: 0.6,
    camOrbit: 0.10,
    lightDir: [0.5, 0.5, 0.7],
    lightCol: "#ffffff",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  // flat floor — the glowing grid is painted, not modelled
  float floorD = p.y + 0.9;
  vec3  q = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  float h = 0.40 + hash(cell) * 1.70;
  float w = 0.13 + hash(cell + 9.0) * 0.14;
  float box = sdBox(q - vec3(0.0, -0.9 + h, 0.0), vec3(w, h, w));
  return min(floorD, box);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    vec2  g    = abs(fract(p.xz) - 0.5);
    float grid = smoothstep(0.46, 0.50, min(g.x, g.y));
    float fres = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
    return u_a * 0.5 + u_b * grid * 0.5 + u_b * fres * 0.35;
  }
  float panel = step(0.5, fract(p.y * 4.0));
  return mix(u_a * 0.5, u_b * 1.1, panel);
}
vec3 emission(vec3 p){
  if (p.y < -0.85){
    vec2  g    = abs(fract(p.xz) - 0.5);
    float grid = smoothstep(0.46, 0.50, min(g.x, g.y));
    float fade = exp(-length(p.xz) * 0.16);   // dissolves into the horizon
    return u_b * grid * fade * (0.7 + u_pulse * 1.6);
  }
  return u_b * 0.35 * step(0.5, fract(p.y * 4.0));
}
    `
  },
  {
    name: "Metaball Flow",
    cat: "abstract",
    desc: "Blended spheres with gravity",
    a: "#040810",
    b: "#60b0ff",
    speed: 0.50,
    glow: 1.2,
    camDist: 3.6,
    camHeight: 0.4,
    camOrbit: 0.10,
    lightDir: [0.4, 0.7, 0.5],
    lightCol: "#ffffff",
    ambient: 0.20,
    custom: `
#define HAS_MATERIAL
// Fake physics: each ball bounces inside a box.  u_pulse blows them apart.
vec3 ballPos(float i){
  float t0 = T * 0.8 + i * 2.1;
  float y  = abs(sin(t0)) * 1.05 - 0.55;
  float x  = sin(t0 * 0.7 + i * 3.1) * 0.85;
  float z  = cos(t0 * 0.6 + i * 2.7) * 0.85;
  return vec3(x, y, z) * (1.0 + u_pulse * 0.45);
}
float map(vec3 p){
  float d = 1e5;
  for (int i = 0; i < 5; i++){
    d = smin(d, sdSphere(p - ballPos(float(i)), 0.42), 0.42);
  }
  d = min(d, p.y + 0.9);
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    return u_a * (0.4 + fbm(p.xz * 3.0 + T * 0.1) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3  col  = mix(u_b * 0.25, u_b, fres);
  // thin-film iridescence
  col += 0.25 * (0.5 + 0.5 * cos(6.2831 * (fres * 1.6 + vec3(0.0, 0.33, 0.67))));
  col += vec3(0.25) * pow(max(0.0, n.y), 4.0);
  return col;
}
    `
  },
  {
    name: "Infinite Tunnel",
    cat: "abstract",
    desc: "Flying through rings of light",
    a: "#050810",
    b: "#a878ff",
    speed: 0.60,
    glow: 1.6,
    camDist: 0.0,
    camHeight: 0.0,
    camOrbit: 0.0,
    lightDir: [0.0, 1.0, 0.0],
    lightCol: "#ffffff",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  // hexagonal tube wall
  vec2  q    = p.xy;
  float wall = max(abs(q.x) * 0.866 + abs(q.y) * 0.5, abs(q.y)) - 1.15;

  // travelling rings, repeated along Z
  vec3 r = p;
  r.z = mod(r.z + T * 2.5, 2.0) - 1.0;
  float ring = length(vec2(length(r.xy) - 0.88, r.z)) - 0.07;

  return min(wall, ring);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  // faint hex cell shading on the wall
  float hex = step(0.5, fract(atan(p.y, p.x) * 2.546479 + T * 0.2));
  return mix(u_a * 1.6, u_b * 0.18, hex);
}
vec3 emission(vec3 p){
  vec3 r = p;
  r.z = mod(r.z + T * 2.5, 2.0) - 1.0;
  float isRing = smoothstep(0.10, 0.04, abs(r.z))
               * smoothstep(1.05, 0.85, length(r.xy));
  return u_b * isRing * (1.8 + u_pulse * 2.5);
}
    `
  },
  {
    name: "Tesseract",
    cat: "abstract",
    desc: "Nested rotating frames",
    a: "#03060e",
    b: "#66c8ff",
    speed: 0.35,
    glow: 1.4,
    camDist: 3.8,
    camHeight: 0.3,
    camOrbit: 0.18,
    lightDir: [0.5, 0.7, 0.5],
    lightCol: "#ffffff",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float d = 1e5;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    vec3  q  = rotY(p, T * 0.35 + fi * 0.55);
    q = rotX(q, T * 0.27 + fi * 0.42);
    float s     = 1.45 - fi * 0.28;
    float shell = sdBox(q, vec3(s)) - 0.035;
    float hole  = -sdBox(q, vec3(s - 0.14));
    d = min(d, max(shell, hole));
  }
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  return mix(u_a * 2.2, u_b, fres);
}
vec3 emission(vec3 p){
  float g = 1.0 - smoothstep(0.0, 2.2, length(p));
  return u_b * g * (0.35 + u_pulse * 0.8);
}
    `
  }

];
