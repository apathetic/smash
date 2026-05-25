import { Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3, Quaternion, Group } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_DYNAMIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';

const MAX_FORWARD_VELOCITY = 10;
const FORWARD_THRUST = 100000;

/**
 * Truck game object.
 * A simple vehicle that propels itself forward.
 * @returns {IWorldEntity}
 */
export class Truck extends Base {
  wheels: Mesh[] = [];

  setup(scene: Scene, physics: World) {
    const position: Position = this.position || [0, 3, 0];
    const group = new Group();
    const material = new MeshStandardMaterial({ color: 0x3b82f6 }); // Blue truck

    // Chassis / Base of the bed (width 3.0, length 6.0)
    const chassisGeo = new BoxGeometry(3.0, 0.4, 6.0);
    const chassisMesh = new Mesh(chassisGeo, material);
    chassisMesh.position.set(0, 0.4, 0); // elevated to make room for wheels
    group.add(chassisMesh);

    // Cab Roof (width 3.0, depth 2.0)
    const cabRoofGeo = new BoxGeometry(3.0, 0.1, 2.0);
    const cabRoof = new Mesh(cabRoofGeo, material);
    cabRoof.position.set(0, 1.55, 2.0);
    group.add(cabRoof);

    // Cab Left
    const cabLeftGeo = new BoxGeometry(0.1, 1.1, 2.0);
    const cabLeft = new Mesh(cabLeftGeo, material);
    cabLeft.position.set(1.45, 1.05, 2.0);
    group.add(cabLeft);

    // Cab Right
    const cabRightGeo = new BoxGeometry(0.1, 1.1, 2.0);
    const cabRight = new Mesh(cabRightGeo, material);
    cabRight.position.set(-1.45, 1.05, 2.0);
    group.add(cabRight);

    // Cab Front
    const cabFrontGeo = new BoxGeometry(2.8, 1.1, 0.1);
    const cabFront = new Mesh(cabFrontGeo, material);
    cabFront.position.set(0, 1.05, 2.95);
    group.add(cabFront);

    // Cab Back
    const cabBackGeo = new BoxGeometry(2.8, 1.1, 0.1);
    const cabBack = new Mesh(cabBackGeo, material);
    cabBack.position.set(0, 1.05, 1.05);
    group.add(cabBack);

    // Bed walls
    const wallLeftGeo = new BoxGeometry(0.1, 0.6, 4.0);
    const wallLeftMesh = new Mesh(wallLeftGeo, material);
    wallLeftMesh.position.set(1.45, 0.8, -1.0);
    group.add(wallLeftMesh);

    const wallRightGeo = new BoxGeometry(0.1, 0.6, 4.0);
    const wallRightMesh = new Mesh(wallRightGeo, material);
    wallRightMesh.position.set(-1.45, 0.8, -1.0);
    group.add(wallRightMesh);

    const wallBackGeo = new BoxGeometry(2.8, 0.6, 0.1);
    const wallBackMesh = new Mesh(wallBackGeo, material);
    wallBackMesh.position.set(0, 0.8, -2.95);
    group.add(wallBackMesh);

    // Wheels
    const wheelGeo = new CylinderGeometry(0.5, 0.5, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelMaterial = new MeshStandardMaterial({ color: 0x111111 }); // Black wheels
    const spokeMaterial = new MeshStandardMaterial({ color: 0xcccccc }); // Light grey spoke
    const spokeGeo = new BoxGeometry(0.42, 0.8, 0.1); // Spoke to visualize rotation

    const wheelPositions = [
      [1.7, 0.3, 2.0],   // Front left
      [-1.7, 0.3, 2.0],  // Front right
      [1.7, 0.3, -2.0],  // Back left
      [-1.7, 0.3, -2.0]  // Back right
    ];

    wheelPositions.forEach(pos => {
      const wheel = new Mesh(wheelGeo, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);

      // Add a spoke to make rotation visible
      const spoke = new Mesh(spokeGeo, spokeMaterial);
      wheel.add(spoke);

      group.add(wheel);
      this.wheels.push(wheel);
    });

    const rigidBodyDesc = RigidBodyDesc
      .dynamic()
      .setTranslation(...position)
      .setCanSleep(false); // keep awake to constantly move

    const body = physics.createRigidBody(rigidBodyDesc);

    // Base collider
    const baseColliderDesc = ColliderDesc
      .cuboid(1.5, 0.2, 3.0)
      .setTranslation(0, 0.4, 0)
      .setMass(6000)
      .setRestitution(0.2)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(baseColliderDesc, body);

    // Cab colliders (Hollow)
    const cabRoofColliderDesc = ColliderDesc
      .cuboid(1.5, 0.05, 1.0)
      .setTranslation(0, 1.55, 2.0)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabRoofColliderDesc, body);

    const cabLeftColliderDesc = ColliderDesc
      .cuboid(0.05, 0.5, 1.0)
      .setTranslation(1.45, 1.1, 2.0)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabLeftColliderDesc, body);

    const cabRightColliderDesc = ColliderDesc
      .cuboid(0.05, 0.5, 1.0)
      .setTranslation(-1.45, 1.1, 2.0)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabRightColliderDesc, body);

    const cabFrontColliderDesc = ColliderDesc
      .cuboid(1.4, 0.5, 0.05)
      .setTranslation(0, 1.1, 2.95)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabFrontColliderDesc, body);

    const cabBackColliderDesc = ColliderDesc
      .cuboid(1.4, 0.5, 0.05)
      .setTranslation(0, 1.1, 1.05)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabBackColliderDesc, body);

    // Bed walls colliders
    const wallLeftColliderDesc = ColliderDesc
      .cuboid(0.05, 0.25, 2.0)
      .setTranslation(1.45, 0.85, -1.0)
      .setMass(40)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallLeftColliderDesc, body);

    const wallRightColliderDesc = ColliderDesc
      .cuboid(0.05, 0.25, 2.0)
      .setTranslation(-1.45, 0.85, -1.0)
      .setMass(40)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallRightColliderDesc, body);

    const wallBackColliderDesc = ColliderDesc
      .cuboid(1.4, 0.25, 0.05)
      .setTranslation(0, 0.85, -2.95)
      .setMass(40)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallBackColliderDesc, body);

    // Wheel colliders (Sphere) to make them physically rest on the floor
    wheelPositions.forEach((pos) => {
      const wheelColliderDesc = ColliderDesc
        .ball(0.5) // Match wheel radius
        .setTranslation(pos[0], pos[1], pos[2])
        .setMass(100)
        .setFriction(0.5)
        .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
      physics.createCollider(wheelColliderDesc, body);
    });

    group.position.set(...position);
    
    // Enable shadows for all meshes in the truck group
    group.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

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
      if (currentSpeed < MAX_FORWARD_VELOCITY) {
        // Impulse scaled by delta so acceleration is consistent
        // Increased due to higher mass
        const forceMag = FORWARD_THRUST * delta;
        body.applyImpulse({ x: forward.x * forceMag, y: forward.y * forceMag, z: forward.z * forceMag }, true);
      }

      // Rotate wheels
      const velDotFwd = currentVel.x * forward.x + currentVel.y * forward.y + currentVel.z * forward.z;
      const rollDirection = velDotFwd >= 0 ? 1 : -1;
      const rotationAngle = (currentSpeed * delta / 0.5) * rollDirection; // Updated for radius 0.5
      this.wheels.forEach(wheel => {
        wheel.rotateX(rotationAngle);
      });
    });
  }
}
