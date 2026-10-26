// Demo do estilo 21: "Tatuagem de traço fino quase sempre precisa de retoque".
// Um só plano: a linha néon é a agulha, que desenha, liga e fecha todas as cenas.
import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, random} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {
  BG,
  Cam3Key,
  Extrude,
  FONT,
  Floor,
  FloorShadow,
  GlowDefs,
  GuideSeg,
  NEON,
  NeedleHead,
  Odometer,
  PERSPECTIVE,
  Particles,
  Stand,
  cam3At,
  ci,
  easeInOut,
  expoOut,
  floorRadius,
  worldTransform,
} from './kit';

const W = 1080;
const H = 1920;
const RED = '#FF4D5E';
const CYAN = '#3FD0FF';
const PURPLE = '#A77BFF';
const AMBER = '#FFB547';

// ---------- Tatuagem fina (coordenadas locais do cartão 820x1000) ----------
const CARD = {x: 130, y: 2000, w: 820, h: 1000};
const TATTOO = [
  'M410 170 C 380 130, 395 95, 410 82 C 425 95, 440 130, 410 170',
  'M410 170 C 360 150, 340 118, 346 96 C 378 104, 400 132, 410 170',
  'M410 170 C 460 150, 480 118, 474 96 C 442 104, 420 132, 410 170',
  'M410 170 C 380 320, 460 450, 410 600 S 360 820, 420 905',
  'M402 300 C 342 270, 302 290, 282 330 C 332 342, 372 330, 402 300',
  'M424 380 C 490 350, 530 370, 548 412 C 500 422, 460 410, 424 380',
  'M418 480 C 352 460, 316 486, 300 528 C 346 532, 392 516, 418 480',
  'M416 572 C 480 546, 522 566, 538 608 C 492 614, 450 602, 416 572',
  'M394 692 C 334 676, 298 700, 288 742 C 334 744, 372 730, 394 692',
];
const LENS = TATTOO.map((d) => getLength(d));
const CUM = LENS.reduce<number[]>((acc, l, i) => [...acc, (acc[i] ?? 0) + l], [0]);
const TOTAL = CUM[CUM.length - 1];
const pointAt = (D: number) => {
  const d = Math.max(0, Math.min(TOTAL - 0.01, D));
  let i = 0;
  while (i < TATTOO.length - 1 && d > CUM[i + 1]) i++;
  return getPointAtLength(TATTOO[i], d - CUM[i]);
};
// falhas que aparecem na cicatrização: [traço, fração, raio máx.]
const GAPS: [number, number, number][] = [
  [3, 0.2, 10],
  [3, 0.52, 11],
  [3, 0.83, 9],
  [5, 0.45, 8],
  [7, 0.35, 9],
  [8, 0.6, 8],
  [1, 0.5, 7],
];
const GAP_PTS = GAPS.map(([i, fr, r]) => {
  const p = getPointAtLength(TATTOO[i], LENS[i] * fr);
  return {x: p?.x ?? 0, y: p?.y ?? 0, r, at: CUM[i] + LENS[i] * fr};
});
const MARKED = [0, 3, 5];
const LENS_GAP = 1;

const DRAW = [118, 165];
const HEAL = [178, 234];
const RETOUCH = [410, 436];

const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const TattooInk: React.FC<{f: number; maskId: string}> = ({f, maskId}) => {
  const drawn = ci(f, DRAW, [0, TOTAL]);
  const fade = ci(f, HEAL, [0, 1]) * (1 - ci(f, RETOUCH, [0, 1]));
  const ink = mix('141210', '6b5a50', fade);
  return (
    <g mask={`url(#${maskId})`} opacity={1 - fade * 0.15}>
      {TATTOO.map((d, i) => {
        const part = Math.max(0, Math.min(LENS[i], drawn - CUM[i]));
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={LENS[i]}
            strokeDashoffset={LENS[i] - part}
          />
        );
      })}
      {[
        [350, 210],
        [468, 226],
        [372, 250],
        [455, 520],
        [352, 640],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} fill={ink} opacity={ci(f, [160 + i * 2, 164 + i * 2], [0, 1])} />
      ))}
    </g>
  );
};

