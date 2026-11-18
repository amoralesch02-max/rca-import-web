"use client";

import { useEffect, useRef } from "react";
import { Snowflake } from "lucide-react";

type CssVars = React.CSSProperties & Record<`--${string}`, string>;

/** Variables de cada animación: duración y desfase, para que nada lata al mismo ritmo */
const anim = (duration: number, delay: number): CssVars => ({
  "--nv-d": `${duration}s`,
  "--nv-s": `${delay}s`,
});

/**
 * Decoración navideña del encabezado del inicio (solo tema Navidad).
 *
 * Todo es SVG estático: no hay animaciones ni librerías, así que no pesa.
 * Se dibuja detrás del contenido y no recibe clics.
 *
 * Para cambiar el reno o el regalo por una imagen PNG propia, busca los
 * componentes <Reindeer /> y <Gift /> y pon un <img> en su lugar.
 */

// Números "al azar" fijos: la decoración queda igual en cada carga
function pseudo(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const r0 = (n: number) => Math.round(n);

/* ============================================================
   RAMA DE PINO
   Se calcula una sola vez: tallo principal + ramitas, y sobre
   cada una, agujas en tres capas (oscura, media y clara).
   ============================================================ */

type Pt = [number, number];

function bezier(p: Pt[]) {
  return {
    pt(t: number): Pt {
      const u = 1 - t;
      return [
        u ** 3 * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t ** 3 * p[3][0],
        u ** 3 * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t ** 3 * p[3][1],
      ];
    },
    tan(t: number): Pt {
      const u = 1 - t;
      return [
        3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]),
        3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]),
      ];
    },
  };
}

type Layers = { dark: string[]; mid: string[]; light: string[]; hi: string[]; snow: string[] };

/**
 * Agujas a ambos lados de una curva. Nada "cuelga": las agujas salen
 * abiertas en abanico, como una rama de pino vista de frente.
 */
function addNeedles(
  out: Layers,
  curve: ReturnType<typeof bezier>,
  steps: number,
  length: number,
  taperEnd: number,
  seedStart: number,
  snowChance = 0.88
) {
  let seed = seedStart;

  for (let i = 0; i <= steps; i += 1) {
    const t = Math.min(1, Math.max(0, i / steps + (pseudo(i + seed, 11) - 0.5) * (0.5 / steps)));
    const [x, y] = curve.pt(t);
    const [dx, dy] = curve.tan(t);
    const angle = Math.atan2(dy, dx);
    const taper = 1 - t * taperEnd;

    for (const side of [-1, 1]) {
      const count = 3 + (pseudo(i * 2 + side + seed, 13) > 0.5 ? 1 : 0);

      for (let k = 0; k < count; k += 1) {
        seed += 1;
        const layer = k % 3;
        const spread = 0.34 + k * 0.27 + pseudo(seed, 3) * 0.3;
        const a = angle + side * spread + (pseudo(seed, 7) - 0.5) * 0.2;
        const len = length * taper * (1 - layer * 0.17) * (0.7 + pseudo(seed, 9) * 0.6);
        const ex = x + Math.cos(a) * len;
        const ey = y + Math.sin(a) * len;

        (layer === 0 ? out.dark : layer === 1 ? out.mid : out.light).push(
          `M${r0(x)} ${r0(y)}L${r0(ex)} ${r0(ey)}`
        );

        if (layer === 2 && pseudo(seed, 15) > 0.45) {
          out.hi.push(
            `M${r0(x + (ex - x) * 0.25)} ${r0(y + (ey - y) * 0.25)}L${r0(x + (ex - x) * 0.85)} ${r0(y + (ey - y) * 0.85)}`
          );
        }

        if (layer === 2 && pseudo(seed, 5) > snowChance) {
          out.snow.push(`M${r0(ex)} ${r0(ey)}h.1`);
        }
      }
    }
  }
}

