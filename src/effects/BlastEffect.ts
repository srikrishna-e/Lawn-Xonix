import {
  Scene,
  ParticleSystem,
  DynamicTexture,
  Vector3,
  Color4,
  SphereParticleEmitter,
} from "@babylonjs/core";

// Shared soft-glow texture — created once, reused for every blast
let _blastTex: DynamicTexture | null = null;

function getBlastTexture(scene: Scene): DynamicTexture {
  if (_blastTex) return _blastTex;

  const size = 64;
  const tex  = new DynamicTexture("blastParticleTex", { width: size, height: size }, scene, false);
  const ctx  = tex.getContext();

  // Radial gradient: white hot core → yellow → orange → transparent edge
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
 * Spawns a one-shot burst of fire/spark particles at `position`.
 * The ParticleSystem auto-disposes once all particles have died.
 */
export function spawnBlast(scene: Scene, position: Vector3): void {
  // ── Main fire burst ────────────────────────────────────────────────────────
  const ps = new ParticleSystem("blast_fire", 160, scene);
  ps.particleTexture = getBlastTexture(scene);

  ps.emitter = position.clone();

  const sphereEmitter  = new SphereParticleEmitter(0.12);
  ps.particleEmitterType = sphereEmitter;

  ps.minEmitPower = 3.5;
  ps.maxEmitPower = 9.0;

  ps.minLifeTime  = 0.25;
  ps.maxLifeTime  = 0.55;

  ps.minSize = 0.08;
  ps.maxSize = 0.30;

  ps.color1    = new Color4(1.0, 0.95, 0.25, 1.0);  // bright yellow
  ps.color2    = new Color4(1.0, 0.38, 0.02, 1.0);  // deep orange
  ps.colorDead = new Color4(0.15, 0.04, 0.0,  0.0); // fade to nothing

  ps.gravity = new Vector3(0, -3.5, 0);

  ps.blendMode      = ParticleSystem.BLENDMODE_ADD;  // additive → glowing look
  ps.manualEmitCount = 110;   // emit exactly N then stop
  ps.disposeOnStop   = true;
  ps.start();

  // ── Fast outward sparks ────────────────────────────────────────────────────
  const sparks = new ParticleSystem("blast_sparks", 60, scene);
  sparks.particleTexture = getBlastTexture(scene);

  sparks.emitter = position.clone();
  sparks.particleEmitterType = new SphereParticleEmitter(0.05);

  sparks.minEmitPower = 7;
  sparks.maxEmitPower = 16;

  sparks.minLifeTime  = 0.15;
  sparks.maxLifeTime  = 0.45;

  sparks.minSize = 0.03;
  sparks.maxSize = 0.10;

  sparks.color1    = new Color4(1.0, 1.0, 0.8, 1.0);   // near-white hot
  sparks.color2    = new Color4(1.0, 0.6, 0.1, 1.0);   // golden
  sparks.colorDead = new Color4(0.3, 0.1, 0.0,  0.0);

  sparks.gravity = new Vector3(0, -6, 0);

  sparks.blendMode       = ParticleSystem.BLENDMODE_ADD;
  sparks.manualEmitCount = 45;
  sparks.disposeOnStop   = true;
  sparks.start();

  // ── Smoke puff (slower, larger, fades to grey) ───────────────────────────
  const smoke = new ParticleSystem("blast_smoke", 40, scene);
  smoke.particleTexture = getBlastTexture(scene);

  smoke.emitter = position.clone();
  smoke.particleEmitterType = new SphereParticleEmitter(0.2);

  smoke.minEmitPower = 0.8;
  smoke.maxEmitPower = 2.5;

  smoke.minLifeTime  = 0.4;
  smoke.maxLifeTime  = 0.85;

  smoke.minSize = 0.20;
  smoke.maxSize = 0.55;

  smoke.color1    = new Color4(0.55, 0.55, 0.55, 0.5);
  smoke.color2    = new Color4(0.3,  0.3,  0.3,  0.4);
  smoke.colorDead = new Color4(0.15, 0.15, 0.15, 0.0);

  smoke.gravity = new Vector3(0, 1.5, 0);  // drift upward

  smoke.blendMode       = ParticleSystem.BLENDMODE_STANDARD;
  smoke.manualEmitCount = 28;
  smoke.disposeOnStop   = true;
  smoke.start();
}