const gapRadius = (f: number, i: number) => {
  const g = GAP_PTS[i];
  const grow = ci(f, [HEAL[0] + i * 5, HEAL[1] - 10 + i * 2], [0, g.r], easeInOut);
  const passAt = RETOUCH[0] + ((RETOUCH[1] - RETOUCH[0]) * g.at) / TOTAL;
  return grow * ci(f, [passAt, passAt + 4], [1, 0]);
};

const SkinCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame: f - 100, fps, config: {damping: 18, stiffness: 110}});
  const drawn = ci(f, DRAW, [0, TOTAL]);
  const retouchD = ci(f, RETOUCH, [0, TOTAL]);
  const needle =
    f >= DRAW[0] && f < DRAW[1] ? pointAt(drawn) : f >= RETOUCH[0] && f < RETOUCH[1] ? pointAt(retouchD) : null;
  const lens = GAP_PTS[LENS_GAP];
  const lensS = ci(f, [200, 210], [0, 1], expoOut) * ci(f, [240, 248], [1, 0]);
  const lc = {x: lens.x + 170, y: lens.y - 40};
  const pulse = ci(f, [436, 442, 450], [0, 0.9, 0.35]);
  return (
    <div
      style={{
        position: 'absolute',
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        borderRadius: 56,
        overflow: 'hidden',
        opacity: inS,
        transform: `translateZ(16px) scale(${0.9 + 0.1 * inS})`,
        background:
          'radial-gradient(120% 90% at 30% 20%, #F1D2B8 0%, #E3B999 45%, #C99273 100%)',
        border: `3px solid ${NEON}88`,
        boxShadow: `0 0 60px ${NEON}33, 0 50px 100px rgba(0,0,0,0.7), inset 0 0 120px rgba(90,40,20,0.35)`,
      }}
    >
      <svg width={CARD.w} height={CARD.h} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        <defs>
          <mask id="gaps" maskUnits="userSpaceOnUse" x={0} y={0} width={CARD.w} height={CARD.h}>
            <rect width={CARD.w} height={CARD.h} fill="#fff" />
            {GAP_PTS.map((g, i) => (
              <circle key={i} cx={g.x} cy={g.y} r={gapRadius(f, i)} fill="#000" />
            ))}
          </mask>
          <clipPath id="lensClip">
            <circle cx={lc.x} cy={lc.y} r={110} />
          </clipPath>
          <radialGradient id="skinLens">
            <stop offset="0" stopColor="#ECC8AC" />
            <stop offset="1" stopColor="#D8A584" />
          </radialGradient>
        </defs>
        {/* poros da pele */}
        {Array.from({length: 70}).map((_, i) => (
          <circle
            key={i}
            cx={random(`px${i}`) * CARD.w}
            cy={random(`py${i}`) * CARD.h}
            r={1 + random(`pr${i}`) * 1.6}
            fill="#8a5a40"
            opacity={0.18}
          />
        ))}
        <TattooInk f={f} maskId="gaps" />
        {/* pulso néon final: traço completo */}
        {pulse > 0 ? (
          <g opacity={pulse}>
            {TATTOO.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={NEON} strokeWidth={10} opacity={0.5} filter="url(#glowSm)" />
            ))}
          </g>
        ) : null}
        {/* marcadores de falha → viram ✓ no retoque */}
        {MARKED.map((gi, k) => {
          const g = GAP_PTS[gi];
          const t0 = 214 + k * 7;
          const s = spring({frame: f - t0, fps, config: {damping: 10, stiffness: 160}});
          const fixed = gapRadius(f, gi) < 0.5 && f > RETOUCH[0];
          const col = fixed ? NEON : RED;
          const out = ci(f, [444, 450], [1, 0]);
          if (f < t0) return null;
          const ring = 1 + ((f - t0) % 20) / 20;
          return (
            <g key={gi} opacity={out} transform={`translate(${g.x} ${g.y}) scale(${s})`}>
              <circle r={22 * ring} fill="none" stroke={col} strokeWidth={2} opacity={fixed ? 0 : 1.6 - ring} />
              <circle r={22} fill="none" stroke={col} strokeWidth={3.5} />
              <g transform={`translate(${gi === 0 ? -150 : 34} -18)`}>
                <rect width={112} height={38} rx={19} fill={col} />
                <text x={56} y={26} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#0b0b0b">
                  {fixed ? '✓ ok' : 'FALHA'}
                </text>
              </g>
            </g>
          );
        })}
        {/* lupa */}
        {lensS > 0 ? (
          <g opacity={lensS} transform={`translate(${lc.x} ${lc.y}) scale(${0.6 + 0.4 * lensS}) translate(${-lc.x} ${-lc.y})`}>
            <line x1={lens.x} y1={lens.y} x2={lc.x - 100} y2={lc.y + 30} stroke={NEON} strokeWidth={2} strokeDasharray="6 6" />
            <g clipPath="url(#lensClip)">
              <circle cx={lc.x} cy={lc.y} r={110} fill="url(#skinLens)" />
              <g transform={`translate(${lc.x} ${lc.y}) scale(2.8) translate(${-lens.x} ${-lens.y})`}>
                <TattooInk f={f} maskId="gaps" />
              </g>
            </g>
            <circle cx={lc.x} cy={lc.y} r={110} fill="none" stroke={NEON} strokeWidth={6} />
            <circle cx={lc.x} cy={lc.y} r={124} fill="none" stroke={NEON} strokeWidth={14} opacity={0.3} filter="url(#glowSm)" />
            <line x1={lc.x + 80} y1={lc.y + 80} x2={lc.x + 150} y2={lc.y + 150} stroke={NEON} strokeWidth={16} strokeLinecap="round" />
          </g>
        ) : null}
        {needle ? <NeedleHead x={needle.x} y={needle.y} r={6} /> : null}
      </svg>
    </div>
  );
};

