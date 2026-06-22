
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { MediaFile } from '../utils/mediaLoader';

interface PolaroidsProps {
  mode: TreeMode;
  mediaFiles: MediaFile[];
  twoHandsDetected: boolean;
  onClosestMediaChange?: (media: MediaFile | null) => void;
  handPosition?: { x: number; y: number; detected: boolean };
  onHoveredMediaChange?: (media: MediaFile | null) => void;
}

interface MediaData {
  id: number;
  media: MediaFile;
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
}

const PolaroidItem: React.FC<{
  data: MediaData;
  mode: TreeMode;
  index: number;
  onClick?: () => void;
  isHovered?: boolean;
}> = ({ data, mode, index, onClick, isHovered: externalHovered }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState(false);
  const [isMouseHovered, setIsMouseHovered] = useState(false);

  // Use external hover (from hand position) or mouse hover
  const isHovered = externalHovered || isMouseHovered;

  // Safe texture loading - only for images
  useEffect(() => {
    if (data.media.type === 'image') {
      const loader = new THREE.TextureLoader();
      loader.load(
        data.media.url,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          setTexture(loadedTex);
          setError(false);
        },
        undefined,
        (err) => {
          console.warn(`Failed to load image: ${data.media.url}`, err);
          setError(true);
        }
      );
    }
    // Videos don't load texture - they show placeholder
  }, [data.media.url, data.media.type]);

  // Random sway offset
  const swayOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;

    // 1. Position Interpolation
    const targetPos = isFormed ? data.targetPos : data.chaosPos;
    const step = delta * data.speed;

    // Smooth lerp to target position
    groupRef.current.position.lerp(targetPos, step);

    // 2. Rotation & Sway Logic
    if (isFormed) {
      // Look at center but face outward
      const dummy = new THREE.Object3D();
      dummy.position.copy(groupRef.current.position);
      dummy.lookAt(0, groupRef.current.position.y, 0);
      dummy.rotateY(Math.PI); // Flip to face out

      // Base rotation alignment
      groupRef.current.quaternion.slerp(dummy.quaternion, step);

      // Physical Swaying (Wind)
      const swayAngle = Math.sin(time * 2.0 + swayOffset) * 0.08;
      const tiltAngle = Math.cos(time * 1.5 + swayOffset) * 0.05;

      const currentRot = new THREE.Euler().setFromQuaternion(groupRef.current.quaternion);
      groupRef.current.rotation.z = currentRot.z + swayAngle * 0.05;
      groupRef.current.rotation.x = currentRot.x + tiltAngle * 0.05;

    } else {
      // Chaos mode - face toward camera with gentle floating
      const cameraPos = new THREE.Vector3(0, 9, 20);
      const dummy = new THREE.Object3D();
      dummy.position.copy(groupRef.current.position);

      // Make photos face the camera
      dummy.lookAt(cameraPos);

      // Smoothly rotate to face camera
      groupRef.current.quaternion.slerp(dummy.quaternion, delta * 3);

      // Add gentle floating wobble
      const wobbleX = Math.sin(time * 1.5 + swayOffset) * 0.03;
      const wobbleZ = Math.cos(time * 1.2 + swayOffset) * 0.03;

      const currentRot = new THREE.Euler().setFromQuaternion(groupRef.current.quaternion);
      groupRef.current.rotation.x = currentRot.x + wobbleX;
      groupRef.current.rotation.z = currentRot.z + wobbleZ;
    }
  });

  return (
    <group ref={groupRef}>

      {/* The Hanging String (Visual only) - fades out at top */}
      <mesh position={[0, 1.2, -0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 1.5]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} transparent opacity={0.6} />
      </mesh>

      {/* Frame Group - Clickable */}
      <group
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={() => setIsMouseHovered(true)}
        onPointerOut={() => setIsMouseHovered(false)}
      >

        {/* White Paper Backing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 1.5, 0.02]} />
          <meshStandardMaterial
            color={isHovered ? "#FFD700" : "#fdfdfd"}
            roughness={0.8}
            emissive={isHovered ? "#FFD700" : "#000000"}
            emissiveIntensity={isHovered ? 0.8 : 0}
          />
        </mesh>

        {/* The Photo/Video Preview Area */}
        <mesh position={[0, 0.15, 0.025]}>
          <planeGeometry args={[1.0, 1.0]} />
          {data.media.type === 'image' ? (
            texture && !error ? (
              <meshBasicMaterial map={texture} />
            ) : (
              <meshStandardMaterial color={error ? "#550000" : "#cccccc"} />
            )
          ) : (
            // Video placeholder - dark background with gradient
            <meshStandardMaterial color="#2a2a2a" />
          )}
        </mesh>

        {/* Play icon for videos */}
        {data.media.type === 'video' && (
          <group position={[0, 0.15, 0.04]}>
            <mesh>
              <circleGeometry args={[0.2, 32]} />
              <meshBasicMaterial
                color="#D4AF37"
                transparent
                opacity={isHovered ? 1.0 : 0.85}
              />
            </mesh>
            <mesh position={[0.03, 0, 0.01]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.12, 3]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          </group>
        )}

        {/* "Tape" or Gold Clip */}
        <mesh position={[0, 0.7, 0.025]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
        </mesh>

        {/* Text Label */}
        <Text
          position={[0, -0.55, 0.03]}
          fontSize={0.12}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          {error ? "Media not found" : (data.media.type === 'video' ? '📹 Video' : "Happy Memories")}
        </Text>
      </group>
    </group>
  );
};

