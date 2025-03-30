import { BoxGeometry, MeshPhongMaterial, Mesh, Group } from 'three';
import { RigidBodyDesc, ColliderDesc, JointData, ActiveEvents,   /* PrismaticImpulseJoint, SphericalImpulseJoint */ } from '@dimforge/rapier3d';
import { Base } from './Base';
import type { World, RigidBody } from '@dimforge/rapier3d';
import type { Scene } from 'three';


const STIFFNESS = 5.0;
const DAMPING = 0.8;

const createMesh = (x: number, y: number, z: number, color: number) => {
  const geometry = new BoxGeometry(x, y, z);
  const material = new MeshPhongMaterial({ color });
  const mesh = new Mesh(geometry, material);
  // mesh.position.set(position.x, position.y, position.z);
  return mesh;
};

const createBoxBody = (physics: World, meshList: Mesh[], bodyList: RigidBody[]) => ({
  size =     [0, 0, 0] as Tuple,
  position = [0, 0, 0] as Position,
  mass = 100,
  color = 0xffffff
}) => {
  const [ x, y, z ] = size;

  const geometry = new BoxGeometry(x, y, z); // full-extents
  const material = new MeshPhongMaterial({ color });
  const mesh = new Mesh(geometry, material);
  // const mesh = createMesh(...size, color);
  // const mesh = createMesh(x, y, z, color);

  const rigidBodyDesc = RigidBodyDesc
    .dynamic()
    .setTranslation(...position)
    .setLinearDamping(0.5)     // Add linear damping to reduce oscillations
    .setAngularDamping(0.5)    // Add angular damping to reduce rotational jitter
    .setCanSleep(true);

  const colliderDesc = ColliderDesc
    .cuboid(x/2, y/2, z/2)     // half-extents
    .setMass(mass)
    .setRestitution(0.1)       // Lower restitution to reduce bouncing. "elasticity"
    .setFriction(0.9)          // Higher friction to help parts "stick" to the ground, and to reduce jitter
    // .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    .setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS);

  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);

  mesh.position.set(...position);
  // mesh.position.x += offset.x;
  // mesh.position.y += offset.y;
  // mesh.position.z += offset.z;
  // mesh.position.copy(body.translation());  // is already setTranslation

  meshList.push(mesh);
  bodyList.push(body);

  return [ mesh, body ] as any;
};

const skinColors = [
  0xe9c8bc,
  0xd69d70,
  0x88583b,
];

const clothingColors = [
  0x0055ff,
  0xFF5500,
  0x55ff00,
  0xeeeeee,
  0x222222,
];



/**
 * Ragdoll
 * @returns IWorldEntity
 */
