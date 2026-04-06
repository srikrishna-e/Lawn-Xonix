export interface RabbitAppearance {
  bodyColor: [number, number, number];
  bodyEmissive: [number, number, number];
  earColor: [number, number, number];
}

export const DEFAULT_RABBIT: RabbitAppearance = {
  bodyColor:    [0.85, 0.68, 0.45],
  bodyEmissive: [0.12, 0.08, 0.03],
  earColor:     [0.9,  0.72, 0.6],
};
