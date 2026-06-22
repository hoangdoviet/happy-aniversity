/**
 * Utilities for computing particle positions for 3D numbers and a 3D heart.
 * Numbers are rasterised onto an off-screen canvas and the filled pixels are
 * sampled as particle targets.  The heart is generated from a parametric
 * surface equation.
 */

// ── Number particle positions ───────────────────────────────────────────────

export function sampleNumberPositions(text: string, count: number): Float32Array {
  const W = text.length > 1 ? 420 : 300;
  const H = 300;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  const fontSize = text.length > 1 ? 210 : 260;
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);

  const imageData = ctx.getImageData(0, 0, W, H);
  const pixels: [number, number][] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (imageData.data[i] > 128) {
        pixels.push([x, y]);
      }
    }
  }

  if (pixels.length === 0) return new Float32Array(count * 3);

  const scale = 0.028; // canvas pixels → Three.js units
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const [px, py] = pixels[Math.floor(Math.random() * pixels.length)];
    positions[i * 3]     = (px - W / 2) * scale;
    positions[i * 3 + 1] = -(py - H / 2) * scale;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6; // slight Z depth
  }

  return positions;
}

// ── Heart particle positions ─────────────────────────────────────────────────

/**
 * 3-D heart parametric surface.
 * XY outline follows the classic heart curve; Z adds petal-shaped depth.
 */
export function sampleHeartPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const scale = 0.34;

  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;

    // 2-D heart outline
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    // Z depth: widest at the top lobes, tapers to tip
    const zScale = Math.sin(t) * Math.sin(t);
    const z = (Math.random() - 0.5) * zScale * 8.0;

    positions[i * 3]     = hx * scale;
    positions[i * 3 + 1] = hy * scale + 0.5; // shift up slightly to center
    positions[i * 3 + 2] = z * scale;
  }

  return positions;
}

// ── Chaos (scattered) positions ──────────────────────────────────────────────

export function createChaosPositions(count: number, radius = 18): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = (radius * 0.5) + Math.random() * radius * 0.5;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

/** Per-particle random values [0..1] for shader variation */
export function createRandomAttributes(count: number): Float32Array {
  const randoms = new Float32Array(count);
  for (let i = 0; i < count; i++) randoms[i] = Math.random();
  return randoms;
}
