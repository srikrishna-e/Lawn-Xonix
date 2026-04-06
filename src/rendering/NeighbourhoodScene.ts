import { Scene, MeshBuilder, StandardMaterial, Color3, Mesh } from "@babylonjs/core";
import { PLATFORM_DEPTH } from "../game/GameConfig";

const GROUND_Y = -(PLATFORM_DEPTH + 0.01); // -1.81

// Platform half-extents (world units)
const HW = 20; // half-width  (x axis)
const HD = 14; // half-depth  (z axis)

// How far outside the platform edge to start the fence
const FENCE_MARGIN = 2.5;
const FX = HW + FENCE_MARGIN; // 22.5
const FZ = HD + FENCE_MARGIN; // 16.5

export class NeighbourhoodScene {
  private meshes: Mesh[] = [];

  constructor(private scene: Scene) {
    this.buildFence();
    this.buildHouses();
    this.buildTrees();
  }

  // ── helpers ────────────────────────────────────────────────

  private mat(r: number, g: number, b: number): StandardMaterial {
    const m = new StandardMaterial(`nbMat_${r}_${g}_${b}_${Math.random()}`, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  private box(w: number, h: number, d: number, x: number, y: number, z: number, mat: StandardMaterial): Mesh {
    const m = MeshBuilder.CreateBox(`nb_${Math.random()}`, { width: w, height: h, depth: d }, this.scene);
    m.position.set(x, y, z);
    m.material = mat;
    this.meshes.push(m);
    return m;
  }

  private cylinder(r: number, h: number, x: number, y: number, z: number, mat: StandardMaterial, tess = 12): Mesh {
    const m = MeshBuilder.CreateCylinder(`nb_${Math.random()}`, { diameter: r * 2, height: h, tessellation: tess }, this.scene);
    m.position.set(x, y, z);
    m.material = mat;
    this.meshes.push(m);
    return m;
  }

  private sphere(r: number, x: number, y: number, z: number, mat: StandardMaterial): Mesh {
    const m = MeshBuilder.CreateSphere(`nb_${Math.random()}`, { diameter: r * 2, segments: 6 }, this.scene);
    m.position.set(x, y, z);
    m.material = mat;
    this.meshes.push(m);
    return m;
  }

  // ── Fence ──────────────────────────────────────────────────

  private buildFence(): void {
    const postMat = this.mat(0.52, 0.36, 0.18);
    const railMat = this.mat(0.58, 0.42, 0.22);

    const postH  = 1.4;
    const postCY = GROUND_Y + postH / 2;
    const rail1Y = GROUND_Y + 0.45;
    const rail2Y = GROUND_Y + 1.1;
    const postW  = 0.18;
    const railT  = 0.1;
    const step   = 2.0; // spacing between posts

    // Four sides
    this.fenceSide("x", -FX, FX, FZ,  postW, postH, postCY, rail1Y, rail2Y, railT, postMat, railMat);
    this.fenceSide("x", -FX, FX, -FZ, postW, postH, postCY, rail1Y, rail2Y, railT, postMat, railMat);
    this.fenceSide("z", -FZ + step, FZ - step, FX,  postW, postH, postCY, rail1Y, rail2Y, railT, postMat, railMat);
    this.fenceSide("z", -FZ + step, FZ - step, -FX, postW, postH, postCY, rail1Y, rail2Y, railT, postMat, railMat);

    // Corner posts
    for (const sx of [-FX, FX]) {
      for (const sz of [-FZ, FZ]) {
        this.box(postW, postH, postW, sx, postCY, sz, postMat);
      }
    }
  }

  private fenceSide(
    axis: "x" | "z",
    from: number, to: number, fixed: number,
    postW: number, postH: number, postCY: number,
    rail1Y: number, rail2Y: number, railT: number,
    postMat: StandardMaterial, railMat: StandardMaterial
  ): void {
    const step = 2.0;
    const len  = to - from;

    // Posts
    for (let t = from; t <= to + 0.01; t += step) {
      const [x, z] = axis === "x" ? [t, fixed] : [fixed, t];
      this.box(postW, postH, postW, x, postCY, z, postMat);
    }

    // Rails (two per side)
    const railLen = len;
    const cx = axis === "x" ? (from + to) / 2 : fixed;
    const cz = axis === "z" ? (from + to) / 2 : fixed;
    const [rw, rd] = axis === "x" ? [railLen, railT] : [railT, railLen];
    this.box(rw, railT, rd, cx, rail1Y, cz, railMat);
    this.box(rw, railT, rd, cx, rail2Y, cz, railMat);
  }

  // ── Houses ─────────────────────────────────────────────────

  private buildHouses(): void {
    // Far side (low X) — visible from camera angle as the "backdrop"
    this.house(-30, 0,   4.5, 3, 5, 0.90, 0.88, 0.82); // cream
    this.house(-38, 0,  -6,   3, 4, 0.82, 0.72, 0.62); // warm tan
    this.house(-34, 0,   13,  4, 5, 0.88, 0.84, 0.78); // off-white

    // Left side backdrop (negative Z)
    this.house(-10, 0, -26,  3, 4, 0.80, 0.78, 0.72); // grey-white
    this.house(  2, 0, -28,  3, 3.5, 0.86, 0.80, 0.74); // light beige

    // Right side backdrop (positive Z)
    this.house(-8,  0,  26,  3, 4, 0.84, 0.80, 0.75);
    this.house(  4, 0,  27,  3, 3.5, 0.78, 0.76, 0.70);
  }

  private house(x: number, _y: number, z: number, w: number, d: number, r: number, g: number, b: number): void {
    const wallH  = 3.0;
    const wallCY = GROUND_Y + wallH / 2;

    // Walls
    const wallMat = this.mat(r, g, b);
    this.box(w, wallH, d, x, wallCY, z, wallMat);

    // Roof (pyramid: cylinder tessellation=4 with diameterTop=0)
    const roofMat = this.mat(0.55, 0.2, 0.12);
    const roofH   = 1.6;
    const roofBaseW = Math.max(w, d) + 0.5;
    const roof = MeshBuilder.CreateCylinder(`nb_roof_${Math.random()}`, {
      diameterBottom: roofBaseW * 1.42, // diagonal of square base
      diameterTop: 0,
      height: roofH,
      tessellation: 4,
    }, this.scene);
    roof.position.set(x, GROUND_Y + wallH + roofH / 2, z);
    roof.rotation.y = Math.PI / 4; // align corners to walls
    roof.material = roofMat;
    this.meshes.push(roof);

    // Window (dark inset box)
    const winMat = this.mat(0.35, 0.48, 0.62);
    // Front-facing window (toward camera, on +X face)
    this.box(0.6, 0.6, 0.05, x + w / 2 + 0.02, wallCY + 0.3, z, winMat);
  }

  // ── Trees ──────────────────────────────────────────────────

  private buildTrees(): void {
    const specs: [number, number][] = [
      // [x, z] positions around the perimeter
      [-26,  8], [-26, -8],
      [-32,  18], [-32, -18],
      [-22,  20], [-22, -20],
      [ -5,  24], [ -5, -24],
      [ 10,  25], [ 10, -25],
      [-15,  22], [-15, -22],
      [-40,   0],
    ];
    for (const [x, z] of specs) {
      this.tree(x, z);
    }
  }

  private tree(x: number, z: number): void {
    const trunkH  = 2.0 + Math.random() * 1.0;
    const canopyR = 1.0 + Math.random() * 0.6;
    const trunkMat  = this.mat(0.32, 0.2, 0.1);
    const canopyMat = this.mat(0.15 + Math.random() * 0.1, 0.38 + Math.random() * 0.15, 0.1);

    this.cylinder(0.18, trunkH, x, GROUND_Y + trunkH / 2, z, trunkMat);
    this.sphere(canopyR, x, GROUND_Y + trunkH + canopyR * 0.75, z, canopyMat);
  }

  // ── Lifecycle ──────────────────────────────────────────────

  dispose(): void {
    this.meshes.forEach(m => m.dispose());
    this.meshes = [];
  }
}
