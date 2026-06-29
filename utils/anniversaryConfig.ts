import { AnniversaryConfig, MonthConfig } from '../types';

const STORAGE_KEY = 'anniversary_v1_config';

export function defaultMonthConfig(month: number): MonthConfig {
  return {
    month,
    title: `Tháng ${month}`,
    description: '',
    photos: [],
    videos: [],
    music: null,
  };
}

export function defaultAnniversaryConfig(): AnniversaryConfig {
  return {
    coupleNames: 'Nhíp & Quỳnh Anh',
    months: Array.from({ length: 12 }, (_, i) => defaultMonthConfig(i + 1)),
    heartMusic: null,
    globalMusic: [],
  };
}

export function getConfig(): AnniversaryConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AnniversaryConfig>;
      // Ensure all 12 months exist with defaults for missing fields
      const months = Array.from({ length: 12 }, (_, i) => {
        const existing = parsed.months?.find((m) => m.month === i + 1);
        if (existing) {
          return { ...defaultMonthConfig(i + 1), ...existing };
        }
        return defaultMonthConfig(i + 1);
      });
      return {
        ...defaultAnniversaryConfig(),
        ...parsed,
        months,
        globalMusic: parsed.globalMusic || [],
      };
    }
  } catch (e) {
    console.error('Failed to load anniversary config from localStorage', e);
  }
  return defaultAnniversaryConfig();
}

export function saveConfig(config: AnniversaryConfig): void {
  // 1. Always write localStorage immediately (sync — drives same-device UI)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }

  // 2. Persist to public/config.json via dev-only endpoint (fire-and-forget)
  //    In production (Vercel), the endpoint returns 404 — silently ignored.
  fetch('/api/save-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config, null, 2),
  }).catch(() => { /* endpoint not available in production — that's expected */ });
}

export function resetConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Server config fetch ─────────────────────────────────────────────────────

/**
 * Fetch config from /public/config.json (static file, accessible to ALL devices).
 * Falls back to localStorage if the file can't be reached.
 * Also hydrates localStorage so getConfig() stays fast on same device.
 */
export async function fetchConfig(): Promise<AnniversaryConfig> {
  try {
    const res = await fetch(`/config.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const parsed = await res.json() as Partial<AnniversaryConfig>;
      const months = Array.from({ length: 12 }, (_, i) => {
        const existing = parsed.months?.find((m) => m.month === i + 1);
        return existing ? { ...defaultMonthConfig(i + 1), ...existing } : defaultMonthConfig(i + 1);
      });
      const config: AnniversaryConfig = {
        ...defaultAnniversaryConfig(),
        ...parsed,
        months,
        globalMusic: parsed.globalMusic || [],
      };
      // Hydrate localStorage cache so same-device getConfig() is consistent
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* quota */ }
      return config;
    }
  } catch (e) {
    console.warn('[fetchConfig] /config.json unavailable, falling back to localStorage:', e);
  }
  return getConfig();
}

// ── Media manifest loaders ──────────────────────────────────────────────────

export interface AvailableMedia {
  photos: string[];
  videos: string[];
  music: string[];
}

async function loadManifest(manifestPath: string): Promise<string[]> {
  try {
    // Cache-bust so the browser always fetches the latest file after an upload
    const res = await fetch(`${manifestPath}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as string[];
  } catch {
    return [];
  }
}

/** Load available media files from manifests in /public */
export async function loadAvailableMedia(): Promise<AvailableMedia> {
  const [photos, videos, music] = await Promise.all([
    loadManifest('/photos/manifest.json'),
    loadManifest('/videos/manifest.json'),
    loadManifest('/music/manifest.json'),
  ]);
  return { photos, videos, music };
}

/** Load media files for a specific month based on stored config */
export function getMonthMedia(config: AnniversaryConfig, month: number) {
  const monthCfg = config.months.find((m) => m.month === month);
  if (!monthCfg) return { photos: [], videos: [], music: null };
  return {
    photos: monthCfg.photos.map((f) => `/photos/${f}`),
    videos: monthCfg.videos.map((f) => `/videos/${f}`),
    music: monthCfg.music ? `/music/${monthCfg.music}` : null,
  };
}

export function getHeartMedia(config: AnniversaryConfig) {
  // Aggregate ALL photos and videos across all 12 months
  const photos = config.months.flatMap((m) => m.photos.map((f) => `/photos/${f}`));
  const videos = config.months.flatMap((m) => m.videos.map((f) => `/videos/${f}`));
  return {
    photos,
    videos,
    music: config.heartMusic ? `/music/${config.heartMusic}` : null,
  };
}
