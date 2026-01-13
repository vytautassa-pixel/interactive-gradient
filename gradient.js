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

const geometry = new THREE.PlaneGeometry(2, 2)

// ---------------- SHADERS ----------------

const vertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_flow;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;
uniform float u_noise;

varying vec2 vUv;

// Random (frame-unique)
float rand(vec2 p){
  return fract(sin(dot(p + u_time, vec2(127.1,311.7))) * 43758.5453);
}

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=rand(i);
  float b=rand(i+vec2(1,0));
  float c=rand(i+vec2(0,1));
  float d=rand(i+vec2(1,1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

vec2 warp(vec2 p,float t){
  return p + vec2(
    noise(p*2.2+t),
    noise(p*2.2-t)
  ) * 0.35;
}

void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  // Local mouse-driven viscous force
  vec2 m = (u_mouse * 2.0 - 1.0);
  m.x *= u_resolution.x / u_resolution.y;
  vec2 d = uv - m;
  float influence = exp(-dot(d,d) * 5.0);
  uv += u_flow * influence * 0.35;

  // MULTI DOMAIN WARP (LIQUID)
  uv = warp(uv, u_time * 0.04);
  uv = warp(uv, u_time * 0.07);
  uv = warp(uv, u_time * 0.11);

  // Scalar oil fields
  float f1 = smoothstep(0.25,0.75,noise(uv*1.2+10.));
  float f2 = smoothstep(0.25,0.75,noise(uv*1.4+20.));
  float f3 = smoothstep(0.25,0.75,noise(uv*1.6+30.));
  float f4 = smoothstep(0.25,0.75,noise(uv*1.8+40.));

  float sum = f1+f2+f3+f4+0.0001;
  vec3 col = (
    c1*f1 +
    c2*f2 +
    c3*f3 +
    c4*f4
  ) / sum;

  // Vignette
  float v = 1.0 - length(vUv - 0.5) * 1.3;
  col *= clamp(v,0.0,1.0);

  // Film grain (true random)
  float g = rand(gl_FragCoord.xy);
  col += g * 0.08 * u_noise;

  // Oil contrast curve
  col = pow(col, vec3(1.45));

  gl_FragColor = vec4(col,1.0);
}
`

const uniforms = {
  u_time: { value: 0 },
  u_resolution: { value: new THREE.Vector2() },
  u_mouse: { value: new THREE.Vector2(0.5,0.5) },
  u_flow: { value: new THREE.Vector2(0,0) },
  u_noise: { value: 1 },
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

// ---------------- RESIZE ----------------
function resize(){
  renderer.setSize(innerWidth, innerHeight)
  uniforms.u_resolution.value.set(innerWidth, innerHeight)
}
window.addEventListener('resize', resize)
resize()

// ---------------- INTERACTION (INERTIA) ----------------
let target = { x: 0.5, y: 0.5 }
let current = { x: 0.5, y: 0.5 }
let flow = { x: 0, y: 0 }

window.addEventListener('pointermove', e => {
  target.x = e.clientX / innerWidth
  target.y = 1 - e.clientY / innerHeight
})

function updateFlow(){
  // smooth delayed movement
  current.x += (target.x - current.x) * 0.08
  current.y += (target.y - current.y) * 0.08

  flow.x += (current.x - uniforms.u_mouse.value.x) * 6.0
  flow.y += (current.y - uniforms.u_mouse.value.y) * 6.0

  flow.x *= 0.85
  flow.y *= 0.85

  uniforms.u_mouse.value.set(current.x, current.y)
  uniforms.u_flow.value.set(flow.x, flow.y)
}

// ---------------- UI ----------------
['c1','c2','c3','c4'].forEach(id=>{
  document.getElementById(id).addEventListener('input',e=>{
    uniforms[id].value.set(e.target.value)
  })
})

document.getElementById('noiseToggle').addEventListener('change',e=>{
  uniforms.u_noise.value = e.target.checked ? 1 : 0
})

// ---------------- LOOP ----------------
function animate(t){
  uniforms.u_time.value = t * 0.001
  updateFlow()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()
