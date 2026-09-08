import { Mesh, BoxGeometry, MeshPhongMaterial, Euler, Quaternion, Vector3 } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_STATIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';

// Ragdoll height is ~2.6, so a 6-step flight stands about twice that.
// Each step is as wide as a Wall (8) so a ragdoll can't simply miss it, and
// nearly as tall as it is deep, making for a steep flight to tumble down.
const STEPS = 6;
const WIDTH = 8;
const RISE = 0.9;
const RUN = 1.2;

/**
 * The Staircase environment object.
 * A flight of wide, blocky steps ascending in +z, each one a solid slab
 * from the base up to its own tread.
 */
export class Staircase extends Base {
  setup(scene: Scene, physics: World) {
    const position: Position = this.position || [0, 0, 0];
    const rot = this.rotation || [0, 0, 0];
    const euler = new Euler(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180);
    const quat = new Quaternion().setFromEuler(euler);

    for (let step = 0; step < STEPS; step++) {
      const height = (step + 1) * RISE;

      // Each slab is offset from the staircase origin, then swung around it,
      // so that `rotation` turns the whole flight rather than each step.
      const offset = new Vector3(0, height / 2, (step + 0.5) * RUN).applyQuaternion(quat);
      const centerPosition: Position = [
        position[0] + offset.x,
        position[1] + offset.y,
        position[2] + offset.z
      ];

      const geometry = new BoxGeometry(WIDTH, height, RUN);
      const material = new MeshPhongMaterial({ color: 0x888888 });
      const mesh = new Mesh(geometry, material);

      const bodyDesc = RigidBodyDesc.fixed()
        .setTranslation(...centerPosition)
        .setRotation(quat);
      const body = physics.createRigidBody(bodyDesc);

      const colliderDesc = ColliderDesc.cuboid(WIDTH / 2, height / 2, RUN / 2)
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
  }

  update(_delta: number) {
    // Fixed entity, no need to update position each frame
  }
}