export const Polaroids: React.FC<PolaroidsProps> = ({
  mode,
  mediaFiles,
  twoHandsDetected,
  onClosestMediaChange,
  handPosition,
  onHoveredMediaChange
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredMediaIndex, setHoveredMediaIndex] = React.useState<number | null>(null);

  const mediaData = useMemo(() => {
    // Don't render any polaroids if no media files
    if (mediaFiles.length === 0) {
      return [];
    }

    const data: MediaData[] = [];
    const height = 9; // Range of height on tree
    const maxRadius = 5.0; // Slightly outside the foliage radius (which is approx 5 at bottom)

    const count = mediaFiles.length;

    for (let i = 0; i < count; i++) {
      // 1. Target Position
      // Distributed nicely on the cone surface
      const yNorm = 0.2 + (i / count) * 0.6; // Keep between 20% and 80% height
      const y = yNorm * height;

      // Radius decreases as we go up
      const r = maxRadius * (1 - yNorm) + 0.8; // +0.8 to ensure it floats OUTSIDE leaves

      // Golden Angle Spiral for even distribution
      const theta = i * 2.39996; // Golden angle in radians

      const targetPos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // 2. Chaos Position - Spread out and closer to camera
      // Camera is at [0, 4, 20], Scene group offset is [0, -5, 0]
      // So relative to scene, camera is at y=9
      const relativeY = 6; // Eye level
      const relativeZ = 20; // Camera Z

      // Create positions spread widely in a grid/circle for easy access
      const angle = (i / count) * Math.PI * 2; // Distribute evenly in circle
      const radius = 8; // Distance from center (wider spread)
      const heightSpread = (i % 3 - 1) * 3; // 3 height levels: -3, 0, +3

      const chaosPos = new THREE.Vector3(
        radius * Math.cos(angle), // X spread in circle
        relativeY + heightSpread, // Y: 3 height levels
        relativeZ - 10 + radius * Math.sin(angle) * 0.5 // Z: 10-12 units from camera (close but visible)
      );

      data.push({
        id: i,
        media: mediaFiles[i],
        chaosPos,
        targetPos,
        speed: 0.8 + Math.random() * 1.5 // Variable speed
      });
    }
    return data;
  }, [mediaFiles]);

  // Detect closest photo to hand position in Chaos mode
  React.useEffect(() => {
    if (mode !== TreeMode.CHAOS || !handPosition?.detected || mediaData.length === 0) {
      setHoveredMediaIndex(null);
      if (onHoveredMediaChange) onHoveredMediaChange(null);
      return;
    }

    // Convert hand position (0-1) to screen/3D space estimate
    // Hand x: 0 (left) to 1 (right)
    // Hand y: 0 (top) to 1 (bottom)

    // Map to approximate 3D world space
    // Assuming camera looking at origin from [0, 9, 20]
    // Map normalized hand position to approximate world coordinates used by chaos positions
    const handWorldX = (handPosition.x - 0.5) * 16; // -8 to +8 maps to chaos radius
    const handWorldY = 6 - handPosition.y * 12; // top -> near 6, bottom -> near -6

    // Find closest photo
    let closestIndex = -1;
    let minDistance = Infinity;

    mediaData.forEach((data, i) => {
      const pos = data.chaosPos;
      // Calculate 2D distance (ignore Z for simplicity)
      const dx = pos.x - handWorldX;
      const dy = pos.y - handWorldY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    // Only hover if within reasonable distance (threshold: ~3.5 units)
    if (minDistance < 3.5 && closestIndex !== -1) {
      setHoveredMediaIndex(closestIndex);
      if (onHoveredMediaChange) {
        onHoveredMediaChange(mediaFiles[closestIndex]);
      }
    } else {
      setHoveredMediaIndex(null);
      if (onHoveredMediaChange) onHoveredMediaChange(null);
    }
  }, [handPosition, mode, mediaData, mediaFiles, onHoveredMediaChange]);

  // Click handler for polaroid items
  const handlePolaroidClick = (media: MediaFile) => {
    if (onClosestMediaChange) {
      onClosestMediaChange(media);
    }
  };

  return (
    <group ref={groupRef}>
      {mediaData.map((data, i) => (
        <PolaroidItem
          key={i}
          index={i}
          data={data}
          mode={mode}
          onClick={() => handlePolaroidClick(data.media)}
          isHovered={i === hoveredMediaIndex}
        />
      ))}
    </group>
  );
};
