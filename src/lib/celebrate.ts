/**
 * Confeti corto al enviar el pedido por WhatsApp.
 *
 * - Tema normal: papelitos con los colores de RCA (azul, rojo, celeste, blanco).
 * - Navidad: copos de nieve, estrellas doradas y algunos papelitos rojos/verdes.
 *
 * Se dibuja en un <canvas> temporal que no bloquea clics y se borra al terminar.
 * Si la pestaña queda en segundo plano (se abrió WhatsApp), la animación se
 * pausa sola y continúa al volver, así el cliente igual la ve.
 * Con "reducir movimiento" activado no se muestra.
 */

type Shape = "paper" | "flake" | "star";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  color: string;
  shape: Shape;
};

const DURATION = 2200; // ms de animación visible
const COUNT_DESKTOP = 110;
const COUNT_MOBILE = 70;

const NORMAL_COLORS = ["#0057a8", "#e31b23", "#38bdf8", "#facc15", "#1e3a8a"];
const XMAS_PAPER = ["#d4192d", "#1f8a57", "#f6c244"];

let running = false;

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeParticle(width: number, height: number, christmas: boolean): Particle {
  let shape: Shape = "paper";
  let color = pick(NORMAL_COLORS);

  if (christmas) {
    const roll = Math.random();

    if (roll < 0.45) {
      shape = "flake";
      color = Math.random() < 0.5 ? "#ffffff" : "#bcd7fb";
    } else if (roll < 0.75) {
      shape = "star";
      color = "#f6c244";
    } else {
      color = pick(XMAS_PAPER);
    }
  }

  // Salen desde dos "cañones" abajo a los costados, hacia el centro y arriba
  const fromLeft = Math.random() < 0.5;
  const angle = (fromLeft ? -62 : -118) + (Math.random() * 36 - 18);
  const speed = height * (0.024 + Math.random() * 0.014);
  const radians = (angle * Math.PI) / 180;

  return {
    x: fromLeft ? width * 0.08 : width * 0.92,
    y: height * 0.95,
    vx: Math.cos(radians) * speed,
    vy: Math.sin(radians) * speed,
    size: shape === "paper" ? 7 + Math.random() * 6 : 6 + Math.random() * 7,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.05 + Math.random() * 0.08,
    color,
    shape,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? size : size * 0.45;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }

  ctx.closePath();
  ctx.fill();
}

function drawFlake(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = Math.max(1.2, size * 0.18);
  ctx.lineCap = "round";

  for (let i = 0; i < 3; i += 1) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
  }
}

export function celebrate() {
  if (typeof window === "undefined" || running) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const christmas = document.documentElement.getAttribute("data-theme") === "navidad";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  running = true;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.setAttribute("aria-hidden", "true");

  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "120",
  });

  document.body.appendChild(canvas);
  ctx.scale(ratio, ratio);

  const count = width < 640 ? COUNT_MOBILE : COUNT_DESKTOP;
  const particles = Array.from({ length: count }, () =>
    makeParticle(width, height, christmas)
  );

  let elapsed = 0;
  let last = 0;

  function frame(now: number) {
    // Si la pestaña estuvo oculta, se continúa donde se quedó
    const delta = last ? Math.min(now - last, 32) : 16;
    last = now;
    elapsed += delta;

    const step = delta / 16;
    const fade = Math.min(1, Math.max(0, (DURATION - elapsed) / 500));

    ctx!.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.vy += 0.32 * step; // gravedad
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.wobble += p.wobbleSpeed * step;
      p.x += (p.vx + Math.sin(p.wobble) * 0.6) * step;
      p.y += p.vy * step;
      p.rotation += p.spin * step;

      ctx!.save();
      ctx!.globalAlpha = fade;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.strokeStyle = p.color;

      if (p.shape === "star") {
        drawStar(ctx!, p.size * 0.6);
      } else if (p.shape === "flake") {
        // Sombra suave para que los copos blancos se vean sobre fondo blanco
        ctx!.shadowColor = "rgba(30, 64, 120, 0.6)";
        ctx!.shadowBlur = 4;
        drawFlake(ctx!, p.size * 0.6);
      } else {
        // Papelito que "gira" en el aire (se achica en un eje)
        ctx!.scale(1, Math.abs(Math.cos(p.wobble * 1.4)) * 0.8 + 0.2);
        ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      }

      ctx!.restore();
    }

    if (elapsed < DURATION) {
      window.requestAnimationFrame(frame);
    } else {
      canvas.remove();
      running = false;
    }
  }

  window.requestAnimationFrame(frame);
}
