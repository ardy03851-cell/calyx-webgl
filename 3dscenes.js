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
// NOTES ON THIS REVISION
// ---------------------------------------------------------------------------
// * 20 brand-new scenes added (34 total).
// * Existing scenes fixed:
//     - Underwater   : bubble SDF was returned in scaled space (2x overshoot)
//     - Snow Field   : heightfield used fbm3(p) so the field depended on y,
//                      breaking the Lipschitz bound → terrain now uses a 2D
//                      fbm and the heightfield is scaled to stay conservative
//     - Black Hole   : accretion disk used `q.y *= 6.0` (non-conservative).
//                      Rebuilt as an annulus ∩ slab (exact, safe).
//     - Infinite Tnl : ring inner cut was `-0.3 + length()` which produced a
//                      solid plug instead of a hole. Fixed.
//     - Ancient Oak  : `exp(-p.y*2.5)` overflowed for rays below the ground
//                      (NaN). Clamped.
//     - Ocean Surface: depended on an undocumented `u_lightDir` uniform.
//     - Chrome Ball / Neon Grid: grid relief maths was inverted; rewrote as
//                      proper grooves.
// * Optimisations: duplicated fbm/hash evaluations hoisted, cheaper ridged
//   terrain (3 octaves instead of 4), removed redundant `min` terms.
// * Several scenes now react to `u_pulse`.
// ---------------------------------------------------------------------------

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
  float floorD  = p.y + 0.9;
  float sphereD = sdSphere(p - vec3(0.0, 0.15, 0.0), 0.85);
  return min(floorD, sphereD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    float pat = fbm(p.xz * 2.0 + T * 0.1);
    return u_a * (0.4 + pat * 0.8);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_b * 0.12, u_b, fres);
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
float map(vec3 p){
  vec3 q = rotY(p, T * 0.4);
  q = rotX(q, T * 0.25);
  // octahedron (1/sqrt(3) ≈ 0.577 is the exact gradient; 0.55 stays conservative)
  float octa = (abs(q.x) + abs(q.y) + abs(q.z) - 0.9) * 0.55;
  float cage = sdBox(q, vec3(1.6)) - 0.05;
  float hole = -sdBox(q, vec3(1.55));
  cage = max(cage, hole);
  return min(octa, cage);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  float facet = step(0.5, fract(dot(n, vec3(3.1, 4.7, 2.3)) * 2.0));
  vec3  base  = mix(u_b * 0.2, u_b, facet);
  return mix(base * 0.5, base, fres);
}
    `
  },
  {
    name: "Prism Stack",
    cat: "glass",
    desc: "Stacked slabs, each turned a little further",
    a: "#06070f",
    b: "#9fd0ff",
    speed: 0.30,
    glow: 1.0,
    camDist: 3.6,
    camHeight: 0.55,
    camOrbit: 0.10,
    lightDir: [0.45, 0.75, 0.5],
    lightCol: "#ffffff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float ground = p.y + 0.95;
  vec3  q      = p;
  float layer  = floor((p.y + 0.95) / 0.62);
  q.y = mod(p.y + 0.95, 0.62) - 0.31;
  float ang = layer * 0.5 + T * 0.2;
  float c = cos(ang), s = sin(ang);
  q.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);
  float slab = sdBox(q, vec3(0.62, 0.20, 0.62)) - 0.035;
  return min(ground, slab);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.90){
    return u_a * (0.5 + fbm(p.xz * 1.5 + T * 0.05) * 0.6);
  }
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  float layer = floor((p.y + 0.95) / 0.62);
  vec3  tint  = mix(u_b, vec3(1.0, 0.72, 0.96), fract(layer * 0.41));
  tint = mix(tint, u_b * 1.5, 0.35);
  return mix(tint * 0.06, tint, clamp(fres * 1.2 + 0.08, 0.0, 1.0));
}
    `
  },
  {
    name: "Frost Bloom",
    cat: "glass",
    desc: "Spiked ice sphere with glowing veins",
    a: "#070c16",
    b: "#a8e8ff",
    speed: 0.22,
    glow: 1.2,
    camDist: 3.3,
    camHeight: 0.45,
    camOrbit: 0.14,
    lightDir: [0.4, 0.8, 0.5],
    lightCol: "#eaf6ff",
    ambient: 0.18,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  vec3  q = p - vec3(0.0, 0.1, 0.0);
  float a = atan(q.z, q.x);
  float spike = 0.06 * abs(sin(a * 5.0 + T * 0.4))
                    * (0.5 + 0.5 * sin(q.y * 5.0 - T * 0.6));
  float d = sdSphere(q, 0.80) + spike;
  d += fbm3(q * 4.0 + T * 0.15) * 0.04;
  float ground = p.y + 1.0;
  return min(ground, d);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 2.0) * 0.5);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  float vein = smoothstep(0.60, 0.95, fbm3(p * 6.0 + T * 0.3));
  vec3  c    = mix(u_b * 0.12, u_b * 1.4, fres);
  return c + u_b * vein * 0.8;
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
  float d    = sdSphere(p, 1.0);
  float nois = fbm3(p * 2.5 + T * 0.4) * 0.13;
  return d - nois;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float crack = fbm3(p * 3.5 + T * 0.6);
  float heat  = smoothstep(0.55, 0.75, crack);
  return mix(vec3(0.08, 0.03, 0.01), u_b * 0.6, heat);
}
vec3 emission(vec3 p){
  float crack = fbm3(p * 3.5 + T * 0.6);
  float heat  = smoothstep(0.60, 0.78, crack);
  float pulse = 0.85 + 0.15 * sin(T * 2.0) + u_pulse * 0.4;
  return u_b * heat * pulse * 1.2;
}
    `
  },
  {
    name: "Chrome Ball",
    cat: "metal",
    desc: "Mirror sphere on a grooved plate",
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
  // Grooved floor: cut a shallow trench along the cell borders
  vec2  g    = abs(fract(p.xz) - 0.5);
  float line = smoothstep(0.44, 0.50, max(g.x, g.y));
  float floorD = p.y + 0.80 + 0.035 * line;
  float sphereD = sdSphere(p - vec3(0.0, 0.15, 0.0), 0.85);
  return min(floorD, sphereD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.74){
    vec2  g    = abs(fract(p.xz) - 0.5);
    float line = smoothstep(0.44, 0.50, max(g.x, g.y));
    return mix(u_a * 0.6, u_a * 2.0, line);
  }
  // Fake environment reflection — sky gradient + horizon + hot spot
  vec3  ref   = reflect(rd, n);
  float sky   = smoothstep(-0.4, 0.6, ref.y);
  float horiz = pow(1.0 - abs(ref.y), 12.0);
  vec3  env   = mix(vec3(0.02, 0.04, 0.08), u_b, sky);
  env += u_b * horiz * 0.6;
  env += vec3(1.0) * pow(max(0.0, ref.y), 48.0) * 0.9;
  return env;
}
    `
  },
  {
    name: "Liquid Chrome",
    cat: "metal",
    desc: "Rippling mercury",
    a: "#05080f",
    b: "#dce6f5",
    speed: 0.35,
    glow: 1.1,
    camDist: 3.3,
    camHeight: 0.45,
    camOrbit: 0.12,
    lightDir: [0.5, 0.65, 0.55],
    lightCol: "#ffffff",
    ambient: 0.18,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float w  = 0.040 * sin(p.y * 5.0 + T * 1.6) * cos(p.x * 4.0 - T * 1.2);
        w += 0.035 * sin(p.z * 4.5 - T * 1.4) * cos(p.y * 3.5 + T * 1.0);
        w += fbm3(p * 2.5 + T * 0.4) * 0.05;
  float d = sdSphere(p - vec3(0.0, 0.10, 0.0), 0.85 + w);
  float ground = p.y + 0.95;
  return min(ground, d);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.90){
    float g = smoothstep(0.45, 0.50, max(abs(fract(p.x) - 0.5), abs(fract(p.z) - 0.5)));
    return u_a * (0.35 + g * 0.5);
  }
  vec3  ref   = reflect(rd, n);
  float sky   = smoothstep(-0.5, 0.7, ref.y);
  float horiz = pow(1.0 - abs(ref.y), 10.0);
  vec3  env   = mix(vec3(0.01, 0.02, 0.05), u_b, sky);
  env += u_b * horiz * 0.5;
  env += vec3(1.0) * pow(max(0.0, ref.y), 40.0) * 0.8;
  return env;
}
    `
  },
  {
    name: "Gearworks",
    cat: "metal",
    desc: "Three meshed cogs, always turning",
    a: "#07090c",
    b: "#c9d4e2",
    speed: 0.25,
    glow: 1.0,
    camDist: 3.9,
    camHeight: 0.5,
    camOrbit: 0.0,
    lightDir: [0.5, 0.7, 0.6],
    lightCol: "#ffffff",
    ambient: 0.18,
    custom: `
