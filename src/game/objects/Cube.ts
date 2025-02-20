import { Mesh, BoxGeometry, MeshNormalMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { Base } from './Base';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * Cube game object.
 * @returns {IWorldEntity}
 */
export class Cube extends Base {
  setup (scene: Scene, physics: World) {
    const position: Position = [0, 3, 0];

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshNormalMaterial();
    const mesh     = new Mesh(geometry, material);

    const colliderDesc = ColliderDesc
      .cuboid(0.5, 0.5, 0.5)
      .setMass(1)
      .setRestitution(0.5);

    const rigidBodyDesc = RigidBodyDesc
      .dynamic()
      .setTranslation(...position)
      .setCanSleep(true);

    const body     = physics.createRigidBody(rigidBodyDesc);
    const collider = physics.createCollider(colliderDesc, body);

    mesh.position.set(...position);
    scene.add(mesh);
    this.dynamicBodies.push({ mesh, body });
  };
}
