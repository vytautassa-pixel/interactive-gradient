import * as THREE from 'https://cdn.skypack.dev/three@0.152.2'

const canvas = document.getElementById('gradient-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

const scene = new THREE.Scene()
const camera = new THREE.Camera()
const geometry = new THREE.PlaneGeometry(2,2)

// ------------------ SHADERS ------------------
const vertexShader = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
`

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

// hash and noise functions
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
float a=hash(i); float b=hash(i+vec2(1.,0.)); float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.; a*=0.5; } return v;}

// organic shapeless weighting
float getWeight(vec2 uv, float scale, float time){
    return fbm(uv*scale + vec2(sin(time*0.1), cos(time*0.1)));
}

void main(){
    vec2 uv = vUv;

    // subtle drift
    uv += vec2(sin(u_time*0.05), cos(u_time*0.07))*0.02;

    // local mouse distortion
    vec2 diff = uv - u_mouse;
    float strength = exp(-length(diff*12.0));
    vec2 force = u_velocity * strength*0.25;
    uv += force;

    // compute weights for 4 shapeless blobs
    float w1 = getWeight(uv, 2.0, u_time*0.1);
    float w2 = getWeight(uv + 10.0, 2.5, u_time*0.15);
    float w3 = getWeight(uv + 20.0, 3.0, u_time*0.2);
    float w4 = getWeight(uv + 30.0, 3.5, u_time*0.25);

    // normalize weights
    float sumW = w1+w2+w3+w4 + 0.0001;
    w1 /= sumW; w2/=sumW; w3/=sumW; w4/=sumW;

    vec3 color = u_color1*w1 + u_color2*w2 + u_color3*w3 + u_color4*w4;

    // vignette
    float dist = length(vUv-0.5);
    color *= smoothstep(0.8,0.2,dist);

    // grain
    float grain = noise(gl_FragCoord.xy*0.9 + u_time*60.0);
    color += grain*u_grain;

    // gamma / contrast
    color = pow(color, vec3(1.2));

    gl_FragColor = vec4(color,1.0);
}
`

// ------------------ UNIFORMS ------------------
const uniforms = {
    u_time: { value:0 },
    u_resolution: { value:new THREE.Vector2(window.innerWidth,window.innerHeight) },
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

// ------------------ MOUSE / TOUCH ------------------
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

// ------------------ UI ------------------
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

// ------------------ ANIMATE ------------------
function animate(t){
    uniforms.u_time.value = t*0.001
    velocity.x *= damping
    velocity.y *= damping
    uniforms.u_velocity.value.set(velocity.x, velocity.y)
    renderer.render(scene,camera)
    requestAnimationFrame(animate)
}
animate()
