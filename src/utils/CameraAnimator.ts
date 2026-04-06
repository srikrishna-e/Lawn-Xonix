import { ArcRotateCamera, Vector2 } from "@babylonjs/core";
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

  // ── Shake state ────────────────────────────────────────────────────────────
  private shakeActive    = false;
  private shakeTimer     = 0;
  private shakeDuration  = 0;
  private shakeIntensity = 0;

  constructor(private camera: ArcRotateCamera) {
    // Ensure targetScreenOffset exists (it defaults to Vector2.Zero in BJS)
    this.camera.targetScreenOffset = Vector2.Zero();
  }

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

  /**
   * Shake the camera with decreasing intensity over `duration` seconds.
   * Uses screen-space offset so it doesn't interfere with locked rotation.
   */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration  = duration;
    this.shakeTimer     = 0;
    this.shakeActive    = true;
  }

  update(dt: number): void {
    // ── Swoop tween ─────────────────────────────────────────────────────────
    if (this.active) {
      this.timer += dt;
      const t = smoothstep(Math.min(this.timer / this.duration, 1));
      this.camera.beta   = this.fromBeta   + (this.toBeta   - this.fromBeta)   * t;
      this.camera.radius = this.fromRadius + (this.toRadius - this.fromRadius) * t;

      if (this.timer >= this.duration) {
        this.active = false;
        this.camera.lowerBetaLimit = this.camera.upperBetaLimit = this.toBeta;
        this.onDone?.();
        this.onDone = null;
      }
    }

    // ── Camera shake ────────────────────────────────────────────────────────
    if (this.shakeActive) {
      this.shakeTimer += dt;
      const remaining = 1 - Math.min(this.shakeTimer / this.shakeDuration, 1);
      const amplitude = this.shakeIntensity * remaining * remaining; // ease-out squared

      // Two overlapping sine waves at co-prime frequencies for organic feel,
      // plus a small random jitter for extra crunch
      const t = this.shakeTimer;
      this.camera.targetScreenOffset.x =
        amplitude * (Math.sin(t * 67) * 0.6 + (Math.random() - 0.5) * 0.4);
      this.camera.targetScreenOffset.y =
        amplitude * (Math.sin(t * 53) * 0.6 + (Math.random() - 0.5) * 0.4);

      if (this.shakeTimer >= this.shakeDuration) {
        this.shakeActive = false;
        this.camera.targetScreenOffset.x = 0;
        this.camera.targetScreenOffset.y = 0;
      }
    }
  }

  get isAnimating(): boolean { return this.active; }
}
