interface Props {
  consumed: number;
  goal: number;
}

/** A circular progress ring showing calories consumed vs daily goal. */
export default function CalorieRing({ consumed, goal }: Props) {
  const size = 210;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratio = goal > 0 ? consumed / goal : 0;
  const clamped = Math.min(ratio, 1);
  const dash = circumference * clamped;
  const over = consumed > goal;
  const remaining = goal - consumed;

  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-weak)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "var(--over)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dasharray 0.6s cubic-bezier(0.2,0.8,0.2,1), stroke 0.3s ease",
          }}
        />
      </svg>
      <div className="ring-center">
        <div className="big">{consumed.toLocaleString()}</div>
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
