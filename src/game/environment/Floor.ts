import { Mesh, BoxGeometry, MeshPhongMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_STATIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';


/**
 * The Floor.
 * @returns IWorldEntity
 */
export class Floor extends Base {
  setup(scene: Scene, physics: World) {
    // note: same position system, but different system for dimensions (below)
    const position: [number, number, number] = [0, -1, 0]; // floor is "1" high; this means its top will be at 0

    const geometry = new BoxGeometry(100, 1, 100); // full extents
    const material = new MeshPhongMaterial({ color: 0x2e7d32 }); // Green grass color
    const mesh = new Mesh(geometry, material);

    const floorBody = RigidBodyDesc.fixed().setTranslation(...position);
    const floorShape = ColliderDesc.cuboid(50, 0.5, 50).setCollisionGroups(COLLISION_GROUP_STATIC); // half-extents
    const body = physics.createRigidBody(floorBody);
    const _collider = physics.createCollider(floorShape, body);

    mesh.receiveShadow = true;
    mesh.position.set(...position);

    scene.add(mesh);

    // Keep track for destruction, but we override update() to skip physics sync
    this.dynamicBodies.push({ mesh, body });
  }

  update(_delta: number) {
    // Fixed entity, no need to update position each frame
  }
}