// ---------- Fundo (céu atrás do chão) ----------
const Sky: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 40%, #0C2219 0%, ${BG} 70%)`}}>
    <div
      style={{
        position: 'absolute',
        width: 900,
        height: 900,
        left: 90,
        top: 160,
        transform: 'rotate(45deg)',
        borderRadius: 120,
        background: 'rgba(124,255,79,0.05)',
        filter: 'blur(80px)',
      }}
    />
  </AbsoluteFill>
);

// ---------- Abertura: partículas a convergir no ponto da agulha ----------
const Burst: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 32) return null;
  const t = ci(f, [0, 24], [0, 1], (x) => x * x);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 60}).map((_, i) => {
        const a = i * 2.39996;
        const base = 260 + random(`b${i}`) * 900;
        const r = base * (1 - t);
        const len = 30 + 160 * (1 - t) * random(`l${i}`);
        const op = ci(f, [0, 4], [0, 1]) * ci(f, [22, 27], [1, 0]);
        return (
          <line
            key={i}
            x1={540 + Math.cos(a) * r}
            y1={960 + Math.sin(a) * r}
            x2={540 + Math.cos(a) * (r + len)}
            y2={960 + Math.sin(a) * (r + len)}
            stroke={NEON}
            strokeWidth={2 + random(`w${i}`) * 3}
            strokeLinecap="round"
            opacity={op}
          />
        );
      })}
      <circle cx={540} cy={960} r={ci(f, [20, 32], [0, 520], expoOut)} fill={NEON} opacity={ci(f, [20, 22, 30], [0, 0.16, 0])} />
    </svg>
  );
};

// ---------- Texto ----------
const txt = (size: number, weight = 900, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: weight,
  fontSize: size,
  color: '#fff',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  ...extra,
});

