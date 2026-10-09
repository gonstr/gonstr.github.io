import { useEffect, useState } from 'react';
import {
  flightPath,
  spinDirection,
  fadeSide,
  toSvgPath,
  STYLES,
  STABILITIES,
  STYLE_LABELS,
} from './flightPath';
import './FlightGuide.css';

const COLORS = {
  understable: '#5ec8ff',
  stable: '#9be28a',
  overstable: '#ffa35e',
};

const SAME_SPIN = { RHBH: 'LHFH', LHFH: 'RHBH', RHFH: 'LHBH', LHBH: 'RHFH' };
const opposite = (side) => (side === 'left' ? 'right' : 'left');

/* ---------- Shared SVG pieces ---------- */

function Basket({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} className="fg-basket">
      <line x1="0" y1="-14" x2="0" y2="12" />
      <ellipse cx="0" cy="-14" rx="7" ry="2" />
      <path d="M-6,-13 L-4,-2 M-2,-13 L-1,-2 M2,-13 L1,-2 M6,-13 L4,-2" />
      <path d="M-8,-2 L8,-2 L6,4 L-6,4 Z" />
    </g>
  );
}

function Field({ w, h, children, pad = 20 }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="fg-field">
      <defs>
        <linearGradient id={`fairway-${w}-${h}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3b2a" />
          <stop offset="1" stopColor="#24503a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx="12" fill={`url(#fairway-${w}-${h})`} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          className="fg-distance"
          x1="8"
          x2={w - 8}
          y1={h - pad - f * (h - pad * 2)}
          y2={h - pad - f * (h - pad * 2)}
        />
      ))}
      <line className="fg-centerline" x1={w / 2} x2={w / 2} y1={pad} y2={h - pad} />
      <rect className="fg-tee" x={w / 2 - 9} y={h - pad - 2} width="18" height="12" rx="2" />
      <Basket x={w / 2} y={pad + 4} scale={w < 160 ? 0.6 : 1} />
      {children}
    </svg>
  );
}

// A disc flying along a path, decelerating as it goes.
function FlyingDisc({ d, color, dur = 3.2, r = 6, begin = '0s' }) {
  return (
    <g>
      <circle r={r} fill={color} stroke="#fff" strokeWidth="1.2" opacity="0.95">
        <animateMotion
          path={d}
          dur={`${dur}s`}
          begin={begin}
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;1"
          keyPoints="0;1"
          keySplines="0.25 0.6 0.45 1"
        />
      </circle>
    </g>
  );
}

// Disc seen from above with a rotating spin arrow.
function SpinBadge({ dir, size = 56 }) {
  const arrow =
    dir === 'cw'
      ? 'M28,8 A20,20 0 0 1 48,28'
      : 'M28,8 A20,20 0 0 0 8,28';
  const head = dir === 'cw' ? 'M48,28 l-5,-5 m5,5 l4,-6' : 'M8,28 l5,-5 m-5,5 l-4,-6';
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} className="fg-spin">
      <circle cx="28" cy="28" r="22" className="fg-spin-disc" />
      <circle cx="28" cy="28" r="15" className="fg-spin-flight" />
      <g className={`fg-spin-rotor fg-spin-${dir}`}>
        <path d={arrow} className="fg-spin-arrow" />
        <path d={head} className="fg-spin-arrow" />
      </g>
    </svg>
  );
}

/* ---------- Sections ---------- */

const NUMBERS = [
  {
    name: 'Speed',
    value: 12,
    min: 1,
    max: 14,
    text: 'How fast the disc has to be thrown to fly as designed. High-speed drivers need a lot of arm speed. Thrown too slowly, they act more overstable than their numbers say.',
  },
  {
    name: 'Glide',
    value: 5,
    min: 1,
    max: 7,
    text: 'How well the disc holds itself up in the air. More glide means more distance, and also less control in the wind.',
  },
  {
    name: 'Turn',
    value: -1,
    min: -5,
    max: 1,
    text: 'High-speed stability: how much the disc drifts against its fade in the first part of the flight. More negative means more understable.',
  },
  {
    name: 'Fade',
    value: 3,
    min: 0,
    max: 5,
    text: 'Low-speed stability: how hard the disc hooks at the end as it slows down. Higher means more overstable.',
  },
];

function Gauge({ value, min, max }) {
  const pct = (v) => ((v - min) / (max - min)) * 100;
  return (
    <svg viewBox="0 0 120 26" className="fg-gauge">
      <rect x="0" y="10" width="120" height="6" rx="3" className="fg-gauge-track" />
      <rect x="0" y="10" width={(pct(value) / 100) * 120} height="6" rx="3" className="fg-gauge-fill" />
      <circle cx={(pct(value) / 100) * 120} cy="13" r="6" className="fg-gauge-knob" />
      <text x="0" y="26" className="fg-gauge-label">{min}</text>
      <text x="120" y="26" textAnchor="end" className="fg-gauge-label">{max}</text>
    </svg>
  );
}

