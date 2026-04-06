import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
  Mesh,
} from "@babylonjs/core";
import { smoothstep } from "../utils/MathUtils";

// ── Layout constants ──────────────────────────────────────────────────────────
// Platform right edge is at world x ≈ 20.  Gate sits just past the edge.
const GATE_X      = 22;
const GATE_Z      = 0.5;   // centred on the mower's start Z (row 14)
const BARN_CX     = 27;    // barn centre X
const BARN_CZ     = GATE_Z;

/** World position where the mower spawns for the intro walk (just inside barn). */
export const BARN_SPAWN_X  = 25.5;
export const BARN_SPAWN_Z  = GATE_Z;

/** World X of the gate-approach waypoint (mower stops here while gate opens). */
export const GATE_APPROACH_X = 22.5;

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function hexMat(name: string, scene: Scene, hex: string, emissive = 0): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  mat.diffuseColor  = new Color3(r, g, b);
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  if (emissive > 0) mat.emissiveColor = new Color3(r * emissive, g * emissive, b * emissive);
  return mat;
}

interface AnimState {
  active:    boolean;
  timer:     number;
  duration:  number;
  from:      number;
  to:        number;
  onComplete?: () => void;
}

function freshAnim(): AnimState {
  return { active: false, timer: 0, duration: 1, from: 0, to: 0 };
}

// ── BarnScene ─────────────────────────────────────────────────────────────────
export class BarnScene {
  private barnRoot: TransformNode;

  /** Pivot nodes for the two gate panels (children of barnRoot). */
  private gatePivotL: TransformNode;
  private gatePivotR: TransformNode;

  private allMeshes: Mesh[] = [];

  private slideAnim: AnimState = freshAnim();
  private gateAnim:  AnimState = freshAnim();

  constructor(private scene: Scene) {
    this.barnRoot    = new TransformNode("barnRoot", scene);
    this.gatePivotL  = new TransformNode("gatePivotL", scene);
    this.gatePivotR  = new TransformNode("gatePivotR", scene);
    this.gatePivotL.parent = this.barnRoot;
    this.gatePivotR.parent = this.barnRoot;

    // Pivot positions are LOCAL to barnRoot (barnRoot starts at world 0,0,0)
    this.gatePivotL.position.set(GATE_X, 0, GATE_Z - 1.0);   // left post hinge  (z ≈ -0.5)
    this.gatePivotR.position.set(GATE_X, 0, GATE_Z + 1.0);   // right post hinge (z ≈  1.5)

    this.buildBarn();
    this.buildBridge();
    this.buildGate();

    // Start off-screen so barn isn't visible during menu
    this.barnRoot.position.x = 50;
  }

  // ── Mesh builders ───────────────────────────────────────────────────────────

  private attach(m: Mesh): void {
    m.parent = this.barnRoot;
    m.receiveShadows = true;
    this.allMeshes.push(m);
  }

  private buildBarn(): void {
    const wallMat  = hexMat("barnWallMat",  this.scene, "#c0392b");
    const trimMat  = hexMat("barnTrimMat",  this.scene, "#922b21");
    const roofMat  = hexMat("barnRoofMat",  this.scene, "#4a2800");
    const doorMat  = hexMat("barnDoorMat",  this.scene, "#2c1a0e");
    const loftMat  = hexMat("barnLoftMat",  this.scene, "#f39c12", 0.15);

    // Main body
    const body = MeshBuilder.CreateBox("barnBody",
      { width: 5, height: 3.2, depth: 5 }, this.scene);
    body.material  = wallMat;
    body.position.set(BARN_CX, 1.6, BARN_CZ);
    this.attach(body);

    // White trim strips on corners
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const trim = MeshBuilder.CreateBox(`barnTrim${sx}${sz}`,
        { width: 0.18, height: 3.4, depth: 0.18 }, this.scene);
      trim.material = trimMat;
      trim.position.set(BARN_CX + sx * 2.41, 1.7, BARN_CZ + sz * 2.41);
      this.attach(trim);
    }

