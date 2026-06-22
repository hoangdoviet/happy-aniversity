import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneState } from '../types';
import {
    sampleNumberPositions,
    createChaosPositions,
    createRandomAttributes,
} from '../utils/numberPositions';

// ── Shaders ──────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;

  attribute vec3 aChaosPos;
  attribute vec3 aFormedPos;
  attribute float aRandom;

  varying vec3  vColor;
  varying float vAlpha;

  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Stagger each particle slightly so they don't all move together
    float localProgress = clamp(uProgress * 1.2 - aRandom * 0.2, 0.0, 1.0);
    float easedProgress = cubicInOut(localProgress);

    vec3 pos = mix(aChaosPos, aFormedPos, easedProgress);

    // Gentle breathing when fully formed
    if (easedProgress > 0.85) {
      float breathe = (easedProgress - 0.85) / 0.15; // 0→1 fade-in
      pos.x += sin(uTime * 1.8 + pos.y * 3.0 + aRandom * 12.0) * 0.07 * breathe;
      pos.y += cos(uTime * 1.5 + pos.x * 2.0 + aRandom * 12.0) * 0.05 * breathe;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.0 + aRandom * 4.5) * (28.0 / -mvPosition.z);
    gl_Position  = projectionMatrix * mvPosition;

    // Romantic palette: gold ↔ pink ↔ white sparkle
    vec3 goldColor  = vec3(1.0,  0.84, 0.10);
    vec3 pinkColor  = vec3(1.0,  0.35, 0.65);
    vec3 roseColor  = vec3(1.0,  0.6,  0.80);
    vec3 whiteColor = vec3(1.0,  0.95, 0.97);

    vColor = mix(pinkColor, goldColor, aRandom * 0.55);
    // Occasional sparkle
    float sparkle = sin(uTime * 7.0 + aRandom * 250.0);
    if (sparkle > 0.92) vColor = whiteColor;

    vAlpha = mix(0.25, 1.0, easedProgress);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = pow(1.0 - r * 2.0, 1.8);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

// ── Component ────────────────────────────────────────────────────────────────

interface NumberParticlesProps {
    /** The text to render as particles, e.g. "1" or "12" */
    text: string;
    mode: SceneState;
    /** Particle count – default 9 000 */
    count?: number;
}

export const NumberParticles: React.FC<NumberParticlesProps> = ({
    text,
    mode,
    count = 9000,
}) => {
    const pointsRef = useRef<THREE.Points>(null);
    const progressRef = useRef(mode === SceneState.FORMED ? 1 : 0);

    // Compute geometry attributes once per (text, count) pair
    const { geometry, uniforms } = useMemo(() => {
        const formedPositions = sampleNumberPositions(text, count);
        const chaosPositions = createChaosPositions(count, 18);
        const randoms = createRandomAttributes(count);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(formedPositions, 3)); // placeholder
        geo.setAttribute('aFormedPos', new THREE.BufferAttribute(formedPositions, 3));
        geo.setAttribute('aChaosPos', new THREE.BufferAttribute(chaosPositions, 3));
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const uni = {
            uTime: { value: 0 },
            uProgress: { value: mode === SceneState.FORMED ? 1 : 0 },
        };

        return { geometry: geo, uniforms: uni };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, count]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const target = mode === SceneState.FORMED ? 1 : 0;
        progressRef.current += (target - progressRef.current) * delta * 1.5;

        uniforms.uTime.value = state.clock.elapsedTime;
        uniforms.uProgress.value = progressRef.current;
    });

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        // uniforms is stable (same reference)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [uniforms]
    );

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};
