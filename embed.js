(function () {
  const script = document.currentScript;
  const colors = (script.dataset.colors || "#ff6b6b,#5f27cd,#1dd1a1").split(",");
  const motion = parseFloat(script.dataset.motion || 0.08);

  const container =
    document.getElementById("interactive-gradient") ||
    document.body;

  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.background = "#050505";
  el.style.overflow = "hidden";

  container.appendChild(el);

  let targetX = 0.5;
  let targetY = 0.5;
  let currentX = 0.5;
  let currentY = 0.5;

  container.addEventListener("mousemove", e => {
    const rect = container.getBoundingClientRect();
    targetX = (e.clientX - rect.left) / rect.width;
    targetY = (e.clientY - rect.top) / rect.height;
  });

  function animate() {
    currentX += (targetX - currentX) * motion;
    currentY += (targetY - currentY) * motion;

    const t = Date.now() * 0.0001;
    const dx = Math.sin(t) * 10;
    const dy = Math.cos(t * 1.3) * 10;

    el.style.background = `
      radial-gradient(600px at ${currentX * 100 + dx}% ${currentY * 100 + dy}%, ${colors[0]}, transparent 60%),
      radial-gradient(800px at ${100 - currentX * 100}% ${100 - currentY * 100}%, ${colors[1]}, transparent 65%),
      radial-gradient(1000px at 50% 50%, ${colors[2]}, #050505 70%)
    `;

    requestAnimationFrame(animate);
  }

  animate();
})();
