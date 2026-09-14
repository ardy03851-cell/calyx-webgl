/* ==============================================================================
   ASSETS & ANIMATION INTELLIGENCE MODULE
   ==============================================================================
   
   AI AND ENVIRONMENTAL ANIMATION PHILOSOPHY:
   When developing smooth, indie-style games for mobile devices (like iPads), 
   animating environmental assets—such as tree leaves, grass, or floating particles—
   requires balancing visual fluidity with CPU/GPU performance. Instead of using 
   complex skeletal rigs (bones) for every single leaf, we rely on procedural math, 
   specifically Trigonometry (Sine and Cosine waves), driven by a continuous 
   `time` variable.

   1. THE POWER OF SINE WAVES (WIND & BREATHING):
   Math.sin() and Math.cos() naturally oscillate between -1 and 1. By feeding 
   the current game time into a sine wave, we get perfectly smooth, looping 
   values that mimic natural phenomena. 
   - Speed: Multiply the time (e.g., Math.sin(time * 2.0)) to make the wind blow faster.
   - Amplitude: Multiply the result (e.g., Math.sin(time) * 0.1) to control how far 
     the leaf bends.
   - Offset: Add a unique seed (like the leaf's X position) to the time so that 
     not all leaves swing in unison, creating an organic, overlapping ripple effect 
     across a forest.

   2. AI & STATE MACHINES:
   If you plan to add AI entities (like tiny creatures or enemies), you will want 
   to structure them using a Finite State Machine (FSM). An FSM allows an entity 
   to switch between discrete behaviors: [Wandering, Chasing, Fleeing, Idle]. 
   In your `update(dt)` loop, the AI should read its current state, calculate the 
   distance to the player (the ball) using `entity.position.distanceTo(ball.p)`, 
   and apply forces to its velocity vector similarly to how the joystick pushes 
   the ball.

   3. IMPLEMENTATION IN THIS SCRIPT:
   Below is the `AssetsManager`. It exposes an `init(scene)` function to inject 
   custom geometry (like trees, lights, or characters) into your world, and an 
   `update(dt)` function that runs every frame. The sample code generates a 
   stylized low-poly tree and uses procedural rotation over time to simulate 
   leaves rustling in a gentle breeze.
============================================================================== */

const AssetsManager = (function() {
    let globalTime = 0;
    
    // Arrays to hold our animated objects so we can update them per frame
    const animatedLeaves = [];
    
    return {
        init: function(scene) {
            console.log("AssetsManager Initialized: Loading custom geometry...");
            
            // Example: Procedural Low-Poly Tree
            const treeGroup = new THREE.Group();
            treeGroup.position.set(2, 0, -3); // Place it in the environment
            
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 5);
            const trunkMat = new THREE.MeshStandardMaterial({ 
                color: 0x8b736b, 
                roughness: 0.9 
            });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.75;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            treeGroup.add(trunk);
            
            // Leaves (Multiple layers)
            const leafGeo = new THREE.IcosahedronGeometry(0.8, 0);
            const leafMat = new THREE.MeshStandardMaterial({ 
                color: 0xa8c3a6, // Pastel green
                roughness: 0.6,
                flatShading: true
            });
            
            // Create a few clusters of leaves for the tree
            const leafPositions = [
                { y: 1.8, scale: 1.0, speed: 1.2, offset: 0 },
                { y: 2.2, scale: 0.8, speed: 1.5, offset: 1.5 },
                { y: 1.5, scale: 0.9, speed: 1.1, offset: 3.0 }
            ];
            
            leafPositions.forEach((data, index) => {
                const leafCluster = new THREE.Mesh(leafGeo, leafMat);
                leafCluster.position.y = data.y;
                // Add slight random horizontal offsets
                leafCluster.position.x = (Math.random() - 0.5) * 0.4;
                leafCluster.position.z = (Math.random() - 0.5) * 0.4;
                leafCluster.scale.setScalar(data.scale);
                leafCluster.castShadow = true;
                
                treeGroup.add(leafCluster);
                
                // Store in our animation array with its unique traits
                animatedLeaves.push({
                    mesh: leafCluster,
                    baseY: leafCluster.position.y,
                    speed: data.speed,
                    offset: data.offset
                });
            });
            
            scene.add(treeGroup);
        },
        
        update: function(dt) {
            // Accumulate time for our sine wave calculations
            globalTime += dt;
            
            // Loop through all leaves and animate them procedurally
            animatedLeaves.forEach(leafData => {
                const { mesh, baseY, speed, offset } = leafData;
                
                // 1. Rustling Rotation (Wind simulation)
                mesh.rotation.x = Math.sin(globalTime * speed + offset) * 0.05;
                mesh.rotation.z = Math.cos(globalTime * speed * 0.8 + offset) * 0.05;
                
                // 2. Subtle Squash and Stretch (Breathing effect)
                const breath = Math.sin(globalTime * 2.0 + offset) * 0.02;
                mesh.scale.set(
                    mesh.scale.x,
                    mesh.scale.x + breath, // Stretch vertically
                    mesh.scale.z
                );
            });
        }
    };
})();
