import { flightPath, spinDirection, fadeSide, STYLES, STABILITIES } from './flightPath';

const last = (pts) => pts[pts.length - 1];

test('backhand and forehand spin opposite ways, and lefties mirror righties', () => {
  expect(spinDirection('RHBH')).toBe('cw');
  expect(spinDirection('LHFH')).toBe('cw');
  expect(spinDirection('RHFH')).toBe('ccw');
  expect(spinDirection('LHBH')).toBe('ccw');
});

test('throws with the same spin fly the same path', () => {
  for (const s of STABILITIES) {
    expect(flightPath('LHFH', s)).toEqual(flightPath('RHBH', s));
    expect(flightPath('LHBH', s)).toEqual(flightPath('RHFH', s));
  }
});

test('opposite spin mirrors the path left/right', () => {
  for (const s of STABILITIES) {
    const cw = flightPath('RHBH', s);
    const ccw = flightPath('RHFH', s);
    ccw.forEach((p, i) => {
      expect(p.x).toBeCloseTo(-cw[i].x);
      expect(p.y).toBeCloseTo(cw[i].y);
    });
  }
});

test('RHBH: overstable finishes left, understable finishes right', () => {
  expect(last(flightPath('RHBH', 'overstable')).x).toBeLessThan(-0.2);
  expect(last(flightPath('RHBH', 'understable')).x).toBeGreaterThan(0.1);
});

test('RHFH: overstable finishes right', () => {
  expect(last(flightPath('RHFH', 'overstable')).x).toBeGreaterThan(0.2);
});

test('paths start at the thrower and travel forward', () => {
  for (const st of STYLES) {
    const pts = flightPath(st, 'stable');
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(last(pts).y).toBeGreaterThan(0.8);
  }
});

test('fadeSide follows spin', () => {
  expect(fadeSide('RHBH')).toBe('left');
  expect(fadeSide('LHFH')).toBe('left');
  expect(fadeSide('RHFH')).toBe('right');
  expect(fadeSide('LHBH')).toBe('right');
});
