import { LevelTheme } from "./ThemeTypes";

// Exact match to the original hardcoded colors — Level 1 baseline
function drawUnclaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#1a4a0a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const baseY = size * (0.5 + Math.random() * 0.5);
    const height = size * (0.25 + Math.random() * 0.35);
    const lean = (Math.random() - 0.5) * 6;
    const shade = Math.floor(80 + Math.random() * 80);
    ctx.strokeStyle = `rgb(0,${shade},0)`;
    ctx.lineWidth = 1.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean, baseY - height * 0.6, x + lean * 1.5, baseY - height);
    ctx.stroke();
  }
}

function drawClaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#5cb832";
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row++) {
    const y = row * (size / 4);
    ctx.fillStyle = row % 2 === 0 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(0, y, size, size / 4);
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(0,${Math.floor(80 + Math.random() * 60)},0,0.3)`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#c46820";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${Math.floor(140 + Math.random() * 60)},${Math.floor(60 + Math.random() * 40)},0,0.4)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#2e7a18";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const h = size * (0.1 + Math.random() * 0.15);
    ctx.strokeStyle = `rgba(0,${Math.floor(100 + Math.random() * 60)},0,0.6)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export const GrassTheme: LevelTheme = {
  name: "Spring Lawn",
  skyColor: [0.5, 0.72, 0.85, 1],
  groundColor: [0.06, 0.05, 0.03],
  platformColor: [0.38, 0.26, 0.14],
  tileHeights: { 0: 0.55, 1: 0.12, 2: 0.06, 3: 0.30 },
  tiles: {
    unclaimed: { drawFn: drawUnclaimed },
    claimed:   { drawFn: drawClaimed },
    trail:     { drawFn: drawTrail, emissiveColor: [0.15, 0.07, 0.0] },
    edge:      { drawFn: drawEdge },
  },
};
