const root = document.documentElement;
const noise = document.querySelector(".gradient-noise");

// ===== Motion =====
let targetX = 0.5;
let targetY = 0.5;
let currentX = 0.5;
let currentY = 0.5;
let motion = 0.08;

// ===== Mouse / Touch =====
function updateTarget(e) {
  const rect = document.body.getBoundingClientRect();
  targetX = (e.clientX - rect.left) / rect.width;
  targetY = (e.clientY - rect.top) / rect.height;
}

window.addEventListener("mousemove", updateTarget);
window.addEventListener("touchmove", e => {
  if (e.touches.length > 0) updateTarget(e.touches[0]);
}, { passive: true });

// ===== Animate gradient =====
function animate() {
  currentX += (targetX - currentX) * motion;
  currentY += (targetY - currentY) * motion;

  const t = Date.now() * 0.00015;
  const drift1 = Math.sin(t * 1.3) * 7;
  const drift2 = Math.cos(t * 1.7) * 7;
  const drift3 = Math.sin(t * 0.9) * 10;

  root.style.setProperty("--x1", `${currentX * 100 + drift1}%`);
  root.style.setProperty("--y1", `${currentY * 100 + drift1}%`);
  root.style.setProperty("--x2", `${100 - currentX * 100 + drift2}%`);
  root.style.setProperty("--y2", `${100 - currentY * 100 + drift2}%`);
  root.style.setProperty("--x3", `${50 + drift3}%`);
  root.style.setProperty("--y3", `${50 + drift3}%`);

  requestAnimationFrame(animate);
}
animate();

// ===== UI Controls =====
document.querySelectorAll("input[type=color]").forEach(input => {
  input.addEventListener("input", e => {
    root.style.setProperty(`--${e.target.dataset.color}`, e.target.value);
  });
});

document.getElementById("motion").addEventListener("input", e => {
  motion = parseFloat(e.target.value);
});

document.getElementById("noiseToggle").addEventListener("change", e => {
  noise.style.opacity = e.target.checked ? "1" : "0";
});

// ===== Embed code =====
document.getElementById("copy").addEventListener("click", () => {
  const c1 = getComputedStyle(root).getPropertyValue("--c1").trim();
  const c2 = getComputedStyle(root).getPropertyValue("--c2").trim();
  const c3 = getComputedStyle(root).getPropertyValue("--c3").trim();

  const embed = `
<div id="interactive-gradient"></div>
<script
  src="https://YOUR_USERNAME.github.io/interactive-gradient/embed.js"
  data-colors="${c1},${c2},${c3}"
  data-motion="${motion}"
  data-noise="${document.getElementById("noiseToggle").checked}">
</script>
  `.trim();

  navigator.clipboard.writeText(embed);
  alert("Embed code copied!");
});
