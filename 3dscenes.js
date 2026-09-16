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
  float sphereD = sdSphere(p - vec3(0.0, 0.15, 0.0), 0.85);
  return min(floorD, sphereD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    float pat = fbm(p.xz * 2.0 + T * 0.1);
    return u_a * (0.4 + pat * 0.8);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  return mix(u_b * 0.15, u_b, fres);
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
  float octa = (abs(q.x) + abs(q.y) + abs(q.z) - 0.9) * 0.55;
  float cage = sdBox(q, vec3(1.6)) - 0.05;
  float hole = -sdBox(q, vec3(1.55));
  cage = max(cage, hole);
  return min(octa, cage);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  float facet = step(0.5, fract(dot(n, vec3(3.1, 4.7, 2.3)) * 2.0));
  vec3 base = mix(u_b * 0.2, u_b, facet);
  return mix(base * 0.5, base, fres);
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
  float nois = fbm3(p * 2.5 + T * 0.4) * 0.15;
  return d - nois;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float crack = fbm3(p * 3.5 + T * 0.6);
  float heat = smoothstep(0.55, 0.75, crack);
  return mix(vec3(0.08, 0.03, 0.01), u_b * 0.6, heat);
}
vec3 emission(vec3 p){
  float crack = fbm3(p * 3.5 + T * 0.6);
  float heat = smoothstep(0.60, 0.78, crack);
  float pulse = 0.85 + 0.15 * sin(T * 2.0);
  return u_b * heat * pulse * 1.2;
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
  float floorD = p.y + 0.8;
  // grid bumps on the floor
  vec2 g = abs(fract(p.xz) - 0.5);
  float grid = max(g.x, g.y) - 0.45;
  floorD = min(floorD, p.y + 0.82 - grid * 0.05);
  float sphereD = sdSphere(p - vec3(0.0, 0.15, 0.0), 0.85);
  return min(floorD, sphereD);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.75){
    return mix(u_a * 0.5, u_a * 1.5, step(0.48, max(abs(fract(p.x)-0.5), abs(fract(p.z)-0.5))));
  }
  // Fake environment reflection — sky gradient + horizon
  vec3 ref = reflect(rd, n);
  float sky = smoothstep(-0.4, 0.6, ref.y);
  float horiz = pow(1.0 - abs(ref.y), 12.0);
  vec3 env = mix(vec3(0.02, 0.04, 0.08), u_b, sky);
  env += u_b * horiz * 0.6;
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
float waves(vec2 q){
  float w = 0.0;
  w += sin(q.x * 1.2 + T * 1.4) * 0.14;
  w += sin(q.y * 1.7 - T * 1.1) * 0.10;
  w += fbm(q * 0.8 + T * 0.2) * 0.28;
  w += fbm(q * 2.5 - T * 0.4) * 0.08;
  return w;
}
float map(vec3 p){
  return p.y - waves(p.xz);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
  vec3 deep = u_a;
  vec3 shallow = u_b;
  // Sun specular
  vec3 L = normalize(-u_lightDir);
  vec3 h = normalize(L - rd);
  float spec = pow(max(0.0, dot(n, h)), 120.0);
  return mix(deep, shallow, fres) + vec3(1.0, 0.95, 0.85) * spec * 1.5;
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
  float w = fbm3(p * 0.8 + vec3(0.0, T * 0.3, 0.0)) * 0.4;
  float floorD = p.y + 1.5 + w;
  // Bubbles — periodic spheres rising
  vec3 bp = p;
  bp.y += T * 0.6;
  vec3 id = floor(bp * 2.0);
  vec3 fp = fract(bp * 2.0) - 0.5;
  float seed = hash3(id);
  fp.x += (seed - 0.5) * 0.4;
  fp.z += (hash3(id + 3.7) - 0.5) * 0.4;
  float r = 0.10 + hash3(id + 1.3) * 0.10;
  float bubble = sdSphere(fp, r);
  return min(floorD, bubble);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -1.0){
    return u_a * (0.6 + fbm(p.xz * 3.0 + T * 0.4) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.5);
  return mix(u_b * 0.3, u_b, fres);
}
vec3 emission(vec3 p){
  // Caustic-like shimmer from above
  float c = fbm(p.xz * 4.0 + T * 0.8);
  float c2 = fbm(p.xz * 8.0 - T * 0.5);
  return u_b * pow(smoothstep(0.6, 0.85, c * c2 * 2.0), 2.0) * 0.4;
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
  vec3 q = p;
  q.xz = mod(q.xz + 2.0, 4.0) - 2.0;
  float h = 0.7 + hash(floor((p.xz + 2.0) / 4.0)) * 0.7;
  float r = 0.28 + hash(floor((p.xz + 2.0) / 4.0) + 7.7) * 0.1;
  float pillar = sdPillar(q - vec3(0.0, -0.9 + h, 0.0), h, r);
  return min(floorD, pillar);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    return u_a * (0.5 + fbm(p.xz * 2.0 + T * 0.05) * 0.5);
  }
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  vec3 base = mix(u_b * 0.4, u_b * 1.2, fres);
  float vein = smoothstep(0.7, 0.9, fbm3(p * 5.0 + T * 0.3));
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
  // Rolling hills
  float terrain = -0.6 + fbm3(p * 0.4) * 1.2 + sin(p.x * 0.3 + T * 0.05) * 0.15;
  float floorD = p.y - terrain;
  // Trees — sparse cones
  vec3 q = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;
  float seed = hash(floor((p.xz + 3.0) / 6.0));
  if (seed > 0.55){
    float trunk = sdCylinder(q - vec3(0.0, 0.2, 0.0), 0.06, 0.4);
    vec3 top = q - vec3(0.0, 0.6, 0.0);
    float canopy = sdSphere(top, 0.35) - 0.05;
    float tree = min(trunk, canopy);
    floorD = min(floorD, tree);
  }
  return floorD;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (n.y < -0.4){
    return u_a * 0.5;
  }
  float snow = smoothstep(0.0, 0.7, n.y);
  float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
  return mix(u_a, u_b, snow * 0.9 + fres * 0.4);
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
  float bh = sdSphere(p, 0.65);
  // Accretion disk — flattened torus
  vec3 q = p;
  q.y *= 6.0;
  float disk = length(q) - 1.6;
  disk = max(disk, abs(p.y) - 0.08);
  disk = max(disk, 0.9 - length(p.xz));
  return min(bh, disk);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  // Disk: hot swirling gas
  float r = length(p.xz);
  float a = atan(p.z, p.x);
  float swirl = fbm(vec2(r * 3.0 - T * 1.5, a * 2.0 + T * 0.5));
  vec3 hot = mix(u_b, vec3(1.0, 1.0, 0.9), smoothstep(1.0, 2.5, r));
  hot = mix(hot, u_b * 0.4, smoothstep(1.6, 3.0, r));
  return hot * (0.6 + swirl * 0.6);
}
vec3 emission(vec3 p){
  float r = length(p.xz);
  float swirl = fbm(vec2(r * 3.0 - T * 1.5, atan(p.z, p.x) * 2.0 + T * 0.5));
  float intensity = smoothstep(3.0, 1.0, r) * (0.8 + swirl * 0.6);
  return mix(u_b, vec3(1.0), smoothstep(1.2, 2.0, r)) * intensity * 1.5;
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
  // FBM displacement — lumpy planet
  float disp = fbm3(p * 2.0 + T * 0.2) * 0.15;
  d -= disp;
  return d;
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.6, 0.75, land);
  return mix(vec3(0.05, 0.02, 0.01), u_b * 0.7, lava);
}
vec3 emission(vec3 p){
  float land = fbm3(p * 3.0 + T * 0.3);
  float lava = smoothstep(0.60, 0.78, land);
  return u_b * lava * (0.9 + 0.2 * sin(T * 1.5));
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
  // Floor plane
  float floorD = p.y + 0.9;
  // Grid lines (notched so they show)
  vec2 g = abs(fract(p.xz) - 0.5);
  float line = min(g.x, g.y) - 0.47;
  floorD = min(floorD, p.y + 0.91 - line * 0.06);
  // Neon towers scattered around
  vec3 q = p;
  q.xz = mod(q.xz + 3.0, 6.0) - 3.0;
  float h = 0.4 + hash(floor((p.xz + 3.0) / 6.0)) * 1.6;
  float w = 0.15 + hash(floor((p.xz + 3.0) / 6.0) + 9.0) * 0.15;
  float box = sdBox(q - vec3(0.0, -0.9 + h, 0.0), vec3(w, h, w));
  return min(floorD, box);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  if (p.y < -0.85){
    float grid = smoothstep(0.44, 0.47, min(abs(fract(p.x) - 0.5), abs(fract(p.z) - 0.5)));
    return u_a * 0.3 + u_b * grid * 0.6;
  }
  // Tower: neon panel look
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
// Simple fake physics: each ball bounces inside a box.
vec3 ballPos(float i){
  float t0 = T * 0.8 + i * 2.1;
  // Gravity-driven vertical bounce
  float y = abs(sin(t0)) * 1.1 - 0.6;
  float x = sin(t0 * 0.7 + i * 3.1) * 0.9;
  float z = cos(t0 * 0.6 + i * 2.7) * 0.9;
  return vec3(x, y, z);
}
float map(vec3 p){
  float d = 1e5;
  for (int i = 0; i < 5; i++){
    vec3 c = ballPos(float(i));
    d = smin(d, sdSphere(p - c, 0.45), 0.4);
  }
  // Floor
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
float sdTrunk(vec3 p, out float bark) {
    // Twist and taper trunk using noise
    vec3 q = p;
    float n = fbm3(q * 1.5 + vec3(0.0, q.y * 0.5, 0.0)) * 0.25;
    q.x += n;
    q.z += n;
    
    // Main tapered cylinder trunk
    float r = 0.22 * (1.2 - clamp(q.y * 0.5, 0.0, 0.9));
    float d = length(q.xz) - r;
    
    // Add large root flares at the base
    float roots = length(p.xz) - (0.35 * exp(-p.y * 2.5));
    d = smin(d, roots, 0.25);
    
    // Bark texture displacement
    bark = fbm3(p * 8.0) * 0.04;
    return d - bark;
}

float sdCanopy(vec3 p) {
    // Multi-lobed fluffy organic canopy using smooth minimums on distorted spheres
    vec3 q = p - vec3(0.0, 1.4, 0.0);
    float d = sdSphere(q, 0.95);
    
    // Carve out organic irregularities and blend secondary lobes
    d += fbm3(q * 2.2) * 0.35;
    d = smin(d, sdSphere(q + vec3(0.5, -0.2, 0.3), 0.7), 0.3);
    d = smin(d, sdSphere(q + vec3(-0.4, 0.1, -0.4), 0.65), 0.3);
    d = smin(d, sdSphere(q + vec3(0.2, 0.5, -0.3), 0.6), 0.3);
    return d;
}

float map(vec3 p) {
    // Ground plane
    float ground = p.y + 0.8;
    
    float bark;
    float trunk = sdTrunk(p, bark);
    float canopy = sdCanopy(p);
    
    // Combine tree parts smoothly
    float tree = smin(trunk, canopy, 0.15);
    
    return min(ground, tree);
}

vec3 materialColor(vec3 p, vec3 n, vec3 rd) {
    // Ground shading
    if (p.y < -0.75) {
        float pat = fbm(p.xz * 2.0);
        return u_a * (0.5 + pat * 0.5);
    }
    
    // Distinguish canopy (leaves) vs trunk/branches based on height and normal orientation
    float isCanopy = smoothstep(0.4, 1.2, p.y) * (1.0 - smoothstep(0.7, 0.9, abs(n.y)));
    
    if (isCanopy > 0.3) {
        // Leaf foliage color with subtle variation
        float leafNoise = fbm3(p * 5.0);
        vec3 leafCol = mix(u_b * 0.6, u_b * 1.3, leafNoise);
        float fres = pow(1.0 - max(0.0, dot(n, -rd)), 2.0);
        return mix(leafCol, u_b * 1.5, fres * 0.3);
    } else {
        // Bark / wood color
        float woodNoise = fbm3(p * 4.0);
        vec3 woodCol = mix(vec3(0.22, 0.14, 0.08), vec3(0.38, 0.26, 0.16), woodNoise);
        return woodCol;
    }
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
  // Tube: distance to the wall of a cylinder along z
  float wall = length(p.xy) - 1.2;
  // Rings every unit along z
  vec3 q = p;
  q.z = mod(q.z + T * 2.5, 2.0) - 1.0;
  float ring = length(q.xy) - 0.9;
  ring = max(ring, -0.3 + length(q.xy));
  ring = max(ring, abs(q.z) - 0.15);
  return min(wall, ring);
}
vec3 materialColor(vec3 p, vec3 n, vec3 rd){
  return u_b * 0.3;
}
vec3 emission(vec3 p){
  // Rings glow; walls stay dark
  vec3 q = p;
  q.z = mod(q.z + T * 2.5, 2.0) - 1.0;
  float isRing = smoothstep(0.2, 0.15, abs(q.z)) *
                 smoothstep(1.1, 0.9, length(q.xy));
  return u_b * isRing * 1.5;
}
    `
  }

];
