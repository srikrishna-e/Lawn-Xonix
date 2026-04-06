import { ArcRotateCamera } from "@babylonjs/core";
import { smoothstep } from "./MathUtils";

/**
 * Animates an ArcRotateCamera's beta (pitch) and radius smoothly,
 * temporarily unlocking the locked limits during the tween.
 */
export class CameraAnimator {
  private active    = false;
  private timer     = 0;
  private duration  = 0;
  private fromBeta  = 0;
  private toBeta    = 0;
  private fromRadius = 0;
  private toRadius  = 0;
  private onDone: (() => void) | null = null;

  constructor(private camera: ArcRotateCamera) {}

  /**
   * Start a smooth tween from the camera's current beta/radius
   * to the given target values over `duration` seconds.
   */
  animateTo(
    targetBeta: number,
    targetRadius: number,
    duration: number,
    onComplete?: () => void,
  ): void {
    this.fromBeta   = this.camera.beta;
    this.toBeta     = targetBeta;
    this.fromRadius = this.camera.radius;
    this.toRadius   = targetRadius;
    this.duration   = duration;
    this.timer      = 0;
    this.active     = true;
    this.onDone     = onComplete ?? null;

    // Temporarily unlock beta so we can animate it
    this.camera.lowerBetaLimit = 0;
    this.camera.upperBetaLimit = Math.PI / 2;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.timer += dt;
    const t = smoothstep(Math.min(this.timer / this.duration, 1));
    this.camera.beta   = this.fromBeta   + (this.toBeta   - this.fromBeta)   * t;
    this.camera.radius = this.fromRadius + (this.toRadius - this.fromRadius) * t;

    if (this.timer >= this.duration) {
      this.active = false;
      // Re-lock camera at final position
      this.camera.lowerBetaLimit = this.camera.upperBetaLimit = this.toBeta;
      this.onDone?.();
      this.onDone = null;
    }
  }

  get isAnimating(): boolean { return this.active; }
}
