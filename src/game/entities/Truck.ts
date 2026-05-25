import { Mesh, BoxGeometry, MeshNormalMaterial, Vector3, Quaternion } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_DYNAMIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';

/**
 * Truck game object.
 * A simple vehicle that propels itself forward.
 * @returns {IWorldEntity}
 */
export class Truck extends Base {
  setup(scene: Scene, physics: World) {
    const position: Position = this.position || [0, 3, 0];

    // Truck-like proportions (width, height, depth)
    const geometry = new BoxGeometry(1.5, 1, 3);
    const material = new MeshNormalMaterial();
    const mesh     = new Mesh(geometry, material);

    const colliderDesc = ColliderDesc
      .cuboid(0.75, 0.5, 1.5)
      .setMass(2000)
      .setRestitution(0.2)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);

    const rigidBodyDesc = RigidBodyDesc
      .dynamic()
      .setTranslation(...position)
      .setCanSleep(false); // keep awake to constantly move

    const body      = physics.createRigidBody(rigidBodyDesc);
    const _collider = physics.createCollider(colliderDesc, body);

    mesh.position.set(...position);
    scene.add(mesh);
    this.dynamicBodies.push({ mesh, body });
  };

  update(delta: number) {
    super.update(delta);

    this.dynamicBodies.forEach(({ body }) => {
      // Get the forward vector based on current rotation
      const rapierRot = body.rotation();
      const quat = new Quaternion(rapierRot.x, rapierRot.y, rapierRot.z, rapierRot.w);
      // Depending on starting orientation, assuming +Z is forward
      const forward = new Vector3(0, 0, 1).applyQuaternion(quat).normalize();
      
      const currentVel = body.linvel();
      const currentSpeed = new Vector3(currentVel.x, currentVel.y, currentVel.z).length();
      
      // Propel forward if below top speed
      if (currentSpeed < 15) {
        // Impulse scaled by delta so acceleration is consistent
        const forceMag = 100000 * delta; 
        body.applyImpulse({ x: forward.x * forceMag, y: forward.y * forceMag, z: forward.z * forceMag }, true);
      }
    });
  }
}