export class RagDoll extends Base {
  setup (scene: Scene, physics: World) {

    const meshList: Mesh[] = [];
    const bodyList: RigidBody[] = [];
    // const jointList = [];
    const createEntity = createBoxBody(physics, meshList, bodyList);


    let skin  =     skinColors[Math.floor(Math.random() * skinColors.length)];
    let shirt = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let pants = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let foot  = clothingColors[Math.floor(Math.random() * clothingColors.length)];

    const group = new Group();
    group.position.set( 0, 0, 0 ); // TODO: use this.position ?

    const [head, headBody] = createEntity({
      size:     [0.5, 0.5,  0.5],
      position: [0.0, 2.18, 0.0],
      mass: 200,
      color: skin
    });

    const [chest, chestBody] = createEntity({
      size:     [0.6, 0.6,  0.3],
      position: [0.0, 1.61, 0.0],
      mass: 300,
      color: shirt
    });

    const [hips, hipsBody] = createEntity({
      size:     [0.6, 0.3,  0.3],
      position: [0.0, 1.14, 0.0],
      color: shirt
    });

    const [upperArmL, upperArmLBody] = createEntity({
      size:     [0.4,  0.2, 0.2],
      position: [0.51, 1.8, 0.0],
      color: shirt
    });

    const [foreArmL, foreArmLBody] = createEntity({
      size:     [0.4,  0.2, 0.2],
      position: [0.92, 1.8, 0.0],
      color: skin
    });

    const [handL, handLBody] = createEntity({
      size:     [0.2,  0.2, 0.2],
      position: [1.23, 1.8, 0.0],
      color: skin
    });

    const [upperArmR, upperArmRBody] = createEntity({
      size:     [ 0.4,  0.2, 0.2],
      position: [-0.51, 1.8, 0.0],
      color: shirt
    });

    const [foreArmR, foreArmRBody] = createEntity({
      size:     [ 0.4,  0.2, 0.2],
      position: [-0.92, 1.8, 0.0],
      color: skin
    });

    const [handR, handRBody] = createEntity({
      size:     [ 0.2,  0.2, 0.2],
      position: [-1.23, 1.8, 0.0],
      color: skin
    });

    const [upperLegL, upperLegLBody] = createEntity({
      size:     [0.2, 0.4,  0.2],
      position: [0.2, 0.78, 0.0],
      color: pants
    });

    const [lowerLegL, lowerLegLBody] = createEntity({
      size:     [0.2, 0.4,  0.2],
      position: [0.2, 0.36, 0.0],
      color: skin
    });

    const [footL, footLBody] = createEntity({
      size:     [0.2, 0.12, 0.35],
      position: [0.2, 0.08, 0.05],
      color: foot
    });

    const [upperLegR, upperLegRBody] = createEntity({
      size:     [ 0.2, 0.4,  0.2],
      position: [-0.2, 0.78, 0.0],
      color: pants
    });

    const [lowerLegR, lowerLegRBody] = createEntity({
      size:     [ 0.2, 0.4,  0.2],
      position: [-0.2, 0.36, 0.0],
      color: skin
    });

    const [footR, footRBody] = createEntity({
      size:     [ 0.2, 0.12, 0.35],
      position: [-0.2, 0.08, 0.05],
      color: foot
    });


    //////////


    const neckJointData =  JointData.revolute(
      { x: 0, y: -0.25, z: 0 },  // Point where the joint is attached on the first rigid-body
      { x: 0, y: 0.3, z: 0 },    // Point where the joint is attached on the second rigid-body
      { x: Math.PI/8, y: Math.PI/8, z: 0 }       // Different axis (front-to-back movement)
    );
    // Modify the joint properties to make it looser
    neckJointData.stiffness = STIFFNESS;
    neckJointData.damping = DAMPING;
    const neckJoint = physics.createImpulseJoint(neckJointData, headBody, chestBody, true);
    neckJoint.setContactsEnabled(false);


    const waistData = JointData.revolute(
      { x: 0, y: -0.3, z: 0 },
      { x: 0, y: 0.075, z: 0 },
      { x: 1, y: 0, z: 0 }          // Axis of rotation (x-axis = side-to-side bending)
    );
    const limitAngle = Math.PI / 6; // 30 degrees rotation limit
    waistData.stiffness = STIFFNESS;
    waistData.damping = DAMPING;
    waistData.limitsEnabled = true; // limits to restrict the joint rotation
    waistData.limits = [limitAngle, limitAngle];
    const waistJoint = physics.createImpulseJoint(waistData, chestBody, hipsBody, true);
    // waistJoint.setContactsEnabled(false);


    const shoulderLData = JointData.spherical({ x: 0.3, y: 0.25, z: 0 }, { x: -0.2, y: 0, z: 0 });
    shoulderLData.stiffness = STIFFNESS;
    shoulderLData.damping = DAMPING;
    const shoulderLJoint = physics.createImpulseJoint(shoulderLData, chestBody, upperArmLBody, true);


    const elbowLData = JointData.spherical({ x: 0.2, y: 0, z: 0 }, { x: -0.2, y: 0, z: 0 });
    const elbowLJoint = physics.createImpulseJoint(elbowLData, upperArmLBody, foreArmLBody, true);


    const wristLData = JointData.spherical({ x: 0.2, y: 0, z: 0 }, { x: -0.1, y: 0, z: 0 });
    const wristLJoint = physics.createImpulseJoint(wristLData, foreArmLBody, handLBody, true);


    const shoulderRData = JointData.spherical({ x: -0.3, y: 0.25, z: 0 }, { x: 0.2, y: 0, z: 0 });
    const shoulderRJoint = physics.createImpulseJoint(shoulderRData, chestBody, upperArmRBody, true);


      // axisA: CANNON.Vec3.UNITX,
      // axisB: CANNON.Vec3.UNITX,
      // angle: Math.PI / 4,
      // twistAngle: Math.PI / 8
    const elbowRData = JointData.spherical({ x: -0.2, y: 0, z: 0 }, { x: 0.2, y: 0, z: 0 });
    const elbowRJoint = physics.createImpulseJoint(elbowRData, upperArmRBody, foreArmRBody, true);


    //foreArmR to HandR
      // axisA: CANNON.Vec3.UNITX,
      // axisB: CANNON.Vec3.UNITX,
      // angle: Math.PI / 8,
      // twistAngle: Math.PI / 8
    const wristRData = JointData.spherical({ x: -0.2, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 });
    physics.createImpulseJoint(wristRData, foreArmRBody, handRBody, true);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const hipLData = JointData.spherical(
      { x: 0.2, y: -0.15, z: 0 },
      { x: 0, y: 0.2, z: 0 }
    );
    physics.createImpulseJoint(hipLData, hipsBody, upperLegLBody, true);


    // axisA: CANNON.Vec3.UNITX,
    // axisB: CANNON.Vec3.UNITX,
    // angle: Math.PI/4,
    // twistAngle: Math.PI/8
    const kneeLData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },  // Anchor point on upper leg
      { x: 0, y: 0.2, z: 0 },   // Anchor point on lower leg
      { x: 1, y: 0, z: 0 }      // Axis of rotation (x-axis = side-to-side knee movement)
    );
    physics.createImpulseJoint(kneeLData, upperLegLBody, lowerLegLBody, true);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 8,
    // twistAngle: Math.PI / 8
    const ankleLData = JointData.spherical(
      { x: 0, y: -0.2, z: 0 },
      { x: 0, y: 0.06, z: -0.04 },
    );
    const ankleLJoint = physics.createImpulseJoint(ankleLData, lowerLegLBody, footLBody, true);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const hipRData = JointData.spherical(
      { x: -0.2, y: -0.15, z: 0 },
      { x: 0,    y: 0.2,   z: 0 },
    );
    const hipRJoint = physics.createImpulseJoint(hipRData, hipsBody, upperLegRBody, true);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const kneeRData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },  // Anchor point on upper leg
      { x: 0, y: 0.2, z: 0 },   // Anchor point on lower leg
      { x: 1, y: 0, z: 0 }      // Axis of rotation (x-axis = side-to-side knee movement)
    );
    physics.createImpulseJoint(kneeRData, upperLegRBody, lowerLegRBody, true);


    const ankleRData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },     // Anchor point on lower leg
      { x: 0, y: 0.06, z: -0.04 }, // Anchor point on foot
      { x: 1, y: 0, z: 0 }         // Axis of rotation (side-to-side)
    );
    ankleRData.stiffness = 15.0;
    ankleRData.damping = 0.7;
    const ankleRJoint = physics.createImpulseJoint(ankleRData, lowerLegRBody, footRBody, true);




    // meshList.push(head);
    // meshList.push(chest);
    // meshList.push(hips);
    // meshList.push(upperArmL);
    // meshList.push(foreArmL);
    // meshList.push(handL);
    // meshList.push(upperArmR);
    // meshList.push(foreArmR);
    // meshList.push(handR);
    // meshList.push(upperLegL);
    // meshList.push(lowerLegL);
    // meshList.push(footL);
    // meshList.push(upperLegR);
    // meshList.push(lowerLegR);
    // meshList.push(footR);

    // bodyList.push(headBody);
    // bodyList.push(chestBody);
    // bodyList.push(hipsBody);
    // bodyList.push(upperArmLBody);
    // bodyList.push(foreArmLBody);
    // bodyList.push(handLBody);
    // bodyList.push(upperArmRBody);
    // bodyList.push(foreArmRBody);
    // bodyList.push(handRBody);
    // bodyList.push(upperLegLBody);
    // bodyList.push(lowerLegLBody);
    // bodyList.push(footLBody);
    // bodyList.push(upperLegRBody);
    // bodyList.push(lowerLegRBody);
    // bodyList.push(footRBody);

    // jointList.push(neckJoint);
    // jointList.push(waistJoint);
    // jointList.push(shoulderLJoint);
    // jointList.push(elbowLJoint);
    // jointList.push(wristLJoint);


      // const decorate(head) => {
    const eyeL = createMesh(0.04, 0.04, 0.04, 0x000000);
    eyeL.position.set(0.11, 0.09, 0.25);
    const eyeBrowL = createMesh(0.13, 0.05, 0.04, 0x000000);
    eyeBrowL.position.set(0.12, 0.15, 0.25);
    const eyeR = createMesh(0.04, 0.04, 0.04, 0x000000);
    eyeR.position.set(-0.11, 0.09, 0.25);
    const eyeBrowR = createMesh(0.13, 0.05, 0.04, 0x000000);
    eyeBrowR.position.set(-0.12, 0.15, 0.25);
    const mouth = createMesh(0.2, 0.05, 0.04, 0xff5555);
    mouth.position.set(0, -0.15, 0.25);
    const ear = createMesh(0.65, 0.15, 0.05, skin);
    ear.position.set(0, 0, 0);
    const hairT = createMesh(0.4, 0.5, 0.6, 0x000000);
    hairT.position.set(0, 0.2, -0.1);
    const hairB = createMesh(0.6, 0.5, 0.35, 0x000000);
    hairB.position.set(0, 0.1, -0.2);

    head.add(eyeL);
    head.add(eyeBrowL);
    head.add(eyeR);
    head.add(eyeBrowR);
    head.add(mouth);
    head.add(ear);
    head.add(hairT);
    head.add(hairB);

    //////////////////////////////////////////////////////////////

    // meshList.forEach((mesh) => scene.add(mesh));
    meshList.forEach((mesh) => group.add(mesh));
    scene.add(group);

    this.dynamicBodies.push(
      { mesh: head,  body: headBody },
      { mesh: chest, body: chestBody },
      { mesh: hips,  body: hipsBody },
      { mesh: upperArmL, body: upperArmLBody },
      { mesh: foreArmL,  body: foreArmLBody },
      { mesh: handL,     body: handLBody },
      { mesh: upperArmR, body: upperArmRBody },
      { mesh: foreArmR,  body: foreArmRBody },
      { mesh: handR,     body: handRBody },
      { mesh: upperLegL, body: upperLegLBody },
      { mesh: lowerLegL, body: lowerLegLBody },
      { mesh: footL,     body: footLBody },
      { mesh: upperLegR, body: upperLegRBody },
      { mesh: lowerLegR, body: lowerLegRBody },
      { mesh: footR,     body: footRBody },
    );

  }

  //////////////////////////////////////////////////////////////

  update(t: number) {
    // pivot.rotation.y += 0.005;
    super.update(t);
  }
}
