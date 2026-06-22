import React, { useRef } from 'react';
import { Environment, OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import { NumberParticles } from './NumberParticles';
import { HeartParticles } from './HeartParticles';
import { MediaOrbit, OrbitMediaFile } from './MediaOrbit';
import { SceneState } from '../types';

interface AnniversarySceneProps {
    /** Current month 1–12, or 0 when showing the heart */
    currentMonth: number;
    mode: SceneState;
    handPosition: { x: number; y: number; detected: boolean };
    mediaFiles: OrbitMediaFile[];
    onMediaClick?: (file: OrbitMediaFile) => void;
}

export const AnniversaryScene: React.FC<AnniversarySceneProps> = ({
    currentMonth,
    mode,
    handPosition,
    mediaFiles,
    onMediaClick,
}) => {
    const controlsRef = useRef<any>(null);

    // Hand-driven camera rotation (mirrors the original Experience.tsx logic)
    useFrame((_, delta) => {
        if (!controlsRef.current || !handPosition.detected) return;

        const controls = controlsRef.current;
        const targetAzimuth = (handPosition.x - 0.5) * Math.PI * 1.4;
        const adjustedY = (handPosition.y - 0.3) * 1.2;
        const clampedY = Math.max(0, Math.min(1, adjustedY));
        const minPolar = Math.PI / 4;
        const maxPolar = Math.PI / 1.8;
        const targetPolar = minPolar + clampedY * (maxPolar - minPolar);

        const currentAzimuth = controls.getAzimuthalAngle();
        const currentPolar = controls.getPolarAngle();

        let azimuthDiff = targetAzimuth - currentAzimuth;
        if (azimuthDiff > Math.PI) azimuthDiff -= Math.PI * 2;
        if (azimuthDiff < -Math.PI) azimuthDiff += Math.PI * 2;

        const lerpSpeed = 3;
        const newAzimuth = currentAzimuth + azimuthDiff * delta * lerpSpeed;
        const newPolar = currentPolar + (targetPolar - currentPolar) * delta * lerpSpeed;

        const radius = controls.getDistance();
        const targetY = 2;
        controls.object.position.set(
            radius * Math.sin(newPolar) * Math.sin(newAzimuth),
            targetY + radius * Math.cos(newPolar),
            radius * Math.sin(newPolar) * Math.cos(newAzimuth),
        );
        controls.target.set(0, targetY, 0);
        controls.update();
    });

    const isHeart = currentMonth === 0;
    const isFormed = mode === SceneState.FORMED;

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
                minDistance={isFormed ? 10 : 14}
                maxDistance={isFormed ? 28 : 34}
                enableDamping
                dampingFactor={0.05}
            />

            {/* ── Lighting ── */}
            <Environment preset="night" background={false} />
            <ambientLight intensity={0.15} color="#200020" />
            <spotLight
                position={[8, 18, 8]}
                angle={0.25}
                penumbra={1}
                intensity={3}
                color={isHeart ? '#ff6688' : '#ffd0e8'}
                castShadow
            />
            <pointLight position={[-10, 4, -8]} intensity={1.5} color="#D4AF37" />
            <pointLight position={[10, 4, 8]} intensity={1.0} color="#FF69B4" />

            {/* ── Stars background ── */}
            <Stars radius={80} depth={50} count={3000} factor={4} saturation={0.5} fade />

            {/* ── 3-D shapes ── */}
            <group position={[0, 0, 0]}>
                {isHeart ? (
                    <HeartParticles mode={mode} count={14000} />
                ) : (
                    <NumberParticles
                        key={currentMonth}   // remount when month changes
                        text={String(currentMonth)}
                        mode={mode}
                        count={10000}
                    />
                )}

                <MediaOrbit
                    mode={mode}
                    mediaFiles={mediaFiles}
                    onMediaClick={onMediaClick}
                />

                <ContactShadows
                    opacity={0.4}
                    scale={25}
                    blur={2.5}
                    far={5}
                    color="#300020"
                />
            </group>

            {/* ── Post-processing ── */}
            <EffectComposer>
                <Bloom
                    threshold={0.55}
                    intensity={isHeart ? 2.2 : 1.6}
                    luminanceSmoothing={0.9}
                />
                <Vignette eskil={false} offset={0.3} darkness={0.7} />
            </EffectComposer>
        </>
    );
};
