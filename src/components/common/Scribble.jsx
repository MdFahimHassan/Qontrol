import { useEffect, useRef, useState } from 'react';

// Wraps inline text with a hand-drawn marker annotation — a wobbly circle
// or underline that draws itself in once the element enters view. Built as
// a plain stroke-dashoffset reveal so it needs no extra dependency and
// naturally respects the app's reduced-motion rule (the draw just resolves
// instantly instead of animating, see index.css).
const CIRCLE_PATH =
  'M8 21C6 10 24 3 52 4C86 5 100 12 98 22C96 33 78 40 50 39C22 38 8 32 8 21';

const UNDERLINE_PATH = 'M4 8C24 3 60 3 96 7';

export default function Scribble({ children, type = 'circle', color = 'var(--color-amber)', className = '', delay = 0, duration = 1400 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const path = type === 'underline' ? UNDERLINE_PATH : CIRCLE_PATH;
  const viewBox = type === 'underline' ? '0 0 100 14' : '0 0 106 44';

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      {children}
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        className={
          type === 'underline'
            ? 'absolute left-[-4%] right-[-4%] -bottom-1 w-[108%] h-[0.4em] pointer-events-none'
            : 'absolute left-1/2 top-1/2 w-[130%] h-[170%] -translate-x-1/2 -translate-y-1/2 pointer-events-none'
        }
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={type === 'underline' ? 3 : 2.5}
          strokeLinecap="round"
          pathLength={100}
          style={{
            strokeDasharray: 100,
            strokeDashoffset: visible ? 0 : 100,
            transition: `stroke-dashoffset ${duration}ms ease-out`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </svg>
    </span>
  );
}