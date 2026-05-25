import { Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3, Quaternion, Group, Euler } from 'three';
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

    // Chassis / Base of the bed (width 3.6, length 7.2)
    const chassisGeo = new BoxGeometry(3.6, 0.4, 7.2);
    const chassisMesh = new Mesh(chassisGeo, material);
    chassisMesh.position.set(0, 0.4, 0); // elevated to make room for wheels
    group.add(chassisMesh);

    // Hood
    const hoodGeo = new BoxGeometry(3.6, 0.5, 2.0);
    const hoodMesh = new Mesh(hoodGeo, material);
    hoodMesh.position.set(0, 0.85, 2.6);
    group.add(hoodMesh);

    // Cab Roof
    const cabRoofGeo = new BoxGeometry(3.6, 0.1, 1.4);
    const cabRoof = new Mesh(cabRoofGeo, material);
    cabRoof.position.set(0, 1.55, -0.1);
    group.add(cabRoof);

    // Cab Left
    const cabLeftGeo = new BoxGeometry(0.1, 0.9, 1.4);
    const cabLeft = new Mesh(cabLeftGeo, material);
    cabLeft.position.set(1.75, 1.05, -0.1);
    group.add(cabLeft);

    // Cab Right
    const cabRightGeo = new BoxGeometry(0.1, 0.9, 1.4);
    const cabRight = new Mesh(cabRightGeo, material);
    cabRight.position.set(-1.75, 1.05, -0.1);
    group.add(cabRight);

    // Cab Front (Windshield)
    const windshieldLength = Math.sqrt(1.0 * 1.0 + 0.5 * 0.5); // 1.118
    const cabFrontGeo = new BoxGeometry(3.4, windshieldLength, 0.1);
    const cabFront = new Mesh(cabFrontGeo, material);
    cabFront.position.set(0, 1.35, 1.1);
    const windshieldAngle = -Math.atan(2); // Tilt back
    cabFront.rotation.x = windshieldAngle;
    group.add(cabFront);

    // Cab Back
    const cabBackGeo = new BoxGeometry(3.4, 0.9, 0.1);
    const cabBack = new Mesh(cabBackGeo, material);
    cabBack.position.set(0, 1.05, -0.8);
    group.add(cabBack);

    // Bed walls
    const wallLeftGeo = new BoxGeometry(0.1, 0.6, 2.8);
    const wallLeftMesh = new Mesh(wallLeftGeo, material);
    wallLeftMesh.position.set(1.75, 0.8, -2.2);
    group.add(wallLeftMesh);

    const wallRightGeo = new BoxGeometry(0.1, 0.6, 2.8);
    const wallRightMesh = new Mesh(wallRightGeo, material);
    wallRightMesh.position.set(-1.75, 0.8, -2.2);
    group.add(wallRightMesh);

    const wallBackGeo = new BoxGeometry(3.4, 0.6, 0.1);
    const wallBackMesh = new Mesh(wallBackGeo, material);
    wallBackMesh.position.set(0, 0.8, -3.55);
    group.add(wallBackMesh);

    // Wheels
    const wheelGeo = new CylinderGeometry(0.5, 0.5, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelMaterial = new MeshStandardMaterial({ color: 0x111111 }); // Black wheels
    const spokeMaterial = new MeshStandardMaterial({ color: 0xcccccc }); // Light grey spoke
    const spokeGeo = new BoxGeometry(0.42, 0.8, 0.1); // Spoke to visualize rotation

    const wheelPositions = [
      [2.04, 0.3, 2.4],   // Front left
      [-2.04, 0.3, 2.4],  // Front right
      [2.04, 0.3, -2.4],  // Back left
      [-2.04, 0.3, -2.4]  // Back right
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
      .cuboid(1.8, 0.2, 3.6)
      .setTranslation(0, 0.4, 0)
      .setMass(8600)
      .setRestitution(0.2)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(baseColliderDesc, body);

    // Hood collider
    const hoodColliderDesc = ColliderDesc
      .cuboid(1.8, 0.25, 1.0)
      .setTranslation(0, 0.85, 2.6)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(hoodColliderDesc, body);

    // Cab colliders (Hollow)
    const cabRoofColliderDesc = ColliderDesc
      .cuboid(1.8, 0.05, 0.7)
      .setTranslation(0, 1.55, -0.1)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabRoofColliderDesc, body);

    const cabLeftColliderDesc = ColliderDesc
      .cuboid(0.05, 0.45, 0.7)
      .setTranslation(1.75, 1.05, -0.1)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabLeftColliderDesc, body);

    const cabRightColliderDesc = ColliderDesc
      .cuboid(0.05, 0.45, 0.7)
      .setTranslation(-1.75, 1.05, -0.1)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabRightColliderDesc, body);

    const cabFrontColliderDesc = ColliderDesc
      .cuboid(1.7, windshieldLength / 2, 0.05)
      .setTranslation(0, 1.35, 1.1)
      .setRotation(new Quaternion().setFromEuler(new Euler(windshieldAngle, 0, 0)))
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabFrontColliderDesc, body);

    const cabBackColliderDesc = ColliderDesc
      .cuboid(1.7, 0.45, 0.05)
      .setTranslation(0, 1.05, -0.8)
      .setMass(400)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(cabBackColliderDesc, body);

    // Bed walls colliders
    const wallLeftColliderDesc = ColliderDesc
      .cuboid(0.05, 0.3, 1.4)
      .setTranslation(1.75, 0.8, -2.2)
      .setMass(40)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallLeftColliderDesc, body);

    const wallRightColliderDesc = ColliderDesc
      .cuboid(0.05, 0.3, 1.4)
      .setTranslation(-1.75, 0.8, -2.2)
      .setMass(40)
      .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
    physics.createCollider(wallRightColliderDesc, body);

    const wallBackColliderDesc = ColliderDesc
      .cuboid(1.7, 0.3, 0.05)
      .setTranslation(0, 0.8, -3.55)
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
