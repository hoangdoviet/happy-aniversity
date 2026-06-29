export enum SceneState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

/** @deprecated Use SceneState instead */
export enum TreeMode {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface MonthConfig {
  month: number; // 1–12
  title: string;
  description: string;
  photos: string[];   // filenames relative to /public/photos/
  videos: string[];   // filenames relative to /public/videos/
  music: string | null; // filename relative to /public/music/
}

export interface AnniversaryConfig {
  coupleNames: string;
  months: MonthConfig[];
  heartMusic: string | null;
  globalMusic?: string[];
}

export interface HandPositionData {
  x: number;
  y: number;
  detected: boolean;
}

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface ParticleData {
  chaosPos: [number, number, number];
  formedPos: [number, number, number];
  speed: number;
  color: string;
}
