/**
 * A nocturnal ink-wash cherry-blossom branch overhanging the top-right.
 * Blossoms are rendered as soft, glowing, out-of-focus blooms (layered bokeh
 * with feathered edges) rather than literal flowers — suggestion over detail.
 * Decorative only (SVG, behind content); the falling petals emit from here.
 */

interface Cluster {
  x: number;
  y: number;
  r: number;
  pale?: boolean;
}

const CLUSTERS: Cluster[] = [
  { x: 416, y: 20, r: 30 },
  { x: 388, y: 84, r: 22, pale: true },
  { x: 346, y: 52, r: 30, pale: true },
  { x: 300, y: 96, r: 25 },
  { x: 250, y: 94, r: 28, pale: true },
  { x: 232, y: 48, r: 18 },
  { x: 204, y: 162, r: 22, pale: true },
];

// Relative orb layout within a cluster: [dx, dy, scale, alpha].
const ORBS: [number, number, number, number][] = [
  [0.0, 0.0, 0.58, 0.85],
  [0.46, 0.26, 0.4, 0.72],
  [-0.42, 0.3, 0.38, 0.7],
  [0.2, -0.46, 0.34, 0.66],
  [-0.36, -0.3, 0.3, 0.6],
  [0.52, -0.16, 0.27, 0.5],
  [-0.54, 0.06, 0.25, 0.48],
];

function Blossoms({ x, y, r, pale }: Cluster) {
  const fill = pale ? "url(#bloomPale)" : "url(#bloomBlush)";
  return (
    <g>
      {/* soft halo for depth */}
      <circle cx={x} cy={y} r={r} fill={fill} opacity={0.22} filter="url(#bigBlur)" />
      {ORBS.map(([dx, dy, s, a], i) => (
        <circle
          key={i}
          cx={x + dx * r}
          cy={y + dy * r}
          r={s * r}
          fill={fill}
          opacity={a}
          filter="url(#softBlur)"
        />
      ))}
    </g>
  );
}

export default function SakuraTree() {
  return (
    <svg
      className="sakura-tree"
      viewBox="0 0 440 230"
      preserveAspectRatio="xMaxYMin meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bloomBlush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbe3ec" />
          <stop offset="45%" stopColor="#eaabc1" />
          <stop offset="100%" stopColor="#eaabc1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bloomPale" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdeff4" />
          <stop offset="45%" stopColor="#f3cedb" />
          <stop offset="100%" stopColor="#f3cedb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bark" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#7b6a72" />
          <stop offset="100%" stopColor="#3c333a" />
        </linearGradient>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id="bigBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Moonlit branch + angular twigs */}
      <g fill="none" stroke="url(#bark)" strokeLinecap="round" opacity="0.9">
        <path
          d="M 452 4 C 398 24 366 40 334 56 C 302 72 288 82 264 106 C 242 128 228 140 200 172"
          strokeWidth="6.5"
        />
        <path d="M 334 56 C 350 80 366 88 392 90" strokeWidth="3.6" />
        <path d="M 264 106 C 254 82 250 68 240 48" strokeWidth="3.4" />
        <path d="M 300 80 C 313 104 324 114 346 122" strokeWidth="2.6" />
        <path d="M 226 144 C 214 130 208 120 200 102" strokeWidth="2.4" />
      </g>
      {/* faint moonlight on the upper edge of the limb */}
      <path
        d="M 452 4 C 398 24 366 40 334 56 C 302 72 288 82 264 106 C 242 128 228 140 200 172"
        fill="none"
        stroke="#b6a6ad"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.35"
        transform="translate(0 -2)"
      />

      {/* Soft-focus blooms */}
      {CLUSTERS.map((c, i) => (
        <Blossoms key={i} {...c} />
      ))}
    </svg>
  );
}
