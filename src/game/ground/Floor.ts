import { Mesh, BoxGeometry, MeshPhongMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { Base } from '~/game/objects/Base';
// import { usePhysics } from '~/system/physics';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * The Floor.
 * @returns IWorldEntity
 */
export class Floor extends Base {
  setup (scene: Scene, physics: World) {
    const geometry = new BoxGeometry(100, 1, 100);
    const material = new MeshPhongMaterial();
    const mesh = new Mesh(geometry, material);

    const floorBody = RigidBodyDesc.fixed().setTranslation(0, -1, 0);
    const floorShape = ColliderDesc.cuboid(50, 0.5, 50);
    const body = physics.createRigidBody(floorBody);
    const collider = physics.createCollider(floorShape, body);

    mesh.receiveShadow = true
    mesh.position.y = -1;

    scene.add(mesh);
    // this.dynamicBodies.push({ mesh, body }); // put here so I could comment it out so I could remind myself that this doesn't need to ever update
  }
}