#define HAS_MATERIAL
float sdGear(vec3 p, float r, float teeth, float th){
  float a     = atan(p.y, p.x);
  float rad   = length(p.xy);
  float outer = r + 0.05 + 0.05 * cos(a * teeth);
  float d2    = max(rad - outer, r * 0.30 - rad);
  vec2  w     = vec2(d2, abs(p.z) - th);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}
float map(vec3 p){
  p = rotY(p, T * 0.15);
  float d = 1e5;

  vec3 q1 = p;
  q1.xy = vec2(cos(T*0.8)*q1.x - sin(T*0.8)*q1.y,
               sin(T*0.8)*q1.x + cos(T*0.8)*q1.y);
  d = min(d, sdGear(q1, 0.80, 14.0, 0.09));

  float a2 = -T * 0.8 * (0.80 / 0.55);
  vec3  q2 = p - vec3(1.28, 0.42, 0.0);
  q2.xy = vec2(cos(a2)*q2.x - sin(a2)*q2.y, sin(a2)*q2.x + cos(a2)*q2.y);
  d = min(d, sdGear(q2, 0.55, 10.0, 0.08));

  float a3 = -T * 0.8 * (0.80 / 0.50);
  vec3  q3 = p - vec3(-1.28, -0.42, 0.0);
  q3.xy = vec2(cos(a3)*q3.x - sin(a3)*q3.y, sin(a3)*q3.x + cos(a3)*q3.y);
  d = min(d, sdGear(q3, 0.50, 9.0, 0.08));

  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  vec3  ref   = reflect(rd, n);
  float sky   = smoothstep(-0.4, 0.7, ref.y);
  float horiz = pow(1.0 - abs(ref.y), 14.0);
  vec3  env   = mix(vec3(0.015, 0.02, 0.03), u_b, sky);
  env += u_b * horiz * 0.45;
  // subtle warm machining tint on the tooth flanks
  float tooth = 0.5 + 0.5 * sin(atan(p.y, p.x) * 12.0);
  return env * (0.85 + tooth * 0.3);
}
    `
  },
  {
    name: "Piston Array",
    cat: "metal",
    desc: "A field of pistons, all out of phase",
    a: "#0a0c10",
    b: "#ffb060",
    speed: 0.45,
    glow: 1.3,
    camDist: 4.2,
    camHeight: 0.7,
    camOrbit: 0.09,
    lightDir: [0.45, 0.8, 0.45],
    lightCol: "#ffffff",
    ambient: 0.15,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float base = p.y + 1.0;
  vec2  cell = floor((p.xz + 0.95) / 1.9);
  vec2  q    = mod(p.xz + 0.95, 1.9) - 0.95;

  float ph   = hash(cell) * 6.2831;
  float h    = 0.55 + 0.55 * sin(T * 1.6 + ph);
  float topY = -1.0 + h;
  float mid  = (topY - 1.0) * 0.5;
  float halfH = (topY + 1.0) * 0.5;

  float shaft = max(length(q) - 0.17, abs(p.y - mid) - halfH);
  float cap   = max(length(q) - 0.30, abs(p.y - topY) - 0.09);
  return min(base, min(shaft, cap));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 2.0) * 0.4);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_a * 1.5, u_b * 0.8, fres) + vec3(0.15) * pow(max(0.0, n.y), 4.0);
}
vec3 emission(vec3 p){
  vec2  cell = floor((p.xz + 0.95) / 1.9);
  vec2  q    = mod(p.xz + 0.95, 1.9) - 0.95;
  float ph   = hash(cell) * 6.2831;
  float topY = -1.0 + 0.55 + 0.55 * sin(T * 1.6 + ph);
  float hot  = smoothstep(0.12, 0.0, abs(p.y - topY)) * smoothstep(0.32, 0.15, length(q));
  return mix(u_b, vec3(1.0, 0.9, 0.7), 0.4) * hot * (1.1 + u_pulse * 1.4);
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
float waves(vec2 q){
  float w = 0.0;
  w += sin(q.x * 1.2 + T * 1.4) * 0.14;
  w += sin(q.y * 1.7 - T * 1.1) * 0.10;
  w += fbm(q * 0.8 + T * 0.2) * 0.28;
  w += fbm(q * 2.5 - T * 0.4) * 0.08;
  return w;
}
float map(vec3 p){
  return (p.y - waves(p.xz)) * 0.85;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3  L     = normalize(vec3(0.3, 0.7, 0.6));
  vec3  h     = normalize(L - rd);
  float spec  = pow(max(0.0, dot(n, h)), 120.0);
  // foam on the crests
  float foam  = smoothstep(0.26, 0.36, p.y) * (1.0 - fres) * 0.35;
  vec3  col   = mix(u_a, u_b, fres);
  col += vec3(1.0, 0.96, 0.88) * spec * 1.6;
  col += vec3(0.85, 0.95, 1.0) * foam;
  return col;
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
  float w      = fbm3(p * 0.8 + vec3(0.0, T * 0.3, 0.0)) * 0.4;
  float floorD = p.y + 1.5 + w;

  // Bubbles — periodic spheres rising. Everything here is in WORLD units:
  // the cell is 0.5 across, offsets and radii are shrunk to match, so the
  // returned distance is a genuine distance (the old version returned a
  // value 2x too large and the marcher overshot).
  vec3  bp = p;
  bp.y += T * 0.6;
  vec3  id = floor(bp * 2.0);
  vec3  fp = (fract(bp * 2.0) - 0.5) * 0.5;
  float s1 = hash3(id);
  fp.x += (s1 - 0.5) * 0.16;
  fp.z += (hash3(id + 3.7) - 0.5) * 0.16;
  float r = 0.05 + hash3(id + 1.3) * 0.05;
  float bubble = sdSphere(fp, r);

  return min(floorD, bubble);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -1.0){
    return u_a * (0.6 + fbm(p.xz * 3.0 + T * 0.4) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  return mix(u_b * 0.25, u_b, fres);
}
vec3 emission(vec3 p){
  // Caustic-like shimmer from above
  float c  = fbm(p.xz * 4.0 + T * 0.8);
  float c2 = fbm(p.xz * 8.0 - T * 0.5);
  return u_b * pow(smoothstep(0.60, 0.85, c * c2 * 2.0), 2.0) * (0.35 + u_pulse * 0.5);
}
    `
  },
  {
    name: "Rain Ripples",
    cat: "water",
    desc: "A pond taking endless drops",
    a: "#050d18",
    b: "#8fd8ff",
    speed: 0.40,
    glow: 1.1,
    camDist: 4.0,
    camHeight: 0.9,
    camOrbit: 0.05,
    lightDir: [0.35, 0.75, 0.55],
    lightCol: "#eaf6ff",
    ambient: 0.16,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  vec2  q = p.xz;
  float w = 0.0;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    vec2  c  = vec2(sin(fi * 2.31) * 1.7, cos(fi * 1.73) * 1.7);
    float t  = mod(T * 0.55 + fi * 0.83, 3.0);
    float r  = length(q - c);
    float rr = r - t * 1.4;
    w += sin(rr * 13.0) * exp(-abs(rr) * 3.2) * exp(-t * 0.9) * 0.030;
  }
  return (p.y - w) * 0.9;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3  L    = normalize(vec3(0.35, 0.75, 0.55));
  vec3  h    = normalize(L - rd);
  float spec = pow(max(0.0, dot(n, h)), 90.0);
  vec3  col  = mix(u_a * 0.6, u_b, fres);
  return col + vec3(1.0, 0.97, 0.9) * spec * 1.4;
}
    `
  },
  {
    name: "Ice Cavern",
    cat: "water",
    desc: "Stalactites and stalagmites",
    a: "#061220",
    b: "#7fd6ff",
    speed: 0.22,
    glow: 1.2,
    camDist: 4.2,
    camHeight: 0.5,
    camOrbit: 0.08,
    lightDir: [0.2, 0.9, 0.3],
    lightCol: "#dff2ff",
    ambient: 0.22,
    custom: `
