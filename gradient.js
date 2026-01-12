const root = document.documentElement;

// ===== Motion =====
let targetX = 0.5;
let targetY = 0.5;
let currentX = 0.5;
let currentY = 0.5;
let motion = 0.08;

window.addEventListener("mousemove", (e) => {
  targetX = e.clientX / window.innerWidth;
  targetY = e.clientY / window.innerHeight;
});

function animate() {
  currentX += (targetX - currentX) * motion;
  currentY += (targetY - currentY) * motion;

  const time = Date.now() * 0.0001;
  const driftX = Math.sin(time) * 10;
  const driftY = Math.cos(time * 1.3) * 10;

  root.style.setProperty("--x", `${currentX * 100}%`);
  root.style.setProperty("--y", `${currentY * 100}%`);
  root.style.setProperty("--dx", `${driftX}px`);
  root.style.setProperty("--dy", `${driftY}px`);

  requestAnimationFrame(animate);
}

animate();

// ===== UI =====
document.querySelectorAll("input[type=color]").forEach(input => {
  input.addEventListener("input", e => {
    root.style.setProperty(`--${e.target.dataset.color}`, e.target.value);
  });
});

document.getElementById("motion").addEventListener("input", e => {
  motion = parseFloat(e.target.value);
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
  data-motion="${motion}">
</script>
  `.trim();

  navigator.clipboard.writeText(embed);
  alert("Embed code copied");
});
