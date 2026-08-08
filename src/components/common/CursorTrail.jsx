import { useEffect, useRef } from 'react';

// The literal "marker follows your cursor" effect from the original concept
// demo — a canvas layer that draws a fading ink trail behind the pointer.
// Decorative only: pointer-events stays off, so (per the earlier parallax
// bug) we listen on window rather than the canvas itself, and convert to
// canvas-local coordinates using the canvas's own bounding rect.
export default function CursorTrail({ color = '244,241,230' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let points = [];
    let raf = null;
    let running = true;
    let lastX = null;
    let lastY = null;
    let lastT = 0;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const now = performance.now();
      const dt = now - lastT;
      const dist = lastX === null ? 0 : Math.hypot(x - lastX, y - lastY);
      // A pause (idle >100ms) or a big jump (>140px in one event, which
      // happens when the cursor re-enters the page from outside the
      // window) means this point shouldn't be connected to whatever was
      // drawn before it — otherwise we get one long spurious straight
      // line across the whole hero.
      const isBreak = lastX === null || dt > 100 || dist > 140;

      points.push({ x, y, life: 1, brk: isBreak });
      lastX = x;
      lastY = y;
      lastT = now;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);

    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        if (!p1.brk) {
          ctx.strokeStyle = `rgba(${color},${p1.life * 0.55})`;
          ctx.lineWidth = 1.5 + p1.life * 2.5;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
        p1.life -= 0.03;
      }
      points = points.filter((p) => p.life > 0);
      if (points.length > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
        lastX = null;
        lastY = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      running = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    />
  );
}