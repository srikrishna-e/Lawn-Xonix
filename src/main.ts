import {
  Engine, Scene, ArcRotateCamera,
  HemisphericLight, DirectionalLight, ShadowGenerator,
  Vector3, Color3, Color4,
} from "@babylonjs/core";
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from "./game/GameConfig";
import { LevelManager } from "./game/LevelManager";
import { ScoreManager, SCORE_VALUES } from "./game/ScoreManager";
import { Grid } from "./core/Grid";
import { Trail } from "./core/Trail";
import { GridRenderer } from "./rendering/GridRenderer";
import { Mower } from "./entities/Mower";
import { Rabbit } from "./entities/Rabbit";

// ── Constants ────────────────────────────────────────────────
const TOTAL_LIVES  = 3;
const DEATH_FREEZE = 1200; // ms

// ── Level manager & score ────────────────────────────────────
const levelManager = new LevelManager();
const scoreManager = new ScoreManager();

// ── DOM refs ─────────────────────────────────────────────────
const $ = (id: string) => document.getElementById(id)!;
const hud                 = $("hud")                as HTMLDivElement;
const hudLives            = $("hudLives")           as HTMLSpanElement;
const hudPercent          = $("hudPercent")         as HTMLSpanElement;
const hudTimer            = $("hudTimer")           as HTMLSpanElement;
const menuScreen          = $("menuScreen")         as HTMLDivElement;
const levelSelectModal    = $("levelSelectModal")   as HTMLDivElement;
const levelGrid           = $("levelGrid")          as HTMLDivElement;
const pauseScreen         = $("pauseScreen")        as HTMLDivElement;
const levelCompleteScreen = $("levelCompleteScreen")as HTMLDivElement;
const timeUpScreen        = $("timeUpScreen")       as HTMLDivElement;
const gameOverScreen      = $("gameOverScreen")     as HTMLDivElement;
const gameCompleteScreen  = $("gameCompleteScreen") as HTMLDivElement;
const howToPlayModal      = $("howToPlayModal")     as HTMLDivElement;
const hudScore            = $("hudScore")           as HTMLSpanElement;
const lcPercent           = $("lcPercent")          as HTMLDivElement;
const lcTime              = $("lcTime")             as HTMLDivElement;
const lcScore             = $("lcScore")            as HTMLDivElement;
const lcTotal             = $("lcTotal")            as HTMLDivElement;
const btnNextLevel        = $("btnNextLevel")       as HTMLButtonElement;

// ── Game state ───────────────────────────────────────────────
type Phase = "menu" | "playing" | "paused" | "dead" | "levelComplete" | "timeUp" | "gameOver" | "gameComplete";
let phase: Phase = "menu";
let lives    = TOTAL_LIVES;
let timeLeft = 0;
let isDead   = false;

// ── Babylon setup ────────────────────────────────────────────
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene  = new Scene(engine);
scene.clearColor = new Color4(0.5, 0.72, 0.85, 1); // default sky blue

const gridSpan = Math.max(GRID_COLS, GRID_ROWS) * TILE_SIZE;
const camera   = new ArcRotateCamera("cam", 0, Math.PI / 4, gridSpan * 1.6, Vector3.Zero(), scene);
camera.lowerAlphaLimit = camera.upperAlphaLimit = camera.alpha;
camera.lowerBetaLimit  = camera.upperBetaLimit  = camera.beta;
camera.inputs.clear();

const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
ambient.intensity = 0.6;

const sun     = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
sun.intensity = 1.1;

const shadows = new ShadowGenerator(512, sun);
shadows.useBlurExponentialShadowMap = true;

// ── Game objects ─────────────────────────────────────────────
let grid:        Grid;
let trail:       Trail;
let renderer:    GridRenderer;
let mower:       Mower;
let rabbits:     Rabbit[] = [];

function applyTheme(): void {
  const { theme } = levelManager.current;
  const [r, g, b, a] = theme.skyColor;
  scene.clearColor = new Color4(r, g, b, a);
  const [gr, gg, gb] = theme.groundColor;
  ambient.groundColor = new Color3(gr, gg, gb);
}

