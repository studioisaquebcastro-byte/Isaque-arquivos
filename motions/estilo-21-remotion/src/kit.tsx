// Kit reutilizável do estilo 21 ("linha-guia contínua").
import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';

export const NEON = '#7CFF4F';
export const NEON_SOFT = '#D8FFC8';
export const BG = '#040B09';
export const FONT = 'Inter, system-ui, sans-serif';

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);

export const ci = (
  f: number,
  input: number[],
  output: number[],
  easing?: (t: number) => number,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

// ---------- Câmara virtual ----------
export type CamKey = {f: number; x: number; y: number; s: number; rx?: number; ry?: number};

export const cameraAt = (f: number, keys: CamKey[]) => {
  const pick = (k: CamKey) => ({x: k.x, y: k.y, s: k.s, rx: k.rx ?? 0, ry: k.ry ?? 0});
  if (f <= keys[0].f) return pick(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = easeInOut((f - a.f) / (b.f - a.f));
      const pa = pick(a);
      const pb = pick(b);
      // escala interpolada em log para o zoom parecer uniforme
      const s = Math.exp(Math.log(pa.s) + (Math.log(pb.s) - Math.log(pa.s)) * t);
      return {
        x: pa.x + (pb.x - pa.x) * t,
        y: pa.y + (pb.y - pa.y) * t,
        s,
        rx: pa.rx + (pb.rx - pa.rx) * t,
        ry: pa.ry + (pb.ry - pa.ry) * t,
      };
    }
  }
  return pick(keys[keys.length - 1]);
};

// ---------- Linha-guia néon ----------
export const GlowDefs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="glowSm" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" />
    </filter>
  </defs>
);

export const NeedleHead: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({
  x,
  y,
  r = 9,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 3.2} fill={NEON} opacity={0.35} filter="url(#glow)" />
    <circle cx={x} cy={y} r={r} fill="#fff" />
    <circle cx={x} cy={y} r={r * 1.7} fill="none" stroke={NEON} strokeWidth={2} opacity={0.8} />
  </g>
);

export const GuideSeg: React.FC<{
  d: string;
  from: number;
  to: number;
  fadeAt?: number;
  fadeDur?: number;
  width?: number;
  stroke?: string;
  easing?: (t: number) => number;
  reverse?: boolean;
}> = ({d, from, to, fadeAt, fadeDur = 10, width = 6, stroke = NEON, easing, reverse}) => {
  const f = useCurrentFrame();
  const L = getLength(d);
  const p = ci(f, [from, to], [0, 1], easing);
  const op = fadeAt === undefined ? 1 : ci(f, [fadeAt, fadeAt + fadeDur], [1, 0]);
  if (f < from || op <= 0) return null;
  const dash = {
    strokeDasharray: L,
    strokeDashoffset: reverse ? -L * (1 - p) : L * (1 - p),
  };
  const head = getPointAtLength(d, reverse ? L * (1 - p) : L * p);
  return (
    <g opacity={op}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={width * 4} strokeLinecap="round" opacity={0.3} filter="url(#glow)" {...dash} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" {...dash} />
      <path d={d} fill="none" stroke={NEON_SOFT} strokeWidth={width * 0.35} strokeLinecap="round" opacity={0.9} {...dash} />
      {head && p > 0 && p < 1 ? <NeedleHead x={head.x} y={head.y} r={width * 1.4} /> : null}
    </g>
  );
};

// ---------- Contador em slots (odómetro) ----------
export const Odometer: React.FC<{
  times: number[];
  values: number[];
  digits: number;
  w?: number;
  h?: number;
  color?: string;
}> = ({times, values, digits, w = 140, h = 190, color = '#FFB547'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  let k = 0;
  for (let i = 0; i < times.length; i++) if (f >= times[i]) k = i;
  const prev = k === 0 ? values[0] : values[k - 1];
  const cur = values[k];
  const pr = spring({frame: f - times[k], fps, config: {damping: 14, stiffness: 170}});
  // índice 0 = vazio (zero à esquerda), índice d+1 = dígito d
  const idx = (n: number, pos: number) => {
    const s = String(n).padStart(digits, ' ');
    const c = s[pos];
    return c === ' ' ? 0 : Number(c) + 1;
  };
  return (
    <div style={{display: 'flex', gap: 18}}>
      {Array.from({length: digits}).map((_, pos) => {
        const a = idx(prev, pos);
        const b = idx(cur, pos);
        const y = (a + (b - a) * pr) * h;
        return (
          <div
            key={pos}
            style={{
              width: w,
              height: h,
              borderRadius: 26,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(180deg,#1b1712,#0d0b09)',
              border: `3px solid ${color}`,
              boxShadow: `0 0 30px ${color}55, inset 0 2px 0 #ffffff22`,
            }}
          >
            <div style={{position: 'absolute', left: 0, right: 0, top: -y}}>
              {[' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c, i) => (
                <div
                  key={i}
                  style={{
                    height: h,
                    lineHeight: `${h}px`,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: h * 0.62,
                    color: '#F6EBDD',
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Cartão de vidro ----------
export const GlassCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  border: string;
  appear: number;
  children: React.ReactNode;
}> = ({x, y, w, h, border, appear, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - appear, fps, config: {damping: 16, stiffness: 120}});
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: 48,
        opacity: s,
        transform: `scale(${0.88 + 0.12 * s})`,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.05))',
        border: `3px solid ${border}`,
        boxShadow: `0 0 50px ${border}40, inset 0 1px 0 rgba(255,255,255,0.25), 0 40px 80px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

// Revelação de texto por máscara (acompanha a cabeça da linha)
export const Reveal: React.FC<{p: number; children: React.ReactNode; fromCenter?: boolean}> = ({
  p,
  children,
  fromCenter,
}) => {
  const clip = fromCenter
    ? `inset(-20% ${50 - p * 50}% -20% ${50 - p * 50}%)`
    : `inset(-20% ${100 - p * 100}% -20% 0)`;
  return <div style={{clipPath: clip}}>{children}</div>;
};
