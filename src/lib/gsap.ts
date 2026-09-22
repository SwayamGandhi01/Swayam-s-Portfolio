"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

/**
 * Single registration point for GSAP plugins.
 *
 * ScrollTrigger touches `document` on register, so this module is only ever
 * imported from client components. Registering twice is a no-op in GSAP, but
 * funnelling it through one module keeps the plugin list discoverable.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

  // Animations are authored in transforms/opacity only; telling GSAP to skip
  // its own will-change management avoids promoting dozens of layers at once.
  gsap.config({ nullTargetWarn: false });
  gsap.defaults({ ease: "expo.out", duration: 1 });
}

export { gsap, ScrollTrigger, SplitText, Flip };

/** Shared easing tokens, mirrored from the CSS custom properties. */
export const EASE = {
  outExpo: "expo.out",
  inOutQuint: "power4.inOut",
} as const;
