/**
 * MediaOrbit — renders photo / video items orbiting around the scene origin.
 * Each item follows an inclined circular orbit.  In CHAOS mode items scatter;
 * in FORMED mode they follow their assigned orbit.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneState } from '../types';

export interface OrbitMediaFile {
    url: string;
    type: 'image' | 'video';
    filename: string;
}

interface OrbitData {
    id: number;
    file: OrbitMediaFile;
    /** Orbit ring radius */
    radius: number;
    /** Tilt of orbit plane around the X axis (radians) */
    inclination: number;
    /** Y-offset so rings are at different heights */
    yOffset: number;
    /** Angular speed (rad/s) */
    speed: number;
    /** Initial angle */
    phase: number;
    /** Chaos scatter target */
    chaosPos: THREE.Vector3;
}

// ── Single orbiting polaroid ─────────────────────────────────────────────────

interface OrbitItemProps {
    data: OrbitData;
    mode: SceneState;
    onClick?: () => void;
    isHovered?: boolean;
}

const OrbitItem: React.FC<OrbitItemProps> = ({ data, mode, onClick, isHovered: externalHover }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [isMouseHovered, setIsMouseHovered] = useState(false);
    const isHovered = externalHover || isMouseHovered;

    // Load texture for images
    useEffect(() => {
        if (data.file.type !== 'image') return;
        const loader = new THREE.TextureLoader();
        loader.load(
            data.file.url,
            (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTexture(tex); },
            undefined,
            (err) => { console.warn('Texture load failed:', data.file.url, err); }
        );
    }, [data.file.url, data.file.type]);

    // Generate thumbnail from first video frame via canvas
    useEffect(() => {
        if (data.file.type !== 'video') return;
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        vid.crossOrigin = 'anonymous';
        vid.preload = 'metadata';
        vid.src = data.file.url;
        // Seek after metadata is loaded to get a frame
        const onLoaded = () => { vid.currentTime = 1; };
        const onSeeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(vid, 0, 0, 256, 256);
                    const tex = new THREE.CanvasTexture(canvas);
                    tex.colorSpace = THREE.SRGBColorSpace;
                    setTexture(tex);
                }
            } catch (e) { /* cross-origin video — skip thumbnail */ }
            vid.src = '';
        };
        vid.addEventListener('loadedmetadata', onLoaded, { once: true });
        vid.addEventListener('seeked', onSeeked, { once: true });
        vid.load();
        return () => { vid.src = ''; };
    }, [data.file.url, data.file.type]);

    const swayOffset = useMemo(() => Math.random() * 100, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;

        // Hover zoom: scale up smoothly when hovered
        const targetScale = isHovered ? 1.13 : 1.0;
        groupRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            delta * 8
        );

        if (mode === SceneState.FORMED) {
            // Orbit position
            const angle = data.phase + t * data.speed;
            const x = data.radius * Math.cos(angle);
            const yOrbit = data.radius * Math.sin(angle) * Math.sin(data.inclination);
            const z = data.radius * Math.sin(angle) * Math.cos(data.inclination);
            const targetPos = new THREE.Vector3(x, data.yOffset + yOrbit, z);
            groupRef.current.position.lerp(targetPos, delta * 2.5);

            // Face away from center
            const dummy = new THREE.Object3D();
            dummy.position.copy(groupRef.current.position);
            dummy.lookAt(0, groupRef.current.position.y, 0);
            dummy.rotateY(Math.PI);
            groupRef.current.quaternion.slerp(dummy.quaternion, delta * 3);

            // Gentle sway
            const sway = Math.sin(t * 1.8 + swayOffset) * 0.06;
            groupRef.current.rotation.z += (sway - groupRef.current.rotation.z) * delta * 2;

        } else {
            // Chaos: drift toward chaosPos
            groupRef.current.position.lerp(data.chaosPos, delta * 1.2);
            // Face camera roughly
            const cam = new THREE.Vector3(0, 4, 20);
            const dummy = new THREE.Object3D();
            dummy.position.copy(groupRef.current.position);
            dummy.lookAt(cam);
            groupRef.current.quaternion.slerp(dummy.quaternion, delta * 2);
        }
    });

    const isVideo = data.file.type === 'video';

    return (
        // ↓ initialise at chaos position so items never start at the origin
        <group ref={groupRef} position={[data.chaosPos.x, data.chaosPos.y, data.chaosPos.z]}>
            {/* Hanging string */}
            <mesh position={[0, 1.3, -0.05]}>
                <cylinderGeometry args={[0.005, 0.005, 1.6]} />
                <meshStandardMaterial color="#FFB6C1" metalness={0.8} roughness={0.2} transparent opacity={0.5} />
            </mesh>

            {/* ── Gold selection glow border (shown when hovered by gesture cursor) ── */}
            <mesh position={[0, 0, -0.035]}>
                <boxGeometry args={[2.04, 2.38, 0.015]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    emissive="#D4AF37"
                    emissiveIntensity={isHovered ? 3.5 : 0}
                    transparent
                    opacity={isHovered ? 0.95 : 0}
                />
            </mesh>
            {/* Outer soft glow plane */}
            <mesh position={[0, 0, -0.04]}>
                <planeGeometry args={[2.3, 2.6]} />
                <meshBasicMaterial
                    color="#D4AF37"
                    transparent
                    opacity={isHovered ? 0.18 : 0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <group
                onClick={onClick}
                onPointerOver={() => setIsMouseHovered(true)}
                onPointerOut={() => setIsMouseHovered(false)}
            >
                {/* Polaroid white backing — emissive so it appears white in dark scene */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.8, 2.1, 0.022]} />
                    <meshStandardMaterial
                        color={isHovered ? '#FFE4E1' : '#ffffff'}
                        roughness={0.7}
                        emissive={isHovered ? '#FF69B4' : '#fff0f5'}
                        emissiveIntensity={isHovered ? 0.5 : 0.35}
                    />
                </mesh>

                {/* Photo / video thumbnail — FRONT face (z=+0.025, in front of box front face at z=+0.011) */}
                <mesh position={[0, 0.18, 0.025]}>
                    <planeGeometry args={[1.55, 1.55]} />
                    <meshBasicMaterial
                        key={texture ? `tex-${data.id}` : `col-${data.id}`}
                        map={texture ?? undefined}
                        color={texture ? undefined : (isVideo ? '#2a0040' : '#e0c8d8')}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Photo / video thumbnail — BACK face (z=-0.025, in front of box back face at z=-0.011 when viewed from behind) */}
                <mesh position={[0, 0.18, -0.025]}>
                    <planeGeometry args={[1.55, 1.55]} />
                    <meshBasicMaterial
                        key={texture ? `back-tex-${data.id}` : `back-col-${data.id}`}
                        map={texture ?? undefined}
                        color={texture ? undefined : (isVideo ? '#2a0040' : '#e0c8d8')}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Video play icon — front */}
                {isVideo && !texture && (
                    <mesh position={[0, 0.18, 0.04]}>
                        <planeGeometry args={[0.5, 0.5]} />
                        <meshBasicMaterial color="#FF69B4" transparent opacity={0.9} side={THREE.DoubleSide} />
                    </mesh>
                )}
                {/* Video play icon — back */}
                {isVideo && !texture && (
                    <mesh position={[0, 0.18, -0.04]}>
                        <planeGeometry args={[0.5, 0.5]} />
                        <meshBasicMaterial color="#FF69B4" transparent opacity={0.9} side={THREE.DoubleSide} />
                    </mesh>
                )}

                {/* Rose gold bottom accent — front */}
                <mesh position={[0, -0.78, 0.025]}>
                    <planeGeometry args={[1.35, 0.14]} />
                    <meshBasicMaterial color="#D4AF37" side={THREE.DoubleSide} />
                </mesh>
                {/* Rose gold bottom accent — back */}
                <mesh position={[0, -0.78, -0.025]}>
                    <planeGeometry args={[1.35, 0.14]} />
                    <meshBasicMaterial color="#D4AF37" side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

