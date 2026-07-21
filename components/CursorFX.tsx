"use client";

import { useEffect, useRef } from "react";

export default function CursorFX() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let x = 0,
      y = 0,
      rx = 0,
      ry = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    let raf: number;
    const tick = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const grow = () => ringRef.current?.classList.add("scale-150", "border-heat");
    const shrink = () => ringRef.current?.classList.remove("scale-150", "border-heat");

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(tick);

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", grow);
      el.addEventListener("mouseleave", shrink);
    });

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hidden md:block pointer-events-none fixed inset-0 z-[70]">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 -ml-[3px] -mt-[3px] rounded-full bg-heat"
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-8 w-8 -ml-4 -mt-4 rounded-full border border-ink/30 transition-transform duration-200 ease-out"
      />
    </div>
  );
}
