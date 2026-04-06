export const GRID_COLS = 40;
export const GRID_ROWS = 28;
export const TILE_SIZE = 1;
export const TILE_GAP = 0;
export const PLAYER_MOVE_DURATION = 0.1; // seconds per tile

// Per-state tile heights (all sit on top of the platform slab)
export const TILE_HEIGHTS: Record<number, number> = {
  0: 0.55,  // UNCLAIMED — tall grass, visibly raised
  1: 0.12,  // CLAIMED   — mowed flat, noticeably lower
  2: 0.06,  // TRAIL     — almost flush, reads as a line
  3: 0.30,  // EDGE      — border trim
};

export const PLATFORM_DEPTH = 1.8; // thickness of the slab below tiles