function FlightNumbers() {
  return (
    <section className="fg-section">
      <h2>1. The four flight numbers</h2>
      <p>
        Most discs are printed with four numbers, like <strong className="fg-mono">12 | 5 | −1 | 3</strong>.
        Turn and fade together describe the disc's <em>stability</em>.
      </p>
      <div className="fg-numbers">
        {NUMBERS.map((n) => (
          <div key={n.name} className="fg-card">
            <div className="fg-card-head">
              <span>{n.name}</span>
              <span className="fg-big">{n.value > 0 && n.name === 'Turn' ? `+${n.value}` : n.value}</span>
            </div>
            <Gauge {...n} />
            <p>{n.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StabilityCompare() {
  const w = 260;
  const h = 360;
  return (
    <section className="fg-section">
      <h2>2. Understable, stable, overstable</h2>
      <div className="fg-split">
        <Field w={w} h={h}>
          {STABILITIES.map((s, i) => {
            const d = toSvgPath(flightPath('RHBH', s), w, h);
            return (
              <g key={s}>
                <path d={d} className="fg-path" stroke={COLORS[s]} />
                <FlyingDisc d={d} color={COLORS[s]} begin={`${i * 0.15}s`} />
              </g>
            );
          })}
        </Field>
        <div>
          <p className="fg-note">Right-hand backhand, seen from above with the basket straight ahead.</p>
          <ul className="fg-legend">
            <li>
              <span className="fg-dot" style={{ background: COLORS.understable }} />
              <strong>Understable</strong> (e.g. 9 | 5 | −3 | 1): turns to the <em>right</em> at high speed
              and doesn't fade much back. Good for long straight lines, turnovers and players with less arm speed.
            </li>
            <li>
              <span className="fg-dot" style={{ background: COLORS.stable }} />
              <strong>Stable</strong> (e.g. 7 | 5 | 0 | 2): flies mostly straight, then fades gently
              to the left at the end.
            </li>
            <li>
              <span className="fg-dot" style={{ background: COLORS.overstable }} />
              <strong>Overstable</strong> (e.g. 9 | 3 | 0 | 4): won't turn, and hooks hard to the
              <em> left</em> as it slows. Predictable in headwinds, good for skips, hyzers and big power throwers.
            </li>
          </ul>
          <p className="fg-note">
            "Left" and "right" are only true for this throw. Which way a disc fades depends on which way it{' '}
            <strong>spins</strong>. See below.
          </p>
        </div>
      </div>
    </section>
  );
}

function Simulator() {
  const [style, setStyle] = useState('RHBH');
  const [stability, setStability] = useState('overstable');
  const w = 280;
  const h = 380;
  const dir = spinDirection(style);
  const fade = fadeSide(style);
  const turn = opposite(fade);

  const captions = {
    understable: `It turns to the ${turn} at high speed, then fades back only a little to the ${fade}.`,
    stable: `It flies close to straight, with a gentle fade to the ${fade} at the end.`,
    overstable: `It resists turning and hooks hard to the ${fade} as it slows down.`,
  };

  return (
    <section className="fg-section">
      <h2>3. Try it: hand, throw and stability</h2>
      <div className="fg-controls">
        <div className="fg-toggle">
          {STYLES.map((s) => (
            <button key={s} className={s === style ? 'active' : ''} onClick={() => setStyle(s)}>
              {STYLE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="fg-toggle">
          {STABILITIES.map((s) => (
            <button
              key={s}
              className={s === stability ? 'active' : ''}
              style={s === stability ? { background: COLORS[s], color: '#0b1520' } : null}
              onClick={() => setStability(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="fg-split">
        <Field w={w} h={h} key={`${style}-${stability}`}>
          {STABILITIES.filter((s) => s !== stability).map((s) => (
            <path key={s} d={toSvgPath(flightPath(style, s), w, h)} className="fg-path fg-ghost" stroke={COLORS[s]} />
          ))}
          {(() => {
            const d = toSvgPath(flightPath(style, stability), w, h);
            return (
              <>
                <path d={d} className="fg-path fg-path-main" stroke={COLORS[stability]} />
                <FlyingDisc d={d} color={COLORS[stability]} r={7} />
              </>
            );
          })()}
          <text x={14} y={h - 12} className="fg-side-label">← left</text>
          <text x={w - 14} y={h - 12} textAnchor="end" className="fg-side-label">right →</text>
        </Field>
        <div className="fg-sim-info">
          <div className="fg-spin-row">
            <SpinBadge dir={dir} />
            <div>
              <div className="fg-big-label">{STYLE_LABELS[style]}</div>
              <div>
                spins <strong>{dir === 'cw' ? 'clockwise' : 'counter-clockwise'}</strong> seen from above
              </div>
            </div>
          </div>
          <p>
            <strong style={{ color: COLORS[stability] }}>{stability[0].toUpperCase() + stability.slice(1)}:</strong>{' '}
            {captions[stability]}
          </p>
          <div className="fg-callout">
            <div>
              Overstable fades <strong>{fade}</strong>, understable turns <strong>{turn}</strong>.
            </div>
            <div>
              Same flight as a <strong>{STYLE_LABELS[SAME_SPIN[style]].toLowerCase()}</strong>, because they spin
              the same way.
            </div>
          </div>
          <p className="fg-note">
            Switch between backhand and forehand, or between right and left hand, and the whole flight mirrors.
            The disc doesn't care which hand threw it. Only the spin direction matters.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhySpin() {
  const [dir, setDir] = useState('cw');
  const cw = dir === 'cw';
  // Front of disc (direction of travel) is up. The upward push at the front
  // "arrives" 90° later in the direction of spin.
  const riseX = cw ? 150 : 50;
  const bankSide = cw ? 'left' : 'right';
  const quarterArc = cw ? 'M100,30 A70,70 0 0 1 166,92' : 'M100,30 A70,70 0 0 0 34,92';
  const quarterHead = cw ? 'M166,92 l-9,-3 m9,3 l1,-9' : 'M34,92 l9,-3 m-9,3 l-1,-9';

  return (
    <section className="fg-section">
      <h2>4. Why spin decides the direction</h2>
      <div className="fg-why">
        <div className="fg-card">
          <h3>A. Lift pushes the nose up</h3>
          <svg viewBox="0 0 260 150" className="fg-diagram">
            {[40, 62, 108, 126].map((y, i) => (
              <path
                key={y}
                className="fg-air"
                d={i < 2 ? `M0,${y} C70,${y} 90,${y - 24} 130,${y - 26} S210,${y} 260,${y}` : `M0,${y} L260,${y}`}
              />
            ))}
            <path className="fg-airfoil" d="M60,92 C80,66 180,64 205,88 C208,92 206,96 200,96 L66,96 C60,96 58,94 60,92 Z" />
            <circle cx="130" cy="88" r="5" className="fg-com" />
            <text x="118" y="122" className="fg-small">centre of mass</text>
            <line x1="165" y1="84" x2="165" y2="30" className="fg-force" />
            <path d="M159,38 L165,28 L171,38" className="fg-force" />
            <text x="172" y="36" className="fg-small fg-force-text">lift</text>
            <path d="M212,70 A28,28 0 0 0 196,46" className="fg-torque" />
            <path d="M196,46 l2,9 m-2,-9 l8,3" className="fg-torque" />
            <text x="10" y="20" className="fg-small">→ direction of flight</text>
          </svg>
          <p>
            Lift acts slightly ahead of the disc's centre, so it tries to <strong>tip the nose up</strong>. How far
            ahead depends on the disc's shape and its speed.
          </p>
        </div>

        <div className="fg-card">
          <h3>B. Spin turns that into a roll</h3>
          <div className="fg-toggle fg-toggle-small">
            <button className={cw ? 'active' : ''} onClick={() => setDir('cw')}>Clockwise (RHBH / LHFH)</button>
            <button className={!cw ? 'active' : ''} onClick={() => setDir('ccw')}>Counter-clockwise (RHFH / LHBH)</button>
          </div>
          <svg viewBox="0 0 200 200" className="fg-diagram fg-diagram-square">
            <circle cx="100" cy="100" r="70" className="fg-top-disc" />
            <circle cx="100" cy="100" r="50" className="fg-spin-flight" />
            <g className={`fg-spin-rotor fg-spin-${dir} fg-rotor-big`}>
              <path d={cw ? 'M100,58 A42,42 0 0 1 142,100' : 'M100,58 A42,42 0 0 0 58,100'} className="fg-spin-arrow" />
              <path d={cw ? 'M100,142 A42,42 0 0 1 58,100' : 'M100,142 A42,42 0 0 0 142,100'} className="fg-spin-arrow" />
            </g>
            <circle cx="100" cy="30" r="7" className="fg-push" />
            <circle cx="100" cy="30" r="2" fill="#fff" />
            <text x="100" y="16" textAnchor="middle" className="fg-small">push up here (nose)</text>
            <path d={quarterArc} className="fg-precess" />
            <path d={quarterHead} className="fg-precess" />
            <circle cx={riseX + (cw ? 20 : -20)} cy="100" r="7" className="fg-push" />
            <text
              x={cw ? 196 : 4}
              y="128"
              textAnchor={cw ? 'end' : 'start'}
              className="fg-small fg-precess-text"
            >
              …shows up here
            </text>
            <text x="100" y="196" textAnchor="middle" className="fg-small">↑ direction of flight</text>
          </svg>
          <p>
            A spinning disc acts like a gyroscope: a push shows up <strong>90° later in the direction of spin</strong>.
            Nose-up becomes "{cw ? 'right' : 'left'} side up". The disc banks to the <strong>{bankSide}</strong>, lift
            tilts with it, and the disc curves {bankSide}. That's the fade.
          </p>
        </div>

        <div className="fg-card fg-wide">
          <h3>C. Speed changes the balance: turn first, fade last</h3>
          <SpeedPhases />
          <p>
            <strong>Fast:</strong> on an understable disc, lift sits at or behind the centre, so the nose is pushed
            <em> down</em>. Spin turns that into a bank the other way: the high-speed <em>turn</em>.
            <br />
            <strong>Slow:</strong> as the disc loses speed, lift always moves forward and the nose-up push wins. Every
            disc eventually fades. Overstable discs have lift far forward from the start, so they never turn and fade
            early and hard.
          </p>
          <p className="fg-note">
            Release angle adds to all of this. Tilting the disc toward its fade side (hyzer) adds fade, and tilting it
            the other way (anhyzer) adds turn.
          </p>
        </div>
      </div>
    </section>
  );
}

function SpeedPhases() {
  const w = 520;
  const h = 200;
  // Lay the RHBH understable path on its side: downfield = right.
  const pts = flightPath('RHBH', 'understable');
  const toXY = (p) => [20 + p.y * (w - 60), 70 + p.x * 260];
  const seg = (a, b) =>
    pts
      .slice(a, b + 1)
      .map((p, i) => `${i ? 'L' : 'M'}${toXY(p).map((n) => n.toFixed(1)).join(',')}`)
      .join(' ');
  const n = pts.length - 1;
  const zones = [
    { from: 0, to: Math.round(n * 0.35), color: '#5ec8ff', label: 'Fast: turn', lx: 70 },
    { from: Math.round(n * 0.35), to: Math.round(n * 0.65), color: '#cfe8ff', label: 'Glide', lx: 250 },
    { from: Math.round(n * 0.65), to: n, color: '#ffa35e', label: 'Slow: fade', lx: 430 },
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="fg-diagram fg-phases">
      {zones.map((z) => (
        <g key={z.label}>
          <path d={seg(z.from, z.to)} className="fg-path fg-path-main" stroke={z.color} />
          <text x={z.lx} y="22" textAnchor="middle" className="fg-small" fill={z.color}>
            {z.label}
          </text>
        </g>
      ))}
      <text x="20" y={h - 10} className="fg-small">thrower</text>
      <text x={w - 10} y={h - 10} textAnchor="end" className="fg-small">downfield → (seen from above, RHBH)</text>
    </svg>
  );
}

function CheatSheet() {
  const w = 130;
  const h = 180;
  return (
    <section className="fg-section">
      <h2>5. Cheat sheet</h2>
      <div className="fg-cheat">
        {STYLES.map((st) => (
          <div key={st} className="fg-card fg-cheat-card">
            <div className="fg-cheat-head">
              <SpinBadge dir={spinDirection(st)} size={34} />
              <strong>{STYLE_LABELS[st]}</strong>
            </div>
            <Field w={w} h={h} pad={16}>
              {STABILITIES.map((s) => (
                <path
                  key={s}
                  d={toSvgPath(flightPath(st, s), w, h, { pad: 16 })}
                  className="fg-path fg-path-thin"
                  stroke={COLORS[s]}
                />
              ))}
            </Field>
            <div className="fg-small-text">
              Overstable fades <strong>{fadeSide(st)}</strong>
              <br />
              Understable turns <strong>{opposite(fadeSide(st))}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FlightGuide({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fg-overlay" role="dialog" aria-modal="true" aria-label="Disc flight guide">
      <button className="fg-close" onClick={onClose} aria-label="Close">✕</button>
      <div className="fg-content">
        <header className="fg-header">
          <h1>Why discs fly the way they do</h1>
          <p>Overstable vs. understable, forehand vs. backhand, righty vs. lefty. It all comes down to spin.</p>
        </header>
        <FlightNumbers />
        <StabilityCompare />
        <Simulator />
        <WhySpin />
        <CheatSheet />
      </div>
    </div>
  );
}
