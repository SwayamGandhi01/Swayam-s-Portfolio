"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * "The build surface" — a plane of points displaced entirely in the vertex
 * shader, with a ripple that follows the pointer.
 *
 * Why a shader and not instanced meshes: all 14k points are positioned on the
 * GPU from a handful of uniforms, so the per-frame CPU cost is four uniform
 * writes. Nothing is allocated in the render loop, there is no geometry
 * update, and there are no textures or model files to download — the whole
 * visual is about 40 lines of GLSL.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uPointerStrength;
  uniform float uPixelRatio;

  varying float vElevation;
  varying float vProximity;

  void main() {
    vec3 p = position;

    // Layered sines give a surface that never visibly repeats.
    float wave =
        sin(p.x * 1.55 + uTime * 0.50) * 0.150
      + sin(p.y * 2.05 - uTime * 0.38) * 0.115
      + sin((p.x + p.y) * 0.85 + uTime * 0.27) * 0.085;

    float d = distance(p.xy, uPointer);
    float ripple = exp(-d * d * 0.45) * uPointerStrength;

    p.z += wave + ripple * 0.8;

    vElevation = wave;
    vProximity = ripple;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (13.0 + ripple * 24.0) * uPixelRatio / max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uAccent;

  varying float vElevation;
  varying float vProximity;

  void main() {
    // Round off the square point sprite.
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    float mask  = smoothstep(0.5, 0.15, d);
    float lift  = smoothstep(-0.20, 0.26, vElevation);
    float blend = clamp(vProximity * 1.7 + lift * 0.45, 0.0, 1.0);

    vec3  color = mix(uBase, uAccent, blend);
    float alpha = mask * (0.26 + vProximity * 0.7 + lift * 0.34);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function LatticeField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const viewport = useThree((s) => s.viewport);

  const pointer = useRef({ x: 0, y: 0, strength: 0 });

  // 110² segments ≈ 12.3k points: dense enough to read as a surface, light
  // enough that a mid-range integrated GPU doesn't notice.
  const geometry = useMemo(() => new THREE.PlaneGeometry(26, 16, 110, 110), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uPointerStrength: { value: 0 },
          uPixelRatio: { value: 1 },
          uBase: { value: new THREE.Color("#4a5866") },
          uAccent: { value: new THREE.Color("#ff5c35") },
        },
      }),
    []
  );

  useFrame((state, delta) => {
    // Written through the JSX ref, not the memoised object: the render loop
    // owns these uniforms, and React must not consider them part of its
    // reactive graph.
    const uniforms = materialRef.current?.uniforms;
    if (!uniforms) return;

    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Map the normalised pointer into the plane's local space, then ease
    // toward it so the ripple trails the cursor instead of snapping to it.
    const p = pointer.current;
    const targetX = state.pointer.x * 12;
    const targetY = state.pointer.y * 7;
    const targetStrength =
      state.pointer.x === 0 && state.pointer.y === 0 ? 0 : 1;

    // Frame-rate independent easing — same feel at 60Hz and 144Hz.
    const ease = 1 - Math.pow(0.0015, delta);
    pointer.current.x = p.x + (targetX - p.x) * ease;
    pointer.current.y = p.y + (targetY - p.y) * ease;
    pointer.current.strength =
      p.strength + (targetStrength - p.strength) * ease * 0.6;

    uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);
    uniforms.uPointerStrength.value = pointer.current.strength;
  });

  // Tilt the surface away from the camera so it reads as a workbench plane
  // rather than a flat wall, and scale it with the viewport so the framing
  // holds from phone to ultrawide.
  const scale = Math.max(0.62, Math.min(1.25, viewport.width / 12));

  return (
    <points
      geometry={geometry}
      rotation={[-Math.PI / 2.42, 0, -0.16]}
      position={[0, -1.1, 0]}
      scale={scale}
    >
      <primitive ref={materialRef} object={material} attach="material" />
    </points>
  );
}
