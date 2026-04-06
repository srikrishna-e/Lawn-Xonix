import { Scene, MeshBuilder, Mesh, StandardMaterial, Color3 } from "@babylonjs/core";
import { Grid } from "../core/Grid";
import { GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP, PLATFORM_DEPTH } from "../game/GameConfig";
import { TileMaterialManager } from "./TileMaterialManager";
import { LevelTheme } from "../themes/ThemeTypes";
import { gridToWorld } from "../utils/MathUtils";

export class GridRenderer {
  private tiles: Mesh[][] = [];
  private matMgr: TileMaterialManager;
  private extraMeshes: Mesh[] = [];

  constructor(private scene: Scene, private grid: Grid, private theme: LevelTheme) {
    this.matMgr = new TileMaterialManager(scene, theme);
    this.addPlatformSlab();
    this.createTiles();
    this.addGroundPlane();
  }

  private addPlatformSlab(): void {
    const [r, g, b] = this.theme.platformColor;
    const w = GRID_COLS * TILE_SIZE;
    const d = GRID_ROWS * TILE_SIZE;
    const slab = MeshBuilder.CreateBox("platformSlab", { width: w, height: PLATFORM_DEPTH, depth: d }, this.scene);
    slab.position.set(0, -PLATFORM_DEPTH / 2, 0);
    const mat = new StandardMaterial("slabMat", this.scene);
    mat.diffuseColor = new Color3(r, g, b);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    slab.material = mat;
    slab.receiveShadows = true;
    this.extraMeshes.push(slab);
  }

  private createTiles(): void {
    const heights = this.theme.tileHeights;
    const tileW = TILE_SIZE - TILE_GAP;
    for (let y = 0; y < this.grid.rows; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.grid.cols; x++) {
        const state = this.grid.get(x, y);
        const h = heights[state] ?? 0.15;
        const mesh = MeshBuilder.CreateBox(`tile_${x}_${y}`, { width: tileW, height: h, depth: tileW }, this.scene);
        const { x: wx, z: wz } = gridToWorld(x, y);
        mesh.position.set(wx, h / 2, wz);
        mesh.receiveShadows = true;
        mesh.material = this.matMgr.get(state);
        this.tiles[y]![x] = mesh;
      }
    }
  }

  private addGroundPlane(): void {
    // No ground plane — sky clearColor shows through for the floating-island look
  }

  updateTile(x: number, y: number): void {
    const state = this.grid.get(x, y);
    const h = this.theme.tileHeights[state] ?? 0.15;
    const tileW = TILE_SIZE - TILE_GAP;
    this.tiles[y]![x]!.dispose();
    const { x: wx, z: wz } = gridToWorld(x, y);
    const newMesh = MeshBuilder.CreateBox(`tile_${x}_${y}`, { width: tileW, height: h, depth: tileW }, this.scene);
    newMesh.position.set(wx, h / 2, wz);
    newMesh.receiveShadows = true;
    newMesh.material = this.matMgr.get(state);
    this.tiles[y]![x] = newMesh;
  }

  dispose(): void {
    for (const row of this.tiles) {
      if (row) row.forEach(m => m?.dispose());
    }
    this.extraMeshes.forEach(m => m.dispose());
    this.tiles = [];
    this.extraMeshes = [];
  }
}
