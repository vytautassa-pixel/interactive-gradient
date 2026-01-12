(function() {
  // Get script element
  const script = document.currentScript;

  // Parse data attributes
  const colors = (script.dataset.colors || "#16254b,#23418a,#aadfd9,#e64f0f").split(",");
  const noiseEnabled = script.dataset.noise === "true";

  // Create container
  const container = document.getElementById("interactive-gradient") || document.body;
  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.style.width = "100%";
  container.style.height = "100%";

  // Create canvas
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  // Three.js setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2,2);

  // Shaders
  const vertexShader = `
    varying vec2 vUv;
    void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    uniform vec3 u_color4;
    uniform float u_noiseAmount;

    varying vec2 vUv;

    float rand(vec2 n){ return fract(sin(dot(n, vec2(12.9898,4.1414)))*43758.5453); }
    float noise(vec2 p){
        vec2 ip = floor(p);
        vec2 u = fract(p); u = u*u*(3.0-2.0*u);
        return mix(
            mix(rand(ip), rand(ip + vec2(1.0,0.0)), u.x),
            mix(rand(ip + vec2(0.0,1.0)), rand(ip + vec2(1.0,1.0)), u.x), u.y
        );
    }

    void main(){
        vec2 st = vUv - 0.5;

        float wave1 = sin((st.y + u_time*0.2) * 5.0 + st.x*3.0);
        float wave2 = cos((st.x + u_time*0.3) * 4.0 + st.y*2.0);
        float wave3 = sin((st.x + st.y + u_time*0.15)*6.0);

        float morph = (wave1 + wave2 + wave3)/3.0;
        morph = morph*0.5 + 0.5;

        vec3 color = mix(u_color1, u_color2, smoothstep(0.0,0.5,morph));
        color = mix(color, u_color3, smoothstep(0.3,0.7,morph));
        color = mix(color, u_color4, smoothstep(0.5,1.0,morph));

        color += vec3(noise(st*10.0 + u_time)*u_noiseAmount);

        gl_FragColor = vec4(color,1.0);
    }
  `;

  // Uniforms
  const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      u_mouse: { value: new THREE.Vector2(0,0) },
      u_color1: { value: new THREE.Color(colors[0]) },
      u_color2: { value: new THREE.Color(colors[1]) },
      u_color3: { value: new THREE.Color(colors[2]) },
      u_color4: { value: new THREE.Color(colors[3]) },
      u_noiseAmount: { value: noiseEnabled ? 0.04 : 0.0 }
  };

  const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Mouse & touch interaction
  container.addEventListener("mousemove", e => {
      uniforms.u_mouse.value.x = e.clientX / container.clientWidth;
      uniforms.u_mouse.value.y = 1 - e.clientY / container.clientHeight;
  });

  container.addEventListener("touchmove", e => {
      if(e.touches.length>0){
          uniforms.u_mouse.value.x = e.touches[0].clientX / container.clientWidth;
          uniforms.u_mouse.value.y = 1 - e.touches[0].clientY / container.clientHeight;
      }
  }, { passive:true });

  // Resize
  window.addEventListener("resize", () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.u_resolution.value.set(container.clientWidth, container.clientHeight);
  });

  // Animate
  function animate(time){
      uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
  }
  animate();
})();
