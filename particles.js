/* ============================================================
   ParticleSystem — GPU-friendly pooled particles
   Types: 'splash' (water droplets), 'wake' (foam), 'spray' (mist)
   ============================================================ */
'use strict';

class ParticleSystem {
  constructor(scene, max = 1500) {
    this.max = max;
    this.scene = scene;

    // per-particle CPU state
    this.p = [];
    for (let i = 0; i < max; i++)
      this.p.push({ alive:false, x:0,y:0,z:0, vx:0,vy:0,vz:0,
                    life:0, maxLife:1, size:1, type:'splash', drag:1, grav:1 });

    // geometry buffers
    this.pos  = new Float32Array(max*3);
    this.sizes = new Float32Array(max);
    this.alphas = new Float32Array(max);
    this.colors = new Float32Array(max*3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute('aAlpha',   new THREE.BufferAttribute(this.alphas, 1));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(this.colors, 3));

    // soft round sprite generated procedurally (no texture files needed)
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(0.4,'rgba(255,255,255,0.6)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(cv);

    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      uniforms: { uTex: { value: tex } },
      vertexShader: `
        attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
        varying float vA; varying vec3 vC;
        void main(){
          vA = aAlpha; vC = aColor;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = aSize * (240.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uTex; varying float vA; varying vec3 vC;
        void main(){
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vC, t.a * vA);
          if (gl_FragColor.a < 0.01) discard;
        }`
    });

    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.cursor = 0;
  }

  _spawn(x,y,z, vx,vy,vz, life, size, type, color) {
    const p = this.p[this.cursor];
    this.cursor = (this.cursor+1) % this.max;
    Object.assign(p, { alive:true, x,y,z, vx,vy,vz, life:0, maxLife:life, size, type });
    p.color = color;
    p.grav = type==='splash' ? 9.8 : type==='spray' ? 2.5 : 0.4;
    p.drag = type==='wake' ? 2.5 : 0.6;
  }

  /** one-shot burst (jump-in splash, etc.) */
  burst(x, y, z, count, type='splash') {
    for (let i=0;i<count;i++){
      const a = Math.random()*Math.PI*2, r = Math.random();
      const up = type==='splash' ? 2+Math.random()*4 : 0.5+Math.random();
      this._spawn(x, y, z,
        Math.cos(a)*r*3, up, Math.sin(a)*r*3,
        0.5+Math.random()*0.8, 0.6+Math.random()*1.4, type,
        type==='splash' ? [0.85,0.95,1.0] : [0.95,0.97,1.0]);
    }
  }

  /** continuous emitter (boat wake / bow spray) */
  emit(x, y, z, count, type='wake', speed=10) {
    for (let i=0;i<count;i++){
      const a = Math.random()*Math.PI*2, r = Math.random()*1.5;
      if (type==='wake')
        this._spawn(x+Math.cos(a)*r, y, z+Math.sin(a)*r,
          Math.cos(a)*0.5, 0.3, Math.sin(a)*0.5,
          1.5+Math.random()*1.5, 1.2+Math.random()*2.0, 'wake', [0.9,0.96,1.0]);
      else // spray
        this._spawn(x, y, z,
          (Math.random()-0.5)*4, 2+Math.random()*3, (Math.random()-0.5)*4,
          0.4+Math.random()*0.5, 0.5+Math.random()*0.8, 'spray', [0.92,0.97,1.0]);
    }
  }

  update(dt, camera) {
    for (let i=0;i<this.max;i++){
      const p = this.p[i];
      if (!p.alive){ this.alphas[i]=0; continue; }
      p.life += dt;
      if (p.life >= p.maxLife){ p.alive=false; this.alphas[i]=0; continue; }

      p.vy -= p.grav*dt;
      const d = Math.max(0, 1 - p.drag*dt);
      p.vx*=d; p.vy*=d; p.vz*=d;
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
      if (p.type!=='wake' && p.y < 0){ p.y=0; p.vy*=-0.3; } // bounce on sea

      const k = p.life/p.maxLife;
      this.pos[i*3]=p.x; this.pos[i*3+1]=p.y; this.pos[i*3+2]=p.z;
      this.sizes[i] = p.size * (p.type==='wake' ? (1
