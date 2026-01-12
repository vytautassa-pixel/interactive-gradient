(function() {
  const script = document.currentScript;
  const colors = (script.dataset.colors || "#ff6b6b,#5f27cd,#1dd1a1").split(",");
  const motion = parseFloat(script.dataset.motion || 0.08);
  const noiseEnabled = script.dataset.noise === "true";

  const container = document.getElementById("interactive-gradient") || document.body;

  // Gradient element
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.background = "#050505";
  el.style.overflow = "hidden";
  container.appendChild(el);

  // Noise overlay
  const noise = document.createElement("div");
  noise.style.cssText = `
    position:absolute;inset:0;
    pointer-events:none;
    background:repeating-radial-gradient(circle, rgba(255,255,255,0.02) 0 1px, transparent 2px);
    z-index:5;
    opacity:${noiseEnabled ? "1" : "0"};
    transition:opacity 0.5s;
  `;
  el.appendChild(noise);

  // Motion variables
  let targetX = 0.5, targetY = 0.5, currentX = 0.5, currentY = 0.5;

  function updateTarget(e) {
    const rect = container.getBoundingClientRect();
    targetX = (e.clientX - rect.left) / rect.width;
    targetY = (e.clientY - rect.top) / rect.height;
  }

  container.addEventListener("mousemove", updateTarget);
  container.addEventListener("touchmove", e => {
    if(e.touches.length>0) updateTarget(e.touches[0]);
  }, { passive:true });

  function animate() {
    currentX += (targetX - currentX) * motion;
    currentY += (targetY - currentY) * motion;

    const t = Date.now() * 0.00015;
    const drift1 = Math.sin(t*1.3)*7;
    const drift2 = Math.cos(t*1.7)*7;
    const drift3 = Math.sin(t*0.9)*10;

    el.style.background = `
      radial-gradient(600px at ${currentX*100 + drift1}% ${currentY*100 + drift1}%, ${colors[0]}, transparent 60%),
      radial-gradient(800px at ${100 - currentX*100 + drift2}% ${100 - currentY*100 + drift2}%, ${colors[1]}, transparent 65%),
      radial-gradient(1000px at 50% + ${drift3}% 50% + ${drift3}%, ${colors[2]}, #050505 70%)
    `;

    requestAnimationFrame(animate);
  }
  animate();
})();
