// Demo do estilo 21: "Tatuagem de traço fino quase sempre precisa de retoque".
// Um só plano: a linha néon é a agulha, que desenha, liga e fecha todas as cenas.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, random} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {getLength, getPointAtLength} from '@remotion/paths';
import {
  BG,
  CamKey,
  FONT,
  GlassCard,
  GlowDefs,
  GuideSeg,
  NEON,
  NeedleHead,
  Odometer,
  Reveal,
  cameraAt,
  ci,
  easeInOut,
  expoOut,
} from './kit';

const W = 1080;
const H = 1920;
const RED = '#FF4D5E';
const CYAN = '#3FD0FF';
const PURPLE = '#A77BFF';
const AMBER = '#FFB547';

// ---------- Câmara ----------
const CAM: CamKey[] = [
  {f: 0, x: 540, y: 960, s: 1.25},
  {f: 30, x: 540, y: 980, s: 1},
  {f: 86, x: 540, y: 1000, s: 1.06},
  {f: 104, x: 640, y: 1750, s: 0.9, rx: 14},
  {f: 122, x: 540, y: 2480, s: 1.02},
  {f: 165, x: 540, y: 2480, s: 1.07},
  {f: 184, x: 540, y: 2360, s: 0.86},
  {f: 238, x: 540, y: 2380, s: 0.9},
  {f: 260, x: 1500, y: 2500, s: 1.05, ry: -9},
  {f: 268, x: 1530, y: 2500, s: 1.07, ry: -9},
  {f: 284, x: 2300, y: 2500, s: 1.05, ry: -9},
  {f: 292, x: 2330, y: 2500, s: 1.07, ry: -9},
  {f: 308, x: 3100, y: 2500, s: 1.05, ry: -9},
  {f: 314, x: 3120, y: 2500, s: 1.07, ry: -9},
  {f: 330, x: 2300, y: 2650, s: 0.42},
  {f: 350, x: 2300, y: 3360, s: 1},
  {f: 386, x: 2300, y: 3360, s: 1.08},
  {f: 398, x: 1500, y: 2900, s: 0.6, rx: 10},
  {f: 412, x: 540, y: 2420, s: 0.9},
  {f: 450, x: 540, y: 2440, s: 0.95},
];

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
        transform: `scale(${0.9 + 0.1 * inS})`,
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

