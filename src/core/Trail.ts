import { Grid, TileState } from "./Grid";
import { GridRenderer } from "../rendering/GridRenderer";

export class Trail {
  private cells: { x: number; y: number }[] = [];
  private cellSet = new Set<string>();
  isActive = false;

  start(x: number, y: number, grid: Grid, renderer: GridRenderer): void {
    this.cells = [{ x, y }];
    this.cellSet = new Set([`${x},${y}`]);
    this.isActive = true;
    grid.set(x, y, TileState.TRAIL);
    renderer.updateTile(x, y);
  }

  extend(x: number, y: number, grid: Grid, renderer: GridRenderer): void {
    this.cells.push({ x, y });
    this.cellSet.add(`${x},${y}`);
    grid.set(x, y, TileState.TRAIL);
    renderer.updateTile(x, y);
  }

  isOnTrail(x: number, y: number): boolean {
    return this.cellSet.has(`${x},${y}`);
  }

  /** Returns the number of tiles newly claimed (trail + flood fill). */
  close(grid: Grid, renderer: GridRenderer, rabbitPositions: { gx: number; gy: number }[] = []): number {
    let claimed = this.cells.length;
    for (const { x, y } of this.cells) {
      grid.set(x, y, TileState.CLAIMED);
      renderer.updateTile(x, y);
    }
    claimed += floodFill(grid, renderer, rabbitPositions);
    this.clear();
    return claimed;
  }

  cancel(grid: Grid, renderer: GridRenderer): void {
    for (const { x, y } of this.cells) {
      grid.set(x, y, TileState.UNCLAIMED);
      renderer.updateTile(x, y);
    }
    this.clear();
  }

  private clear(): void {
    this.cells = [];
    this.cellSet.clear();
    this.isActive = false;
  }
}

/** Returns number of tiles claimed by flood fill. */
function floodFill(grid: Grid, renderer: GridRenderer, rabbitPositions: { gx: number; gy: number }[] = []): number {
  const { cols, rows } = grid;
  const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
  const assigned = new Set<string>();
  const components: Set<string>[] = [];

  // Find all connected UNCLAIMED regions (CLAIMED/EDGE/TRAIL are walls)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      if (grid.get(x, y) !== TileState.UNCLAIMED || assigned.has(key)) continue;

      const component = new Set<string>();
      const q: { x: number; y: number }[] = [{ x, y }];
      component.add(key);
      assigned.add(key);

      let head = 0;
      while (head < q.length) {
        const { x: cx, y: cy } = q[head++]!;
        for (const { dx, dy } of dirs) {
          const nx = cx + dx, ny = cy + dy;
          const nk = `${nx},${ny}`;
          if (grid.isInBounds(nx, ny) && grid.get(nx, ny) === TileState.UNCLAIMED && !component.has(nk)) {
            component.add(nk);
            assigned.add(nk);
            q.push({ x: nx, y: ny });
          }
        }
      }
      components.push(component);
    }
  }

  if (components.length <= 1) return 0; // nothing to claim

  // Build a set of rabbit position keys for fast lookup
  const rabbitKeys = new Set(rabbitPositions.map(({ gx, gy }) => `${gx},${gy}`));

  // Determine which components to keep (contain a rabbit) vs claim (no rabbit)
  const hasRabbits = components.map(c => [...rabbitKeys].some(k => c.has(k)));
  const anyRabbitFound = hasRabbits.some(Boolean);

  // Fallback: if no component contains a rabbit, keep the largest (original behavior)
  let keepFn: (i: number) => boolean;
  if (anyRabbitFound) {
    keepFn = (i) => hasRabbits[i]!;
  } else {
    let maxIdx = 0;
    for (let i = 1; i < components.length; i++) {
      if (components[i]!.size > components[maxIdx]!.size) maxIdx = i;
    }
    keepFn = (i) => i === maxIdx;
  }

  let count = 0;
  for (let i = 0; i < components.length; i++) {
    if (keepFn(i)) continue;
    for (const k of components[i]!) {
      const comma = k.indexOf(',');
      const x = parseInt(k.slice(0, comma), 10);
      const y = parseInt(k.slice(comma + 1), 10);
      grid.set(x, y, TileState.CLAIMED);
      renderer.updateTile(x, y);
      count++;
    }
  }
  return count;
}
