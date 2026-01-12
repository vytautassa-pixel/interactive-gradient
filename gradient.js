// ===========================
// Three.js setup
// ===========================
const canvas = document.getElementById("gradient-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.Camera();
const geometry = new THREE.PlaneGeometry(2,2);

// ===========================
// Shaders
// ===========================
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

// Value noise
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

    // per-color subtle mouse offsets
    vec2 mo1 = (u_mouse - 0.5) * 0.02;
    vec2 mo2 = (u_mouse - 0.5) * 0.03;
    vec2 mo3 = (u_mouse - 0.5) * 0.025;
    vec2 mo4 = (u_mouse - 0.5) * 0.015;

    // Per-layer waves
    float wave1 = sin((st.y + u_time*0.05) * 5.0 + st.x*3.0 + mo1.x + mo1.y);
    float wave2 = cos((st.x + u_time*0.03) * 4.0 + st.y*2.0 + mo2.x - mo2.y);
    float wave3 = sin((st.x + st.y + u_time*0.04)*6.0 + mo3.x - mo3.y);
    float wave4 = cos((st.x - st.y + u_time*0.045)*5.5 + mo4.x + mo4.y);

    // Combine waves for smooth morph
    float morph = (wave1 + wave2 + wave3 + wave4)/4.0;
    morph = morph*0.5 + 0.5;

    // Smooth color blending
    vec3 color = mix(u_color1, u_color2, smoothstep(0.0,0.5,wave1));
    color = mix(color, u_color3, smoothstep(0.3,0.7,wave2));
    color = mix(color, u_color4, smoothstep(0.5,1.0,wave3));

    // subtle noise overlay
    color += vec3(noise(st*10.0 + u_time)*u_noiseAmount);

    gl_FragColor = vec4(color,1.0);
}
`;

// ===========================
// Uniforms
// ===========================
const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2(0.5,0.5) },
    u_color1: { value: new THREE.Color("#16254b") },
    u_color2: { value: new THREE.Color("#23418a") },
    u_color3: { value: new THREE.Color("#aadfd9") },
    u_color4: { value: new THREE.Color("#e64f0f") },
    u_noiseAmount: { value: 0.04 }
};

const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// ===========================
// Mouse & Touch
// ===========================
window.addEventListener("mousemove", e => {
    uniforms.u_mouse.value.x = e.clientX / window.innerWidth;
    uniforms.u_mouse.value.y = 1 - e.clientY / window.innerHeight;
});
window.addEventListener("touchmove", e => {
    if(e.touches.length>0){
        uniforms.u_mouse.value.x = e.touches[0].clientX / window.innerWidth;
        uniforms.u_mouse.value.y = 1 - e.touches[0].clientY / window.innerHeight;
    }
},{passive:true});

// ===========================
// Resize
// ===========================
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

// ===========================
// Animate
// ===========================
function animate(time){
    uniforms.u_time.value = time * 0.001;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
}
animate();

// ===========================
// UI Controls
// ===========================
document.querySelectorAll("input[type=color]").forEach(input => {
    input.addEventListener("input", e => {
        uniforms[e.target.dataset.color].value.set(e.target.value);
    });
});

document.getElementById("noiseToggle").addEventListener("change", e => {
    uniforms.u_noiseAmount.value = e.target.checked ? 0.04 : 0.0;
});

// ===========================
// Embed Code
// ===========================
document.getElementById("copy").addEventListener("click", () => {
    const c1 = uniforms.u_color1.value.getStyle();
    const c2 = uniforms.u_color2.value.getStyle();
    const c3 = uniforms.u_color3.value.getStyle();
    const c4 = uniforms.u_color4.value.getStyle();
    const embed = `
<div id="interactive-gradient"></div>
<script src="https://YOUR_USERNAME.github.io/interactive-gradient/embed.js"
    data-colors="${c1},${c2},${c3},${c4}"
    data-noise="${document.getElementById("noiseToggle").checked}">
</script>
    `.trim();
    navigator.clipboard.writeText(embed);
    alert("Embed code copied!");
});
