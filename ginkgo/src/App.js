import { useEffect, useState, useCallback, useMemo } from 'react';
import './App.css';

const { DateTime } = require('luxon');

const DEBUG = process.env.NODE_ENV === 'development';
const TIME_PRESETS = [
  { label: 'Night (2am)', hour: 2 },
  { label: 'Dawn (5:45am)', hour: 5.75 },
  { label: 'Sunrise (7am)', hour: 7 },
  { label: 'Morning (9am)', hour: 9 },
  { label: 'Midday (12pm)', hour: 12 },
  { label: 'Golden (16pm)', hour: 16 },
  { label: 'Sunset (17:45pm)', hour: 17.75 },
  { label: 'Dusk (19pm)', hour: 19 },
  { label: 'Night (22pm)', hour: 22 },
];

// Color keyframes: [hour, topR, topG, topB, bottomR, bottomG, bottomB, opacity, brightness]
const COLOR_STOPS = [
  [0,    10, 22, 40,    26, 39, 68,    0.70, 0.30],
  [5,    10, 22, 40,    26, 39, 68,    0.70, 0.30],
  [5.5,  26, 26, 62,    74, 48, 96,    0.55, 0.40],
  [6.5,  26, 26, 62,   196,106, 58,    0.40, 0.55],
  [7.5,  58, 90,140,   212,133,106,    0.30, 0.75],
  [8.5,  58, 90,140,   240,192, 96,    0.25, 0.85],
  [10,  106,159,216,   160,196,232,    0.15, 1.00],
  [15,  135,206,235,   176,212,232,    0.10, 1.00],
  [16.5,196,154, 58,   212,112, 74,    0.20, 0.90],
  [17.5, 90, 42, 90,   192, 64, 64,    0.35, 0.80],
  [18.5, 90, 42, 90,   212,112, 48,    0.45, 0.65],
  [19.5, 26, 26, 74,    58, 32, 96,    0.55, 0.50],
  [20.5, 26, 26, 74,    90, 48,112,    0.65, 0.40],
  [22,   10, 22, 40,    26, 39, 68,    0.70, 0.30],
  [24,   10, 22, 40,    26, 39, 68,    0.70, 0.30],
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getTimeOfDay(hour) {
  let i = 0;
  while (i < COLOR_STOPS.length - 1 && COLOR_STOPS[i + 1][0] <= hour) i++;
  if (i >= COLOR_STOPS.length - 1) i = COLOR_STOPS.length - 2;

  const a = COLOR_STOPS[i];
  const b = COLOR_STOPS[i + 1];
  const t = a[0] === b[0] ? 0 : (hour - a[0]) / (b[0] - a[0]);

  const topR = Math.round(lerp(a[1], b[1], t));
  const topG = Math.round(lerp(a[2], b[2], t));
  const topB = Math.round(lerp(a[3], b[3], t));
  const botR = Math.round(lerp(a[4], b[4], t));
  const botG = Math.round(lerp(a[5], b[5], t));
  const botB = Math.round(lerp(a[6], b[6], t));
  const opacity = lerp(a[7], b[7], t);
  const brightness = lerp(a[8], b[8], t);

  const gradient = `linear-gradient(to bottom, rgb(${topR},${topG},${topB}), rgb(${botR},${botG},${botB}))`;

  // Derive phase name for debug display
  let phase;
  if (hour < 5) phase = 'night';
  else if (hour < 6.5) phase = 'dawn';
  else if (hour < 8) phase = 'sunrise';
  else if (hour < 10) phase = 'morning';
  else if (hour < 15) phase = 'day';
  else if (hour < 17) phase = 'golden';
  else if (hour < 18.5) phase = 'sunset';
  else if (hour < 20) phase = 'dusk';
  else phase = 'night';

  return { phase, gradient, opacity, brightness };
}

const SPORE_COLORS = [
  { core: 'rgba(255, 255, 255, 0.8)', glow: 'rgba(255, 255, 255, 0.5)' },
  { core: 'rgba(255, 255, 255, 0.8)', glow: 'rgba(255, 255, 255, 0.5)' },
  { core: 'rgba(235, 245, 255, 0.8)', glow: 'rgba(220, 235, 255, 0.5)' },
  { core: 'rgba(255, 245, 235, 0.8)', glow: 'rgba(255, 240, 220, 0.5)' },
  { core: 'rgba(245, 235, 255, 0.8)', glow: 'rgba(240, 225, 255, 0.5)' },
  { core: 'rgba(255, 248, 220, 0.8)', glow: 'rgba(255, 240, 180, 0.45)' },
  { core: 'rgba(255, 245, 210, 0.8)', glow: 'rgba(255, 235, 170, 0.45)' },
  { core: 'rgba(210, 190, 245, 0.8)', glow: 'rgba(180, 150, 235, 0.5)' },
];

function Spores() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const color = SPORE_COLORS[Math.floor(Math.random() * SPORE_COLORS.length)];
        return {
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: 3 + Math.random() * 9,
          driftX: -40 + Math.random() * 80,
          driftY: -60 + Math.random() * -20,
          duration: 12 + Math.random() * 18,
          delay: -(Math.random() * 30),
          glowDuration: 3 + Math.random() * 4,
          glowDelay: -(Math.random() * 7),
          opacity: 0.1 + Math.random() * 0.5,
          coreColor: color.core,
          glowColor: color.glow,
        };
      }),
    []
  );

  return (
    <div className="spores-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="spore"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.coreColor,
            '--drift-x': `${p.driftX}px`,
            '--drift-y': `${p.driftY}px`,
            '--max-opacity': p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className="spore-glow"
            style={{
              background: `radial-gradient(circle, ${p.glowColor}, transparent 70%)`,
              animationDuration: `${p.glowDuration}s`,
              animationDelay: `${p.glowDelay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function App() {
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const now = DateTime.now().setZone('CET');
    return getTimeOfDay(now.hour + now.minute / 60 + now.second / 3600);
  });
  const [debugMode, setDebugMode] = useState(false);
  const [debugTimeIdx, setDebugTimeIdx] = useState(4);
  const [overrideTime, setOverrideTime] = useState(null);

  useEffect(() => {
    const update = () => {
      const now = DateTime.now().setZone('CET');
      setTimeOfDay(getTimeOfDay(now.hour + now.minute / 60 + now.second / 3600));
    };
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!DEBUG) return;
    if (e.key === 'd' || e.key === 'D') {
      setDebugMode((prev) => {
        if (prev) setOverrideTime(null);
        return !prev;
      });
    }
    if (!debugMode) return;
    if (e.key === 'ArrowUp') {
      setDebugTimeIdx((prev) => {
        const next = (prev - 1 + TIME_PRESETS.length) % TIME_PRESETS.length;
        setOverrideTime(getTimeOfDay(TIME_PRESETS[next].hour));
        return next;
      });
    }
    if (e.key === 'ArrowDown') {
      setDebugTimeIdx((prev) => {
        const next = (prev + 1) % TIME_PRESETS.length;
        setOverrideTime(getTimeOfDay(TIME_PRESETS[next].hour));
        return next;
      });
    }
  }, [debugMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeTime = overrideTime || timeOfDay;

  return (
    <div className="App">
      <div
        className="background-image"
        style={{ filter: `brightness(${activeTime.brightness})` }}
      />
      <div
        className="time-overlay"
        style={{
          background: activeTime.gradient,
          opacity: activeTime.opacity,
        }}
      />
      <div className="ambient-light">
        <div className="glow glow-warm" />
        <div className="glow glow-cool" />
        <div className="glow glow-soft" />
      </div>
      <Spores />
      {debugMode && (
        <div className="debug-hud">
          <div>Press D to exit debug</div>
          <div>↑ ↓ Time: <strong>{TIME_PRESETS[debugTimeIdx].label}</strong></div>
          <div>Phase: {activeTime.phase} | Brightness: {activeTime.brightness.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

export default App;
