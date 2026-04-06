import { LevelConfig } from "./levels/LevelConfig";
import { Level1 } from "./levels/Level1";
import { Level2 } from "./levels/Level2";
import { Level3 } from "./levels/Level3";
import { Level4 } from "./levels/Level4";
import { Level5 } from "./levels/Level5";

const LEVELS: LevelConfig[] = [Level1, Level2, Level3, Level4, Level5];

export class LevelManager {
  private idx = 0;

  get current(): LevelConfig { return LEVELS[this.idx]!; }
  get isLastLevel(): boolean  { return this.idx >= LEVELS.length - 1; }
  get totalLevels(): number   { return LEVELS.length; }

  /** Move to next level. Returns false if already on the last level. */
  advance(): boolean {
    if (this.idx < LEVELS.length - 1) {
      this.idx++;
      return true;
    }
    return false;
  }

  jumpTo(idx: number): void {
    this.idx = Math.max(0, Math.min(idx, LEVELS.length - 1));
  }

  reset(): void {
    this.idx = 0;
  }
}
