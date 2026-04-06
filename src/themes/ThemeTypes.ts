export interface TileVisual {
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void;
  emissiveColor?: [number, number, number];
}

export interface LevelTheme {
  name: string;
  skyColor: [number, number, number, number];   // RGBA 0–1
  groundColor: [number, number, number];         // RGB 0–1
  platformColor: [number, number, number];       // RGB 0–1
  tileHeights: Record<number, number>;
  tiles: {
    unclaimed: TileVisual;
    claimed: TileVisual;
    trail: TileVisual;
    edge: TileVisual;
  };
}