#define HAS_MATERIAL
// Bounded cone spike. q has its base at the origin, pointing +y.
float sdSpike(vec3 q, float h, float r){
  float y   = clamp(q.y, 0.0, h);
  float rad = r * (1.0 - y / h);
  float d   = length(q.xz) - rad;
  d = max(d, q.y - h);
  d = max(d, -q.y);
  return d * 0.72;
}
float map(vec3 p){
  float ground = p.y + 1.0;
  vec2  cell   = floor((p.xz + 1.0) / 2.0);
  vec3  q      = p;
  q.xz = mod(q.xz + 1.0, 2.0) - 1.0;

  float s1 = hash(cell);
  float s2 = hash(cell + 5.3);

  // stalagmite (grows up from the floor)
  float up = sdSpike(q - vec3(0.0, -1.0, 0.0), 0.7 + s1 * 1.6, 0.26 + s2 * 0.12);

  // stalactite (hangs down from the ceiling)
  vec3  r = q - vec3((s1 - 0.5) * 0.5, 2.3, (s2 - 0.5) * 0.5);
  r.y = -r.y;
  float dn = sdSpike(r, 0.6 + s2 * 1.4, 0.24 + s1 * 0.12);

  return min(ground, min(up, dn));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 3.0) * 0.5);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  float core = smoothstep(0.3, 0.9, n.y * 0.5 + 0.5);
  vec3  c    = mix(u_b * 0.15, u_b * 1.5, fres);
  return c + u_b * core * 0.25;
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
  vec3  q      = p;
  vec2  cell   = floor((p.xz + 2.0) / 4.0);
  q.xz = mod(q.xz + 2.0, 4.0) - 2.0;

  float a = hash(cell);
  float b = hash(cell + 7.7);
  float h = 0.7 + a * 0.7;
  float r = 0.28 + b * 0.1;

  float pillar = sdPillar(q - vec3(0.0, -0.9 + h, 0.0), h, r);
  return min(floorD, pillar);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    return u_a * (0.5 + fbm(p.xz * 2.0 + T * 0.05) * 0.5);
  }
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3  base  = mix(u_b * 0.4, u_b * 1.2, fres);
  float vein  = smoothstep(0.70, 0.90, fbm3(p * 5.0 + T * 0.3));
  return base + u_b * vein * 0.5;
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
  // Terrain must not depend on p.y — using fbm3(p) made the field
  // non-conservative and caused the marcher to punch through hills.
  float terrain = -0.6
                + fbm(p.xz * 0.35 + T * 0.02) * 1.1
                + sin(p.x * 0.3 + T * 0.05) * 0.15;
  float floorD  = (p.y - terrain) * 0.6;

  // Trees — sparse cones, one candidate per cell
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  vec3  q    = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;

  if (hash(cell) > 0.55){
    vec2  origin = p.xz - q.xz;
    float baseY  = -0.6 + fbm(origin * 0.35 + T * 0.02) * 1.1;
    float trunk  = max(length(q.xz) - 0.07, abs(q.y - (baseY + 0.35)) - 0.35);
    float canopy = sdSphere(q - vec3(0.0, baseY + 0.95, 0.0), 0.42) - 0.05;
    floorD = min(floorD, min(trunk, canopy));
  }
  return floorD;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (n.y < -0.4) return u_a * 0.5;
  float snow  = smoothstep(0.0, 0.7, n.y);
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  return mix(u_a, u_b, clamp(snow * 0.9 + fres * 0.4, 0.0, 1.0));
}
    `
  },
  {
    name: "Ancient Oak",
    cat: "nature",
    desc: "A highly detailed procedural tree",
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
float sdTrunk(vec3 p){
  vec3  q = p;
  float n = fbm3(q * 1.5 + vec3(0.0, q.y * 0.5, 0.0)) * 0.22;
  q.x += n;
  q.z += n;

  float r = 0.22 * (1.2 - clamp(max(q.y, 0.0) * 0.5, 0.0, 0.9));
  float d = length(q.xz) - r;
  d = max(d, q.y - 2.0);                     // cap the top of the trunk

  // Root flare. `exp` is clamped: rays travelling far below the ground used
  // to evaluate exp(large positive) and produce NaNs.
  float roots = length(p.xz) - 0.34 * exp(-max(p.y, 0.0) * 2.5);
  d = smin(d, roots, 0.25);

  d -= fbm3(p * 8.0) * 0.035;                // bark relief
  return d * 0.80;
}
float sdCanopy(vec3 p){
  vec3  q = p - vec3(0.0, 1.6, 0.0);
  float d = sdSphere(q, 0.85);
  d += fbm3(q * 2.0) * 0.28;
  d = smin(d, sdSphere(q + vec3( 0.55, -0.15,  0.30), 0.62), 0.35);
  d = smin(d, sdSphere(q + vec3(-0.45,  0.10, -0.40), 0.58), 0.35);
  d = smin(d, sdSphere(q + vec3( 0.15,  0.50, -0.35), 0.55), 0.35);
  return d * 0.75;
}
float map(vec3 p){
  float ground = p.y + 0.85;
  float trunk  = sdTrunk(p);
  float canopy = sdCanopy(p);
  return min(ground, smin(trunk, canopy, 0.20));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.80){
    return u_a * (0.5 + fbm(p.xz * 2.0) * 0.6);
  }
  float leaf = smoothstep(0.95, 1.30, p.y + fbm3(p * 3.0) * 0.15);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);

  vec3 leafCol = mix(u_b * 0.55, u_b * 1.30, fbm3(p * 5.0));
  leafCol = mix(leafCol, u_b * 1.5, fres * 0.3);

  vec3 woodCol = mix(vec3(0.22, 0.14, 0.08), vec3(0.40, 0.27, 0.16), fbm3(p * 4.0));

  return mix(woodCol, leafCol, leaf);
}
    `
  },
  {
    name: "Desert Dunes",
    cat: "nature",
    desc: "Wind-carved sand under a low sun",
    a: "#1a0f06",
    b: "#ffc878",
    speed: 0.20,
    glow: 1.0,
    camDist: 5.0,
    camHeight: 0.9,
    camOrbit: 0.05,
    lightDir: [0.75, 0.45, 0.3],
    lightCol: "#ffd9a0",
    ambient: 0.25,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float dune = fbm(p.xz * 0.28 + vec2(T * 0.02, 0.0)) * 1.35;
  dune += sin(p.x * 0.55 + T * 0.06) * 0.18;
  dune += fbm(p.xz * 1.1 - vec2(T * 0.04, 0.0)) * 0.12;
  float ground = (p.y + 1.0 - dune) * 0.55;

  // A few half-buried rocks
  vec3 q = p;
  q.xz = mod(q.xz + 4.0, 8.0) - 4.0;
  float rock = sdSphere(q - vec3(0.0, -0.75, 0.0), 0.30) - 0.06;
  return min(ground, rock);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float slope = 1.0 - clamp(n.y, 0.0, 1.0);
  float grain = fbm(p.xz * 6.0);
  vec3  warm  = u_b * (0.55 + grain * 0.55);
  vec3  shadow = u_a * 2.0;
  float fres  = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(warm, shadow, slope * 0.55) + warm * fres * 0.3;
}
    `
  },
  {
    name: "Bamboo Grove",
    cat: "nature",
    desc: "Tall stalks swaying in the wind",
    a: "#0a1608",
    b: "#8fd45e",
    speed: 0.25,
    glow: 0.9,
    camDist: 4.4,
    camHeight: 0.7,
    camOrbit: 0.09,
    lightDir: [0.4, 0.8, 0.45],
    lightCol: "#f2ffe0",
    ambient: 0.22,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float ground = p.y + 1.0;

  vec2  cell = floor((p.xz + 2.0) / 4.0);
  vec3  q    = p;
  q.xz = mod(q.xz + 2.0, 4.0) - 2.0;

  float s     = hash(cell);
  float sway  = sin(T * 0.8 + s * 6.2831) * 0.12;
  float bend  = sway * (q.y + 1.0);
  vec3  r     = q - vec3(bend, 0.0, 0.0);

  float rad  = 0.075 + s * 0.045;
  // node bulges
  rad += 0.012 * smoothstep(0.75, 1.0, sin(r.y * 5.5));

  float stalk = length(r.xz) - rad;
  stalk = max(stalk, q.y - (1.6 + s * 2.2));
  stalk = max(stalk, -1.0 - q.y);

  return min(ground, stalk);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 3.0) * 0.5);
  float node = smoothstep(0.80, 1.0, sin(p.y * 5.5));
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3  col  = mix(u_b * 0.5, u_b * 1.25, node);
  return col * (0.8 + fres * 0.6);
}
    `
  },
  {
    name: "Alien Pods",
    cat: "nature",
    desc: "Glowing seed pods breathing in the dark",
    a: "#0a0616",
    b: "#a066ff",
    speed: 0.35,
    glow: 1.6,
    camDist: 4.0,
    camHeight: 0.6,
    camOrbit: 0.10,
    lightDir: [0.3, 0.85, 0.4],
    lightCol: "#e0d0ff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float ground = p.y + 1.0;

  vec2  cell = floor((p.xz + 1.5) / 3.0);
  vec3  q    = p;
  q.xz = mod(q.xz + 1.5, 3.0) - 1.5;

  float s   = hash(cell);
  float top = 0.25 + s * 0.9;

  float stalk = max(length(q.xz) - 0.055, abs(q.y - (-1.0 + top * 0.5)) - top * 0.5);
  stalk = max(stalk, -1.0 - q.y);

  vec3  pc = q - vec3(0.0, -1.0 + top + 0.20, 0.0);
  pc.y *= 0.8;
  float pod = (length(pc) - (0.17 + 0.035 * sin(T * 1.6 + s * 6.2831))) * 0.8;

  return min(ground, smin(stalk, pod, 0.10));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 2.5) * 0.5);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  return mix(u_b * 0.15, u_b * 1.3, fres);
}
vec3 emission(vec3 p){
  vec2  cell = floor((p.xz + 1.5) / 3.0);
  float s    = hash(cell);
  vec2  q    = mod(p.xz + 1.5, 3.0) - 1.5;
  float top  = 0.25 + s * 0.9;
  vec2  c    = vec2(0.0, -1.0 + top + 0.20);
  float d    = length(vec2(length(q), p.y - c.y));
  float glow = smoothstep(0.34, 0.14, d);
  float breathe = 0.55 + 0.45 * sin(T * 1.8 + s * 6.2831);
  return mix(u_b, vec3(1.0, 0.85, 1.0), 0.35) * glow * breathe * 1.4;
}
    `
  },
  {
    name: "Volcanic Flow",
    cat: "nature",
    desc: "Basalt columns over running lava",
    a: "#0a0302",
    b: "#ff5a12",
    speed: 0.40,
    glow: 1.8,
    camDist: 4.6,
    camHeight: 0.8,
    camOrbit: 0.08,
    lightDir: [0.4, 0.75, 0.5],
    lightCol: "#ffb070",
    ambient: 0.08,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  // lava river surface
  float lava = p.y + 1.05
             + fbm(p.xz * 0.6 + T * 0.25) * 0.10
             + sin(p.x * 1.5 - T * 0.9) * 0.04;

  // hexagonal basalt columns
  vec2  cell = floor((p.xz + 1.0) / 2.0);
  vec2  q    = mod(p.xz + 1.0, 2.0) - 1.0;
  float s    = hash(cell);
  float h    = 0.6 + s * 1.4;

  // hexagonal prism approximation via max-of-planes
  vec2  qq = abs(q);
  float hex = max(qq.x * 0.866 + qq.y * 0.5, qq.y) - 0.55;
  float col = max(hex, abs(p.y + 1.0 - h * 0.5) - h * 0.5);

  return min(lava, col);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95){
    float flow = fbm(p.xz * 1.4 + T * 0.5);
    float crust = smoothstep(0.42, 0.62, flow);
    return mix(u_b * 1.2, vec3(0.06, 0.03, 0.02), crust);
  }
  return vec3(0.055, 0.05, 0.05) * (0.6 + fbm3(p * 4.0) * 0.8);
}
vec3 emission(vec3 p){
  float flow  = fbm(p.xz * 1.4 + T * 0.5);
  float crack = 1.0 - smoothstep(0.42, 0.62, flow);
  float near  = smoothstep(0.0, -0.4, p.y + 1.05);
  return u_b * crack * (0.6 + u_pulse * 0.8) * (0.5 + near) * 1.6;
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
  // Event horizon
  float bh = sdSphere(p, 0.62);

  // Accretion disk — a tilted annulus ∩ slab. (The old `q.y *= 6.0`
  // version was not a distance field and the marcher overshot it.)
  vec3  rp   = rotX(p, 0.35);
  float rad  = length(rp.xz);
  float disk = max(abs(rad - 1.55) - 0.50, abs(rp.y) - 0.035);

  return min(bh, disk);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (length(p) < 0.72) return vec3(0.005);

  float rad   = length(p.xz);
  float swirl = fbm(vec2(rad * 2.5 - T * 1.2, atan(p.z, p.x) * 1.5 + T * 0.4));

  vec3 hot = mix(vec3(1.0, 0.95, 0.85), u_b, smoothstep(1.05, 1.70, rad));
  hot = mix(hot, u_b * 0.25, smoothstep(1.60, 2.05, rad));
  return hot * (0.55 + swirl * 0.70);
}
vec3 emission(vec3 p){
  if (length(p) < 0.68) return vec3(0.0);

  float rad   = length(p.xz);
  float swirl = fbm(vec2(rad * 2.5 - T * 1.2, atan(p.z, p.x) * 1.5 + T * 0.4));
  float ring  = smoothstep(2.05, 1.10, rad);
  return mix(u_b, vec3(1.0), smoothstep(1.70, 1.05, rad)) * ring * (0.7 + swirl * 0.8) * 1.6;
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
  float d    = sdSphere(p, 1.1);
  float disp = fbm3(p * 2.0 + T * 0.2) * 0.15;
  return d - disp;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.60, 0.75, land);
  return mix(vec3(0.05, 0.02, 0.01), u_b * 0.7, lava);
}
vec3 emission(vec3 p){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.60, 0.78, land);
  return u_b * lava * (0.9 + 0.2 * sin(T * 1.5) + u_pulse * 0.5);
}
    `
  },
  {
    name: "Ringed Giant",
    cat: "space",
    desc: "A gas giant and its two ring bands",
    a: "#100a18",
    b: "#ffd9a0",
    speed: 0.18,
    glow: 1.1,
    camDist: 5.4,
    camHeight: 0.9,
    camOrbit: 0.10,
    lightDir: [0.6, 0.6, 0.5],
    lightCol: "#fff0d8",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float planet = sdSphere(p, 1.0);
  planet -= fbm3(p * 2.5 + T * 0.05) * 0.04;

  vec3  rp   = rotX(p, 0.40);
  float rad  = length(rp.xz);
  float ringA = max(abs(rad - 1.75) - 0.22, abs(rp.y) - 0.020);
  float ringB = max(abs(rad - 2.28) - 0.15, abs(rp.y) - 0.020);

  return min(planet, min(ringA, ringB));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  vec3  rp  = rotX(p, 0.40);
  float rad = length(rp.xz);

  // Ring surfaces are the only thing with rp.y ≈ 0 beyond the planet
  if (abs(rp.y) < 0.05 && rad > 1.30 && rad < 2.55){
    float band = 0.5 + 0.5 * sin(rad * 42.0);
    return mix(u_a * 2.2, u_b * 0.95, band * 0.7);
  }

  // Planet: banded gas giant
  float lat  = p.y / max(0.001, length(p));
  float band = 0.5 + 0.5 * sin(lat * 14.0 + fbm3(p * 3.0) * 1.5);
  vec3  col  = mix(u_a * 2.4, u_b, band);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return col * (0.7 + fres * 0.8);
}
    `
  },
  {
    name: "Nebula Core",
    cat: "space",
    desc: "A cluster of stars around a bright nucleus",
    a: "#050310",
    b: "#66b0ff",
    speed: 0.40,
    glow: 1.8,
    camDist: 5.0,
    camHeight: 0.6,
    camOrbit: 0.14,
    lightDir: [0.4, 0.8, 0.4],
    lightCol: "#ffffff",
    ambient: 0.06,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float d = 1e5;
  for (int i = 0; i < 7; i++){
    float fi = float(i);
    vec3  c  = vec3(
      sin(fi * 2.10 + T * 0.35),
      sin(fi * 1.30 + T * 0.27) * 0.6,
      cos(fi * 2.70 + T * 0.31)
    ) * (0.9 + fi * 0.22);

    float r = 0.15 + hash(vec2(fi, 3.0)) * 0.09
            + 0.02 * sin(T * 2.0 + fi);
    d = min(d, sdSphere(p - c, r));
  }
  d = smin(d, sdSphere(p, 0.42 + 0.03 * sin(T * 1.5)), 0.32);
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  return mix(u_a, u_b, fres);
}
vec3 emission(vec3 p){
  float r    = length(p);
  float core = smoothstep(0.95, 0.20, r);
  float puls = 0.6 + 0.4 * sin(r * 4.0 - T * 2.0);
  return mix(u_b, vec3(1.0, 0.95, 0.85), core) * (core * 2.0 + puls * 0.5);
}
    `
  },
  {
    name: "Warp Gate",
    cat: "space",
    desc: "A ring of metal holding a swirl of light",
    a: "#05070c",
    b: "#40e0ff",
    speed: 0.45,
    glow: 1.8,
    camDist: 4.4,
    camHeight: 0.5,
    camOrbit: 0.12,
    lightDir: [0.5, 0.7, 0.6],
    lightCol: "#cfefff",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float rr    = length(p.xy);
  float frame = length(vec2(rr - 1.25, p.z)) - 0.14;
  float mem   = max(rr - 1.12, abs(p.z) - 0.030);
  float base  = sdBox(p - vec3(0.0, -1.45, 0.0), vec3(0.85, 0.12, 0.5));
  return min(min(frame, mem), base);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float rr = length(p.xy);
  if (rr < 1.18 && abs(p.z) < 0.10) return u_a * 0.3;
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_a, u_b * 0.5, fres);
}
vec3 emission(vec3 p){
  float rr = length(p.xy);
  if (abs(p.z) > 0.08 || rr > 1.18) return vec3(0.0);

  float sw   = fbm(vec2(rr * 3.0 - T * 1.5, atan(p.y, p.x) * 2.0 + T * 0.6));
  float edge = smoothstep(1.18, 0.55, rr);
  return mix(u_b, vec3(1.0), edge * 0.7) * (0.5 + sw * 1.2) * (0.9 + u_pulse * 1.6);
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
float map(vec3 p){
  // Grooved floor
  vec2  g    = abs(fract(p.xz) - 0.5);
  float line = smoothstep(0.44, 0.50, max(g.x, g.y));
  float floorD = p.y + 0.90 + 0.05 * line;

  // Neon towers
  vec2  cell = floor((p.xz + 3.0) / 6.0);
  vec3  q    = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;

  float h = 0.4 + hash(cell) * 1.6 + u_pulse * 0.5;
  float w = 0.15 + hash(cell + 9.0) * 0.15;
  float box = sdBox(q - vec3(0.0, -0.9 + h, 0.0), vec3(w, h, w));

  return min(floorD, box);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.86){
    vec2  g    = abs(fract(p.xz) - 0.5);
    float grid = smoothstep(0.44, 0.50, max(g.x, g.y));
    return u_a * 0.35 + u_b * grid * 0.7;
  }
  float panel = step(0.5, fract(p.y * 4.0));
  return mix(u_a * 0.4, u_b * 1.2, panel);
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
vec3 ballPos(float i){
  float t0 = T * 0.8 + i * 2.1;
  float y  = abs(sin(t0)) * 1.1 - 0.6;
  float x  = sin(t0 * 0.7 + i * 3.1) * 0.9;
  float z  = cos(t0 * 0.6 + i * 2.7) * 0.9;
  return vec3(x, y, z);
}
float map(vec3 p){
  float d = 1e5;
  float r = 0.45 + u_pulse * 0.06;
  for (int i = 0; i < 5; i++){
    d = smin(d, sdSphere(p - ballPos(float(i)), r), 0.4);
  }
  d = min(d, p.y + 0.9);
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    return u_a * (0.4 + fbm(p.xz * 3.0 + T * 0.1) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_b * 0.3, u_b, fres) + vec3(0.2) * pow(max(0.0, n.y), 4.0);
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
  float wall = length(p.xy) - 1.25;

  vec3  q = p;
  q.z = mod(q.z + T * 2.5, 2.0) - 1.0;
  float rr = length(q.xy);

  // Annulus (inner hole + outer edge) with a bit of depth in z.
  // The old code used `-0.3 + length()` which filled the centre in.
  float ring = max(abs(rr - 0.92) - 0.28, abs(q.z) - 0.09);

  return min(wall, ring);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  return u_b * 0.25;
}
vec3 emission(vec3 p){
  vec3  q  = p;
  q.z = mod(q.z + T * 2.5, 2.0) - 1.0;
  float rr = length(q.xy);

  float isRing = smoothstep(0.11, 0.05, abs(q.z))
               * smoothstep(1.30, 1.10, rr)
               * smoothstep(0.55, 0.70, rr);

  return u_b * isRing * (1.5 + u_pulse * 1.5);
}
    `
  },
  {
    name: "Tesseract",
    cat: "abstract",
    desc: "Four nested shells, all turning",
    a: "#060a14",
    b: "#7fe6ff",
    speed: 0.35,
    glow: 1.3,
    camDist: 4.2,
    camHeight: 0.5,
    camOrbit: 0.13,
    lightDir: [0.5, 0.7, 0.55],
    lightCol: "#ffffff",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  vec3 q = rotZ(rotY(rotX(p, T * 0.35), T * 0.50), T * 0.25);

  float d = 1e5;
  float s = 1.0;
  for (int i = 0; i < 4; i++){
    float outer = sdBox(q, vec3(s)) - 0.025;
    float inner = -sdBox(q, vec3(s - 0.13));
    d = min(d, max(outer, inner));
    s *= 0.64;
  }
  return min(d, sdSphere(q, 0.13));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_a, u_b, 0.20 + fres * 0.80);
}
vec3 emission(vec3 p){
  float r = length(p);
  return u_b * smoothstep(0.55, 0.12, r) * (1.3 + u_pulse * 1.2);
}
    `
  },
  {
    name: "Kaleido Spires",
    cat: "abstract",
    desc: "Mirrored crystal towers",
    a: "#08060f",
    b: "#c07cff",
    speed: 0.30,
    glow: 1.4,
    camDist: 5.2,
    camHeight: 0.9,
    camOrbit: 0.09,
    lightDir: [0.45, 0.75, 0.5],
    lightCol: "#ffffff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float ground = p.y + 1.0;

  // Mirror in x and z, then repeat — an exact kaleidoscope.
  vec2  q    = abs(p.xz);
  vec2  cell = floor(q / 2.2);
  q = mod(q, 2.2) - 1.1;

  float s = hash(cell);
  float h = 0.8 + s * 1.8;
  float w = 0.18 + hash(cell + 4.7) * 0.16;

  float spire = sdBox(vec3(q.x, p.y + 1.0 - h, q.y), vec3(w, h, w));

  // octahedral tip
  vec3  tp = vec3(q.x, p.y + 1.0 - h * 2.0, q.y);
  float tip = (abs(tp.x) + abs(tp.y) + abs(tp.z) - w * 2.0) * 0.55;

  return min(ground, min(spire, tip));
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95) return u_a * (0.5 + fbm(p.xz * 2.0) * 0.5);

  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  float vein = smoothstep(0.65, 0.95, fbm3(p * 4.0 + T * 0.3));

  vec3 col = mix(u_a * 2.0, u_b, fres);
  return col + u_b * vein * 0.9;
}
    `
  },
  {
    name: "DNA Helix",
    cat: "abstract",
    desc: "Two strands and their rungs, always turning",
    a: "#040810",
    b: "#4fe0a8",
    speed: 0.40,
    glow: 1.5,
    camDist: 4.2,
    camHeight: 0.5,
    camOrbit: 0.12,
    lightDir: [0.5, 0.7, 0.5],
    lightCol: "#ffffff",
    ambient: 0.14,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float ang = p.y * 1.6 + T * 0.9;
  vec2  c1  = vec2(cos(ang), sin(ang)) * 0.55;
  vec2  c2  = -c1;

  // 0.72 compensates for the pitch of the helix so the field stays conservative
  float d1 = (length(p.xz - c1) - 0.12) * 0.72;
  float d2 = (length(p.xz - c2) - 0.12) * 0.72;
  float d  = min(d1, d2);

  // Base-pair rungs, every 0.9 in y
  float seg = floor(p.y / 0.9 + 0.5);
  float yc  = seg * 0.9;
  float a2  = yc * 1.6 + T * 0.9;
  float ca  = cos(a2), sa = sin(a2);
  vec2  rq  = vec2(ca * p.x - sa * p.z, sa * p.x + ca * p.z);
  float rung = sdBox(vec3(rq.x, p.y - yc, rq.y), vec3(0.55, 0.042, 0.042));

  return min(d, rung);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  float band = 0.5 + 0.5 * sin(p.y * 2.0 - T * 1.2);
  return mix(u_a * 2.5, u_b, 0.35 + band * 0.65) * (0.7 + fres * 0.7);
}
vec3 emission(vec3 p){
  float seg = floor(p.y / 0.9 + 0.5);
  float yc  = seg * 0.9;
  float near = smoothstep(0.18, 0.0, abs(p.y - yc));
  return u_b * near * (0.6 + u_pulse * 1.6);
}
    `
  },
  {
    name: "Pendulum Wave",
    cat: "abstract",
    desc: "Nine pendulums, each a little faster",
    a: "#05070c",
    b: "#ffd070",
    speed: 0.30,
    glow: 1.2,
    camDist: 4.6,
    camHeight: 0.5,
    camOrbit: 0.06,
    lightDir: [0.5, 0.7, 0.6],
    lightCol: "#ffffff",
    ambient: 0.16,
    custom: `
#define HAS_MATERIAL
float segDist(vec3 p, vec3 a, vec3 b, float r){
  vec3  pa = p - a;
  vec3  ba = b - a;
  float h  = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float map(vec3 p){
  float d = p.y + 0.9;                                             // floor
  d = min(d, sdBox(p - vec3(0.0, 2.00, 0.0), vec3(2.05, 0.06, 0.08))); // bar

  for (int i = 0; i < 9; i++){
    float fi   = float(i);
    float x    = (fi - 4.0) * 0.42;
    float len  = 1.42 + fi * 0.055;
    float ang  = sin(T * (1.0 + fi * 0.08) * 0.9) * 0.75;

    vec3 pivot = vec3(x, 1.94, 0.0);
    vec3 bob   = pivot + vec3(sin(ang), -cos(ang), 0.0) * len;

    d = min(d, sdSphere(p - bob, 0.15));
    d = min(d, segDist(p, pivot, bob, 0.012));
  }
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85) return u_a * (0.5 + fbm(p.xz * 3.0) * 0.4);
  if (p.y > 1.90) return u_a * 2.0;

  float id   = clamp((p.x + 1.9) / 0.42, 0.0, 8.0);
  float tint = fract(id * 0.31);
  vec3  col  = mix(u_b, vec3(1.0, 0.6, 0.35), tint);

  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(col * 0.25, col, fres);
}
    `
  },
  {
    name: "Circuit City",
    cat: "abstract",
    desc: "Glowing traces between dark blocks",
    a: "#03070d",
    b: "#38e8ff",
    speed: 0.35,
    glow: 1.7,
    camDist: 4.6,
    camHeight: 0.8,
    camOrbit: 0.07,
    lightDir: [0.4, 0.8, 0.45],
    lightCol: "#d0f4ff",
    ambient: 0.10,
    custom: `
#define HAS_MATERIAL
#define HAS_EMISSION
float map(vec3 p){
  float ground = p.y + 1.0;

  vec2  cell = floor((p.xz + 1.0) / 2.0);
  vec2  q    = mod(p.xz + 1.0, 2.0) - 1.0;

  float h = hash(cell);
  float bh = 0.25 + h * 1.70 + u_pulse * 0.35;
  float w  = 0.22 + hash(cell + 7.3) * 0.30;

  float box = sdBox(vec3(q.x, p.y + 1.0 - bh, q.y), vec3(w, bh, w));
  return min(ground, box);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.95){
    vec2  g     = abs(fract(p.xz * 0.5) - 0.5);
    float trace = smoothstep(0.42, 0.48, max(g.x, g.y));
    return u_a * 0.6 + u_b * trace * 0.5;
  }
  float win = step(0.5, fract(p.y * 6.0)) * step(0.5, fract((p.x + p.z) * 3.0));
  return mix(u_a * 0.7, u_b * 1.2, win * 0.8);
}
vec3 emission(vec3 p){
  if (p.y < -0.95){
    vec2  g     = abs(fract(p.xz * 0.5) - 0.5);
    float trace = smoothstep(0.44, 0.49, max(g.x, g.y));
    return u_b * trace * (0.8 + u_pulse * 2.2);
  }
  float win = step(0.5, fract(p.y * 6.0)) * step(0.5, fract((p.x + p.z) * 3.0));
  return u_b * win * 0.7;
}
    `
  },
  {
    name: "Fractal Peaks",
    cat: "abstract",
    desc: "Ridged multifractal mountains",
    a: "#070b12",
    b: "#8fc4ff",
    speed: 0.18,
    glow: 1.1,
    camDist: 6.0,
    camHeight: 1.3,
    camOrbit: 0.06,
    lightDir: [0.55, 0.65, 0.45],
    lightCol: "#ffffff",
    ambient: 0.16,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  vec2  q   = p.xz;
  float h   = 0.0;
  float amp = 1.0;
  float f   = 0.30;
  for (int i = 0; i < 3; i++){
    float n = fbm(q * f + float(i) * 17.3);
    h += amp * (1.0 - abs(n * 2.0 - 1.0));   // ridged
    amp *= 0.5;
    f   *= 2.2;
  }
  h = h * 0.80 - 0.45;
  return (p.y - h) * 0.55;   // heightfields need scaling to stay conservative
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float snow = smoothstep(0.45, 0.95, p.y + fbm(p.xz * 1.5) * 0.3);
  float rock = fbm(p.xz * 5.0);
  vec3  col  = mix(u_a * 2.0, u_b * 0.65, rock * 0.7);
  col = mix(col, vec3(0.92, 0.96, 1.0), snow * 0.85);

  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return col + u_b * fres * 0.25;
}
    `
  },
  {
    name: "Vortex Funnel",
    cat: "abstract",
    desc: "A hollow tornado of spinning shell",
    a: "#06040e",
    b: "#b070ff",
    speed: 0.55,
    glow: 1.6,
    camDist: 4.8,
    camHeight: 0.6,
    camOrbit: 0.10,
    lightDir: [0.4, 0.8, 0.45],
    lightCol: "#ffffff",
    ambient: 0.12,
    custom: `
#define HAS_MATERIAL
float map(vec3 p){
  float ground = p.y + 1.2;
  float y      = p.y + 1.2;
  float R      = 0.15 + y * 0.45;

  float d = abs(length(p.xz) - R) - 0.14;
  d -= 0.030 * sin(atan(p.z, p.x) * 6.0 + y * 4.0 - T * 2.0);
  d = max(d, -y);
  d = max(d, y - 3.2);

  return min(ground, d * 0.80);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float y = p.y + 1.2;
  float swirl = 0.5 + 0.5 * sin(atan(p.z, p.x) * 6.0 + y * 4.0 - T * 2.0);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3 col = mix(u_a * 2.2, u_b * 1.4, swirl);
  return col * (0.6 + fres * 0.9);
}
    `
  }

];
