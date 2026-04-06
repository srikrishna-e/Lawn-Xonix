import { Scene, MeshBuilder, StandardMaterial, Color3, Mesh, TransformNode } from "@babylonjs/core";
import { Grid, TileState } from "../core/Grid";
import { Trail } from "../core/Trail";
import { gridToWorld, worldToGrid } from "../utils/MathUtils";
import { TILE_HEIGHTS } from "../game/GameConfig";

const RABBIT_Y = (TILE_HEIGHTS[0] ?? 0.55) + 0.45; // sit above tallest grass

export class Rabbit {
  private root: TransformNode;
  private wx: number;
  private wz: number;
  private vx: number;
  private vz: number;

  constructor(private scene: Scene, startGridX: number, startGridY: number, speed: number = 5.5) {
    this.root = new TransformNode("rabbitRoot", scene);

    // Body — larger so it's clearly visible above the grass
    const body = MeshBuilder.CreateSphere("rabbitBody", { diameter: 1.0, segments: 8 }, scene);
    const bodyMat = new StandardMaterial("rabbitBodyMat", scene);
    bodyMat.diffuseColor = new Color3(0.85, 0.68, 0.45);
    bodyMat.emissiveColor = new Color3(0.12, 0.08, 0.03);
    body.material = bodyMat;
    body.parent = this.root;

    // Ears
    for (const side of [-1, 1]) {
      const ear = MeshBuilder.CreateCylinder(`rabbitEar${side}${startGridX}`, {
        diameterTop: 0.08, diameterBottom: 0.18, height: 0.5, tessellation: 6
      }, scene);
      const earMat = new StandardMaterial(`earMat${side}${startGridX}`, scene);
      earMat.diffuseColor = new Color3(0.9, 0.72, 0.6);
      ear.material = earMat;
      ear.position.set(side * 0.22, 0.65, 0);
      ear.parent = this.root;
    }

    // Shadow circle under rabbit
    const shadow = MeshBuilder.CreateDisc("rabbitShadow", { radius: 0.45, tessellation: 12 }, scene);
    shadow.rotation.x = Math.PI / 2;
    shadow.position.y = -(RABBIT_Y - 0.05);
    const shadowMat = new StandardMaterial("rabbitShadowMat", scene);
    shadowMat.diffuseColor = new Color3(0, 0, 0);
    shadowMat.alpha = 0.3;
    shadow.material = shadowMat;
    shadow.parent = this.root;

    const { x, z } = gridToWorld(startGridX, startGridY);
    this.wx = x;
    this.wz = z;
    this.root.position.set(this.wx, RABBIT_Y, this.wz);

    // Diagonal start angle so it bounces like Airxonix balls
    const angle = Math.PI / 4 + Math.floor(Math.random() * 4) * (Math.PI / 2) + (Math.random() - 0.5) * 0.3;
    this.vx = Math.cos(angle) * speed;
    this.vz = Math.sin(angle) * speed;
  }

  isEnclosed(grid: Grid): boolean {
    const { gx, gy } = worldToGrid(this.wx, this.wz);
    return grid.isInBounds(gx, gy) && this.isSolid(grid.get(gx, gy));
  }

  getGridPos(): { gx: number; gy: number } {
    return worldToGrid(this.wx, this.wz);
  }

  update(dt: number, grid: Grid, trail: Trail, moveOnly = false): boolean {
    const nextX = this.wx + this.vx * dt;
    const nextZ = this.wz + this.vz * dt;

    const { gx: gxX, gy: gyX } = worldToGrid(nextX, this.wz);
    const { gx: gxZ, gy: gyZ } = worldToGrid(this.wx, nextZ);

    const blockedX = !grid.isInBounds(gxX, gyX) || this.isSolid(grid.get(gxX, gyX));
    const blockedZ = !grid.isInBounds(gxZ, gyZ) || this.isSolid(grid.get(gxZ, gyZ));

    if (blockedX) this.vx = -this.vx;
    if (blockedZ) this.vz = -this.vz;

    this.wx += this.vx * dt;
    this.wz += this.vz * dt;

    this.root.position.x = this.wx;
    this.root.position.z = this.wz;

    // Hop animation
    this.root.position.y = RABBIT_Y + Math.abs(Math.sin(Date.now() / 180)) * 0.35;

    // Trail hit detection — skipped when moveOnly so rabbits can keep moving
    // during the death freeze and respawn sequence without re-triggering death.
    if (!moveOnly && trail.isActive) {
      const { gx, gy } = worldToGrid(this.wx, this.wz);
      if (grid.isInBounds(gx, gy) && grid.get(gx, gy) === TileState.TRAIL) {
        return true;
      }
    }

    return false;
  }

  private isSolid(state: TileState): boolean {
    // Rabbits bounce off EDGE and CLAIMED — only roam UNCLAIMED
    return state === TileState.CLAIMED || state === TileState.EDGE;
  }

  dispose(): void {
    this.root.dispose();
  }
}
