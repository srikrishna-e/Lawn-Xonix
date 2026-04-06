import { LevelTheme } from "../../themes/ThemeTypes";

export interface LevelConfig {
  level: number;
  label: string;
  theme: LevelTheme;
  rabbitCount: number;
  rabbitSpeed: number;   // tiles per second
  timerSeconds: number;
  winPercent: number;
}
