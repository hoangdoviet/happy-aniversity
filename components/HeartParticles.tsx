import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneState } from '../types';
import { sampleHeartPositions, createChaosPositions, createRandomAttributes } from '../utils/numberPositions';

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
    float localProgress = clamp(uProgress * 1.2 - aRandom * 0.2, 0.0, 1.0);
    float easedProgress = cubicInOut(localProgress);

    vec3 pos = mix(aChaosPos, aFormedPos, easedProgress);

    // Pulsing heartbeat when fully formed
    if (easedProgress > 0.88) {
      float beat = (easedProgress - 0.88) / 0.12;
      float pulse = sin(uTime * 2.0) * 0.04 + 0.96; // scale 0.92–1.0
      pos *= mix(1.0, pulse, beat);
      // Gentle floating
      pos.y += sin(uTime * 1.2 + aRandom * 8.0) * 0.05 * beat;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.5 + aRandom * 5.0) * (30.0 / -mvPosition.z);
    gl_Position  = projectionMatrix * mvPosition;

    // Deep red / rose / white sparkle palette
    vec3 deepRed    = vec3(0.9,  0.05, 0.20);
    vec3 roseRed    = vec3(1.0,  0.25, 0.45);
    vec3 hotPink    = vec3(1.0,  0.41, 0.71);
    vec3 whiteColor = vec3(1.0,  0.93, 0.96);

    vColor = mix(deepRed, hotPink, aRandom * 0.7);
    float sparkle = sin(uTime * 6.0 + aRandom * 300.0);
    if (sparkle > 0.92) vColor = whiteColor;

    vAlpha = mix(0.2, 1.0, easedProgress);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = pow(1.0 - r * 2.0, 1.6);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

// ── Component ────────────────────────────────────────────────────────────────

interface HeartParticlesProps {
    mode: SceneState;
    count?: number;
}

export const HeartParticles: React.FC<HeartParticlesProps> = ({
    mode,
    count = 12000,
}) => {
    const pointsRef = useRef<THREE.Points>(null);
    const progressRef = useRef(mode === SceneState.FORMED ? 1 : 0);

    const { geometry, uniforms } = useMemo(() => {
        const formedPositions = sampleHeartPositions(count);
        const chaosPositions = createChaosPositions(count, 20);
        const randoms = createRandomAttributes(count);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(formedPositions, 3));
        geo.setAttribute('aFormedPos', new THREE.BufferAttribute(formedPositions, 3));
        geo.setAttribute('aChaosPos', new THREE.BufferAttribute(chaosPositions, 3));
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const uni = {
            uTime: { value: 0 },
            uProgress: { value: mode === SceneState.FORMED ? 1 : 0 },
        };

        return { geometry: geo, uniforms: uni };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const target = mode === SceneState.FORMED ? 1 : 0;
        progressRef.current += (target - progressRef.current) * delta * 1.2;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [uniforms]
    );

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};
