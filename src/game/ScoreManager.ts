// ── Score tuning constants ────────────────────────────────────
// Kept in one place so future iterations (multipliers, streaks, etc.)
// only need changes here.
export const SCORE_VALUES = {
  TILE:                 10,   // per tile claimed
  RABBIT_BONUS:        500,   // per rabbit enclosed
  TIME_MULTIPLIER:      20,   // timeLeft (seconds) × this
  CLEAN_SWEEP_BONUS:  1000,   // bonus for claiming >90% of the lawn
  CLEAN_SWEEP_THRESHOLD: 90,  // percent required for clean sweep
} as const;

export class ScoreManager {
  private _total  = 0;
  private _level  = 0;   // score earned in the current level

  get total(): number  { return this._total; }
  get levelScore(): number { return this._level; }

  addTilesClaimed(count: number): number {
    const pts = count * SCORE_VALUES.TILE;
    this._total += pts;
    this._level += pts;
    return pts;
  }

  addRabbitsEnclosed(count: number): number {
    const pts = count * SCORE_VALUES.RABBIT_BONUS;
    this._total += pts;
    this._level += pts;
    return pts;
  }

  addTimeBonus(timeLeft: number): number {
    const pts = Math.floor(timeLeft * SCORE_VALUES.TIME_MULTIPLIER);
    this._total += pts;
    this._level += pts;
    return pts;
  }

  addCleanSweepBonus(): number {
    const pts = SCORE_VALUES.CLEAN_SWEEP_BONUS;
    this._total += pts;
    this._level += pts;
    return pts;
  }

  /** Call at the start of each level so per-level score resets. */
  resetLevel(): void {
    this._level = 0;
  }

  /** Full reset when returning to main menu. */
  reset(): void {
    this._total = 0;
    this._level = 0;
  }
}