function stemPath(curve: ReturnType<typeof bezier>, n: number) {
  return Array.from({ length: n + 1 }, (_, i) => curve.pt(i / n))
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${r0(x)} ${r0(y)}`)
    .join("");
}

function emptyLayers(): Layers {
  return { dark: [], mid: [], light: [], hi: [], snow: [] };
}

/** Ramita que sale de una rama principal, curvándose hacia afuera */
function twigFrom(
  parent: ReturnType<typeof bezier>,
  t: number,
  size: number,
  side: number,
  salt: number
) {
  const [x, y] = parent.pt(t);
  const [dx, dy] = parent.tan(t);
  const tl = Math.hypot(dx, dy) || 1;
  const tx = dx / tl;
  const ty = dy / tl;
  const a = Math.atan2(dy, dx) + side * (0.72 + pseudo(salt, 4) * 0.3);
  const ux = Math.cos(a);
  const uy = Math.sin(a);

  return bezier([
    [x, y],
    [x + ux * size * 0.35, y + uy * size * 0.35],
    [x + ux * size * 0.7 + tx * size * 0.12, y + uy * size * 0.7 + ty * size * 0.12],
    [x + ux * size + tx * size * 0.32, y + uy * size + ty * size * 0.32],
  ]);
}

function buildBranch() {
  const out = emptyLayers();
  const stems: string[] = [];
  let seed = 1;

  // Tres ramas que salen de la esquina: una larga en diagonal, una pegada
  // al borde superior y otra que baja por el costado.
  const rama: [Pt[], number, number, [number, number, number][]][] = [
    // [curva, pasos, largo de aguja, ramitas [t, tamaño, lado]]
    [
      [[-24, -12], [78, 18], [170, 62], [262, 132]],
      34,
      40,
      [
        [0.2, 66, 1],
        [0.36, 78, -1],
        [0.52, 76, 1],
        [0.68, 64, -1],
        [0.84, 50, 1],
      ],
    ],
    [
      [[-24, -6], [96, -10], [196, 6], [292, 40]],
      30,
      36,
      [
        [0.25, 56, 1],
        [0.5, 62, 1],
        [0.75, 50, 1],
      ],
    ],
    [
      [[-16, 14], [34, 72], [84, 134], [128, 204]],
      28,
      36,
      [
        [0.3, 52, -1],
        [0.55, 58, -1],
        [0.8, 46, -1],
      ],
    ],
  ];

  const curves = rama.map(([pts]) => bezier(pts));

  rama.forEach(([, steps, length, twigs], idx) => {
    const curveMain = curves[idx];

    stems.push(stemPath(curveMain, 20));
    addNeedles(out, curveMain, steps, length, 0.4, seed);
    seed += 500;

    twigs.forEach(([t, size, side], j) => {
      const tw = twigFrom(curveMain, t, size, side, idx * 10 + j);

      stems.push(stemPath(tw, 8));
      addNeedles(out, tw, 12, 29, 0.55, seed);
      seed += 200;
    });
  });

  // Luces sobre las ramas
  const kinds = ["Y", "W", "R", "Y", "W", "Y", "R", "W"];
  const bulbs: { x: number; y: number; kind: string }[] = [];

  [
    [0, [0.08, 0.2, 0.34, 0.48, 0.62, 0.76, 0.9]],
    [1, [0.12, 0.3, 0.5, 0.7, 0.9]],
    [2, [0.18, 0.4, 0.62, 0.84]],
  ].forEach(([idx, ts]) => {
    (ts as number[]).forEach((t, i) => {
      const c = curves[idx as number];
      const [x, y] = c.pt(t);
      const [dx, dy] = c.tan(t);
      const ang = Math.atan2(dy, dx) + (i % 2 ? 1 : -1) * (0.8 + pseudo(i + (idx as number) * 7, 2) * 0.4);
      const dist = 12 + pseudo(i * 3 + (idx as number), 8) * 14;

      bulbs.push({
        x: r0(x + Math.cos(ang) * dist),
        y: r0(y + Math.sin(ang) * dist),
        kind: kinds[(i + (idx as number) * 3) % kinds.length],
      });
    });
  });

  return {
    dark: out.dark.join(""),
    mid: out.mid.join(""),
    light: out.light.join(""),
    hi: out.hi.join(""),
    snow: out.snow.join(""),
    stems: stems.join(""),
    bulbs,
  };
}

/** Ramita corta para apoyar sobre la nieve (alrededor del regalo) */
function buildSprig() {
  const out = emptyLayers();
  const curveS = bezier([
    [0, 0],
    [22, -4],
    [46, -3],
    [72, 3],
  ]);

  addNeedles(out, curveS, 13, 16, 0.5, 900, 0.9);

  return {
    stem: stemPath(curveS, 8),
    dark: out.dark.join(""),
    mid: out.mid.join(""),
    light: out.light.join(""),
    hi: out.hi.join(""),
    snow: out.snow.join(""),
  };
}

const SPRIG = buildSprig();

const BRANCH = buildBranch();

const BULB_COLOR: Record<string, string> = {
  Y: "#ffd36b",
  W: "#fff4d1",
  R: "#ff5a4f",
};

/** El dibujo de la rama, definido una vez y reutilizado con <use> */
function BranchDefs() {
  return (
    <defs>
      <radialGradient id="nvGlowY">
        <stop offset="0" stopColor="#ffd36b" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="nvGlowW">
        <stop offset="0" stopColor="#fff4d1" stopOpacity="0.85" />
        <stop offset="1" stopColor="#fff4d1" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="nvGlowR">
        <stop offset="0" stopColor="#ff5a4f" stopOpacity="0.8" />
        <stop offset="1" stopColor="#ff5a4f" stopOpacity="0" />
      </radialGradient>

      {/* Luz desde arriba a la izquierda: cada capa se aclara hacia la esquina */}
      <linearGradient id="nvNdD" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="210">
        <stop offset="0" stopColor="#164a30" />
        <stop offset="1" stopColor="#071d14" />
      </linearGradient>
      <linearGradient id="nvNdM" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="210">
        <stop offset="0" stopColor="#2f8456" />
        <stop offset="1" stopColor="#123f2a" />
      </linearGradient>
      <linearGradient id="nvNdL" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="210">
        <stop offset="0" stopColor="#62b985" />
        <stop offset="1" stopColor="#276c47" />
      </linearGradient>
      <linearGradient id="nvNdH" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="210">
        <stop offset="0" stopColor="#b6efc6" />
        <stop offset="1" stopColor="#4c9f6e" />
      </linearGradient>

      <g id="nvBranchGreen" fill="none" strokeLinecap="round">
        <path d={BRANCH.stems} stroke="#3a2818" strokeWidth="3.2" />
        <path d={BRANCH.dark} stroke="url(#nvNdD)" strokeWidth="3.1" />
        <path d={BRANCH.mid} stroke="url(#nvNdM)" strokeWidth="2.5" />
        <path d={BRANCH.light} stroke="url(#nvNdL)" strokeWidth="2" />
        <path d={BRANCH.hi} stroke="url(#nvNdH)" strokeWidth="1.3" opacity="0.85" />
        <path d={BRANCH.snow} stroke="#f3f8ff" strokeWidth="3.4" opacity="0.9" />
      </g>

      {/* Ramita corta (alrededor del regalo) */}
      <g id="nvSprig" fill="none" strokeLinecap="round">
        <path d={SPRIG.stem} stroke="#3a2818" strokeWidth="2.4" />
        <path d={SPRIG.dark} stroke="#0f3322" strokeWidth="2.6" />
        <path d={SPRIG.mid} stroke="#1f6140" strokeWidth="2.1" />
        <path d={SPRIG.light} stroke="#3f9a64" strokeWidth="1.7" />
        <path d={SPRIG.hi} stroke="#8fd6a2" strokeWidth="1.1" opacity="0.85" />
        <path d={SPRIG.snow} stroke="#f3f8ff" strokeWidth="3" opacity="0.9" />
      </g>
    </defs>
  );
}

function PineBranch({
  className = "",
  withDefs = false,
  phase = 0,
}: {
  className?: string;
  withDefs?: boolean;
  phase?: number;
}) {
  return (
    <svg viewBox="0 0 300 220" className={`overflow-visible ${className}`}>
      {withDefs && <BranchDefs />}
      <use href="#nvBranchGreen" />
      {BRANCH.bulbs.map((b, i) => (
        <g
          key={i}
          className="nv-tw"
          style={anim(2.2 + (i % 4) * 0.55, -((i * 0.43 + phase) % 3))}
        >
          <circle cx={b.x} cy={b.y} r="34" fill={`url(#nvGlow${b.kind})`} opacity="0.3" />
          <circle cx={b.x} cy={b.y} r="13" fill={`url(#nvGlow${b.kind})`} />
          <circle cx={b.x} cy={b.y} r="3.6" fill={BULB_COLOR[b.kind]} />
          <circle cx={b.x - 1} cy={b.y - 1.2} r="1.1" fill="#fff" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

/* ============================================================
   ESFERA COLGANTE
   ============================================================ */

function Ornament({
  id,
  cord,
  radius,
  light,
  dark,
  stripe,
  className = "",
  style,
}: {
  id: string;
  cord: number;
  radius: number;
  light: string;
  dark: string;
  stripe: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const width = radius * 2 + 20;
  const cx = width / 2;
  const cy = cord + 11 + radius;
  const height = cy + radius + 10;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} style={style}>
      <defs>
        <radialGradient id={`${id}-b`} cx="0.34" cy="0.28" r="0.9">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={dark} />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor={light} stopOpacity="0.35" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={radius * 1.7} fill={`url(#${id}-g)`} />
      <line x1={cx} y1="0" x2={cx} y2={cord} stroke="#e8d79e" strokeWidth="1.2" />
      <rect x={cx - 6} y={cord} width="12" height="7" rx="1.5" fill="#f2c85b" />
      <rect x={cx - 3.5} y={cord + 5} width="7" height="6" rx="1" fill="#c99a2c" />
      <circle cx={cx} cy={cy} r={radius} fill={`url(#${id}-b)`} />

      <g clipPath={`url(#${id}-c)`}>
        <path
          d={`M${cx - radius} ${cy - radius * 0.1} Q${cx} ${cy + radius * 0.55} ${cx + radius} ${cy - radius * 0.1} L${cx + radius} ${cy + radius * 0.22} Q${cx} ${cy + radius * 0.85} ${cx - radius} ${cy + radius * 0.22} Z`}
          fill={stripe}
          opacity="0.85"
        />
        <path
          d={`M${cx - radius} ${cy - radius * 0.45} Q${cx} ${cy + radius * 0.2} ${cx + radius} ${cy - radius * 0.45}`}
          stroke="#fff"
          strokeOpacity="0.25"
          strokeWidth="1.4"
          fill="none"
        />
      </g>

      <ellipse
        cx={cx - radius * 0.4}
        cy={cy - radius * 0.46}
        rx={radius * 0.2}
        ry={radius * 0.32}
        fill="#fff"
        opacity="0.75"
        transform={`rotate(-32 ${cx - radius * 0.4} ${cy - radius * 0.46})`}
      />
      <circle cx={cx + radius * 0.42} cy={cy + radius * 0.5} r={radius * 0.08} fill="#fff" opacity="0.4" />
    </svg>
  );
}

/* ============================================================
   RENO DE LUCES
   Imagen real (/public/navidad/reno.webp, fondo transparente) con
   resplandor, sombra cálida sobre la nieve y destellos que parpadean.
   ============================================================ */

// Destellos sobre las luces: [izquierda %, arriba %, tamaño px, desfase s]
const DEER_SPARKS: [number, number, number, number][] = [
  [17.5, 13, 16, 0],
  [41, 1.5, 14, -1.2],
  [64, 1.5, 16, -2.1],
  [91, 7, 14, -0.7],
  [50, 48, 18, -1.7],
  [23, 43, 14, -2.6],
  [10, 96, 14, -0.4],
  [66, 96, 14, -1.5],
];

function Reindeer({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ aspectRatio: "480 / 773" }}>
      {/* luz cálida que cae sobre la nieve */}
      <div
        className="absolute -bottom-3 left-[-12%] h-6 w-[124%] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,214,140,0.65) 0%, rgba(255,214,140,0) 70%)",
        }}
      />

      {/* resplandor que pulsa (copia desenfocada detrás) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/navidad/reno.webp"
        alt=""
        aria-hidden="true"
        className="nv-pulse absolute inset-0 h-full w-full"
        style={{ filter: "blur(9px) brightness(1.35) saturate(1.3)", ...anim(3.4, 0) }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/navidad/reno.webp"
        alt=""
        width={480}
        height={773}
        className="relative block h-full w-full"
        style={{ filter: "drop-shadow(0 0 10px rgba(255,190,90,0.35))" }}
      />

      {DEER_SPARKS.map(([x, y, size, delay], i) => (
        <svg
          key={i}
          viewBox="-8 -8 16 16"
          width={size}
          height={size}
          className="nv-spark absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            ...anim(2.6 + (i % 3) * 0.6, delay),
          }}
        >
          <path d="M0 -7L1.5 -1.5L7 0L1.5 1.5L0 7L-1.5 1.5L-7 0L-1.5 -1.5Z" fill="#fff6d6" />
        </svg>
      ))}
    </div>
  );
}

/* ============================================================
   REGALO  ·  REEMPLAZABLE por un PNG
   Caja en perspectiva (tapa, frente y costado), cintas que la
   envuelven y moño; caja roja pequeña, piña y rama de pino.
   ============================================================ */

function Sparkle({ x, y, s, delay = 0 }: { x: number; y: number; s: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="nv-spark"
        style={anim(2.8 + (x % 3) * 0.5, delay)}
        d={`M0 ${-s}L${s * 0.22} ${-s * 0.22}L${s} 0L${s * 0.22} ${s * 0.22}L0 ${s}L${-s * 0.22} ${s * 0.22}L${-s} 0L${-s * 0.22} ${-s * 0.22}Z`}
        fill="#fff6d6"
      />
    </g>
  );
}

/** Un lazo del moño (el otro es su reflejo) */
function BowLoop() {
  return (
    <g>
      <path d="M114 60 C84 20 42 30 56 56 C66 69 100 69 114 60 Z" fill="url(#nvSatin)" />
      <path d="M114 60 C94 40 68 42 72 56 C80 64 102 64 114 60 Z" fill="#6e0818" opacity="0.5" />
      <path d="M96 36 C78 32 58 42 64 54" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M112 58 C96 50 82 50 74 56" stroke="#6e0818" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />
    </g>
  );
}

function Gift({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 190" className={`overflow-visible ${className}`}>
      <defs>
        <linearGradient id="nvFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8faff" />
          <stop offset="1" stopColor="#c3d1ec" />
        </linearGradient>
        <linearGradient id="nvSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9bbda" />
          <stop offset="1" stopColor="#8ea4ca" />
        </linearGradient>
        <linearGradient id="nvTop" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#e9f0fc" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <pattern id="nvPaper" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="1.3" height="7" fill="#8fa8d6" opacity="0.3" />
        </pattern>
        <pattern id="nvDots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#fff" opacity="0.5" />
          <circle cx="6" cy="6" r="1" fill="#fff" opacity="0.5" />
        </pattern>
        <linearGradient id="nvSatin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8e0b1f" />
          <stop offset="0.24" stopColor="#e5283f" />
          <stop offset="0.38" stopColor="#ff7585" />
          <stop offset="0.52" stopColor="#e5283f" />
          <stop offset="0.82" stopColor="#a50f25" />
          <stop offset="1" stopColor="#8e0b1f" />
        </linearGradient>
        <linearGradient id="nvSatinV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a7c" />
          <stop offset="1" stopColor="#c4152d" />
        </linearGradient>
        <linearGradient id="nvRedF" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0344a" />
          <stop offset="1" stopColor="#a40f26" />
        </linearGradient>
        <radialGradient id="nvShadow">
          <stop offset="0" stopColor="#1d3a78" stopOpacity="0.6" />
          <stop offset="1" stopColor="#1d3a78" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nvCone" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#b98250" />
          <stop offset="1" stopColor="#4c2f17" />
        </radialGradient>
      </defs>

      {/* sombra sobre la nieve (la luz viene de la izquierda) */}
      <ellipse cx="142" cy="176" rx="122" ry="11" fill="url(#nvShadow)" />

      {/* ramitas de pino apoyadas en la nieve, detrás de las cajas */}
      <use href="#nvSprig" transform="translate(62 167) rotate(192) scale(1.1)" />
      <use href="#nvSprig" transform="translate(60 173) rotate(158) scale(0.95)" />
      <use href="#nvSprig" transform="translate(54 160) rotate(218) scale(0.85)" />

      {/* ---------- caja grande ---------- */}
      {/* cuerpo: frente y costado */}
      <rect x="52" y="92" width="86" height="80" fill="url(#nvFront)" />
      <rect x="52" y="92" width="86" height="80" fill="url(#nvPaper)" />
      <path d="M138 92 L176 76 L176 156 L138 172 Z" fill="url(#nvSide)" />
      <path d="M138 92 L176 76 L176 156 L138 172 Z" fill="url(#nvPaper)" opacity="0.7" />

      {/* cinta del frente y del costado */}
      <rect x="83" y="92" width="24" height="80" fill="url(#nvSatin)" />
      <path d="M153.2 85.6 L160.8 82.4 L160.8 162.4 L153.2 165.6 Z" fill="#b30f27" />
      <path d="M153.2 85.6 L156 84.4 L156 164.4 L153.2 165.6 Z" fill="#e5283f" />

      {/* sombra de la tapa sobre el cuerpo */}
      <rect x="52" y="92" width="86" height="9" fill="#0a1b3d" opacity="0.16" />
      <path d="M138 92 L176 76 L176 85 L138 101 Z" fill="#0a1b3d" opacity="0.2" />

      {/* tapa: frente, costado y cara superior */}
      <rect x="46" y="70" width="98" height="22" rx="1.5" fill="#fbfdff" />
      <rect x="46" y="70" width="98" height="22" fill="url(#nvPaper)" />
      <rect x="46" y="84" width="98" height="8" fill="#b7c6e2" opacity="0.5" />
      <path d="M144 70 L182 54 L182 76 L144 92 Z" fill="#a3b6d6" />
      <path d="M46 70 L84 54 L182 54 L144 70 Z" fill="url(#nvTop)" />
      <path d="M46 70 L84 54 L182 54 L144 70 Z" fill="url(#nvPaper)" opacity="0.6" />

      {/* cintas de la tapa */}
      <rect x="83" y="70" width="24" height="22" fill="url(#nvSatin)" />
      <path d="M159.2 63.6 L166.8 60.4 L166.8 82.4 L159.2 85.6 Z" fill="#b30f27" />
      <path d="M83 70 L107 70 L145 54 L121 54 Z" fill="url(#nvSatinV)" />
      <path d="M62 63.3 L160 63.3 L166 60.7 L68 60.7 Z" fill="#e0243b" />
      <path d="M62 63.3 L160 63.3 L158 64.2 L61 64.2 Z" fill="#7d0a1b" opacity="0.35" />

      {/* moño sobre la tapa */}
      <ellipse cx="114" cy="64" rx="22" ry="5" fill="#0a1b3d" opacity="0.22" />
      <BowLoop />
      <g transform="translate(228 0) scale(-1 1)">
        <BowLoop />
      </g>

      {/* colas del moño que caen por el frente */}
      <path d="M108 68 L88 106 L99 102 L101 114 L116 70 Z" fill="#c4152d" />
      <path d="M108 68 L88 106 L92 105 L110 70 Z" fill="#ff5468" opacity="0.5" />
      <path d="M120 68 L140 104 L129 100 L127 111 L112 70 Z" fill="#a50f25" />
      <path d="M86 108 L99 102 M129 100 L142 106" stroke="#0a1b3d" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />

      {/* nudo */}
      <rect x="104" y="50" width="20" height="18" rx="5" fill="#d21b34" />
      <rect x="107" y="52" width="5" height="12" rx="2.5" fill="#fff" opacity="0.45" />

      {/* ---------- caja roja pequeña ---------- */}
      <rect x="156" y="138" width="44" height="38" fill="url(#nvRedF)" />
      <rect x="156" y="138" width="44" height="38" fill="url(#nvDots)" />
      <path d="M200 138 L216 131 L216 169 L200 176 Z" fill="#7f0b1d" />
      <path d="M200 138 L216 131 L216 169 L200 176 Z" fill="url(#nvDots)" opacity="0.5" />
      <path d="M156 138 L172 131 L216 131 L200 138 Z" fill="#ff5468" />
      <rect x="172" y="138" width="12" height="38" fill="#ffffff" opacity="0.94" />
      <path d="M172 138 L184 138 L200 131 L188 131 Z" fill="#ffffff" />
      <path d="M205.6 134.5 L210 132.7 L210 171 L205.6 172.8 Z" fill="#e9eef8" />
      <path d="M178 134 C167 121 159 128 168 135 Z" fill="#ffffff" />
      <path d="M178 134 C189 121 197 128 188 135 Z" fill="#f1f5fc" />
      <circle cx="178" cy="133" r="3" fill="#ffffff" />

      {/* ramitas y bayas delante, para que las cajas queden "anidadas" */}
      <use href="#nvSprig" transform="translate(152 179) rotate(186) scale(0.8)" />
      <use href="#nvSprig" transform="translate(205 177) rotate(-4) scale(0.62)" />
      <use href="#nvSprig" transform="translate(206 173) rotate(24) scale(0.5)" />
      {[
        [48, 170],
        [42, 165],
        [138, 177],
        [143, 179],
        [214, 174],
        [219, 177],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.7" fill="#d4182f" />
          <circle cx={x - 0.8} cy={y - 0.9} r="0.9" fill="#fff" opacity="0.8" />
        </g>
      ))}

      {/* piña */}
      <ellipse cx="34" cy="158" rx="17" ry="13" fill="url(#nvCone)" transform="rotate(-18 34 158)" />
      <g stroke="#2e1b0b" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M21 156 Q34 148 48 154" />
        <path d="M19 162 Q34 154 49 161" />
        <path d="M23 168 Q35 162 46 167" />
        <path d="M28 150 Q36 146 43 149" />
        <path d="M27 146 L30 170 M35 145 L36 171 M42 148 L41 170" opacity="0.5" />
      </g>

      {/* destellos */}
      <Sparkle x={82} y={30} s={6} delay={0} />
      <Sparkle x={200} y={72} s={5} delay={-1.1} />
      <Sparkle x={46} y={118} s={4} delay={-2.0} />
    </svg>
  );
}

