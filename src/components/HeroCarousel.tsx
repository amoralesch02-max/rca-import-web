"use client";

import ProductImage from "@/components/ProductImage";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HeroCarouselItem = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  href: string;
  /** "cover" para banners (recorta); "contain" para productos (foto completa) */
  fit: "cover" | "contain";
};

const AUTOPLAY_MS = 4500;
const DEFAULT_WIDTH = 360;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function HeroCarousel({
  items,
}: {
  items: HeroCarouselItem[];
}) {
  const total = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [reduceMotion, setReduceMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  // Medidas responsivas: la tarjeta y la separación dependen del ancho disponible
  const cardWidth = clamp(width * 0.6, 190, 300);
  const step = cardWidth * 0.62;
  const cardHeight = cardWidth + 62;
  const containerHeight = cardHeight + 54;

  function goTo(next: number) {
    if (total === 0) return;
    setIndex(((next % total) + total) % total);
  }

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Avance automático (se detiene al tocar, pasar el mouse o si el usuario prefiere menos movimiento)
  useEffect(() => {
    if (paused || dragging || reduceMotion || total < 2) return;

    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearTimeout(timer);
  }, [index, paused, dragging, reduceMotion, total]);

  useEffect(() => {
    if (index >= total && total > 0) setIndex(0);
  }, [index, total]);

  // Arrastre: el movimiento sigue al dedo o al mouse en tiempo real
  useEffect(() => {
    if (!dragging) return;

    function handleMove(event: PointerEvent) {
      const diff = event.clientX - startX.current;

      if (Math.abs(diff) > 6) {
        moved.current = true;
      }

      setDragX(diff);
    }

    function handleUp(event: PointerEvent) {
      const diff = event.clientX - startX.current;
      const jump = clamp(Math.round(-diff / step), -2, 2);

      if (jump !== 0) {
        goTo(index + jump);
      } else if (Math.abs(diff) > step * 0.3) {
        goTo(index + (diff < 0 ? 1 : -1));
      }

      setDragX(0);
      setDragging(false);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, index, step, total]);

  if (total === 0) {
    return (
      <div className="mx-auto flex h-[300px] w-[230px] items-center justify-center rounded-3xl border border-white/30 bg-white/10 backdrop-blur">
        <Package className="text-white/60" size={72} />
      </div>
    );
  }

  return (
    <div
      className="select-none"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Productos estrella"
    >
      <div
        ref={containerRef}
        className="relative w-full cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          height: containerHeight,
          perspective: 1100,
          touchAction: "pan-y",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;

          startX.current = event.clientX;
          moved.current = false;
          setDragging(true);
        }}
        onClickCapture={(event) => {
          // Si se arrastró, no se debe abrir el producto
          if (moved.current) {
            event.preventDefault();
            event.stopPropagation();
            moved.current = false;
          }
        }}
      >
        {/* Brillo detrás de la tarjeta central */}
        <div
          className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl"
          style={{ width: cardWidth * 1.3, height: cardWidth * 1.1 }}
        />

        {/* Sombra en el piso */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-slate-950/40 blur-xl"
          style={{
            bottom: 26,
            width: cardWidth * 0.8,
            height: 22,
          }}
        />

        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, i) => {
            // Posición relativa circular: 0 = centro, ±1 = vecinas...
            let d = i - index;

            if (d > total / 2) d -= total;
            if (d < -total / 2) d += total;

            const o = d + dragX / step;
            const abs = Math.abs(o);
            const isCenter = Math.abs(d) === 0;

            const spread = abs <= 1 ? abs : 1 + (abs - 1) * 0.72;
            const translateX = Math.sign(o) * spread * step;
            const translateZ = -abs * 80;
            const rotateY = clamp(-o * 30, -50, 50);
            const scale = Math.max(0.68, 1 - abs * 0.12);
            const opacity = clamp(1 - abs * 0.3, 0, 1);
            const visible = abs < 2.6;

            return (
              <div
                key={item.id}
                className="absolute top-3"
                style={{
                  left: "50%",
                  width: cardWidth,
                  marginLeft: -cardWidth / 2,
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: visible ? opacity : 0,
                  zIndex: 100 - Math.round(abs * 10),
                  pointerEvents: visible ? "auto" : "none",
                  transition: dragging
                    ? "none"
                    : "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease",
                  willChange: "transform, opacity",
                }}
                aria-hidden={!isCenter}
              >
                <div className={isCenter && !dragging ? "animate-float" : ""}>
                  <Link
                    href={item.href}
                    draggable={false}
                    tabIndex={isCenter ? 0 : -1}
                    onClick={(event) => {
                      if (!isCenter) {
                        event.preventDefault();
                        goTo(i);
                      }
                    }}
                    className={`block overflow-hidden rounded-3xl bg-white text-slate-950 shadow-2xl shadow-slate-950/40 transition-shadow ${
                      isCenter ? "ring-2 ring-white" : "ring-1 ring-white/40"
                    }`}
                  >
                    <div style={{ height: cardWidth }}>
                      <ProductImage
                        src={item.image}
                        alt={item.title}
                        fit={item.fit}
                        priority={i === 0}
                        sizes="300px"
                        className="h-full w-full"
                      />
                    </div>

                    <div className="px-4 py-3">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {item.title}
                      </p>

                      {item.subtitle && (
                        <p className="mt-0.5 text-sm font-bold text-brand">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Anterior"
              className="absolute left-1 top-[40%] z-[200] hidden h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105 sm:flex"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Siguiente"
              className="absolute right-1 top-[40%] z-[200] hidden h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105 sm:flex"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Indicadores con progreso */}
      {total > 1 && (
        <div className="mt-1 flex items-center justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a ${item.title}`}
              className={`relative h-1.5 overflow-hidden rounded-full bg-white/35 transition-all duration-500 ${
                i === index ? "w-8" : "w-1.5"
              }`}
            >
              {i === index && (
                <span
                  key={index}
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{
                    animation: reduceMotion
                      ? "none"
                      : `progress-fill ${AUTOPLAY_MS}ms linear forwards`,
                    animationPlayState: paused || dragging ? "paused" : "running",
                    width: reduceMotion ? "100%" : undefined,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
