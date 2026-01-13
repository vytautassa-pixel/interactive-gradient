import * as THREE from 'https://cdn.skypack.dev/three@0.152.2'

const canvas = document.getElementById('gradient-canvas')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
})

const scene = new THREE.Scene()
const camera = new THREE.Camera()
camera.position.z = 1

// Fullscreen quad
const geometry = new THREE.PlaneGeometry(2, 2)

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;

varying vec2 vUv;

// ---- HASH / NOISE ----
float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// ---- DOMAIN WARP ----
vec2 warp(vec2 p, float t) {
  float n1 = noise(p * 2.5 + t);
  float n2 = noise(p * 2.5 - t);
  return p + vec2(n1, n2) * 0.25;
}

void main() {
  vec2 uv = vUv;

  // Normalize space
  uv = uv * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  // Mouse-driven local liquid force
  vec2 m = (u_mouse * 2.0 - 1.0);
  m.x *= u_resolution.x / u_resolution.y;
  vec2 d = uv - m;
  float influence = exp(-dot(d,d) * 6.0);
  uv += u_velocity * influence * 0.2;

  // MULTI-PASS DOMAIN WARP (THIS IS LIQUID)
  uv = warp(uv, u_time * 0.05);
  uv = warp(uv, u_time * 0.08);
  uv = warp(uv, u_time * 0.11);

  // Scalar fields (oil bands)
  float f1 = smoothstep(0.3, 0.7, noise(uv * 1.2 + 10.0));
  float f2 = smoothstep(0.3, 0.7, noise(uv * 1.4 + 20.0));
  float f3 = smoothstep(0.3, 0.7, noise(uv * 1.6 + 30.0));
  float f4 = smoothstep(0.3, 0.7, noise(uv * 1.8 + 40.0));

  float sum = f1 + f2 + f3 + f4 + 0.0001;

  vec3 color =
    (c1 * f1 +
     c2 * f2 +
     c3 * f3 +
     c4 * f4) / sum;

  // Vignette
  float v = 1.0 - length(vUv - 0.5) * 1.3;
  color *= clamp(v, 0.0, 1.0);

  // Contrast curve (oil look)
  color = pow(color, vec3(1.4));

  gl_FragColor = vec4(color, 1.0);
}
`

const uniforms = {
  u_time: { value: 0 },
  u_resolution: { value: new THREE.Vector2() },
  u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
  u_velocity: { value: new THREE.Vector2() },
  c1: { value: new THREE.Color('#f25c29') },
  c2: { value: new THREE.Color('#020918') },
  c3: { value: new THREE.Color('#d6d6dc') },
  c4: { value: new THREE.Color('#f27b4b') }
}

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader
})

scene.add(new THREE.Mesh(geometry, material))

// -------- RESIZE --------
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', resize)
resize()

// -------- INTERACTION --------
let last = { x: 0.5, y: 0.5 }
let vel = { x: 0, y: 0 }

function move(e) {
  const x = e.clientX / innerWidth
  const y = 1 - e.clientY / innerHeight
  vel.x += (x - last.x) * 4.0
  vel.y += (y - last.y) * 4.0
  last = { x, y }
  uniforms.u_mouse.value.set(x, y)
}

window.addEventListener('pointermove', move)

// -------- UI --------
[['c1','c1'],['c2','c2'],['c3','c3'],['c4','c4']].forEach(([id,u])=>{
  document.getElementById(id).addEventListener('input',e=>{
    uniforms[u].value.set(e.target.value)
  })
})

// -------- ANIMATE --------
function animate(t) {
  uniforms.u_time.value = t * 0.001
  vel.x *= 0.88
  vel.y *= 0.88
  uniforms.u_velocity.value.set(vel.x, vel.y)
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()
