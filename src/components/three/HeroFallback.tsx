/**
 * Non-WebGL stand-in for the hero field.
 *
 * Same visual idea — a perspective dot grid with a warm light source drifting
 * across it — expressed in two gradients and a transform. Renders on the
 * server, costs nothing, and holds the composition so the hero layout is
 * identical whichever path a visitor gets. The drift animation is stopped by
 * the global reduced-motion rule.
 */
export function HeroFallback() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-[-25%] bottom-[-30%] top-[22%] origin-bottom"
        style={{
          transform: "perspective(900px) rotateX(62deg)",
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--color-content) 26%, transparent) 1px, transparent 1.4px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 45%, #000 20%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 45%, #000 20%, transparent 78%)",
        }}
      />
      <div className="absolute inset-0 animate-[hero-drift_14s_ease-in-out_infinite_alternate] bg-[radial-gradient(38rem_26rem_at_62%_62%,color-mix(in_oklab,var(--color-signal)_20%,transparent),transparent_70%)]" />
    </div>
  );
}