/* ============================================================
   NIEVE: imagen real (/public/navidad/nieve.webp) con dunas,
   sombras azuladas, ondulaciones del viento y destellos.
   ============================================================ */

function SnowHills() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/navidad/nieve.webp"
      alt=""
      width={3200}
      height={240}
      className="absolute inset-x-0 bottom-0 h-[70px] w-full object-cover object-bottom sm:h-[100px] lg:h-[160px]"
    />
  );
}

/* ============================================================
   CIELO: estrellitas fijas
   ============================================================ */

const STARS: [number, number, number, boolean][] = [
  [8, 14, 7, true],
  [22, 22, 6, true],
  [33, 12, 5, false],
  [64, 24, 5, true],
  [84, 20, 6, true],
  [91, 40, 5, false],
  [5, 70, 4, true],
  [48, 6, 4, true],
];

function Sky() {
  return (
    <>
      {STARS.map(([x, y, s, always], i) => (
        <svg
          key={i}
          viewBox="-8 -8 16 16"
          width={s * 2}
          height={s * 2}
          className={`nv-star absolute ${always ? "" : "hidden sm:block"}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity: 0.35 + pseudo(i, 1) * 0.45,
            ...anim(2.6 + pseudo(i, 3) * 3, -pseudo(i, 5) * 5),
          }}
        >
          <path
            d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z"
            fill="#fff6d6"
          />
        </svg>
      ))}
    </>
  );
}

/* ============================================================
   DESTELLOS EN LA NIEVE Y ESTRELLAS FUGACES
   ============================================================ */

const GLINTS: [number, number, number, boolean][] = [
  [6, 38, 9, true],
  [17, 58, 7, false],
  [29, 30, 8, true],
  [41, 62, 7, false],
  [53, 34, 9, true],
  [64, 56, 7, false],
  [75, 28, 8, true],
  [88, 52, 9, false],
];

function SnowGlints() {
  return (
    <>
      {GLINTS.map(([x, bottom, size, always], i) => (
        <svg
          key={i}
          viewBox="-8 -8 16 16"
          width={size * 2}
          height={size * 2}
          className={`nv-spark absolute ${always ? "" : "hidden sm:block"}`}
          style={{ left: `${x}%`, bottom: `${bottom}px`, ...anim(3 + (i % 3) * 0.8, -i * 0.9) }}
        >
          <path d="M0 -7L1.5 -1.5L7 0L1.5 1.5L0 7L-1.5 1.5L-7 0L-1.5 -1.5Z" fill="#ffffff" />
        </svg>
      ))}
    </>
  );
}

function ShootingStars() {
  return (
    <>
      <span className="nv-shoot" style={{ left: "13%", top: "9%", animationDelay: "6s" }} />
      <span
        className="nv-shoot hidden sm:block"
        style={{ left: "68%", top: "6%", animationDelay: "19s", animationDuration: "31s" }}
      />
    </>
  );
}

/* ============================================================
   CONJUNTO
   ============================================================ */

export default function HeroDecor() {
  const ref = useRef<HTMLDivElement>(null);

  // Las animaciones se pausan cuando el encabezado no se ve o la pestaña está oculta
  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    let visible = true;
    const apply = () => el.classList.toggle("nv-paused", !visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      apply();
    });

    observer.observe(el);
    document.addEventListener("visibilitychange", apply);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="nv-fade pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <Sky />
      <ShootingStars />

      {/* Ramas de las esquinas */}
      <PineBranch
        withDefs
        className="absolute -left-5 -top-2 w-[104px] sm:w-[170px] lg:w-[230px] xl:w-[290px] 2xl:w-[330px]"
      />
      <PineBranch phase={1.3} className="absolute -right-5 -top-2 w-[104px] -scale-x-100 sm:w-[170px] lg:w-[230px] xl:w-[290px] 2xl:w-[330px]" />

      {/* Esferas colgantes */}
      <Ornament
        id="nvBallRed"
        cord={64}
        radius={22}
        light="#ff8f8f"
        dark="#c2182b"
        stripe="#f6d36a"
        className="nv-swing absolute left-[3%] top-0 hidden w-10 sm:block lg:w-14"
        style={anim(4.6, 0)}
      />
      <Ornament
        id="nvBallGold"
        cord={82}
        radius={21}
        light="#fff0b8"
        dark="#c8932a"
        stripe="#ffffff"
        className="nv-swing absolute right-[3.5%] top-0 hidden w-10 sm:block lg:w-[52px]"
        style={anim(5.4, -1.8)}
      />

      {/* Copos grandes y suaves */}
      <Snowflake
        size={34}
        strokeWidth={1.4}
        className="absolute left-[17%] top-[26%] hidden text-white/50 lg:block"
      />
      <Snowflake
        size={28}
        strokeWidth={1.4}
        className="absolute right-[18%] top-[34%] hidden text-white/45 lg:block"
      />
      <Snowflake
        size={22}
        strokeWidth={1.4}
        className="absolute left-[8%] top-[58%] hidden text-white/35 lg:block"
      />

      <SnowHills />
      <SnowGlints />

      {/* Reno y regalo: solo en pantallas grandes, apoyados sobre la nieve */}
      <Reindeer className="absolute bottom-[34px] right-[6%] hidden w-[150px] xl:block 2xl:w-[185px]" />
      <Gift className="absolute bottom-[22px] right-[4%] hidden w-[190px] lg:block xl:right-[13%] 2xl:w-[250px]" />
    </div>
  );
}
