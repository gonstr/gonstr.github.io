// Top-down flight model, seen from behind the thrower.
// x: lateral (+ = thrower's right), y: distance downfield (0..1).

export const STYLES = ['RHBH', 'RHFH', 'LHBH', 'LHFH'];
export const STABILITIES = ['understable', 'stable', 'overstable'];

export const STYLE_LABELS = {
  RHBH: 'Right-hand backhand',
  RHFH: 'Right-hand forehand',
  LHBH: 'Left-hand backhand',
  LHFH: 'Left-hand forehand',
};

// Viewed from above: a right-hand backhand pulls the disc across the body
// and releases it spinning clockwise. Forehand and left-handed throws flip it.
export function spinDirection(style) {
  return style === 'RHBH' || style === 'LHFH' ? 'cw' : 'ccw';
}

// Low-speed fade always goes the way the spin tips the disc.
export function fadeSide(style) {
  return spinDirection(style) === 'cw' ? 'left' : 'right';
}

// turn: high-speed drift to the right (for clockwise spin)
// fade: low-speed hook to the left (for clockwise spin)
const PROFILES = {
  understable: { turn: 0.26, fade: 0.08, distance: 1.0 },
  stable: { turn: 0.05, fade: 0.12, distance: 0.97 },
  overstable: { turn: -0.02, fade: 0.32, distance: 0.9 },
};

function smoothstep(a, b, t) {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

export function flightPath(style, stability, steps = 60) {
  const { turn, fade, distance } = PROFILES[stability];
  const sign = spinDirection(style) === 'cw' ? 1 : -1;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Disc decelerates, so forward progress flattens out at the end.
    const y = distance * (1 - Math.pow(1 - t, 1.5));
    const late = Math.max(0, (t - 0.55) / 0.45);
    const x = turn * smoothstep(0.1, 0.7, t) - fade * late * late;
    pts.push({ x: x * sign + 0, y }); // + 0 normalises -0
  }
  return pts;
}

// Map a flight path into an SVG path string inside a w×h box,
// thrower at bottom-centre.
export function toSvgPath(pts, w, h, { pad = 20, lateralScale = 0.95 } = {}) {
  const cx = w / 2;
  const reach = h - pad * 2;
  return pts
    .map((p, i) => {
      const X = cx + p.x * w * lateralScale;
      const Y = h - pad - p.y * reach;
      return `${i ? 'L' : 'M'}${X.toFixed(1)},${Y.toFixed(1)}`;
    })
    .join(' ');
}