interface MediaOrbitProps {
    mode: SceneState;
    mediaFiles: OrbitMediaFile[];
    onMediaClick?: (file: OrbitMediaFile) => void;
    hoveredFile?: OrbitMediaFile | null;
}

export const MediaOrbit: React.FC<MediaOrbitProps> = ({
    mode,
    mediaFiles,
    onMediaClick,
    hoveredFile,
}) => {
    const orbits = useMemo<OrbitData[]>(() => {
        return mediaFiles.map((file, i) => {
            // Distribute items across multiple orbit rings
            const ringIndex = i % 3;           // 3 rings
            const ringRadius = 6 + ringIndex * 2.5; // 6, 8.5, 11
            const inclination = [-0.4, 0.2, -0.6][ringIndex];
            const yOffset = [-1, 1.5, 0][ringIndex];
            const speed = 0.15 + Math.random() * 0.12;

            const phase = (i / mediaFiles.length) * Math.PI * 2;

            // Chaos scatter position
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 10 + Math.random() * 12;
            const chaosPos = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi),
            );

            return { id: i, file, radius: ringRadius, inclination, yOffset, speed, phase, chaosPos };
        });
    }, [mediaFiles]);

    return (
        <>
            {orbits.map((orbit) => (
                <OrbitItem
                    key={orbit.id}
                    data={orbit}
                    mode={mode}
                    onClick={() => onMediaClick?.(orbit.file)}
                    isHovered={hoveredFile?.url === orbit.file.url}
                />
            ))}
        </>
    );
};
