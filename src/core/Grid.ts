export enum TileState {
  UNCLAIMED = 0,
  CLAIMED = 1,
  TRAIL = 2,
  EDGE = 3,
}

export class Grid {
  readonly cols: number;
  readonly rows: number;
  private cells: TileState[][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.cells = [];
    for (let y = 0; y < rows; y++) {
      this.cells[y] = [];
      for (let x = 0; x < cols; x++) {
        const isBorder = x === 0 || x === cols - 1 || y === 0 || y === rows - 1;
        this.cells[y]![x] = isBorder ? TileState.EDGE : TileState.UNCLAIMED;
      }
    }
  }

  get(x: number, y: number): TileState {
    return this.cells[y]![x]!;
  }

  set(x: number, y: number, state: TileState): void {
    this.cells[y]![x] = state;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  isSafe(x: number, y: number): boolean {
    const s = this.get(x, y);
    return s === TileState.CLAIMED || s === TileState.EDGE;
  }

  claimedPercent(): number {
    const interior = (this.cols - 2) * (this.rows - 2);
    let claimed = 0;
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.cells[y]![x] === TileState.CLAIMED) claimed++;
      }
    }
    return Math.floor((claimed / interior) * 100);
  }
}
