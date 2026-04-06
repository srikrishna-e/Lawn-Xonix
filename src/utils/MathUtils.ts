import { GRID_COLS, GRID_ROWS, TILE_SIZE } from "../game/GameConfig";

export function gridToWorld(gridX: number, gridY: number): { x: number; z: number } {
  return {
    x: (gridX - GRID_COLS / 2 + 0.5) * TILE_SIZE,
    z: (gridY - GRID_ROWS / 2 + 0.5) * TILE_SIZE,
  };
}

export function worldToGrid(wx: number, wz: number): { gx: number; gy: number } {
  return {
    gx: Math.floor(wx / TILE_SIZE + GRID_COLS / 2),
    gy: Math.floor(wz / TILE_SIZE + GRID_ROWS / 2),
  };
}