function initGame(): void {
  const cfg = levelManager.current;

  // Clean up previous session
  rabbits.forEach(r => r.dispose());
  rabbits = [];
  if (renderer) renderer.dispose();
  if (mower) mower.dispose();
  applyTheme();

  grid         = new Grid(GRID_COLS, GRID_ROWS);
  trail        = new Trail();
  renderer     = new GridRenderer(scene, grid, cfg.theme);
  mower        = new Mower(scene, grid, shadows);
  rabbits  = spawnRabbits(cfg.rabbitCount, cfg.rabbitSpeed);

  lives    = TOTAL_LIVES;
  timeLeft = cfg.timerSeconds;
  isDead   = false;
  scoreManager.resetLevel();
}

function spawnRabbits(count: number, speed: number): Rabbit[] {
  const result: Rabbit[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let gx: number, gy: number;
    do {
      gx = 3 + Math.floor(Math.random() * (GRID_COLS - 6));
      gy = 3 + Math.floor(Math.random() * (GRID_ROWS - 6));
    } while (used.has(`${gx},${gy}`));
    used.add(`${gx},${gy}`);
    result.push(new Rabbit(scene, gx, gy, speed));
  }
  return result;
}

// ── HUD update ───────────────────────────────────────────────
function updateHUD(): void {
  hudLives.textContent   = "❤️".repeat(Math.max(lives, 0));
  hudPercent.textContent = `Mowed: ${grid.claimedPercent()}%`;
  hudScore.textContent   = `★ ${scoreManager.total.toLocaleString()}`;
  const secs = Math.ceil(timeLeft);
  hudTimer.textContent   = `⏱ ${secs}s`;
  hudTimer.classList.toggle("urgent", secs <= 10);
}

// ── Screen helpers ────────────────────────────────────────────
const allScreens = () => [menuScreen, pauseScreen, levelCompleteScreen, timeUpScreen, gameOverScreen, gameCompleteScreen];

function showScreen(screen: HTMLDivElement | null): void {
  allScreens().forEach(s => { s.style.display = "none"; });
  hud.style.display = "none";
  if (screen) screen.style.display = "flex";
}

function togglePause(): void {
  if (phase === "playing") {
    phase = "paused";
    pauseScreen.style.display = "flex";
  } else if (phase === "paused") {
    phase = "playing";
    pauseScreen.style.display = "none";
    canvas.focus();
  }
}

// Swatch colors matching each theme's unclaimed tile primary
const LEVEL_SWATCHES = ["#1a4a0a", "#3d1800", "#9ab8cc", "#7a5520", "#07150a"];

function buildLevelSelect(): void {
  levelGrid.innerHTML = "";
  for (let i = 0; i < levelManager.totalLevels; i++) {
    levelManager.jumpTo(i);
    const cfg = levelManager.current;
    const card = document.createElement("div");
    card.className = "level-card";
    card.innerHTML = `
      <div class="lc-num">${cfg.level}</div>
      <div class="lc-info">
        <div class="lc-name">${cfg.theme.name}</div>
        <div class="lc-detail">${cfg.rabbitCount} rabbits · ${cfg.timerSeconds}s · ${cfg.winPercent}% to win</div>
      </div>
      <div class="lc-swatch" style="background:${LEVEL_SWATCHES[i]}"></div>
    `;
    const idx = i;
    card.addEventListener("click", () => {
      levelManager.jumpTo(idx);
      levelSelectModal.style.display = "none";
      startPlaying();
    });
    levelGrid.appendChild(card);
  }
  levelManager.reset();
}

function startPlaying(): void {
  initGame();
  showScreen(null);
  hud.style.display = "flex";
  canvas.focus();
  phase = "playing";
}

function showLevelComplete(): void {
  phase = "levelComplete";
  hud.style.display = "none";

  const pct = grid.claimedPercent();
  const timeBonus   = scoreManager.addTimeBonus(timeLeft);
  const sweepBonus  = pct >= SCORE_VALUES.CLEAN_SWEEP_THRESHOLD
    ? scoreManager.addCleanSweepBonus() : 0;

  lcPercent.textContent = `Mowed: ${pct}%`;
  lcTime.textContent    = `Time left: ${Math.ceil(timeLeft)}s  (+${timeBonus.toLocaleString()} pts)`;
  lcScore.textContent   = sweepBonus > 0
    ? `Clean sweep! +${sweepBonus.toLocaleString()} bonus`
    : `Level score: ${scoreManager.levelScore.toLocaleString()}`;
  lcTotal.textContent   = `Total: ${scoreManager.total.toLocaleString()}`;

  btnNextLevel.style.display = levelManager.isLastLevel ? "none" : "";
  levelCompleteScreen.style.display = "flex";
}

