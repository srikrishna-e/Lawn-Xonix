import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ShadowGenerator,
  Mesh,
  TransformNode,
} from "@babylonjs/core";
import { Grid, TileState } from "../core/Grid";
import { Trail } from "../core/Trail";
import { GridRenderer } from "../rendering/GridRenderer";
import { PLAYER_MOVE_DURATION, TILE_HEIGHTS } from "../game/GameConfig";
import { gridToWorld } from "../utils/MathUtils";
import { DEFAULT_MOWER } from "../components/MowerAppearance";

const MOWER_Y = TILE_HEIGHTS[0] ?? 0.55; // sit on top of tallest grass

function makeMat(name: string, scene: Scene, r: number, g: number, b: number): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = new Color3(r, g, b);
  return mat;
}

export class Mower {
  readonly root: TransformNode;

  private gridX: number;
  private gridY: number;
  private targetX: number;
  private targetY: number;
  private moveTimer = 0;
  private isMoving = false;
  private targetRotY = 0;  // radians, Y-axis rotation to face movement direction

  // ── Intro / respawn walk state ─────────────────────────────────────────────
  private introWalking    = false;
  private introPath:       { x: number; z: number }[] = [];
  private introPathIdx     = 0;
  private introSpeed       = 0;
  private introOnComplete: (() => void) | null = null;

  constructor(scene: Scene, private grid: Grid, shadows: ShadowGenerator) {
    this.root = new TransformNode("mowerRoot", scene);
    const { deckColor, bodyColor, handleColor, wheelColor } = DEFAULT_MOWER;

    // --- Blade deck (wide flat base) ---
    const deck = MeshBuilder.CreateBox("deck", { width: 0.82, height: 0.08, depth: 0.82 }, scene);
    deck.material = makeMat("deckMat", scene, ...deckColor);
    deck.position.y = 0.04;
    deck.parent = this.root;
    shadows.addShadowCaster(deck);

    // --- Body / engine housing ---
    const body = MeshBuilder.CreateBox("body", { width: 0.52, height: 0.22, depth: 0.52 }, scene);
    body.material = makeMat("bodyMat", scene, ...bodyColor);
    body.position.y = 0.19;
    body.parent = this.root;
    shadows.addShadowCaster(body);

    // --- Fuel cap (small box on top) ---
    const cap = MeshBuilder.CreateBox("cap", { width: 0.14, height: 0.08, depth: 0.14 }, scene);
    cap.material = makeMat("capMat", scene, ...deckColor);
    cap.position.set(0.1, 0.34, -0.1);
    cap.parent = this.root;

    // --- Handle bar post (left & right) ---
    for (const side of [-1, 1]) {
      const post = MeshBuilder.CreateBox(`post${side}`, { width: 0.04, height: 0.4, depth: 0.04 }, scene);
      post.material = makeMat("handleMat", scene, ...handleColor);
      post.position.set(side * 0.2, 0.4, 0.32);
      post.rotation.x = Math.PI / 6; // lean back
      post.parent = this.root;
      shadows.addShadowCaster(post);
    }

    // --- Handle crossbar ---
    const crossbar = MeshBuilder.CreateBox("crossbar", { width: 0.52, height: 0.04, depth: 0.04 }, scene);
    crossbar.material = makeMat("handleMat2", scene, ...handleColor);
    crossbar.position.set(0, 0.6, 0.46);
    crossbar.parent = this.root;

    // --- 4 Wheels ---
    const wheelPositions = [
      { x: -0.34, z: -0.34 },
      { x:  0.34, z: -0.34 },
      { x: -0.34, z:  0.34 },
      { x:  0.34, z:  0.34 },
    ];
    for (let i = 0; i < wheelPositions.length; i++) {
      const w = wheelPositions[i]!;
      const wheel = MeshBuilder.CreateCylinder(`wheel${i}`, { diameter: 0.2, height: 0.1, tessellation: 12 }, scene);
      wheel.material = makeMat(`wheelMat${i}`, scene, ...wheelColor);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(w.x, 0.06, w.z);
      wheel.parent = this.root;
      shadows.addShadowCaster(wheel);
    }

    // Scale up so mower is clearly visible on the grid
    this.root.scaling.setAll(1.8);

    // Starting position: near EDGE border (user's side), middle column
    this.gridX = grid.cols - 1;
    this.gridY = Math.floor(grid.rows / 2);
    this.targetX = this.gridX;
    this.targetY = this.gridY;
    this.applyWorldPosition(this.gridX, this.gridY);
  }

  private applyWorldPosition(gx: number, gy: number): void {
    const { x, z } = gridToWorld(gx, gy);
    this.root.position.set(x, MOWER_Y, z);
  }

  // ── Intro walk API ──────────────────────────────────────────────────────────

  /**
   * Move the mower along a sequence of world-space waypoints at `speed` units/s.
   * `onComplete` fires once the last waypoint is reached.
   */
  startIntroWalk(
    path: { x: number; z: number }[],
    speed: number,
    onComplete: () => void,
  ): void {
    this.introPath       = path;
    this.introPathIdx    = 0;
    this.introSpeed      = speed;
    this.introOnComplete = onComplete;
    this.introWalking    = true;
  }

  cancelIntroWalk(): void {
    this.introWalking    = false;
    this.introOnComplete = null;
  }

