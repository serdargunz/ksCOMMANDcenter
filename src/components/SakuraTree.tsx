/**
 * A stylized cherry-blossom branch overhanging the top-right corner.
 * Purely decorative (SVG, behind content). The falling petals are emitted
 * from roughly this area so they read as drifting off the branch.
 */

interface Anchor {
  x: number;
  y: number;
  s: number;
}

// Blossom clusters along the branch (viewBox coords).
const BLOSSOMS: Anchor[] = [
  { x: 408, y: 22, s: 1.2 },
  { x: 366, y: 40, s: 1.0 },
  { x: 392, y: 64, s: 0.85 },
  { x: 326, y: 58, s: 1.1 },
  { x: 300, y: 92, s: 0.95 },
  { x: 256, y: 86, s: 1.05 },
  { x: 232, y: 126, s: 0.8 },
  { x: 196, y: 150, s: 0.9 },
];

const BUDS: Anchor[] = [
  { x: 350, y: 80, s: 1 },
  { x: 280, y: 60, s: 1 },
  { x: 220, y: 104, s: 1 },
  { x: 168, y: 132, s: 1 },
  { x: 432, y: 46, s: 1 },
];

function Blossom({ x, y, s }: Anchor) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`rotate(${i * 72})`}>
          <ellipse cx="0" cy="-7.5" rx="5.2" ry="8" fill="url(#petGrad)" />
          {/* subtle notch highlight */}
          <ellipse cx="0" cy="-9" rx="1.6" ry="2.4" fill="#ffffff" opacity="0.45" />
        </g>
      ))}
      <circle r="2.6" fill="#f06f9a" />
      <circle r="2.6" fill="#ef6f9a" />
      <circle r="1" cx="0" cy="-1.5" fill="#ffd27a" />
    </g>
  );
}

export default function SakuraTree() {
  return (
    <svg
      className="sakura-tree"
      viewBox="0 0 440 210"
      preserveAspectRatio="xMaxYMin meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="petGrad" cx="50%" cy="78%" r="75%">
          <stop offset="0%" stopColor="#ffe6f0" />
          <stop offset="60%" stopColor="#ffc2da" />
          <stop offset="100%" stopColor="#ff9ec4" />
        </radialGradient>
        <linearGradient id="barkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a4045" />
          <stop offset="100%" stopColor="#3a2a2e" />
        </linearGradient>
        <filter id="blossomGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#ff9ec4"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      {/* Branch + offshoots */}
      <g
        fill="none"
        stroke="url(#barkGrad)"
        strokeLinecap="round"
        opacity="0.92"
      >
        <path
          d="M 446 4 C 392 24 366 36 338 50 C 306 66 292 72 268 96 C 244 120 228 130 200 162"
          strokeWidth="6"
        />
        <path d="M 338 50 C 352 70 364 78 392 80" strokeWidth="3.4" />
        <path d="M 268 96 C 258 74 252 62 240 44" strokeWidth="3.4" />
        <path d="M 300 70 C 312 96 322 108 344 116" strokeWidth="2.6" />
        <path d="M 228 132 C 214 120 206 112 196 96" strokeWidth="2.4" />
      </g>

      {/* Buds (tiny dots) */}
      <g opacity="0.85">
        {BUDS.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="2.6" fill="#ffb3d2" />
        ))}
      </g>

      {/* Blossoms */}
      <g filter="url(#blossomGlow)">
        {BLOSSOMS.map((b, i) => (
          <Blossom key={i} {...b} />
        ))}
      </g>
    </svg>
  );
}
