import { useEffect, useRef } from 'react';

// Each doodle: src, position (%), size (px), rotation (deg), float timing,
// a parallax "depth" (how far it drifts with the cursor), and optional
// opacity/z-index for the few pieces that peek out from behind the hero
// copy instead of ringing the edges — keeps the scatter from reading as a
// perfect circle of icons around empty space.
const DOODLES = [
  { src: '/doodles/heartbeat.png', x: 35, y: 20, size: 46, rot: -6, dur: 5.5, delay: 0.0, depth: 10, opacity: 0.32, behind: true },
  { src: '/doodles/crown.png', x: 24, y: 6, size: 64, rot: 4, dur: 6.0, delay: 0.4, depth: 22 },
  { src: '/doodles/checkmark.png', x: 66, y: 22, size: 40, rot: 6, dur: 5.6, delay: 0.2, depth: 10, opacity: 0.32, behind: true },
  { src: '/doodles/moon.gif', x: 95, y: 18, size: 84, rot: -4, dur: 6.5, delay: 0.6, depth: 26 },
  { src: '/doodles/glasses.gif', x: 46, y: 89, size: 84, rot: -3, dur: 6.1, delay: 0.3, depth: 20 },
  { src: '/doodles/puzzle_static.png', x: 70, y: 63, size: 44, rot: -8, dur: 6.8, delay: 0.8, depth: 8, opacity: 0.3, behind: true },
  { src: '/doodles/sparkle.gif', x: 30, y: 60, size: 46, rot: 5, dur: 5.4, delay: 0.5, depth: 8, opacity: 0.28, behind: true },
  { src: '/doodles/hairpull.gif', x: 4, y: 90, size: 94, rot: -4, dur: 6.3, delay: 1.3, depth: 18 },
  { src: '/doodles/diamond.gif', x: 92, y: 38, size: 84, rot: 6, dur: 6.0, delay: 0.2, depth: 24 },
  { src: '/doodles/hello_bubble.gif', x: 90, y: 60, size: 94, rot: -5, dur: 5.8, delay: 0.7, depth: 22 },
  { src: '/doodles/volume.gif', x: 80, y: 90, size: 102, rot: 4, dur: 6.4, delay: 1.0, depth: 16 },
  { src: '/doodles/puzzle.gif', x: 24, y: 90, size: 78, rot: 8, dur: 5.7, delay: 0.4, depth: 18 },
  { src: '/doodles/envelope.gif', x: 14, y: 28, size: 82, rot: -6, dur: 6.2, delay: 1.2, depth: 22 },
  { src: '/doodles/clock.png', x: 10, y: 84, size: 60, rot: 5, dur: 5.9, delay: 0.6, depth: 14 },
  { src: '/doodles/panda.gif', x: 58, y: 90, size: 112, rot: -2, dur: 6.6, delay: 0.9, depth: 20 },
];

export default function DoodleBackground({ variant = 'full' }) {
  const doodles = variant === 'sparse' ? DOODLES.filter((_, i) => i % 3 === 0) : DOODLES;
  const layerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduceMotion) return;

    const el = layerRef.current;
    if (!el) return;

    let raf = null;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    function tick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      itemRefs.current.forEach((node, i) => {
        if (!node) return;
        const depth = doodles[i].depth;
        node.style.transform = `translate(${curX * depth}px, ${curY * depth}px)`;
      });
      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    // Listen on window, not the doodle layer itself — the layer has
    // pointer-events: none (on purpose, so it never blocks clicks on the
    // buttons/links underneath), which means it can never be an event
    // target for mousemove. window always receives the event regardless;
    // we still use the layer's own bounding rect for the math below.
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [doodles]);

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {doodles.map((d, i) => (
        <div
          key={d.src}
          ref={(node) => (itemRefs.current[i] = node)}
          className="absolute will-change-transform"
          style={{ left: `${d.x}%`, top: `${d.y}%`, zIndex: d.behind ? 1 : 4 }}
        >
          <img
            src={d.src}
            alt=""
            width={d.size}
            height={d.size}
            className="doodle-float"
            style={{
              width: d.size,
              opacity: d.opacity ?? 0.9,
              '--doodle-rot': `${d.rot}deg`,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}