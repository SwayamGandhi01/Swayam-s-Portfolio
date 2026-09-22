"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { LatticeField } from "./LatticeField";

/**
 * Canvas host for the hero field.
 *
 * Three guards sit in front of the renderer:
 *  1. WebGL support is probed before mounting — no context, no canvas.
 *  2. Device memory / core count are sampled; very low-end devices get the
 *     CSS fallback instead of a stuttering render loop.
 *  3. The loop is suspended (`frameloop="never"`) whenever the hero scrolls
 *     out of view or the tab is hidden, so an idle background tab costs
 *     nothing.
 *
 * The component is itself lazily imported by the hero, so three.js is not in
 * the initial bundle at all.
 */

function canRenderWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;

    // Rough capability floor. `deviceMemory` is Chromium-only; absence is
    // treated as "fine", since we only want to exclude devices that say so.
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;

    return true;
  } catch {
    return false;
  }
}

export default function HeroCanvas({ onUnavailable }: { onUnavailable?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // This module is imported with `ssr: false`, so the probe only ever runs in
  // the browser and can be resolved once, on the first render, rather than in
  // an effect that would cascade a second render.
  const [supported] = useState(canRenderWebGL);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!supported) onUnavailable?.();
  }, [supported, onUnavailable]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supported) return;

    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && !document.hidden),
      { threshold: 0 }
    );
    io.observe(host);

    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supported]);

  if (!supported) return null;

  return (
    <div ref={hostRef} className="absolute inset-0" aria-hidden>
      {supported && (
        <Canvas
          frameloop={active ? "always" : "never"}
          // Cap DPR: past ~1.75 the extra fragments are invisible on this
          // effect but the fill cost is real on high-density screens.
          dpr={[1, 1.75]}
          camera={{ position: [0, 2.6, 7.2], fov: 42 }}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
        >
          <LatticeField />
        </Canvas>
      )}
    </div>
  );
}
