import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  r: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
  hue: number;
  sat: number;
  light: number;
  alpha: number;
}

/**
 * Ambient cherry-blossom petals drifting down behind the app.
 * Canvas-based for smooth, low-overhead motion. Pauses when the tab is
 * hidden and disables itself when the user prefers reduced motion.
 */
export default function Petals() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const count = Math.round(Math.min(22, Math.max(9, w / 38)));

    function make(initial: boolean): Petal {
      // Sakura blush mix: some near-white, some soft pink.
      const pale = Math.random() < 0.5;
      return {
        x: rnd(0, w),
        y: initial ? rnd(-20, h) : rnd(-50, -10),
        r: rnd(5.5, 11),
        sway: rnd(16, 46),
        swaySpeed: rnd(0.5, 1.2),
        phase: rnd(0, Math.PI * 2),
        vy: rnd(13, 27),
        vx: rnd(-10, 4),
        rot: rnd(0, Math.PI * 2),
        vr: rnd(-0.7, 0.7),
        hue: rnd(340, 352),
        sat: pale ? rnd(45, 68) : rnd(80, 96),
        light: pale ? rnd(90, 96) : rnd(80, 88),
        alpha: rnd(0.55, 0.9),
      };
    }

    const petals: Petal[] = [];
    for (let i = 0; i < count; i++) petals.push(make(true));

    function draw(p: Petal) {
      const g = ctx!.createRadialGradient(0, 0, 0, 0, 0, p.r);
      g.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.alpha})`);
      g.addColorStop(
        1,
        `hsla(${p.hue}, ${p.sat}%, ${Math.max(p.light - 12, 66)}%, ${p.alpha * 0.82})`,
      );
      ctx!.save();
      ctx!.translate(p.x + Math.sin(p.phase) * p.sway, p.y);
      ctx!.rotate(p.rot);
      ctx!.scale(1, 0.6);
      ctx!.shadowColor = `hsla(${p.hue}, 85%, 82%, 0.5)`;
      ctx!.shadowBlur = 6;
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.moveTo(0, -p.r);
      ctx!.quadraticCurveTo(p.r, -p.r * 0.25, 0, p.r);
      ctx!.quadraticCurveTo(-p.r, -p.r * 0.25, 0, -p.r);
      ctx!.fill();
      ctx!.restore();
    }

    let raf = 0;
    let running = true;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx!.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.phase += p.swaySpeed * dt;
        p.rot += p.vr * dt;
        if (p.y - 24 > h || p.x + p.sway < -30) Object.assign(p, make(false));
        draw(p);
      }
      if (running) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="petals" aria-hidden="true" />;
}