  /** Teleport root mesh to an arbitrary world position (no grid sync). */
  teleportToWorld(x: number, y: number, z: number): void {
    this.root.position.set(x, y, z);
    // Cancel any grid move that was in progress so onArrival() is never
    // called on a stale grid position (which would stamp a spurious TRAIL tile).
    this.isMoving     = false;
    this.introWalking = false;
    this.introOnComplete = null;
  }

  private updateIntroWalk(dt: number): void {
    if (this.introPathIdx >= this.introPath.length) {
      this.introWalking = false;
      const cb = this.introOnComplete;
      this.introOnComplete = null;
      cb?.();
      return;
    }

    const target = this.introPath[this.introPathIdx]!;
    const dx   = target.x - this.root.position.x;
    const dz   = target.z - this.root.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const step = this.introSpeed * dt;

    if (dist < 0.001 || step >= dist) {
      // Snap to waypoint and advance
      this.root.position.x = target.x;
      this.root.position.z = target.z;
      this.introPathIdx++;
      if (this.introPathIdx >= this.introPath.length) {
        this.introWalking = false;
        const cb = this.introOnComplete;
        this.introOnComplete = null;
        cb?.();
      }
    } else {
      const nx = dx / dist;
      const nz = dz / dist;
      this.root.position.x += nx * step;
      this.root.position.z += nz * step;
      // Face direction of travel.
      // rotation.y=0 → faces -Z; formula: atan2(-nx, -nz)
      const targetRot = Math.atan2(-nx, -nz);
      this.root.rotation.y = lerpAngle(this.root.rotation.y, targetRot, Math.min(dt * 12, 1));
    }
  }

  // ── Normal update ────────────────────────────────────────────────────────────

  /** Returns the number of tiles claimed this frame (>0 when a trail closes). */
  update(dt: number, keys: Set<string>, trail: Trail, renderer: GridRenderer, rabbitPositions: { gx: number; gy: number }[] = []): number {
    // Intro / respawn walk overrides normal input
    if (this.introWalking) {
      this.updateIntroWalk(dt);
      return 0;
    }
    if (this.isMoving) {
      this.moveTimer += dt;
      const t = Math.min(this.moveTimer / PLAYER_MOVE_DURATION, 1);

      const from = gridToWorld(this.gridX, this.gridY);
      const to = gridToWorld(this.targetX, this.targetY);
      this.root.position.x = from.x + (to.x - from.x) * t;
      this.root.position.y = MOWER_Y;
      this.root.position.z = from.z + (to.z - from.z) * t;

      // Smoothly rotate toward target direction
      this.root.rotation.y = lerpAngle(this.root.rotation.y, this.targetRotY, Math.min(dt * 20, 1));

      if (t >= 1) {
        this.isMoving = false;
        this.gridX = this.targetX;
        this.gridY = this.targetY;
        this.root.rotation.y = this.targetRotY; // snap to final angle
        return this.onArrival(trail, renderer, rabbitPositions);
      }
      return 0;
    }

    let dx = 0, dy = 0;
    if (keys.has("ArrowUp")         || keys.has("KeyW")) dx = -1;
    else if (keys.has("ArrowDown")  || keys.has("KeyS")) dx = 1;
    else if (keys.has("ArrowLeft")  || keys.has("KeyA")) dy = -1;
    else if (keys.has("ArrowRight") || keys.has("KeyD")) dy = 1;

    if (dx !== 0 || dy !== 0) {
      const nx = this.gridX + dx;
      const ny = this.gridY + dy;
      if (this.grid.isInBounds(nx, ny)) {
        this.targetX = nx;
        this.targetY = ny;
        this.moveTimer = 0;
        this.isMoving = true;
        if (dx === -1) this.targetRotY = Math.PI / 2;
        else if (dx === 1) this.targetRotY = -Math.PI / 2;
        else if (dy === -1) this.targetRotY = 0;
        else if (dy === 1) this.targetRotY = Math.PI;
      }
    }
    return 0;
  }

  private onArrival(trail: Trail, renderer: GridRenderer, rabbitPositions: { gx: number; gy: number }[] = []): number {
    const state = this.grid.get(this.gridX, this.gridY);
    const isSafe = state === TileState.CLAIMED || state === TileState.EDGE;

    if (trail.isActive) {
      if (isSafe) {
        return trail.close(this.grid, renderer, rabbitPositions);
      } else if (state === TileState.TRAIL) {
        trail.cancel(this.grid, renderer);
      } else {
        trail.extend(this.gridX, this.gridY, this.grid, renderer);
      }
    } else {
      if (state === TileState.UNCLAIMED) {
        trail.start(this.gridX, this.gridY, this.grid, renderer);
      }
    }
    return 0;
  }

  /** Instantly hide all mower meshes (survives TransformNode setEnabled quirks). */
  hide(): void {
    this.root.getChildMeshes().forEach(m => { m.isVisible = false; });
  }

  /** Make all mower meshes visible again. */
  show(): void {
    this.root.getChildMeshes().forEach(m => { m.isVisible = true; });
  }

  dispose(): void {
    this.root.dispose();
  }

  respawn(): void {
    this.gridX = this.grid.cols - 1;
    this.gridY = Math.floor(this.grid.rows / 2);
    this.targetX = this.gridX;
    this.targetY = this.gridY;
    this.isMoving = false;
    this.applyWorldPosition(this.gridX, this.gridY);
  }

  get currentGridX(): number { return this.gridX; }
  get currentGridY(): number { return this.gridY; }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
}
