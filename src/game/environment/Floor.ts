import { Mesh, BoxGeometry, MeshPhongMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { Base } from '~/game/entities/Base';
// import { usePhysics } from '~/system/physics';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * The Floor.
 * @returns IWorldEntity
 */
export class Floor extends Base {
  setup (scene: Scene, physics: World) {
   // note: same position system, but different system for dimensions (below)
    const position: [number, number, number] = [0, -1, 0]; // floor is "1" high; this means its top will be at 0

    const geometry = new BoxGeometry(100, 1, 100); // full extents
    const material = new MeshPhongMaterial();
    const mesh = new Mesh(geometry, material);

    const floorBody = RigidBodyDesc.fixed().setTranslation(...position);
    const floorShape = ColliderDesc.cuboid(50, 0.5, 50); // half-extents
    const body = physics.createRigidBody(floorBody);
    const collider = physics.createCollider(floorShape, body);

    mesh.receiveShadow = true;
    mesh.position.set(...position);

    scene.add(mesh);

    // I put this line here so I could comment it out. So I could be
    // reminded that this doesn't need to ever update
    // this.dynamicBodies.push({ mesh, body });
  }
}
