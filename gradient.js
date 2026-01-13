import * as THREE from 'https://cdn.skypack.dev/three@0.152.2'

const canvas = document.getElementById('gradient-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const scene = new THREE.Scene()
const camera = new THREE.Camera()
const geometry = new THREE.PlaneGeometry(2, 2)

// ---------- SHADERS ----------
const vertexShader = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
`

// Simplex noise GLSL
const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_grain;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
float a=hash(i); float b=hash(i+vec2(1.,0.)); float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.; a*=0.5; } return v;}

// radial blob mask
float blob(vec2 uv, vec2 center, float radius, float morph){
  float d = length(uv-center+vec2(fbm(uv*3.0 + morph)*0.03));
  return smoothstep(radius+0.02, radius, d);
}

void main(){
  vec2 uv = vUv;

  // subtle autonomous drift
  uv += vec2(sin(u_time*0.1), cos(u_time*0.12))*0.02;

  // local mouse force
  vec2 diff = uv - u_mouse;
  float strength = exp(-length(diff*12.0));
  vec2 force = u_velocity * strength*0.25;

  // define 4 blobs with independent positions
  vec2 centers[4];
  centers[0] = vec2(0.3,0.4) + vec2(sin(u_time*0.2),cos(u_time*0.18))*0.05 + force;
  centers[1] = vec2(0.7,0.5) + vec2(cos(u_time*0.18),sin(u_time*0.2))*0.05 + force*0.8;
  centers[2] = vec2(0.4,0.7) + vec2(sin(u_time*0.15),cos(u_time*0.17))*0.04 + force*0.6;
  centers[3] = vec2(0.6,0.3) + vec2(cos(u_time*0.12),sin(u_time*0.14))*0.03 + force*0.4;

  float m1 = blob(uv, centers[0], 0.25, u_time*0.1);
  float m2 = blob(uv, centers[1], 0.25, u_time*0.2);
  float m3 = blob(uv, centers[2], 0.25, u_time*0.3);
  float m4 = blob(uv, centers[3], 0.25, u_time*0.4);

  vec3 color = vec3(0.0);
  color += u_color1*m1;
  color += u_color2*m2;
  color += u_color3*m3;
  color += u_color4*m4;

  // subtle vignette
  float dist = length(uv-0.5);
  color *= smoothstep(0.8,0.2,dist);

  // film grain
  float grain = noise(gl_FragCoord.xy*0.9 + u_time*60.0);
  color += grain*u_grain;

  // gamma / contrast
  color = pow(color, vec3(1.2));

  gl_FragColor = vec4(color,1.0);
}
`

// ---------- UNIFORMS ----------
const uniforms = {
  u_time: { value:0 },
  u_resolution: { value:new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_velocity: { value:new THREE.Vector2(0,0) },
  u_mouse: { value:new THREE.Vector2(0.5,0.5) },
  u_color1: { value:new THREE.Color('#f25c29') },
  u_color2: { value:new THREE.Color('#030d27') },
  u_color3: { value:new THREE.Color('#d0d0d5') },
  u_color4: { value:new THREE.Color('#f27b4b') },
  u_grain: { value:0.08 }
}

const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
scene.add(new THREE.Mesh(geometry,material))

// ---------- MOUSE / TOUCH ----------
let lastMouse = {x:0.5,y:0.5}, velocity={x:0,y:0}
const damping = 0.85
function onPointerMove(e){
  const x = e.clientX/window.innerWidth
  const y = 1.0 - e.clientY/window.innerHeight
  velocity.x += (x-lastMouse.x)*5.0
  velocity.y += (y-lastMouse.y)*5.0
  lastMouse.x = x
  lastMouse.y = y
  uniforms.u_mouse.value.set(x,y)
}
window.addEventListener('mousemove', onPointerMove)
window.addEventListener('touchmove', e=>onPointerMove(e.touches[0]),{passive:true})

// ---------- UI ----------
function updateColor(id,uniform){
  document.getElementById(id).addEventListener('input',e=>{
    uniforms[uniform].value.set(e.target.value)
  })
}
updateColor('c1','u_color1')
updateColor('c2','u_color2')
updateColor('c3','u_color3')
updateColor('c4','u_color4')

document.getElementById('noiseToggle').addEventListener('change',e=>{
  uniforms.u_grain.value = e.target.checked?0.08:0.0
})

// ---------- ANIMATE ----------
function animate(t){
  uniforms.u_time.value = t*0.001
  velocity.x *= damping
  velocity.y *= damping
  uniforms.u_velocity.value.set(velocity.x, velocity.y)
  renderer.render(scene,camera)
  requestAnimationFrame(animate)
}
animate()
