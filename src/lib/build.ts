import { KIT_BY_ID } from '@/world/buildKit';

/** The lot is a fixed grid of cells; one cell is one world unit. */
export const GRID_W = 14;
export const GRID_D = 18;

/** Starting spend, in $ISLAND. Materials are what the token is for. */
export const START_BUDGET = 6000;

export interface Brand {
  /** Token or business name shown large. */
  name: string;
  /** Ticker or strapline underneath. */
  ticker: string;
  /** Stands in for a logo until real uploads exist. */
  emoji: string;
  /** Background colour of the panel. */
  color: string;
}

export interface Placed {
  uid: string;
  kitId: string;
  /** Grid cell of the piece's top-left corner. */
  x: number;
  z: number;
  /** Quarter turns clockwise, 0-3. */
  rot: number;
  brand?: Brand;
}

export interface LotState {
  lotId: string;
  items: Placed[];
}

export const DEFAULT_BRAND: Brand = {
  name: 'YOUR TOKEN',
  ticker: '$TICKER',
  emoji: '🌴',
  color: '#0b5f8f',
};

export const BRAND_COLORS = [
  '#0b5f8f',
  '#14b7e0',
  '#19905a',
  '#ff7258',
  '#ffb020',
  '#6b4fd8',
  '#0f172a',
];

/** Footprint of a piece after rotation. */
export function footprint(kitId: string, rot: number): [number, number] {
  const size = KIT_BY_ID[kitId]?.size ?? [1, 1];
  return rot % 2 === 0 ? [size[0], size[1]] : [size[1], size[0]];
}

export function cellsOf(p: Placed): string[] {
  const [w, d] = footprint(p.kitId, p.rot);
  const out: string[] = [];
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < d; j++) out.push(`${p.x + i},${p.z + j}`);
  }
  return out;
}

export function inBounds(p: Placed): boolean {
  const [w, d] = footprint(p.kitId, p.rot);
  return p.x >= 0 && p.z >= 0 && p.x + w <= GRID_W && p.z + d <= GRID_D;
}

/** True when a piece can sit here without overlapping anything else. */
export function canPlace(items: Placed[], candidate: Placed): boolean {
  if (!inBounds(candidate)) return false;
  const taken = new Set(
    items.filter((i) => i.uid !== candidate.uid).flatMap(cellsOf),
  );
  return cellsOf(candidate).every((c) => !taken.has(c));
}

export function spentOf(items: Placed[]): number {
  return items.reduce((n, i) => n + (KIT_BY_ID[i.kitId]?.cost ?? 0), 0);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------ persistence -- */

const KEY = 'archipelago.lot.v1';

export function loadLot(lotId: string): LotState {
  const empty: LotState = { lotId, items: [] };
  try {
    const raw = localStorage.getItem(`${KEY}.${lotId}`);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as LotState;
    if (!parsed || !Array.isArray(parsed.items)) return empty;
    // Drop anything referencing a kit piece that no longer exists.
    return { lotId, items: parsed.items.filter((i) => KIT_BY_ID[i.kitId]) };
  } catch {
    return empty;
  }
}

export function saveLot(state: LotState): boolean {
  try {
    localStorage.setItem(`${KEY}.${state.lotId}`, JSON.stringify(state));
    return true;
  } catch {
    // Private windows and blocked storage both land here; the build still
    // works for this session, it just will not survive a reload.
    return false;
  }
}

/* ---------------------------------------------------------- sign artwork -- */

/**
 * Draws a brand panel to a canvas so billboards, signs and neon can carry a
 * token or business identity. Replace with real logo uploads later.
 */
export function drawBrandPanel(brand: Brand, w = 512, h = 288): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = brand.color;
  ctx.fillRect(0, 0, w, h);

  // Soft highlight so the panel is not a flat rectangle.
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, 'rgba(255,255,255,0.22)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `${Math.round(h * 0.3)}px system-ui, sans-serif`;
  ctx.fillText(brand.emoji, w / 2, h * 0.3);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(h * 0.17)}px system-ui, sans-serif`;
  const name = brand.name.slice(0, 18).toUpperCase();
  ctx.fillText(name, w / 2, h * 0.58);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = `700 ${Math.round(h * 0.1)}px system-ui, sans-serif`;
  ctx.fillText(brand.ticker.slice(0, 16).toUpperCase(), w / 2, h * 0.78);

  return c;
}
