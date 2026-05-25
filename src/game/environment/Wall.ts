import { Mesh, BoxGeometry, MeshPhongMaterial, Euler, Quaternion } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_STATIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';

/**
 * The Wall environment object.
 */
export class Wall extends Base {
  setup(scene: Scene, physics: World) {
    const position: Position = this.position || [0, 0, 0];

    // Ragdoll height is ~2.6.
    // 1.5x height = 3.9
    // 3x long = 7.8 (length/width)
    const width = 8;
    const height = 4;
    const depth = 1;

    // Adjust Y position so the base of the wall sits at the provided position[1] (usually 0)
    const centerPosition: Position = [position[0], position[1] + height / 2, position[2]];

    const geometry = new BoxGeometry(width, height, depth);
    const material = new MeshPhongMaterial({ color: 0x888888 });
    const mesh = new Mesh(geometry, material);

    const rot = this.rotation || [0, 0, 0];
    const euler = new Euler(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180);
    const quat = new Quaternion().setFromEuler(euler);

    const bodyDesc = RigidBodyDesc.fixed()
      .setTranslation(...centerPosition)
      .setRotation(quat);
    const body = physics.createRigidBody(bodyDesc);

    const colliderDesc = ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setCollisionGroups(COLLISION_GROUP_STATIC);
    physics.createCollider(colliderDesc, body);

    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.position.set(...centerPosition);
    mesh.quaternion.copy(quat);

    scene.add(mesh);

    // keep track so that they may be removed (ie. when level changes)
    this.dynamicBodies.push({ mesh, body });
  }

  update(_delta: number) {
    // Fixed entity, no need to update position each frame
  }
}
