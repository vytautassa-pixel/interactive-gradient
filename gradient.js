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

/* ------------------ Noise ------------------ */
float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);

    float a = rand(i);
    float b = rand(i + vec2(1.0,0.0));
    float c = rand(i + vec2(0.0,1.0));
    float d = rand(i + vec2(1.0,1.0));

    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

/* ------------------ Domain Warp ------------------ */
vec2 warp(vec2 p, vec2 mouse, float time) {
    float n1 = noise(p * 2.5 + time * 0.05);
    float n2 = noise(p * 3.5 - time * 0.04);

    vec2 mouseInfluence = (mouse - 0.5) * 0.25;
    vec2 warpOffset = vec2(n1, n2) * 0.15;

    return p + warpOffset + mouseInfluence * vec2(n2, n1);
}

void main() {
    vec2 uv = vUv;

    /* subtle autonomous motion */
    uv += vec2(
        sin(u_time * 0.03),
        cos(u_time * 0.025)
    ) * 0.02;

    /* domain warp driven by mouse */
    vec2 warped = warp(uv, u_mouse, u_time);

    /* layered gradient sampling */
    float g1 = smoothstep(0.0, 0.4, warped.y + noise(warped*2.0)*0.15);
    float g2 = smoothstep(0.3, 0.7, warped.x + noise(warped*3.0)*0.15);
    float g3 = smoothstep(0.5, 1.0, warped.y + noise(warped*4.0)*0.15);

    vec3 color = u_color1;
    color = mix(color, u_color2, g1);
    color = mix(color, u_color3, g2);
    color = mix(color, u_color4, g3);

    /* film grain */
    color += noise(warped * 12.0 + u_time) * u_noiseAmount;

    gl_FragColor = vec4(color, 1.0);
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
