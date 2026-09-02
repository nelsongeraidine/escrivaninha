export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const;

// Zoom em passos fixos: mais previsível para o leitor e evita reflow contínuo
// do livro a cada pixel de ajuste.
export function normalizeZoom(value: number): number {
  // NaN ou Infinity caem no padrão de 100% em vez de propagar lixo pela UI.
  if (!Number.isFinite(value)) return 100;
  let best: number = ZOOM_LEVELS[0];
  for (const z of ZOOM_LEVELS) if (Math.abs(z - value) < Math.abs(best - value)) best = z;
  return best;
}

export function nextZoom(current: number): number {
  const i = ZOOM_LEVELS.indexOf(normalizeZoom(current) as (typeof ZOOM_LEVELS)[number]);
  return ZOOM_LEVELS[Math.min(i + 1, ZOOM_LEVELS.length - 1)];
}

export function prevZoom(current: number): number {
  const i = ZOOM_LEVELS.indexOf(normalizeZoom(current) as (typeof ZOOM_LEVELS)[number]);
  return ZOOM_LEVELS[Math.max(i - 1, 0)];
}
