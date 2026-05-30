import { Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3, Quaternion, Group } from 'three';
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
export class Rocket extends Base {
  setup(scene: Scene, physics: World) {
    const position: Position = this.position || [0, 3, 0];

    const group = new Group();
    const material = new MeshStandardMaterial({ color: 0x3b82f6 }); // Blue truck

    // Chassis / Base of the bed
    const chassisGeo = new BoxGeometry(1.5, 0.4, 3);
    const chassisMesh = new Mesh(chassisGeo, material);
    chassisMesh.position.set(0, 0.4, 0); // elevated to make room for wheels
    group.add(chassisMesh);

    // Cab
    const cabGeo = new BoxGeometry(1.5, 1, 1);
    const cabMesh = new Mesh(cabGeo, material);
    cabMesh.position.set(0, 1.1, 1); // front is +Z
    group.add(cabMesh);

    // Bed walls
    const wallLeftGeo = new BoxGeometry(0.1, 0.5, 2);
    const wallLeft = new Mesh(wallLeftGeo, material);
    wallLeft.position.set(0.7, 0.85, -0.5);
    group.add(wallLeft);

    const wallRightGeo = new BoxGeometry(0.1, 0.5, 2);
    const wallRight = new Mesh(wallRightGeo, material);
    wallRight.position.set(-0.7, 0.85, -0.5);
    group.add(wallRight);

    const wallBackGeo = new BoxGeometry(1.3, 0.5, 0.1);
    const wallBack = new Mesh(wallBackGeo, material);
    wallBack.position.set(0, 0.85, -1.45);
    group.add(wallBack);

    // Wheels
    const wheelGeo = new CylinderGeometry(0.3, 0.3, 0.2, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    
    const wheelPositions = [
      [0.85, 0.3, 1],   // Front left
      [-0.85, 0.3, 1],  // Front right
      [0.85, 0.3, -1],  // Back left
      [-0.85, 0.3, -1]  // Back right
    ];

    wheelPositions.forEach(pos => {
      const wheel = new Mesh(wheelGeo, material);
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });

    const rigidBodyDesc = RigidBodyDesc
      .dynamic()
      .setTranslation(...position)
      .setCanSleep(false); // keep awake to constantly move

    const body = physics.createRigidBody(rigidBodyDesc);

    // Base collider
    const baseColliderDesc = ColliderDesc
      .cuboid(0.75, 0.2, 1.5)
      .setTranslation(0, 0.4, 0)
      .setMass(1500)
      .setRestitution(0.2)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(baseColliderDesc, body);

    // Cab collider
    const cabColliderDesc = ColliderDesc
      .cuboid(0.75, 0.5, 0.5)
      .setTranslation(0, 1.1, 1)
      .setMass(500)
      .setRestitution(0.2)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabColliderDesc, body);

    // Bed walls colliders
    const wallLeftColliderDesc = ColliderDesc
      .cuboid(0.05, 0.25, 1)
      .setTranslation(0.7, 0.85, -0.5)
      .setMass(10)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallLeftColliderDesc, body);

    const wallRightColliderDesc = ColliderDesc
      .cuboid(0.05, 0.25, 1)
      .setTranslation(-0.7, 0.85, -0.5)
      .setMass(10)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallRightColliderDesc, body);

    const wallBackColliderDesc = ColliderDesc
      .cuboid(0.65, 0.25, 0.05)
      .setTranslation(0, 0.85, -1.45)
      .setMass(10)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallBackColliderDesc, body);

    group.position.set(...position);
    scene.add(group);
    this.dynamicBodies.push({ mesh: group, body });
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