    // Roof — two slanted rectangular panels
    for (const side of [-1, 1]) {
      const panel = MeshBuilder.CreateBox("roofPanel",
        { width: 5.6, height: 0.18, depth: 2.9 }, this.scene);
      panel.material = roofMat;
      // Pivot about the ridge: tilt outward ~35°
      panel.rotation.z  = side * 0.6;
      panel.position.set(BARN_CX, 3.9 - Math.abs(side) * 0.1, BARN_CZ + side * 1.1);
      this.attach(panel);
    }

    // Ridge cap
    const ridge = MeshBuilder.CreateBox("barnRidge",
      { width: 5.6, height: 0.25, depth: 0.3 }, this.scene);
    ridge.material = roofMat;
    ridge.position.set(BARN_CX, 4.1, BARN_CZ);
    this.attach(ridge);

    // Loft window (front face)
    const loft = MeshBuilder.CreateBox("barnLoft",
      { width: 0.9, height: 0.7, depth: 0.12 }, this.scene);
    loft.material  = loftMat;
    loft.position.set(BARN_CX, 3.0, BARN_CZ - 2.47);
    this.attach(loft);

    // Door opening (dark box on the front face facing platform)
    const door = MeshBuilder.CreateBox("barnDoor",
      { width: 1.4, height: 2.2, depth: 0.12 }, this.scene);
    door.material = doorMat;
    door.position.set(BARN_CX, 1.1, BARN_CZ - 2.52);
    this.attach(door);
  }

  private buildBridge(): void {
    const plankMat = hexMat("plankMat", this.scene, "#8b6914");
    const railMat  = hexMat("railMat",  this.scene, "#6b4f10");

    // Bridge deck: spans from platform edge (x≈20) to barn entrance (x≈24.5)
    const deck = MeshBuilder.CreateBox("bridgeDeck",
      { width: 5.0, height: 0.15, depth: 2.5 }, this.scene);
    deck.material = plankMat;
    deck.position.set(22.25, -0.05, GATE_Z);
    this.attach(deck);

    // Side guard rails
    for (const side of [-1, 1]) {
      const rail = MeshBuilder.CreateBox(`rail${side}`,
        { width: 5.0, height: 0.28, depth: 0.1 }, this.scene);
      rail.material = rail.material = railMat;
      rail.position.set(22.25, 0.19, GATE_Z + side * 1.2);
      this.attach(rail);

      // Vertical balusters every ~1.2 units
      for (let bx = 0; bx < 5; bx++) {
        const bal = MeshBuilder.CreateBox(`bal${side}_${bx}`,
          { width: 0.08, height: 0.28, depth: 0.08 }, this.scene);
        bal.material = railMat;
        bal.position.set(20 + bx * 1.25, 0.19, GATE_Z + side * 1.2);
        this.attach(bal);
      }
    }
  }

  private buildGate(): void {
    const postMat  = hexMat("gatePostMat",  this.scene, "#5c3d11");
    const panelMat = hexMat("gatePanelMat", this.scene, "#a0632a");

    // Gate arch / top bar
    const arch = MeshBuilder.CreateBox("gateArch",
      { width: 0.15, height: 0.2, depth: 2.6 }, this.scene);
    arch.material = postMat;
    arch.position.set(GATE_X, 2.1, GATE_Z);
    this.attach(arch);

    // Posts (two sides)
    for (const side of [-1, 1]) {
      const post = MeshBuilder.CreateBox(`gatePost${side}`,
        { width: 0.22, height: 2.2, depth: 0.22 }, this.scene);
      post.material = postMat;
      post.position.set(GATE_X, 1.1, GATE_Z + side * 1.15);
      this.attach(post);
    }

    // ── Left panel (pivot at z = GATE_Z - 1.0 ≈ -0.5) ──────────
    //    Panel centre local to pivot: (0, 0.8, +0.5)  → extends from z=0 to z=1.0
    //    Open: pivot rotates rotation.y = -PI/2 → panel swings toward +X (barn side) ✓
    const panelL = MeshBuilder.CreateBox("gatePanelL",
      { width: 0.12, height: 1.6, depth: 1.0 }, this.scene);
    panelL.material = panelMat;
    panelL.position.set(0, 0.8, 0.5);   // local to gatePivotL
    panelL.parent = this.gatePivotL;
    this.allMeshes.push(panelL);

    // Horizontal slat details on left panel
    for (let s = 0; s < 3; s++) {
      const slat = MeshBuilder.CreateBox(`slatL${s}`,
        { width: 0.14, height: 0.08, depth: 0.95 }, this.scene);
      slat.material = postMat;
      slat.position.set(0, 0.3 + s * 0.5, 0.5);
      slat.parent = this.gatePivotL;
      this.allMeshes.push(slat);
    }

    // ── Right panel (pivot at z = GATE_Z + 1.0 ≈ 1.5) ──────────
    //    Panel centre local to pivot: (0, 0.8, -0.5)  → extends from z=0 to z=-1.0
    //    Open: pivot rotates rotation.y = +PI/2 → panel swings toward +X (barn side) ✓
    const panelR = MeshBuilder.CreateBox("gatePanelR",
      { width: 0.12, height: 1.6, depth: 1.0 }, this.scene);
    panelR.material = panelMat;
    panelR.position.set(0, 0.8, -0.5);  // local to gatePivotR
    panelR.parent = this.gatePivotR;
    this.allMeshes.push(panelR);

    for (let s = 0; s < 3; s++) {
      const slat = MeshBuilder.CreateBox(`slatR${s}`,
        { width: 0.14, height: 0.08, depth: 0.95 }, this.scene);
      slat.material = postMat;
      slat.position.set(0, 0.3 + s * 0.5, -0.5);
      slat.parent = this.gatePivotR;
      this.allMeshes.push(slat);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Reset to on-screen home position with gate closed (call before each intro). */
  reset(): void {
    this.barnRoot.position.x = 0;
    this.closeGate();
    this.slideAnim = freshAnim();
    this.gateAnim  = freshAnim();
  }

  /** Slide the entire structure off to the right (+X). */
  slideOut(duration: number, onComplete?: () => void): void {
    this.slideAnim = {
      active: true, timer: 0, duration,
      from: this.barnRoot.position.x,
      to:   this.barnRoot.position.x + 35,
      onComplete,
    };
  }

  /** Slide the barn back in from the right to home position (x=0). */
  slideIn(duration: number, onComplete?: () => void): void {
    // Make sure it starts off screen before sliding in
    if (this.barnRoot.position.x < 30) this.barnRoot.position.x = 35;
    this.slideAnim = {
      active: true, timer: 0, duration,
      from: this.barnRoot.position.x,
      to:   0,
      onComplete,
    };
  }

  /** Swing the gate panels open (left = −90°, right = +90° around Y). */
  openGate(duration: number, onComplete?: () => void): void {
    this.gateAnim = {
      active: true, timer: 0, duration,
      from: 0, to: Math.PI / 2,
      onComplete,
    };
  }

  /** Snap gate shut instantly. */
  closeGate(): void {
    this.gatePivotL.rotation.y = 0;
    this.gatePivotR.rotation.y = 0;
    this.gateAnim = freshAnim();
  }

  update(dt: number): void {
    // Slide animation
    if (this.slideAnim.active) {
      this.slideAnim.timer += dt;
      const t = smoothstep(Math.min(this.slideAnim.timer / this.slideAnim.duration, 1));
      this.barnRoot.position.x =
        this.slideAnim.from + (this.slideAnim.to - this.slideAnim.from) * t;
      if (this.slideAnim.timer >= this.slideAnim.duration) {
        this.slideAnim.active = false;
        this.slideAnim.onComplete?.();
      }
    }

    // Gate animation
    if (this.gateAnim.active) {
      this.gateAnim.timer += dt;
      const t     = smoothstep(Math.min(this.gateAnim.timer / this.gateAnim.duration, 1));
      const angle = this.gateAnim.to * t;           // 0 → PI/2
      this.gatePivotL.rotation.y = -angle;          // left  panel swings toward +X
      this.gatePivotR.rotation.y = +angle;          // right panel swings toward +X
      if (this.gateAnim.timer >= this.gateAnim.duration) {
        this.gateAnim.active = false;
        this.gateAnim.onComplete?.();
      }
    }
  }

  dispose(): void {
    this.allMeshes.forEach(m => m.dispose());
    this.barnRoot.dispose();
    this.allMeshes = [];
  }
}
