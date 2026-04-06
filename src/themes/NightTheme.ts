import { LevelTheme } from "./ThemeTypes";

// Level 5 — Night Garden: moonlit grass, deep purple sky

function drawUnclaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#07150a";
  ctx.fillRect(0, 0, size, size);
  // Pale moonlit grass blades
  for (let i = 0; i < 55; i++) {
    const x = Math.random() * size;
    const baseY = size * (0.5 + Math.random() * 0.5);
    const height = size * (0.25 + Math.random() * 0.35);
    const lean = (Math.random() - 0.5) * 6;
    const shade = Math.floor(60 + Math.random() * 80);
    ctx.strokeStyle = `rgba(${Math.floor(shade * 0.3)},${shade},${Math.floor(shade * 0.4)},0.8)`;
    ctx.lineWidth = 1.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean, baseY - height * 0.6, x + lean * 1.5, baseY - height);
    ctx.stroke();
  }
  // Firefly dots
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(220,255,180,${0.3 + Math.random() * 0.5})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawClaimed(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#112a14";
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row++) {
    const y = row * (size / 4);
    ctx.fillStyle = row % 2 === 0 ? "rgba(0,0,0,0.1)" : "rgba(100,200,120,0.04)";
    ctx.fillRect(0, y, size, size / 4);
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(80,${Math.floor(140 + Math.random() * 60)},90,0.3)`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#080a18";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(80,90,${Math.floor(140 + Math.random() * 60)},0.35)`;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#0d2412";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.floor(60 + Math.random() * 60);
    ctx.strokeStyle = `rgba(${Math.floor(shade * 0.3)},${shade},${Math.floor(shade * 0.5)},0.55)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.12);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export const NightTheme: LevelTheme = {
  name: "Night Garden",
  skyColor: [0.04, 0.03, 0.14, 1],
  groundColor: [0.02, 0.02, 0.06],
  platformColor: [0.08, 0.07, 0.04],
  tileHeights: { 0: 0.55, 1: 0.12, 2: 0.06, 3: 0.30 },
  tiles: {
    unclaimed: { drawFn: drawUnclaimed },
    claimed:   { drawFn: drawClaimed },
    trail:     { drawFn: drawTrail, emissiveColor: [0.04, 0.05, 0.12] },
    edge:      { drawFn: drawEdge },
  },
};