const Words: React.FC<{words: {t: string; c?: string}[]; start: number; step?: number; style: React.CSSProperties; opacity?: number}> = ({
  words,
  start,
  step = 3,
  style,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', gap: '0.28em', justifyContent: 'center', opacity, ...style}}>
      {words.map((w, i) => {
        const s = spring({frame: f - start - i * step, fps, config: {damping: 15, stiffness: 160}});
        return (
          <span
            key={i}
            style={{
              color: w.c ?? style.color,
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`,
              filter: `blur(${(1 - s) * 8}px)`,
              display: 'inline-block',
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

const clipLeft = (p: number) => `inset(-30% ${100 - p * 100}% -30% 0)`;
const clipCenter = (p: number) => `inset(-30% ${50 - p * 50}% -30% ${50 - p * 50}%)`;

// ---------- Cartão de vidro de pé, com espessura ----------
const Monolith: React.FC<{
  x: number;
  y: number;
  color: string;
  at: number;
  title: string;
  body: string[];
  icon: string;
}> = ({x, y, color, at, title, body, icon}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame: f - at, fps, config: {damping: 14, stiffness: 90}});
  const pop = spring({frame: f - at - 8, fps, config: {damping: 11, stiffness: 150}});
  const out = ci(f, [336, 348], [1, 0]);
  const w = 640;
  const h = 760;
  return (
    <>
      <FloorShadow x={x} y={y + 10} w={w * 1.1} o={0.7 * rise * out} />
      <Stand x={x} y={y} w={w} h={h} rise={rise}>
        {[28, 21, 14, 7].map((z) => (
          <div
            key={z}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 48,
              border: `3px solid ${color}`,
              background: 'rgba(8,16,13,0.85)',
              opacity: 0.35 * out,
              transform: `translateZ(${-z}px)`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 48,
            border: `3px solid ${color}`,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06))',
            boxShadow: `0 0 60px ${color}50, inset 0 1px 0 rgba(255,255,255,0.3)`,
            opacity: out,
          }}
        >
          <div style={{position: 'absolute', top: 430, left: 0, right: 0, textAlign: 'center'}}>
            <div style={txt(64, 900, {letterSpacing: 1})}>{title}</div>
            <div style={{height: 30}} />
            {body.map((b, k) => (
              <div key={k} style={txt(36, 500, {color: '#B9C7C1', lineHeight: 1.45})}>
                {b}
              </div>
            ))}
          </div>
        </div>
        {/* ícone a flutuar à frente do vidro (paralaxe real) */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: out,
            transform: `translateZ(${40 + 70 * pop}px) scale(${pop})`,
          }}
        >
          <Icon kind={icon} color={color} f={f - at} />
        </div>
      </Stand>
    </>
  );
};

// ---------- Câmara de drone (frames da linha original de 450) ----------
const CAM3: Cam3Key[] = [
  {f: 0, x: 540, y: 1080, d: 5200, tilt: 0, spin: -40},
  {f: 30, x: 540, y: 1080, z: 40, d: 1900, tilt: 30, spin: -20},
  {f: 56, x: 540, y: 1100, z: 160, d: 1500, tilt: 68, spin: -8},
  {f: 86, x: 540, y: 1120, z: 170, d: 1450, tilt: 80, spin: 6},
  {f: 104, x: 780, y: 1600, d: 1700, tilt: 62, spin: 35, roll: -6},
  {f: 122, x: 540, y: 2400, d: 1600, tilt: 28, spin: 12},
  {f: 165, x: 540, y: 2500, d: 1400, tilt: 10, spin: 0},
  {f: 184, x: 540, y: 2300, z: 120, d: 2050, tilt: 42, spin: -14},
  {f: 238, x: 540, y: 2350, z: 120, d: 1900, tilt: 36, spin: 12},
  {f: 260, x: 1500, y: 2560, z: 380, d: 1350, tilt: 84, spin: -24, roll: 3},
  {f: 268, x: 1530, y: 2560, z: 380, d: 1300, tilt: 85, spin: -17},
  {f: 284, x: 2300, y: 2560, z: 380, d: 1350, tilt: 84, spin: -24, roll: 3},
  {f: 292, x: 2330, y: 2560, z: 380, d: 1300, tilt: 85, spin: -17},
  {f: 308, x: 3100, y: 2560, z: 380, d: 1350, tilt: 84, spin: -24, roll: 3},
  {f: 314, x: 3120, y: 2560, z: 380, d: 1300, tilt: 85, spin: -17},
  {f: 330, x: 2200, y: 2520, z: 380, d: 3900, tilt: 62, spin: 26},
  {f: 350, x: 2300, y: 3440, z: 140, d: 1550, tilt: 78, spin: -30},
  {f: 386, x: 2300, y: 3440, z: 140, d: 1450, tilt: 82, spin: 14},
  {f: 398, x: 1500, y: 2900, z: 300, d: 3600, tilt: 45, spin: 80, roll: 8},
  {f: 412, x: 540, y: 2500, d: 1500, tilt: 20, spin: 10},
  {f: 436, x: 540, y: 2480, d: 1450, tilt: 12, spin: 0},
  {f: 450, x: 540, y: 2540, z: 60, d: 1950, tilt: 42, spin: -16},
];

const Scenes: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = cam3At(f, CAM3);
  const hookRise = ci(f, [28, 52], [0, 1], expoOut);
  const subRise = ci(f, [52, 64], [0, 1], expoOut);
  const hookOut = ci(f, [92, 104], [1, 0]);
  const healOut = ci(f, [240, 252], [1, 0]);
  const reRise = ci(f, [344, 362], [0, 1], expoOut);
  const reP = ci(f, [348, 366], [0, 1], expoOut);
  const reOut = ci(f, [394, 404], [1, 0]);
  const dot = {
    x: ci(f, [24, 30], [540, 120], expoOut),
    y: ci(f, [24, 30], [1080, 1080], expoOut),
  };
  const pop = (t: number) => spring({frame: f - t, fps, config: {damping: 11, stiffness: 150}});
  const fog = ci(cam.tilt, [50, 85], [0, 1]);
  const R = floorRadius(cam);

  const cards = [
    {x: 1500, c: CYAN, at: 250, title: 'AGULHA FINA', body: ['Uma só ponta:', 'o traço é delicado.'], icon: 'needle'},
    {x: 2300, c: PURPLE, at: 274, title: 'MENOS TINTA', body: ['Entra menos pigmento', 'em cada passagem.'], icon: 'drop'},
    {x: 3100, c: AMBER, at: 298, title: 'CICATRIZAÇÃO', body: ['A pele expulsa parte', 'do pigmento.'], icon: 'skin'},
  ];

  return (
    <AbsoluteFill>
      <Sky />
      <AbsoluteFill style={{perspective: PERSPECTIVE, perspectiveOrigin: '50% 50%'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 4000,
            height: 4000,
            transformOrigin: '0 0',
            transformStyle: 'preserve-3d',
            transform: worldTransform(cam, W, H),
          }}
        >
          <Floor cam={cam} />

          {/* 2-3. Pele, desenho e cicatrização (pele deitada no chão, com espessura) */}
          {f > 96 ? (
            <>
              <FloorShadow x={540} y={3010} w={900} o={0.5} />
              {[4, 8, 12].map((z) => (
                <div
                  key={z}
                  style={{
                    position: 'absolute',
                    left: CARD.x,
                    top: CARD.y,
                    width: CARD.w,
                    height: CARD.h,
                    borderRadius: 56,
                    background: '#8E5C43',
                    opacity: ci(f, [100, 112], [0, 1]),
                    transform: `translateZ(${z}px)`,
                  }}
                />
              ))}
              <SkinCard />
            </>
          ) : null}
          {f > 96 && f < 252 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: 1080,
                top: 3060,
                transform: 'translateZ(2px)',
              }}
            >
              <Words start={190} words={[{t: 'A'}, {t: 'pele'}, {t: 'cicatriza…'}]} style={txt(58, 800)} opacity={healOut} />
              <div style={{height: 18}} />
              <Words start={204} words={[{t: 'e'}, {t: 'o'}, {t: 'traço'}, {t: 'fino'}, {t: 'falha.', c: RED}]} style={txt(58, 800)} opacity={healOut} />
            </div>
          ) : null}

          {/* Linha-guia: trilho néon no chão */}
          <svg width={2 * R} height={2 * R} viewBox={`${cam.x - R} ${cam.y - R} ${2 * R} ${2 * R}`} style={{position: 'absolute', left: cam.x - R, top: cam.y - R, transform: 'translateZ(1px)'}}>
            <GlowDefs />
            {f >= 20 && f < 31 ? <NeedleHead x={dot.x} y={dot.y} r={10} /> : null}
            <GuideSeg d="M120 1080 L960 1080" from={30} to={54} fadeAt={98} />
            <GuideSeg d="M960 1080 C 1100 1080, 1080 1350, 820 1550 S 420 1900, 540 2170" from={86} to={118} fadeAt={124} easing={easeInOut} />
            <GuideSeg d="M950 2500 C 1150 2500, 1250 2580, 1500 2580" from={240} to={260} fadeAt={340} easing={easeInOut} />
            <GuideSeg d="M1500 2580 L 2300 2580" from={264} to={284} fadeAt={340} easing={easeInOut} />
            <GuideSeg d="M2300 2580 L 3100 2580" from={288} to={308} fadeAt={340} easing={easeInOut} />
            <GuideSeg d="M1500 2580 C 1500 3000, 2300 3000, 2300 3440" from={326} to={346} fadeAt={350} fadeDur={8} easing={easeInOut} />
            <GuideSeg d="M2300 2580 L 2300 3440" from={328} to={346} fadeAt={350} fadeDur={8} easing={easeInOut} />
            <GuideSeg d="M3100 2580 C 3100 3000, 2300 3000, 2300 3440" from={326} to={346} fadeAt={350} fadeDur={8} easing={easeInOut} />
            <GuideSeg d="M2300 3440 L 1880 3440" from={346} to={362} fadeAt={396} easing={expoOut} />
            <GuideSeg d="M2300 3440 L 2720 3440" from={346} to={362} fadeAt={396} easing={expoOut} />
            <defs>
              <linearGradient id="multi" gradientUnits="userSpaceOnUse" x1={1880} y1={0} x2={2720} y2={0}>
                <stop offset="0" stopColor={CYAN} />
                <stop offset="0.5" stopColor={PURPLE} />
                <stop offset="1" stopColor={AMBER} />
              </linearGradient>
            </defs>
            <path d="M1880 3440 L2720 3440" stroke="url(#multi)" strokeWidth={6} strokeLinecap="round" opacity={ci(f, [366, 380], [0, 1]) * ci(f, [394, 400], [1, 0])} />
            <GuideSeg d="M2720 3440 C 3000 3440, 2600 2600, 1600 2300 S 700 2120, 540 2170" from={384} to={410} fadeAt={414} easing={easeInOut} />
          </svg>

          {/* 1. Gancho: o título levanta-se do chão sobre a linha */}
          {f < 106 ? (
            <>
              <FloorShadow x={540} y={1090} w={1000} o={0.5 * hookRise * hookOut} />
              <Stand x={540} y={1076} w={1040} h={300} rise={hookRise}>
                <div style={{position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', transformStyle: 'preserve-3d'}}>
                  <div style={{...txt(44, 800, {color: NEON, letterSpacing: 14}), clipPath: clipLeft(ci(f, [30, 46], [0, 1])), opacity: hookOut}}>TATUAGEM DE</div>
                </div>
                <div style={{position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center', transformStyle: 'preserve-3d'}}>
                  <Extrude text="TRAÇO FINO" style={txt(160, 900, {letterSpacing: -3})} depth={16} clip={clipLeft(ci(f, [30, 54], [0, 1]))} opacity={hookOut} />
                </div>
              </Stand>
              <Stand x={540} y={1200} w={1040} h={70} rise={subRise}>
                <Words
                  start={56}
                  words={[{t: 'quase'}, {t: 'sempre'}, {t: 'precisa'}, {t: 'de'}, {t: 'retoque', c: NEON}]}
                  style={txt(56, 700, {color: '#E8F3EE'})}
                  opacity={hookOut}
                />
              </Stand>
            </>
          ) : null}

          {/* Contador de pé atrás da pele */}
          {f > 160 && f < 252 ? (
            <>
              <FloorShadow x={540} y={1905} w={760} o={0.5 * healOut} />
              <Stand x={540} y={1900} w={900} h={300} rise={ci(f, [164, 178], [0, 1], expoOut)}>
                <div style={{position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', opacity: healOut}}>
                  <div style={txt(34, 800, {color: AMBER, letterSpacing: 10})}>CICATRIZAÇÃO</div>
                </div>
                <div style={{position: 'absolute', left: 150, top: 80, opacity: healOut}}>
                  <Odometer times={[166, 184, 199, 214, 228]} values={[1, 7, 14, 21, 30]} digits={2} />
                </div>
                <div style={{position: 'absolute', left: 480, top: 128, transformStyle: 'preserve-3d'}}>
                  <Extrude text="DIAS" style={txt(100, 900, {color: AMBER})} side="#6B4210" depth={10} opacity={healOut} />
                </div>
              </Stand>
            </>
          ) : null}

          {/* 4. Porquê: monólitos de vidro que se levantam do chão */}
          {f > 240 && f < 352 ? cards.map((c, i) => <Monolith key={i} x={c.x} y={2500} color={c.c} at={c.at} title={c.title} body={c.body} icon={c.icon} />) : null}

          {/* 5. Título do retoque */}
          {f > 340 && f < 406 ? (
            <>
              <FloorShadow x={2300} y={3450} w={1200} o={0.5 * reRise * reOut} />
              <Stand x={2300} y={3436} w={1600} h={260} rise={reRise}>
                <div style={{position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', transformStyle: 'preserve-3d'}}>
                  <Extrude text="O RETOQUE." style={txt(150, 900, {letterSpacing: -2})} depth={16} clip={clipCenter(reP)} opacity={reOut} />
                </div>
                <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', ...txt(46, 800, {letterSpacing: 8, color: '#E8F3EE'}), clipPath: clipLeft(ci(f, [360, 378], [0, 1])), opacity: reOut}}>
                  FAZ PARTE DO PROCESSO.
                </div>
              </Stand>
            </>
          ) : null}

          {/* 6. Fecho */}
          {f > 414 ? (
            <>
              <Stand x={540} y={1930} w={900} h={110} rise={pop(416)}>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      ...txt(40, 800, {color: NEON, letterSpacing: 8}),
                      padding: '22px 40px',
                      border: `3px solid ${NEON}`,
                      borderRadius: 60,
                      background: 'rgba(7,19,14,0.8)',
                      boxShadow: `0 0 40px ${NEON}55`,
                    }}
                  >
                    DEPOIS DO RETOQUE
                  </div>
                </div>
              </Stand>
              <FloorShadow x={540} y={3115} w={700} o={0.5 * pop(436)} />
              <Stand x={540} y={3110} w={900} h={130} rise={ci(f, [434, 444], [0, 1], expoOut)}>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      ...txt(56, 900, {color: '#07130E', letterSpacing: 2}),
                      background: NEON,
                      padding: '26px 52px',
                      borderRadius: 70,
                      boxShadow: `0 0 80px ${NEON}88`,
                      transform: `scale(${spring({frame: f - 436, fps, config: {damping: 9, stiffness: 200}})}) rotate(-3deg)`,
                    }}
                  >
                    ✓ TRAÇO COMPLETO
                  </div>
                </div>
              </Stand>
            </>
          ) : null}

          <Particles cam={cam} area={[-800, 200, 4400, 4200]} />
        </div>
      </AbsoluteFill>
      <Burst />
      {/* névoa no horizonte quando a câmara está rasante */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${BG} 0%, rgba(4,11,9,0.6) 18%, transparent 40%)`, opacity: fog}} />
      <AbsoluteFill style={{background: 'radial-gradient(75% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: ci(f, [0, 2], [1, 0])}} />
    </AbsoluteFill>
  );
};

// ---------- Ícones dos cartões ----------
const Icon: React.FC<{kind: string; color: string; f: number}> = ({kind, color, f}) => {
  const w = 300;
  if (kind === 'needle') {
    const y = Math.sin(f * 0.9) * 10;
    return (
      <svg width={w} height={300} viewBox="0 0 300 300">
        <defs>
          <linearGradient id="steel" x1="0" x2="1">
            <stop offset="0" stopColor="#8fa3ad" />
            <stop offset="0.5" stopColor="#f2f7fa" />
            <stop offset="1" stopColor="#7d8f99" />
          </linearGradient>
        </defs>
        <g transform={`translate(0 ${y})`}>
          <rect x={128} y={20} width={44} height={150} rx={10} fill="url(#steel)" />
          <path d="M140 170 L160 170 L152 262 L148 262 Z" fill="url(#steel)" />
        </g>
        <path d="M60 282 Q150 270 240 282" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={150} cy={274 + y * 0.2} r={4} fill={color} />
      </svg>
    );
  }
  if (kind === 'drop') {
    const s = ci(f, [8, 24], [1, 0.55], easeInOut);
    return (
      <svg width={w} height={300} viewBox="0 0 300 300">
        <path d="M150 30 C 150 30, 70 140, 70 190 A 80 80 0 0 0 230 190 C 230 140, 150 30, 150 30 Z" fill="none" stroke={color} strokeWidth={4} strokeDasharray="12 10" opacity={0.6} />
        <g transform={`translate(150 190) scale(${s}) translate(-150 -190)`}>
          <path d="M150 30 C 150 30, 70 140, 70 190 A 80 80 0 0 0 230 190 C 230 140, 150 30, 150 30 Z" fill={color} opacity={0.9} />
          <ellipse cx={120} cy={170} rx={14} ry={26} fill="#fff" opacity={0.35} />
        </g>
      </svg>
    );
  }
  const rise = ci(f, [6, 30], [0, 1], easeInOut);
  return (
    <svg width={w} height={300} viewBox="0 0 300 300">
      <path d="M20 120 Q 80 100 150 120 T 280 120 L280 170 L20 170 Z" fill="#E3B999" opacity={0.9} />
      <path d="M20 170 L280 170 L280 230 L20 230 Z" fill="#C98E6E" opacity={0.85} />
      <path d="M20 230 L280 230 L280 280 L20 280 Z" fill="#9C664C" opacity={0.85} />
      {[60, 100, 150, 200, 240].map((x, i) => (
        <circle key={i} cx={x} cy={195 - (i % 2 === 0 ? rise * 110 : 0)} r={9} fill={i % 2 === 0 ? color : '#1b1512'} opacity={i % 2 === 0 ? 1 - rise * 0.4 : 1} />
      ))}
    </svg>
  );
};

// ---------- Som ----------
// ---------- Sincronia com a narração ----------
// A animação foi desenhada numa linha de 450 frames; estas âncoras (frame original → segundo final)
// esticam cada bloco para começar na palavra certa da narração (public/narracao-sync.wav).
const ANCHORS: [number, number][] = [
  [0, 0], [30, 0.8], [54, 2.5], [56, 2.85], [86, 5.2], [118, 6.1], [165, 7.7], [166, 8.5],
  [214, 10.1], [240, 10.7], [262, 11.45], [280, 12.45], [292, 13.4], [304, 13.9], [314, 15.0],
  [330, 16.2], [346, 17.1], [348, 17.2], [380, 19.0], [386, 19.4], [410, 20.3], [436, 21.2], [450, 22.2],
];
export const FPS = 30;
export const DURATION = Math.round(ANCHORS[ANCHORS.length - 1][1] * FPS);
const ORIG = ANCHORS.map((a) => a[0]);
const NEW = ANCHORS.map((a) => a[1] * FPS);
const toNew = (f: number) => interpolate(f, ORIG, NEW, {extrapolateRight: 'clamp'});
const toOrig = (f: number) => interpolate(f, NEW, ORIG, {extrapolateRight: 'clamp'});

const Remapped: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={toOrig(f)}>
      <Scenes />
    </Freeze>
  );
};

// ---------- Som ----------
const S: React.FC<{at: number; src: string; v?: number; len?: number}> = ({at, src, v = 1, len}) => (
  <Sequence from={Math.round(toNew(at))} durationInFrames={len} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
  </Sequence>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile('narracao-sync.wav')} volume={1} />
    <Audio src={staticFile('sfx/bed.wav')} volume={0.45} loop />
    <S at={0} src="suck" v={0.6} />
    <S at={24} src="pop" v={0.7} />
    <S at={30} src="whoosh" v={0.3} />
    <S at={86} src="whoosh" v={0.6} />
    <S at={118} src="buzz" v={0.35} len={48} />
    {[166, 184, 199, 214, 228].map((t) => (
      <S key={t} at={t} src="tick" v={0.6} />
    ))}
    {[214, 221, 228].map((t) => (
      <S key={t} at={t} src="ping" v={0.6} />
    ))}
    <S at={240} src="whoosh" v={0.5} />
    <S at={262} src="whoosh" v={0.35} />
    <S at={280} src="whoosh" v={0.35} />
    <S at={304} src="whoosh" v={0.35} />
    <S at={320} src="whoosh" v={0.6} />
    <S at={346} src="impact" v={0.6} />
    <S at={384} src="whoosh" v={0.6} />
    <S at={410} src="buzz" v={0.3} len={27} />
    <S at={436} src="impact" v={0.5} />
    <S at={437} src="ding" v={0.7} />
  </>
);

export const TracoFino: React.FC = () => (
  <AbsoluteFill style={{background: BG}}>
    {/* o motion blur é aplicado depois, em ffmpeg (npm run render) */}
    <Remapped />
    <Sound />
  </AbsoluteFill>
);
