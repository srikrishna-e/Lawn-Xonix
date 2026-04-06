export interface MowerAppearance {
  bodyColor:   [number, number, number];
  deckColor:   [number, number, number];
  wheelColor:  [number, number, number];
  handleColor: [number, number, number];
}

export const DEFAULT_MOWER: MowerAppearance = {
  bodyColor:   [0.85, 0.12, 0.08],  // red
  deckColor:   [0.18, 0.18, 0.18],  // dark grey
  wheelColor:  [0.1,  0.1,  0.1],   // black
  handleColor: [0.25, 0.25, 0.25],  // medium grey
};