// ---------- Fundo ----------
const Background: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 45%, #0C2219 0%, ${BG} 70%)`}}>
    <div
      style={{
        position: 'absolute',
        width: 900,
        height: 900,
        left: 420 - cx * 0.06,
        top: 300 - cy * 0.04,
        transform: 'rotate(45deg)',
        borderRadius: 120,
        background: 'rgba(124,255,79,0.06)',
        filter: 'blur(70px)',
      }}
    />
    {Array.from({length: 70}).map((_, i) => {
      const x = (((random(`dx${i}`) * 2400 - cx * 0.5) % 1200) + 1200) % 1200 - 60;
      const y = (((random(`dy${i}`) * 4000 - cy * 0.5) % 2040) + 2040) % 2040 - 60;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 3 + random(`ds${i}`) * 4,
            height: 3 + random(`ds${i}`) * 4,
            borderRadius: 9,
            background: NEON,
            opacity: 0.12 + random(`do${i}`) * 0.25,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

// ---------- Abertura: partículas a convergir no ponto da agulha ----------
const Burst: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 32) return null;
  const t = ci(f, [0, 24], [0, 1], (x) => x * x);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <GlowDefs />
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

const Words: React.FC<{words: {t: string; c?: string}[]; start: number; step?: number; style: React.CSSProperties}> = ({
  words,
  start,
  step = 3,
  style,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', gap: '0.28em', justifyContent: 'center', ...style}}>
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

const Scenes: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = cameraAt(f, CAM);
  const headP = ci(f, [30, 54], [0, 1]);
  const hookOut = ci(f, [92, 104], [1, 0]);
  const healOut = ci(f, [240, 252], [1, 0]);
  const reP = ci(f, [348, 366], [0, 1], expoOut);
  const reOut = ci(f, [394, 404], [1, 0]);
  const dot = {
    x: ci(f, [24, 30], [540, 120], expoOut),
    y: ci(f, [24, 30], [960, 1080], expoOut),
  };
  const iconPop = (t: number) => spring({frame: f - t, fps, config: {damping: 11, stiffness: 150}});

  const cards = [
    {x: 1500, c: CYAN, at: 252, title: 'AGULHA FINA', body: ['Uma só ponta:', 'o traço é delicado.'], icon: 'needle'},
    {x: 2300, c: PURPLE, at: 276, title: 'MENOS TINTA', body: ['Entra menos pigmento', 'em cada passagem.'], icon: 'drop'},
    {x: 3100, c: AMBER, at: 300, title: 'CICATRIZAÇÃO', body: ['A pele expulsa parte', 'do pigmento.'], icon: 'skin'},
  ];

  return (
    <AbsoluteFill>
      <Background cx={cam.x} cy={cam.y} />
      <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 50%'}}>
        <AbsoluteFill style={{transform: `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`, transformStyle: 'preserve-3d'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 4000,
              height: 4000,
              transformOrigin: '0 0',
              transform: `translate(${W / 2 - cam.x * cam.s}px, ${H / 2 - cam.y * cam.s}px) scale(${cam.s})`,
            }}
          >
            {/* 1. Gancho */}
            {f < 106 ? (
              <div style={{position: 'absolute', left: 40, width: 1000, top: 790, opacity: hookOut, filter: `blur(${(1 - hookOut) * 14}px)`, textAlign: 'center'}}>
                <Reveal p={ci(f, [30, 46], [0, 1])}>
                  <div style={txt(44, 800, {color: NEON, letterSpacing: 14})}>TATUAGEM DE</div>
                </Reveal>
                <div style={{height: 26}} />
                <Reveal p={headP}>
                  <div style={txt(150, 900, {letterSpacing: -3})}>TRAÇO FINO</div>
                </Reveal>
                <div style={{height: 104}} />
                <Words
                  start={56}
                  words={[{t: 'quase'}, {t: 'sempre'}, {t: 'precisa'}, {t: 'de'}, {t: 'retoque', c: NEON}]}
                  style={txt(54, 700, {color: '#E8F3EE'})}
                />
              </div>
            ) : null}

            {/* 2-3. Pele, desenho e cicatrização */}
            {f > 96 && f < 252 ? (
              <div style={{opacity: healOut}}>
                <div style={{position: 'absolute', left: 0, width: 1080, top: 1610, textAlign: 'center', opacity: ci(f, [168, 176], [0, 1])}}>
                  <div style={txt(34, 800, {color: AMBER, letterSpacing: 10})}>CICATRIZAÇÃO</div>
                </div>
                <div style={{position: 'absolute', left: 300, top: 1690, opacity: ci(f, [166, 172], [0, 1]), transform: `scale(${0.8 + 0.2 * iconPop(166)})`}}>
                  <Odometer times={[166, 184, 199, 214, 228]} values={[1, 7, 14, 21, 30]} digits={2} />
                </div>
                <div style={{position: 'absolute', left: 630, top: 1740, opacity: ci(f, [170, 178], [0, 1])}}>
                  <div style={txt(100, 900, {color: AMBER})}>DIAS</div>
                </div>
                <div style={{position: 'absolute', left: 0, width: 1080, top: 3060}}>
                  <Words start={190} words={[{t: 'A'}, {t: 'pele'}, {t: 'cicatriza…'}]} style={txt(58, 800)} />
                  <div style={{height: 18}} />
                  <Words start={204} words={[{t: 'e'}, {t: 'o'}, {t: 'traço'}, {t: 'fino'}, {t: 'falha.', c: RED}]} style={txt(58, 800)} />
                </div>
              </div>
            ) : null}
            {f > 96 ? <SkinCard /> : null}

            {/* 4. Porquê: carrossel de cartões de vidro */}
            {f > 240 && f < 352
              ? cards.map((c, i) => (
                  <GlassCard key={i} x={c.x} y={2500} w={640} h={760} border={c.c} appear={c.at}>
                    <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${iconPop(c.at + 6)})`}}>
                      <Icon kind={c.icon} color={c.c} f={f - c.at} />
                    </div>
                    <div style={{position: 'absolute', top: 430, left: 0, right: 0, textAlign: 'center'}}>
                      <div style={txt(64, 900, {letterSpacing: 1})}>{c.title}</div>
                      <div style={{height: 30}} />
                      {c.body.map((b, k) => (
                        <div key={k} style={txt(36, 500, {color: '#B9C7C1', lineHeight: 1.45})}>
                          {b}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ))
              : null}

            {/* 5. Título do retoque */}
            {f > 344 && f < 406 ? (
              <div style={{position: 'absolute', left: 1300, width: 2000, top: 3245, textAlign: 'center', opacity: reOut, filter: `blur(${(1 - reOut) * 12}px)`}}>
                <Reveal p={reP} fromCenter>
                  <div style={txt(136, 900, {letterSpacing: -2})}>O RETOQUE.</div>
                </Reveal>
                <div style={{height: 64}} />
                <Reveal p={ci(f, [360, 378], [0, 1])}>
                  <div style={txt(46, 800, {letterSpacing: 8, color: '#E8F3EE'})}>FAZ PARTE DO PROCESSO.</div>
                </Reveal>
              </div>
            ) : null}

            {/* 6. Fecho */}
            {f > 414 ? (
              <>
                <div style={{position: 'absolute', left: 0, width: 1080, top: 1770, display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      ...txt(40, 800, {color: NEON, letterSpacing: 8}),
                      padding: '22px 40px',
                      border: `3px solid ${NEON}`,
                      borderRadius: 60,
                      boxShadow: `0 0 40px ${NEON}55`,
                      opacity: iconPop(416),
                      transform: `translateY(${(1 - iconPop(416)) * 40}px)`,
                    }}
                  >
                    DEPOIS DO RETOQUE
                  </div>
                </div>
                <div style={{position: 'absolute', left: 0, width: 1080, top: 3070, display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      ...txt(56, 900, {color: '#07130E', letterSpacing: 2}),
                      background: NEON,
                      padding: '26px 52px',
                      borderRadius: 70,
                      boxShadow: `0 0 80px ${NEON}88`,
                      transform: `scale(${spring({frame: f - 436, fps, config: {damping: 9, stiffness: 200}}) * 1}) rotate(-3deg)`,
                    }}
                  >
                    ✓ TRAÇO COMPLETO
                  </div>
                </div>
              </>
            ) : null}

            {/* Linha-guia (camada única por cima de tudo) */}
            <svg width={4000} height={4000} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <GlowDefs />
              {f >= 20 && f < 31 ? <NeedleHead x={dot.x} y={dot.y} r={10} /> : null}
              <GuideSeg d="M120 1080 L960 1080" from={30} to={54} fadeAt={98} />
              <GuideSeg d="M960 1080 C 1100 1080, 1080 1350, 820 1550 S 420 1900, 540 2170" from={86} to={118} fadeAt={124} easing={easeInOut} />
              <GuideSeg d="M950 2300 C 1150 2300, 1200 2040, 1500 2040 L 1500 2120" from={240} to={260} fadeAt={340} easing={easeInOut} />
              <GuideSeg d="M1500 2040 L 2300 2040 L 2300 2120" from={264} to={284} fadeAt={340} easing={easeInOut} />
              <GuideSeg d="M2300 2040 L 3100 2040 L 3100 2120" from={288} to={308} fadeAt={340} easing={easeInOut} />
              <GuideSeg d="M1500 2880 C 1500 3200, 2300 3150, 2300 3440" from={326} to={346} fadeAt={345} fadeDur={6} easing={easeInOut} />
              <GuideSeg d="M2300 2880 L 2300 3440" from={328} to={346} fadeAt={345} fadeDur={6} easing={easeInOut} />
              <GuideSeg d="M3100 2880 C 3100 3200, 2300 3150, 2300 3440" from={326} to={346} fadeAt={345} fadeDur={6} easing={easeInOut} />
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
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Burst />
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
const S: React.FC<{at: number; src: string; v?: number}> = ({at, src, v = 1}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
  </Sequence>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile('sfx/bed.wav')} volume={0.8} />
    <S at={0} src="suck" v={0.8} />
    <S at={24} src="pop" />
    <S at={30} src="whoosh" v={0.5} />
    <S at={86} src="whoosh" />
    <S at={118} src="buzz" v={0.7} />
    {[166, 184, 199, 214, 228].map((t) => (
      <S key={t} at={t} src="tick" />
    ))}
    {[214, 221, 228].map((t) => (
      <S key={t} at={t} src="ping" />
    ))}
    <S at={240} src="whoosh" v={0.8} />
    <S at={262} src="whoosh" v={0.6} />
    <S at={284} src="whoosh" v={0.6} />
    <S at={306} src="whoosh" v={0.6} />
    <S at={322} src="whoosh" />
    <S at={346} src="impact" v={0.8} />
    <S at={384} src="whoosh" />
    <S at={410} src="buzz" v={0.6} />
    <S at={436} src="impact" v={0.6} />
    <S at={437} src="ding" />
  </>
);

export const TracoFino: React.FC = () => (
  <AbsoluteFill style={{background: BG}}>
    <CameraMotionBlur samples={6} shutterAngle={170}>
      <Scenes />
    </CameraMotionBlur>
    <Sound />
  </AbsoluteFill>
);