function advanceLevel(): void {
  if (levelManager.advance()) {
    startPlaying();
  } else {
    showGameComplete();
  }
}

function showGameComplete(): void {
  phase = "gameComplete";
  showScreen(gameCompleteScreen);
}

function showTimeUp(): void {
  phase = "timeUp";
  trail.cancel(grid, renderer);
  hud.style.display = "none";
  timeUpScreen.style.display = "flex";
}

function showGameOver(): void {
  phase = "gameOver";
  hud.style.display = "none";
  gameOverScreen.style.display = "flex";
}

function returnToMenu(): void {
  levelManager.reset();
  scoreManager.reset();
  phase = "menu";
  showScreen(menuScreen);
}

// ── Death ────────────────────────────────────────────────────
function triggerDeath(): void {
  if (isDead) return;
  isDead = true;
  lives--;
  scene.clearColor = new Color4(0.8, 0.1, 0.1, 1);
  trail.cancel(grid, renderer);
  updateHUD();

  if (lives <= 0) {
    setTimeout(() => {
      applyTheme();
      showGameOver();
    }, DEATH_FREEZE);
    return;
  }

  setTimeout(() => {
    applyTheme();
    mower.respawn();
    isDead = false;
    phase = "playing";
  }, DEATH_FREEZE);
}

// ── Button wiring ─────────────────────────────────────────────
$("btnStart")          .addEventListener("click", startPlaying);
$("btnNextLevel")      .addEventListener("click", advanceLevel);
$("btnMenu")           .addEventListener("click", returnToMenu);
$("btnRetry")          .addEventListener("click", startPlaying);
$("btnMenuTimeUp")     .addEventListener("click", returnToMenu);
$("btnMenuGameOver")   .addEventListener("click", returnToMenu);
$("btnMenuGameComplete").addEventListener("click", returnToMenu);
$("btnResume")         .addEventListener("click", togglePause);
$("btnMenuPause")      .addEventListener("click", returnToMenu);
$("btnHowToPlay")         .addEventListener("click", () => { howToPlayModal.style.display = "flex"; });
$("btnCloseHowTo")        .addEventListener("click", () => { howToPlayModal.style.display = "none"; });
$("btnLevels")            .addEventListener("click", () => { buildLevelSelect(); levelSelectModal.style.display = "flex"; });
$("btnCloseLevelSelect")  .addEventListener("click", () => { levelSelectModal.style.display = "none"; });

// ── Keyboard ──────────────────────────────────────────────────
const keys = new Set<string>();
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    togglePause();
    return;
  }
  if (phase === "menu" && (e.code === "Enter" || e.code === "Space")) {
    startPlaying();
    return;
  }
  keys.add(e.code);
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

// ── Initial menu state ────────────────────────────────────────
applyTheme();   // set sky color on first load
showScreen(menuScreen);

// ── Render loop ───────────────────────────────────────────────
engine.runRenderLoop(() => {
  const dt = engine.getDeltaTime() / 1000;

  if (phase === "playing" && !isDead) {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      showTimeUp();
    }

    const rabbitPositions = rabbits.map(r => r.getGridPos());
    const tilesClaimed = mower.update(dt, keys, trail, renderer, rabbitPositions);
    if (tilesClaimed > 0) scoreManager.addTilesClaimed(tilesClaimed);

    const prevRabbitCount = rabbits.length;
    rabbits = rabbits.filter(r => {
      if (r.isEnclosed(grid)) { r.dispose(); return false; }
      return true;
    });
    const rabbitsEnclosed = prevRabbitCount - rabbits.length;
    if (rabbitsEnclosed > 0) scoreManager.addRabbitsEnclosed(rabbitsEnclosed);

    for (const rabbit of rabbits) {
      if (rabbit.update(dt, grid, trail)) {
        triggerDeath();
        break;
      }
    }

    if (grid.claimedPercent() >= levelManager.current.winPercent) {
      showLevelComplete();
    }

    updateHUD();
  }

  scene.render();
});

window.addEventListener("resize", () => engine.resize());
