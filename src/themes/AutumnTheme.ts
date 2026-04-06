import { LevelTheme } from "./ThemeTypes";

// Level 2 — Autumn Garden: warm oranges, browns, fallen leaves

function drawUnclaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#3d1800";
  ctx.fillRect(0, 0, size, size);
  // Leaf litter strokes
  for (let i = 0; i < 55; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.floor(160 + Math.random() * 80);
    const g = Math.floor(40 + Math.random() * 60);
    ctx.strokeStyle = `rgb(${r},${g},0)`;
    ctx.lineWidth = 1.5 + Math.random();
    const w = size * (0.08 + Math.random() * 0.12);
    const h = size * (0.04 + Math.random() * 0.06);
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawClaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#7a3a10";
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row++) {
    const y = row * (size / 4);
    ctx.fillStyle = row % 2 === 0 ? "rgba(0,0,0,0.08)" : "rgba(255,200,100,0.06)";
    ctx.fillRect(0, y, size, size / 4);
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${Math.floor(180 + Math.random() * 60)},${Math.floor(80 + Math.random() * 40)},0,0.25)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#1e0800";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${Math.floor(80 + Math.random() * 60)},${Math.floor(20 + Math.random() * 20)},0,0.5)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#5c2800";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.floor(180 + Math.random() * 60);
    const g = Math.floor(60 + Math.random() * 40);
    ctx.strokeStyle = `rgba(${r},${g},0,0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.12);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export const AutumnTheme: LevelTheme = {
  name: "Autumn Garden",
  skyColor: [0.75, 0.5, 0.25, 1],
  groundColor: [0.06, 0.03, 0.01],
  platformColor: [0.3, 0.14, 0.05],
  tileHeights: { 0: 0.55, 1: 0.12, 2: 0.06, 3: 0.30 },
  tiles: {
    unclaimed: { drawFn: drawUnclaimed },
    claimed:   { drawFn: drawClaimed },
    trail:     { drawFn: drawTrail, emissiveColor: [0.1, 0.04, 0.0] },
    edge:      { drawFn: drawEdge },
  },
};
