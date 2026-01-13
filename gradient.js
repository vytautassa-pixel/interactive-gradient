import * as THREE from 'https://cdn.skypack.dev/three@0.152.2'

const canvas = document.getElementById('gradient-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const scene = new THREE.Scene()
const camera = new THREE.Camera()
const geometry = new THREE.PlaneGeometry(2,2)

// ---------- SHADERS ----------
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position,1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_velocity;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform float u_grain;

varying vec2 vUv;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); 
float a=hash(i); float b=hash(i+vec2(1.0,0.0)); float c=hash(i+vec2(0.0,1.0)); float d=hash(i+vec2(1.0,1.0));
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.0; float a=0.5; for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;} return v;}

vec2 warp(vec2 uv, vec2 force, float t, float scale){
  float n1=fbm(uv*scale + t*0.08);
  float n2=fbm(uv*scale - t*0.06);
  return uv + vec2(n1,n2)*0.35 + force*0.6;
}

void main(){
  vec2 uv=vUv;
  uv+=vec2(sin(u_time*0.02), cos(u_time*0.018))*0.025;
  vec2 force=u_velocity;

  vec2 uv1=warp(uv+0.12, force*1.2, u_time, 2.5);
  vec2 uv2=warp(uv-0.08, force*1.0, u_time+10.0, 3.0);
  vec2 uv3=warp(uv+0.18, force*0.8, u_time+20.0, 3.5);
  vec2 uv4=warp(uv-0.14, force*0.6, u_time+30.0, 4.0);

  float m1=fbm(uv1*3.0);
  float m2=fbm(uv2*3.2);
  float m3=fbm(uv3*3.4);

  vec3 color=u_color1;
  color=mix(color,u_color2,smoothstep(0.15,0.85,m1));
  color=mix(color,u_color3,smoothstep(0.25,0.95,m2));
  color=mix(color,u_color4,smoothstep(0.35,1.0,m3));

  float grain=noise(gl_FragCoord.xy*0.9+u_time*60.0);
  color+=grain*u_grain;

  gl_FragColor=vec4(color,1.0);
}
`

// ---------- UNIFORMS ----------
const uniforms={
  u_time:{value:0},
  u_resolution:{value:new THREE.Vector2(window.innerWidth, window.innerHeight)},
  u_velocity:{value:new THREE.Vector2(0,0)},
  u_color1:{value:new THREE.Color('#16254b')},
  u_color2:{value:new THREE.Color('#23418a')},
  u_color3:{value:new THREE.Color('#aadfd9')},
  u_color4:{value:new THREE.Color('#e64f0f')},
  u_grain:{value:0.08}
}

const material=new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader})
scene.add(new THREE.Mesh(geometry,material))

// ---------- MOUSE VELOCITY ----------
let last={x:0.5,y:0.5}, velocity={x:0,y:0}
const damping=0.9
function onPointerMove(e){
  const x=e.clientX/window.innerWidth
  const y=1.0-e.clientY/window.innerHeight
  velocity.x += (x-last.x)*2.5
  velocity.y += (y-last.y)*2.5
  last.x=x; last.y=y
}
window.addEventListener('mousemove',onPointerMove)
window.addEventListener('touchmove',e=>onPointerMove(e.touches[0]),{passive:true})

// ---------- UI CONTROLS ----------
const updateColor=(id,uniform)=>{
  document.getElementById(id).addEventListener('input',e=>{
    uniforms[uniform].value.set(e.target.value)
  })
}
updateColor('c1','u_color1')
updateColor('c2','u_color2')
updateColor('c3','u_color3')
updateColor('c4','u_color4')

document.getElementById('noiseToggle').addEventListener('change',e=>{
  uniforms.u_grain.value=e.target.checked?0.08:0.0
})

// ---------- ANIMATION ----------
function animate(t){
  uniforms.u_time.value=t*0.001
  velocity.x*=damping
  velocity.y*=damping
  uniforms.u_velocity.value.set(velocity.x,velocity.y)
  renderer.render(scene,camera)
  requestAnimationFrame(animate)
}
animate()
