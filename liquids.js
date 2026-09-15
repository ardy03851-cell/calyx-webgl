// liquids.js — Calyx fluid definitions
// 
// Each liquid object supports the following fields:
//   name    {string}  Display name
//   cat     {string}  Category: "organic" | "energy" | "matter" | "strange"
//   desc    {string}  Short description
//   a       {string}  Base color (hex)
//   b       {string}  Accent / highlight color (hex)
//   motion  {number}  Motion algorithm ID (shader supports 0–25 explicitly,
//                     26+ uses a fallback fbm pattern; you can extend the
//                     shader to add more branches)
//   speed   {number}  Time multiplier
//
// Optional fields (safe to add, ignored by default but fully supported
// by the data layer and ready to be wired into the shader):
//   glow    {number}  Extra glow intensity        (default 0.45)
//   soft    {number}  Softness                    (default 0.30)
//   scale   {number}  Pattern scale multiplier    (default 1.00)
//   warp    {number}  Distortion strength         (default 0.00)
//   pulse   {number}  Pulse response multiplier   (default 1.00)
//
// Any other custom properties are preserved as-is and can be consumed
// by future shader versions or UI features without breaking the app.

export default [
  // ------------------------------------------------------------------
  // 1–42: Original set
  // ------------------------------------------------------------------
  {
    name: "Deep Obsidian",
    cat: "organic",
    desc: "Flowing strata",
    a: "#17243d",
    b: "#5c82c9",
    motion: 0,
    speed: 0.65
  },
  {
    name: "Ink Tendrils",
    cat: "strange",
    desc: "Soft branching ink",
    a: "#100d1c",
    b: "#71538f",
    motion: 1,
    speed: 0.55
  },
  {
    name: "Molten Gold",
    cat: "matter",
    desc: "Warm cellular heat",
    a: "#2b1705",
    b: "#b47b32",
    motion: 2,
    speed: 0.70
  },
  {
    name: "Emerald Vortex",
    cat: "organic",
    desc: "Quiet rotational fluid",
    a: "#06231b",
    b: "#3a9f7b",
    motion: 3,
    speed: 0.55
  },
  {
    name: "Crystal Melt",
    cat: "matter",
    desc: "Slow geometric facets",
    a: "#171326",
    b: "#8d7dbd",
    motion: 4,
    speed: 0.55
  },
  {
    name: "Solar Plasma",
    cat: "energy",
    desc: "Muted flare turbulence",
    a: "#301d0b",
    b: "#c77832",
    motion: 5,
    speed: 0.75
  },
  {
    name: "Arctic Waves",
    cat: "matter",
    desc: "Frozen ribbons",
    a: "#081a24",
    b: "#6caec1",
    motion: 6,
    speed: 0.45
  },
  {
    name: "Toxic Bubbles",
    cat: "strange",
    desc: "Low-key gas pockets",
    a: "#152006",
    b: "#79a33d",
    motion: 7,
    speed: 0.55
  },
  {
    name: "Midnight Nebula",
    cat: "strange",
    desc: "Quiet orbital clouds",
    a: "#0b0820",
    b: "#645a9f",
    motion: 8,
    speed: 0.50
  },
  {
    name: "Eclipse Ink",
    cat: "strange",
    desc: "Soft reactive ring",
    a: "#210d13",
    b: "#a84459",
    motion: 9,
    speed: 0.45
  },
  {
    name: "Biolume Spores",
    cat: "organic",
    desc: "Dim living particles",
    a: "#06201d",
    b: "#37a996",
    motion: 10,
    speed: 0.55
  },
  {
    name: "Copper Oxide",
    cat: "matter",
    desc: "Oxidized flow",
    a: "#21140b",
    b: "#8e8064",
    motion: 11,
    speed: 0.50
  },
  {
    name: "Sakura Petals",
    cat: "organic",
    desc: "Gentle petal drift",
    a: "#240f19",
    b: "#b86c8d",
    motion: 3,
    speed: 0.38
  },
  {
    name: "Coffee",
    cat: "organic",
    desc: "Warm, slow crema flow",
    a: "#170d07",
    b: "#8b4f2e",
    motion: 12,
    speed: 0.28
  },
  {
    name: "Matrix Rain",
    cat: "energy",
    desc: "Quiet digital cascade",
    a: "#07190b",
    b: "#4f9b62",
    motion: 14,
    speed: 0.50
  },
  {
    name: "Royal Velvet",
    cat: "organic",
    desc: "Heavy folded fluid",
    a: "#160d20",
    b: "#8b639e",
    motion: 15,
    speed: 0.40
  },
  {
    name: "Neon Sunset",
    cat: "energy",
    desc: "Soft ribbon plasma",
    a: "#25120b",
    b: "#b85f3e",
    motion: 16,
    speed: 0.65
  },
  {
    name: "Aurora Curtains",
    cat: "energy",
    desc: "Muted magnetic sheets",
    a: "#071b1b",
    b: "#54aaa0",
    motion: 17,
    speed: 0.48
  },
  {
    name: "Liquid Mercury",
    cat: "matter",
    desc: "Cool reflective waves",
    a: "#1c2025",
    b: "#b7c0c7",
    motion: 18,
    speed: 0.45
  },
  {
    name: "Carbon Lattice",
    cat: "matter",
    desc: "Dense hard-surface flow",
    a: "#0c1017",
    b: "#657080",
    motion: 19,
    speed: 0.35
  },
  {
    name: "Electric Spiral",
    cat: "energy",
    desc: "Gentle charged vortex",
    a: "#120c22",
    b: "#8066bd",
    motion: 20,
    speed: 0.55
  },
  {
    name: "Swamp Spores",
    cat: "organic",
    desc: "Suspended earthy growth",
    a: "#101a0b",
    b: "#6f8f49",
    motion: 21,
    speed: 0.40
  },
  {
    name: "Fire Veins",
    cat: "energy",
    desc: "Dim branching heat",
    a: "#240e08",
    b: "#b84f2d",
    motion: 22,
    speed: 0.60
  },
  {
    name: "Liquid Chrome",
    cat: "matter",
    desc: "Soft mirror distortion",
    a: "#20252b",
    b: "#c4ccd2",
    motion: 23,
    speed: 0.40
  },
  {
    name: "Rain Glass",
    cat: "matter",
    desc: "Vertical fluid sheets",
    a: "#081a22",
    b: "#71a7ba",
    motion: 24,
    speed: 0.38
  },
  {
    name: "Rose Smoke",
    cat: "strange",
    desc: "Floral low-density turbulence",
    a: "#220c17",
    b: "#ad4f78",
    motion: 25,
    speed: 0.40
  },
  {
    name: "Cyan Shock",
    cat: "energy",
    desc: "Low-energy pressure waves",
    a: "#052023",
    b: "#43a9ad",
    motion: 26,
    speed: 0.60
  },
  {
    name: "Amber Lava",
    cat: "matter",
    desc: "Slow cracked convection",
    a: "#281708",
    b: "#bd7b2f",
    motion: 27,
    speed: 0.55
  },
  {
    name: "Dirty Water",
    cat: "matter",
    desc: "Heavy surface current",
    a: "#10191b",
    b: "#496d72",
    motion: 12,
    speed: 0.22
  },
  {
    name: "Black Oil",
    cat: "matter",
    desc: "Very slow viscous flow",
    a: "#050607",
    b: "#252a2d",
    motion: 12,
    speed: 0.18
  },
  {
    name: "Industrial Coolant",
    cat: "matter",
    desc: "Steady chemical flow",
    a: "#071817",
    b: "#43867f",
    motion: 6,
    speed: 0.28
  },
  {
    name: "Rust Slurry",
    cat: "matter",
    desc: "Dense sediment flow",
    a: "#21110b",
    b: "#8c4d35",
    motion: 2,
    speed: 0.28
  },
  {
    name: "Blood",
    cat: "organic",
    desc: "Deep red viscous waves",
    a: "#260508",
    b: "#a51e2b",
    motion: 12,
    speed: 0.24
  },
  {
    name: "Sewage",
    cat: "matter",
    desc: "Murky particulate flow",
    a: "#10160a",
    b: "#55613a",
    motion: 11,
    speed: 0.18
  },
  {
    name: "Oat Milk",
    cat: "organic",
    desc: "Soft creamy surface",
    a: "#242018",
    b: "#b9a98c",
    motion: 12,
    speed: 0.20
  },
  {
    name: "Black Tea",
    cat: "organic",
    desc: "Calm amber-brown flow",
    a: "#1b1009",
    b: "#7d4d2c",
    motion: 12,
    speed: 0.22
  },
  {
    name: "Sea Glass",
    cat: "matter",
    desc: "Slow cool translucent drift",
    a: "#07191b",
    b: "#4b8e8d",
    motion: 6,
    speed: 0.22
  },
  {
    name: "Rainwater",
    cat: "matter",
    desc: "Barely moving clear water",
    a: "#07131a",
    b: "#568493",
    motion: 0,
    speed: 0.20
  },
  {
    name: "Lavender Water",
    cat: "organic",
    desc: "Quiet violet diffusion",
    a: "#171323",
    b: "#766b91",
    motion: 15,
    speed: 0.18
  },
  {
    name: "Honey",
    cat: "organic",
    desc: "Thick golden current",
    a: "#2b1b06",
    b: "#b18438",
    motion: 13,
    speed: 0.18
  },
  {
    name: "Clay Wash",
    cat: "matter",
    desc: "Earthy suspended flow",
    a: "#1e120c",
    b: "#795c47",
    motion: 12,
    speed: 0.17
  },
  {
    name: "Moon Milk",
    cat: "strange",
    desc: "Pale nocturnal drift",
    a: "#171922",
    b: "#9aa1b2",
    motion: 15,
    speed: 0.18
  },

  // ------------------------------------------------------------------
  // 43–50: New enhanced liquids with extra properties
  // ------------------------------------------------------------------
  {
    name: "Quantum Foam",
    cat: "strange",
    desc: "Subatomic shimmer",
    a: "#0a0a1a",
    b: "#7a8cff",
    motion: 26,
    speed: 0.60,
    glow: 0.80,
    scale: 1.40,
    soft: 0.25
  },
  {
    name: "Nebula Bloom",
    cat: "organic",
    desc: "Expansive cosmic cloud",
    a: "#120a1e",
    b: "#b57aff",
    motion: 27,
    speed: 0.40,
    glow: 0.90,
    soft: 0.50,
    warp: 0.15
  },
  {
    name: "Magma Core",
    cat: "matter",
    desc: "Deep planetary heat",
    a: "#1a0602",
    b: "#ff6b2b",
    motion: 28,
    speed: 0.50,
    glow: 1.20,
    warp: 0.30,
    pulse: 1.40
  },
  {
    name: "Frost Crystal",
    cat: "matter",
    desc: "Icy geometric growth",
    a: "#0a1420",
    b: "#a8d8ff",
    motion: 29,
    speed: 0.35,
    scale: 1.80,
    soft: 0.10,
    glow: 0.60
  },
  {
    name: "Void Silk",
    cat: "strange",
    desc: "Dark elegant folds",
    a: "#08080c",
    b: "#6a4c93",
    motion: 30,
    speed: 0.30,
    soft: 0.60,
    glow: 0.55
  },
  {
    name: "Solar Wind",
    cat: "energy",
    desc: "Charged particle stream",
    a: "#1a1208",
    b: "#ffaa33",
    motion: 31,
    speed: 0.80,
    glow: 1.00,
    warp: 0.20,
    pulse: 1.20
  },
  {
    name: "Abyssal Glow",
    cat: "organic",
    desc: "Deep sea bioluminescence",
    a: "#021a1a",
    b: "#2ee6c8",
    motion: 3,
    speed: 0.25,
    glow: 1.10,
    pulse: 1.50,
    soft: 0.40
  },
  {
    name: "Chromatic Oil",
    cat: "matter",
    desc: "Iridescent thin film",
    a: "#101018",
    b: "#c77dff",
    motion: 14,
    speed: 0.40,
    scale: 0.80,
    glow: 0.70,
    soft: 0.20
  }
];
