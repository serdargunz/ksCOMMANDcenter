import { useEffect, useRef, useState } from "react";

interface Props {
  consumed: number;
  goal: number;
}

/** Animates a number from its previous value to the target on change. */
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

/** A glowing gradient progress ring: calories consumed vs daily goal. */
export default function CalorieRing({ consumed, goal }: Props) {
  const size = 236;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratio = goal > 0 ? consumed / goal : 0;
  const dash = circumference * Math.min(ratio, 1);
  const over = consumed > goal;
  const remaining = goal - consumed;

  const display = useCountUp(consumed);

  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="55%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="ringGradOver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="5"
              floodColor={over ? "#fb7185" : "#2dd4bf"}
              floodOpacity="0.75"
            />
          </filter>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "url(#ringGradOver)" : "url(#ringGrad)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#ringGlow)"
          style={{
            transition:
              "stroke-dasharray 0.7s cubic-bezier(0.2,0.8,0.2,1), stroke 0.3s ease",
          }}
        />
      </svg>
      <div className="ring-center">
        <div className="big">{display.toLocaleString()}</div>
        <div className="label">of {goal.toLocaleString()} kcal</div>
        <div className={`remaining${over ? " over" : ""}`}>
          {over
            ? `${Math.abs(remaining).toLocaleString()} over`
            : `${remaining.toLocaleString()} left`}
        </div>
      </div>
    </div>
  );
}
