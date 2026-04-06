import { Scene, StandardMaterial, DynamicTexture, Color3 } from "@babylonjs/core";
import { TileState } from "../core/Grid";
import { LevelTheme } from "../themes/ThemeTypes";

export class TileMaterialManager {
  private mats = new Map<TileState, StandardMaterial>();

  constructor(private scene: Scene, theme: LevelTheme) {
    const { tiles } = theme;
    this.create(TileState.UNCLAIMED, tiles.unclaimed.drawFn, tiles.unclaimed.emissiveColor);
    this.create(TileState.CLAIMED,   tiles.claimed.drawFn,   tiles.claimed.emissiveColor);
    this.create(TileState.TRAIL,     tiles.trail.drawFn,     tiles.trail.emissiveColor);
    this.create(TileState.EDGE,      tiles.edge.drawFn,      tiles.edge.emissiveColor);
  }

  private create(
    state: TileState,
    drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
    emissiveColor?: [number, number, number]
  ): void {
    const size = 128;
    const uid = `${state}_${Date.now()}_${Math.random()}`;
    const tex = new DynamicTexture(`tileTex_${uid}`, { width: size, height: size }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    drawFn(ctx, size);
    tex.update();

    const mat = new StandardMaterial(`tileMat_${uid}`, this.scene);
    mat.diffuseTexture = tex;
    mat.diffuseColor = new Color3(1, 1, 1); // white so texture shows fully
    if (emissiveColor) {
      mat.emissiveColor = new Color3(emissiveColor[0], emissiveColor[1], emissiveColor[2]);
    }
    this.mats.set(state, mat);
  }

  get(state: TileState): StandardMaterial {
    return this.mats.get(state)!;
  }
}
