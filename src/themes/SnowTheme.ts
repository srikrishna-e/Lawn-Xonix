import { LevelTheme } from "./ThemeTypes";

// Level 3 — Winter Frost: white snow, icy blues

function drawUnclaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#9ab8cc";
  ctx.fillRect(0, 0, size, size);
  // Snow drift ridges
  for (let i = 0; i < 12; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 8, size * 0.7, y + 8, size, y);
    ctx.stroke();
  }
  // Sparkle dots
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.5})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawClaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#d8ecf8";
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row++) {
    const y = row * (size / 4);
    ctx.fillStyle = row % 2 === 0 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(0, y, size, size / 4);
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(200,230,255,0.5)`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#5878a0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(180,210,240,0.4)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#7898b8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(220,240,255,0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.1);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export const SnowTheme: LevelTheme = {
  name: "Winter Frost",
  skyColor: [0.65, 0.82, 0.95, 1],
  groundColor: [0.7, 0.75, 0.82],
  platformColor: [0.28, 0.38, 0.52],
  tileHeights: { 0: 0.55, 1: 0.12, 2: 0.06, 3: 0.30 },
  tiles: {
    unclaimed: { drawFn: drawUnclaimed },
    claimed:   { drawFn: drawClaimed },
    trail:     { drawFn: drawTrail, emissiveColor: [0.05, 0.08, 0.15] },
    edge:      { drawFn: drawEdge },
  },
};
