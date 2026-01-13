import * as THREE from 'https://cdn.skypack.dev/three@0.152.2'

const canvas = document.getElementById('gradient-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio,2))

const scene = new THREE.Scene()
const camera = new THREE.Camera()
const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2))
scene.add(mesh)

const vertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position,1.);
}
`

const fragmentShader = `
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;
uniform float u_grain;

varying vec2 vUv;

// --- HASH / NOISE ---
float hash(vec2 p){
  p = fract(p*vec2(123.34,456.21));
  p += dot(p,p+78.233);
  return fract(p.x*p.y);
}

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  float a=hash(i);
  float b=hash(i+vec2(1,0));
  float c=hash(i+vec2(0,1));
  float d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

// --- DOMAIN WARP ---
vec2 warp(vec2 p,float t){
  float n1=noise(p*2.5+t);
  float n2=noise(p*3.5-t);
  return p + vec2(n1,n2)*0.35;
}

void main(){
  vec2 uv=vUv;

  // Mouse force (LOCAL distortion, not movement)
  vec2 m=uv-u_mouse;
  float md=exp(-dot(m,m)*20.);
  uv+=u_velocity*md*0.15;

  // MULTI DOMAIN WARP (THIS IS LIQUID)
  uv=warp(uv,u_time*0.05);
  uv=warp(uv,u_time*0.08);
  uv=warp(uv,u_time*0.11);

  // Scalar fields (NOT clouds)
  float f1=noise(uv*1.2+10.);
  float f2=noise(uv*1.4+20.);
  float f3=noise(uv*1.6+30.);
  float f4=noise(uv*1.8+40.);

  // Sharpen into oily bands
  f1=smoothstep(0.2,0.8,f1);
  f2=smoothstep(0.2,0.8,f2);
  f3=smoothstep(0.2,0.8,f3);
  f4=smoothstep(0.2,0.8,f4);

  float sum=f1+f2+f3+f4+0.0001;
  vec3 col =
    (f1*c1 +
     f2*c2 +
     f3*c3 +
     f4*c4) / sum;

  // Vignette
  float v=1.-length(vUv-.5)*1.3;
  col*=clamp(v,0.,1.);

  // Film grain
  float g=noise(gl_FragCoord.xy*0.8+u_time*40.);
  col+=g*u_grain;

  // Contrast curve (oil look)
  col=pow(col,vec3(1.35));

  gl_FragColor=vec4(col,1.);
}
`

const uniforms = {
  u_time:{value:0},
  u_mouse:{value:new THREE.Vector2(.5,.5)},
  u_velocity:{value:new THREE.Vector2()},
  u_grain:{value:0.06},
  c1:{value:new THREE.Color('#f25c29')},
  c2:{value:new THREE.Color('#020918')},
  c3:{value:new THREE.Color('#d6d6dc')},
  c4:{value:new THREE.Color('#f27b4b')}
}

mesh.material=new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader
})

// ---- INTERACTION ----
let last={x:.5,y:.5},vel={x:0,y:0}
addEventListener('pointermove',e=>{
  const x=e.clientX/innerWidth
  const y=1-e.clientY/innerHeight
  vel.x+=(x-last.x)*4
  vel.y+=(y-last.y)*4
  last={x,y}
  uniforms.u_mouse.value.set(x,y)
})

function animate(t){
  uniforms.u_time.value=t*.001
  vel.x*=.85
  vel.y*=.85
  uniforms.u_velocity.value.set(vel.x,vel.y)
  renderer.render(scene,camera)
  requestAnimationFrame(animate)
}
animate()
