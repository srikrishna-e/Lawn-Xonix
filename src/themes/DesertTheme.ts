import { LevelTheme } from "./ThemeTypes";

// Level 4 — Desert Sands: sandy dunes, terracotta, hot sky

function drawUnclaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#7a5520";
  ctx.fillRect(0, 0, size, size);
  // Sand ripple waves
  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * size + Math.random() * (size / 12);
    const shade = Math.floor(180 + Math.random() * 60);
    ctx.strokeStyle = `rgba(${shade},${Math.floor(shade * 0.7)},0,0.35)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.25, y - 4, size * 0.75, y + 4, size, y);
    ctx.stroke();
  }
  // Pebble dots
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.floor(150 + Math.random() * 80);
    ctx.fillStyle = `rgba(${r},${Math.floor(r * 0.6)},0,0.4)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawClaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#c49040";
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row++) {
    const y = row * (size / 4);
    ctx.fillStyle = row % 2 === 0 ? "rgba(0,0,0,0.07)" : "rgba(255,220,100,0.07)";
    ctx.fillRect(0, y, size, size / 4);
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${Math.floor(200 + Math.random() * 55)},${Math.floor(140 + Math.random() * 60)},0,0.3)`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#3d2000";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${Math.floor(100 + Math.random() * 60)},${Math.floor(50 + Math.random() * 30)},0,0.5)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#8b5520";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.floor(180 + Math.random() * 60);
    ctx.strokeStyle = `rgba(${r},${Math.floor(r * 0.6)},0,0.4)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.1);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export const DesertTheme: LevelTheme = {
  name: "Desert Sands",
  skyColor: [0.95, 0.82, 0.45, 1],
  groundColor: [0.12, 0.08, 0.03],
  platformColor: [0.52, 0.3, 0.1],
  tileHeights: { 0: 0.55, 1: 0.12, 2: 0.06, 3: 0.30 },
  tiles: {
    unclaimed: { drawFn: drawUnclaimed },
    claimed:   { drawFn: drawClaimed },
    trail:     { drawFn: drawTrail, emissiveColor: [0.08, 0.04, 0.0] },
    edge:      { drawFn: drawEdge },
  },
};
