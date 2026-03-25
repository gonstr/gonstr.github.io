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

const SPORE_COLORS_DAY = [
  { core: 'rgba(255, 255, 255, 0.8)', glow: 'rgba(255, 255, 255, 0.5)' },
  { core: 'rgba(255, 255, 255, 0.8)', glow: 'rgba(255, 255, 255, 0.5)' },
  { core: 'rgba(255, 255, 255, 0.8)', glow: 'rgba(255, 255, 255, 0.5)' },
];

const SPORE_COLORS_NIGHT = [
  { core: 'rgba(190, 215, 255, 0.8)', glow: 'rgba(170, 200, 255, 0.45)' },
  { core: 'rgba(200, 240, 220, 0.8)', glow: 'rgba(180, 230, 210, 0.45)' },
  { core: 'rgba(215, 200, 240, 0.8)', glow: 'rgba(200, 185, 235, 0.45)' },
  { core: 'rgba(240, 215, 190, 0.8)', glow: 'rgba(235, 205, 175, 0.45)' },
  { core: 'rgba(240, 200, 215, 0.8)', glow: 'rgba(235, 185, 205, 0.45)' },
  { core: 'rgba(190, 235, 235, 0.8)', glow: 'rgba(175, 225, 225, 0.45)' },
];

const ORB_COLORS = [
  'rgba(60, 130, 255, 0.5)',
  'rgba(100, 180, 255, 0.45)',
  'rgba(140, 80, 255, 0.45)',
  'rgba(60, 200, 180, 0.4)',
  'rgba(180, 100, 255, 0.4)',
];

function CityLights({ brightness, bgMask }) {
  const opacity = Math.max(0, (1 - brightness) * 1.2 - 0.3);
  const lights = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const warmth = Math.random();
        const r = 255;
        const g = Math.round(180 + warmth * 60);
        const b = Math.round(100 + warmth * 80);
        return {
          id: i,
          left: 5 + Math.random() * 90,
          top: 5 + Math.random() * 90,
          size: 6 + Math.random() * 10,
          color: `rgba(${r}, ${g}, ${b}, 0.9)`,
          glowColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
          duration: 2 + Math.random() * 5,
          delay: -(Math.random() * 7),
          glowSize: 4 + Math.random() * 6,
        };
      }),
    []
  );

  if (opacity <= 0) return null;

  return (
    <div className="city-lights-container" style={{
      opacity,
      transition: 'opacity 60s ease',
      WebkitMaskImage: `url(${bgMask})`,
      maskImage: `url(${bgMask})`,
    }}>
      {lights.map((l) => (
        <div
          key={l.id}
          className="city-light"
          style={{
            left: `${l.left}%`,
            top: `${l.top}%`,
            width: `${l.size}px`,
            height: `${l.size}px`,
            background: l.color,
            boxShadow: `0 0 ${l.glowSize}px ${l.glowColor}`,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function NightOrbs({ brightness, bgMask }) {
  const opacity = Math.max(0, (1 - brightness) * 0.8 - 0.2);
  const orbs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: 20 + Math.random() * 60,
        size: 150 + Math.random() * 200,
        driftX: -60 + Math.random() * 120,
        driftY: -40 + Math.random() * 80,
        duration: 25 + Math.random() * 20,
        delay: -(Math.random() * 40),
        color: ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)],
      })),
    []
  );

  if (opacity <= 0) return null;

  return (
    <div className="orbs-container" style={{
      opacity,
      transition: 'opacity 60s ease',
      WebkitMaskImage: `url(${bgMask})`,
      maskImage: `url(${bgMask})`,
    }}>
      {orbs.map((o) => (
        <div
          key={o.id}
          className="night-orb"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: `${o.size}px`,
            height: `${o.size}px`,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            '--drift-x': `${o.driftX}px`,
            '--drift-y': `${o.driftY}px`,
            animationDuration: `${o.duration}s`,
            animationDelay: `${o.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Spores({ brightness }) {
  const isNight = brightness < 0.6;
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const dayColor = SPORE_COLORS_DAY[Math.floor(Math.random() * SPORE_COLORS_DAY.length)];
        const nightColor = SPORE_COLORS_NIGHT[Math.floor(Math.random() * SPORE_COLORS_NIGHT.length)];
        return {
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: 3 + Math.random() * 14,
          driftX: -40 + Math.random() * 80,
          driftY: -60 + Math.random() * -20,
          duration: 12 + Math.random() * 18,
          delay: -(Math.random() * 30),
          glowDuration: 3 + Math.random() * 4,
          glowDelay: -(Math.random() * 7),
          opacity: 0.08 + Math.random() * 0.35,
          dayCore: dayColor.core,
          dayGlow: dayColor.glow,
          nightCore: nightColor.core,
          nightGlow: nightColor.glow,
        };
      }),
    []
  );

  return (
    <div className="spores-container" style={{
      opacity: Math.max(0, (1 - brightness) * 1.5 - 0.2),
      transition: 'opacity 60s ease',
    }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="spore"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: isNight ? p.nightCore : p.dayCore,
            transition: 'background 60s ease',
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
              background: `radial-gradient(circle, ${isNight ? p.nightGlow : p.dayGlow}, transparent 70%)`,
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
      <div className="bg-breathe" style={{
        WebkitMaskImage: `url(${process.env.PUBLIC_URL}/ginkgo-bg-mask.png)`,
        maskImage: `url(${process.env.PUBLIC_URL}/ginkgo-bg-mask.png)`,
        '--night-intensity': Math.min((1 - activeTime.brightness) * 0.8, 0.6),
      }} />
      <div className="leaf-breathe" style={{
        WebkitMaskImage: `url(${process.env.PUBLIC_URL}/ginkgo-mask.png)`,
        maskImage: `url(${process.env.PUBLIC_URL}/ginkgo-mask.png)`,
        '--night-intensity': Math.min((1 - activeTime.brightness) * 0.5, 0.35),
      }} />
      <div className="leaf-veins" style={{
        WebkitMaskImage: `url(${process.env.PUBLIC_URL}/ginkgo-veins.png)`,
        maskImage: `url(${process.env.PUBLIC_URL}/ginkgo-veins.png)`,
        '--night-intensity': Math.min((1 - activeTime.brightness) * 0.4, 0.3),
      }} />
      <NightOrbs brightness={activeTime.brightness} bgMask={`${process.env.PUBLIC_URL}/ginkgo-bg-mask.png`} />
      <CityLights brightness={activeTime.brightness} bgMask={`${process.env.PUBLIC_URL}/ginkgo-bg-mask.png`} />
      <Spores brightness={activeTime.brightness} />
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
