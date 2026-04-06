import { Scene, MeshBuilder, StandardMaterial, Color3, Mesh } from "@babylonjs/core";

interface Cloud {
  meshes: Mesh[];
  speedX: number;
  speedZ: number;
  boundX: number;
  boundZ: number;
}

export class CloudScene {
  private clouds: Cloud[] = [];
  private allMeshes: Mesh[] = [];

  constructor(private scene: Scene) {
    this.buildClouds(18);
  }

  private mat(): StandardMaterial {
    const m = new StandardMaterial(`cloudMat_${Math.random()}`, this.scene);
    m.diffuseColor  = new Color3(1, 1, 1);
    m.emissiveColor = new Color3(0.9, 0.9, 0.9);
    m.specularColor = new Color3(0, 0, 0);
    m.alpha = 0.75 + Math.random() * 0.2;
    m.backFaceCulling = false;
    return m;
  }

  private buildClouds(count: number): void {
    const BOUND_X = 90;
    const BOUND_Z = 70;

    for (let i = 0; i < count; i++) {
      const cx = (Math.random() - 0.5) * BOUND_X * 2;
      const cz = (Math.random() - 0.5) * BOUND_Z * 2;
      // Below the platform (slab bottom ≈ -1.8); clouds sit at -4 to -14
      const cy = -(4 + Math.random() * 10);
      const scale = 3 + Math.random() * 5;

      const meshes = this.makeCloudPuffs(cx, cy, cz, scale);
      const speedX = (0.3 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1);
      const speedZ = (Math.random() - 0.5) * 0.3;

      this.clouds.push({ meshes, speedX, speedZ, boundX: BOUND_X, boundZ: BOUND_Z });
      this.allMeshes.push(...meshes);
    }
  }

  private makeCloudPuffs(cx: number, cy: number, cz: number, scale: number): Mesh[] {
    const meshes: Mesh[] = [];
    const mat = this.mat();
    const puffCount = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffCount; p++) {
      const ox = (Math.random() - 0.5) * scale * 1.2;
      const oy = (Math.random() - 0.5) * scale * 0.25;
      const oz = (Math.random() - 0.5) * scale * 0.5;
      const r  = (0.5 + Math.random() * 0.5) * scale;
      const m  = MeshBuilder.CreateSphere(`cloud_${Math.random()}`, {
        diameterX: r * 2.2,
        diameterY: r * 0.7,
        diameterZ: r * 1.4,
        segments: 5,
      }, this.scene);
      m.position.set(cx + ox, cy + oy, cz + oz);
      m.material = mat;
      meshes.push(m);
    }
    return meshes;
  }

  update(dt: number): void {
    for (const cloud of this.clouds) {
      for (const m of cloud.meshes) {
        m.position.x += cloud.speedX * dt;
        m.position.z += cloud.speedZ * dt;
      }
      const ref = cloud.meshes[0]!;
      if (ref.position.x > cloud.boundX)  cloud.meshes.forEach(m => { m.position.x -= cloud.boundX * 2; });
      if (ref.position.x < -cloud.boundX) cloud.meshes.forEach(m => { m.position.x += cloud.boundX * 2; });
      if (ref.position.z > cloud.boundZ)  cloud.meshes.forEach(m => { m.position.z -= cloud.boundZ * 2; });
      if (ref.position.z < -cloud.boundZ) cloud.meshes.forEach(m => { m.position.z += cloud.boundZ * 2; });
    }
  }

  dispose(): void {
    this.allMeshes.forEach(m => m.dispose());
    this.allMeshes = [];
    this.clouds = [];
  }
}
