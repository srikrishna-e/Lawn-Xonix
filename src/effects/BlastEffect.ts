import {
  Scene,
  ParticleSystem,
  DynamicTexture,
  Vector3,
  Color4,
  SphereParticleEmitter,
} from "@babylonjs/core";

// Shared soft-glow texture — created once, reused across all blasts
let _blastTex: DynamicTexture | null = null;

function getBlastTexture(scene: Scene): DynamicTexture {
  if (_blastTex) return _blastTex;

  const size = 64;
  const tex  = new DynamicTexture("blastParticleTex", { width: size, height: size }, scene, false);
  const ctx  = tex.getContext();

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0,    "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,230,80,0.95)");
  g.addColorStop(0.55, "rgba(255,90,10,0.7)");
  g.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update();

  _blastTex = tex;
  return _blastTex;
}

/**
 * Spawns a one-shot burst of fire / sparks / smoke at `position`.
 *
 * Uses emitRate + targetStopDuration instead of manualEmitCount —
 * manualEmitCount drips particles through emitRate per frame which
 * at the default rate of 10/s produces ~0 particles per 16 ms frame.
 */
function spawnBurstAt(scene: Scene, pos: Vector3): void {
  const tex = getBlastTexture(scene);

  // ── Main fire burst ────────────────────────────────────────────────────────
  const fire = new ParticleSystem("blast_fire", 300, scene);
  fire.particleTexture = tex;
  fire.emitter         = pos.clone();
  fire.particleEmitterType = new SphereParticleEmitter(0.15);

  fire.emitRate            = 3000;   // high rate → burst fills in < 1 frame
  fire.targetStopDuration  = 0.06;   // emit for 60 ms then stop
  fire.disposeOnStop       = true;

  fire.minEmitPower = 4;
  fire.maxEmitPower = 12;
  fire.minLifeTime  = 0.3;
  fire.maxLifeTime  = 0.7;

  // Sizes tuned for camera distance ≈ 52 units (need ≥ 0.5 to be clearly visible)
  fire.minSize = 0.5;
  fire.maxSize = 1.4;

  fire.color1    = new Color4(1.0, 0.95, 0.25, 1.0);
  fire.color2    = new Color4(1.0, 0.38, 0.02, 1.0);
  fire.colorDead = new Color4(0.15, 0.04, 0.0,  0.0);

  fire.gravity   = new Vector3(0, -4, 0);
  fire.blendMode = ParticleSystem.BLENDMODE_ADD;
  fire.start();

  // ── Sparks ─────────────────────────────────────────────────────────────────
  const sparks = new ParticleSystem("blast_sparks", 120, scene);
  sparks.particleTexture       = tex;
  sparks.emitter               = pos.clone();
  sparks.particleEmitterType   = new SphereParticleEmitter(0.05);

  sparks.emitRate           = 2000;
  sparks.targetStopDuration = 0.05;
  sparks.disposeOnStop      = true;

  sparks.minEmitPower = 10;
  sparks.maxEmitPower = 22;
  sparks.minLifeTime  = 0.15;
  sparks.maxLifeTime  = 0.5;
  sparks.minSize = 0.18;
  sparks.maxSize = 0.55;

  sparks.color1    = new Color4(1.0, 1.0, 0.8, 1.0);
  sparks.color2    = new Color4(1.0, 0.6, 0.1, 1.0);
  sparks.colorDead = new Color4(0.3, 0.1, 0.0, 0.0);

  sparks.gravity   = new Vector3(0, -8, 0);
  sparks.blendMode = ParticleSystem.BLENDMODE_ADD;
  sparks.start();

  // ── Smoke puff ─────────────────────────────────────────────────────────────
  const smoke = new ParticleSystem("blast_smoke", 60, scene);
  smoke.particleTexture       = tex;
  smoke.emitter               = pos.clone();
  smoke.particleEmitterType   = new SphereParticleEmitter(0.25);

  smoke.emitRate           = 600;
  smoke.targetStopDuration = 0.07;
  smoke.disposeOnStop      = true;

  smoke.minEmitPower = 1;
  smoke.maxEmitPower = 3;
  smoke.minLifeTime  = 0.5;
  smoke.maxLifeTime  = 1.0;
  smoke.minSize = 0.9;
  smoke.maxSize = 2.2;

  smoke.color1    = new Color4(0.55, 0.55, 0.55, 0.5);
  smoke.color2    = new Color4(0.3,  0.3,  0.3,  0.4);
  smoke.colorDead = new Color4(0.15, 0.15, 0.15, 0.0);

  smoke.gravity   = new Vector3(0, 2, 0);
  smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  smoke.start();
}

/**
 * Fire blast at the mower position, and optionally at a second impact
 * point (e.g. where a rabbit hit the trail — which may be far from the mower).
 */
export function spawnBlast(scene: Scene, mowerPos: Vector3, impactPos?: Vector3): void {
  spawnBurstAt(scene, mowerPos);
  if (impactPos && impactPos.subtract(mowerPos).length() > 1.5) {
    // Only add second blast if the impact is far enough away to be worth it
    spawnBurstAt(scene, impactPos);
  }
}
