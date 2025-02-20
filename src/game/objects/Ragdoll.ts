import { BoxGeometry, MeshPhongMaterial, Mesh, Group } from 'three';
import { RigidBodyDesc, ColliderDesc, JointData, Vector3, ActiveEvents } from '@dimforge/rapier3d';
import { Base } from './Base';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


const createMesh = (x: number, y: number, z: number, color: number) => {
  const geometry = new BoxGeometry(x, y, z);
  const material = new MeshPhongMaterial({ color });
  const mesh = new Mesh(geometry, material);
  // mesh.position.set(position.x, position.y, position.z);
  return mesh;
};

const createBoxBody = (physics: World) => ({
  size =     [0, 0, 0],
  position = [0, 0, 0] as Position,
  offset = null,
  color = 0xffffff
}) => {
  const [ x, y, z ] = size;

  const geometry = new BoxGeometry(x, y, z); // full-extents
  const material = new MeshPhongMaterial({ color });
  const mesh = new Mesh(geometry, material);
  // const mesh = createMesh(x,y,z,color);

  const rigidBodyDesc = RigidBodyDesc
    .dynamic()
    .setTranslation(...position)
    .setCanSleep(true);

  const colliderDesc = ColliderDesc
    .cuboid(x/2, y/2, z/2) // half-extents
    .setMass(1)
    .setRestitution(0.5) // elasticity
    // .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    .setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS);

  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);

  mesh.position.set(...position);
  // mesh.position.x += offset.x;
  // mesh.position.y += offset.y;
  // mesh.position.z += offset.z;
  // mesh.position.copy(body.translation());  // is already setTranslation

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
    const createEntity = createBoxBody(physics);
    // const offset = { x: 0, y: 0, z: 0 }

    const meshList = [];
    const bodyList = [];
    const jointList = [];

    let skin  =     skinColors[Math.floor(Math.random() * skinColors.length)];
    let shirt = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let pants = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let foot  = clothingColors[Math.floor(Math.random() * clothingColors.length)];

    const group = new Group();
    group.position.set( 0, 0, 0 );

    const [head, headBody] = createEntity({
      size:     [0.5, 0.5,  0.5],
      position: [0,   2.18, 0],
      color: skin
    });

    const [chest, chestBody] = createEntity({
      size:     [0.6, 0.6,  0.3],
      position: [0,   1.61, 0],
      color: shirt
    });

    const [hips, hipsBody] = createEntity({
      size: [0.6,0.3,0.3],
      position: [0,1.14,0],
      color: shirt
    });

    const [upperShoulderL, upperShoulderLBody] = createEntity({
      size: [0.4,0.2,0.2],
      position: [0.51,1.8,0],
      color: shirt
    });

    const [lowerShoulderL, lowerShoulderLBody] = createEntity({
      size:     [ 0.4,  0.2, 0.2],
      position: [ 0.92, 1.8, 0],
      color: skin
    });

    const [handL, handLBody] = createEntity({
      size:     [ 0.2,  0.2, 0.2],
      position: [ 1.23, 1.8, 0],
      color: skin
    });

    const [upperShoulderR, upperShoulderRBody] = createEntity({
      size:     [ 0.4,   0.2, 0.2],
      position: [ -0.51, 1.8, 0],
      color: shirt
    });

    const [lowerShoulderR, lowerShoulderRBody] = createEntity({
      size:     [ 0.4,   0.2, 0.2],
      position: [ -0.92, 1.8, 0],
      color: skin
    });

    const [handR, handRBody] = createEntity({
      size:     [ 0.2,   0.2, 0.2],
      position: [ -1.23, 1.8, 0],
      color: skin
    });

    const [upperLegL, upperLegLBody] = createEntity({
      size:     [ 0.2, 0.4,  0.2],
      position: [ 0.2, 0.78, 0],
      color: pants
    });

    const [lowerLegL, lowerLegLBody] = createEntity({
      size:     [ 0.2, 0.4,  0.2],
      position: [ 0.2, 0.36, 0],
      color: skin
    });

    // const footLBody = createBody(0.1, 0.06, 0.1525); // <== NOTE: foot z is different, in original
    const [footL, footLBody] = createEntity({
      size:     [ 0.2, 0.12, 0.35],
      position: [ 0.2, 0.08, 0.05],
      color: foot
    });

    const [upperLegR, upperLegRBody] = createEntity({
      size:     [ 0.2,  0.4,  0.2],
      position: [ -0.2, 0.78, 0],
      color: pants
    });

    const [lowerLegR, lowerLegRBody] = createEntity({
      size:     [ 0.2,  0.4,  0.2],
      position: [ -0.2, 0.36, 0],
      color: skin
    });

    const [footR, footRBody] = createEntity({
      size:     [ 0.2,  0.12, 0.35],
      position: [ -0.2, 0.08, 0.05],
      color: foot
    });




    //Head to Chest
    // jointList.push(physics.createImpulseJoint(
    //   headBody,
    //   chestBody, {
    //     new Vector3(0, -0.25, 0),
    //     new Vector3(0, 0.3, 0),
    //     new Vector3(0, 0.3, 0),
    //     axisA: CANNON.Vec3.UNITY,
    //     axisB: CANNON.Vec3.UNITY,
    //     angle: Math.PI / 4,
    //     twistAngle: Math.PI / 8
    //   }
    // ));

    const neckJoint = physics.createImpulseJoint(
      JointData.spherical(
        { x: 0, y: -0.25, z: 0 }, // Point where the joint is attached on the first rigid-body affected by this joint. Expressed in the local-space of the rigid-body.
        { x: 0, y: 0.3, z: 0 }),  // Point where the joint is attached on the second rigid-body affected by this joint. Expressed in the local-space of the rigid-body.
      headBody,
      chestBody,
      true
    );

/** * /

    const waistJoint = physics.createImpulseJoint(
      JointData.spherical({ x: 0, y: -0.3, z: 0 }, { x: 0, y: 0.075, z: 0 }),
      chestBody,
      hipsBody,
      true,
    );

    const shoulderLJoint = physics.createImpulseJoint(
      JointData.spherical({ x: 0.3, y: 0.25, z: 0 }, { x: -0.2, y: 0, z: 0 }),
      chestBody,
      upperShoulderLBody,
      true,
    );

    const elbowLJoint = physics.createImpulseJoint(
      JointData.spherical({ x: 0.2, y: 0, z: 0 }, { x: -0.2, y: 0, z: 0 }),
      upperShoulderLBody,
      lowerShoulderLBody,
      true,
    );

    const wristLJoint = physics.createImpulseJoint(
      JointData.spherical({ x: 0.2, y: 0, z: 0 }, { x: -0.1, y: 0, z: 0 }),
      lowerShoulderLBody,
      handLBody,
      true
    );

    const shoulderRJoint = physics.createImpulseJoint(
      JointData.spherical({ x: -0.3, y: 0.25, z: 0 }, { x: 0.2, y: 0, z: 0 }),
      chestBody,
      upperShoulderRBody,
      true,
    );

  /** /

      //UpperShoulderR to LowerShoulderR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: -0.2,y: 0, 0),
{ x: 0.2,y: 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      upperShoulderRBody,
      lowerShoulderRBody
      ));

      //LowerShoulderR to HandR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: -0.2,y: 0, 0),
{ x: 0.1,y: 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 8,
          // twistAngle: Math.PI / 8
        ),
      lowerShoulderRBody,
      handRBody
      ));

      //Hips to UpperLegL
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: 0.2,y: -0.15, 0),
{ x: 0, y:0.2, 0),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      hipsBody,
      upperLegLBody
      ));

      //UpperLegL to LowerLegL
    jointList.push(physics.createImpulseJoint(
        JointData.revolute(
{ x: 0, y:-0.2, 0),
{ x: 0, y:0.2, 0),

{ x: 0, y:1, 0), // ///????

          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          ////angle: Math.PI/4,
          ////twistAngle: Math.PI/8
        ),
      upperLegLBody,
      lowerLegLBody
      ));

      //LowerLegL to FootL
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: 0, y:-0.2, 0),
{ x: 0, y:0.06, -0.04),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 8,
          // twistAngle: Math.PI / 8
        ),
      lowerLegLBody,
      footLBody
      ));

      //Hips to UpperLegR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: -0.2,y: -0.15, 0),
{ x: 0, y:0.2, 0),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      hipsBody,
      upperLegRBody
      ));

      //UpperLegR to LowerLegR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
{ x: 0, y:-0.2, 0),
{ x: 0, y:0.2, 0),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      upperLegRBody,
      lowerLegRBody
      ));

  /**/

    const ankleRJoint = physics.createImpulseJoint(
      JointData.spherical({ x: 0, y: -0.2, z: 0 }, { x: 0, y: 0.06, z: -0.04 }),
      lowerLegRBody,
      footRBody,
      true,
    );




    meshList.push(head);
    meshList.push(chest);
    meshList.push(hips);
    meshList.push(upperShoulderL);
    meshList.push(lowerShoulderL);
    meshList.push(handL);
    meshList.push(upperShoulderR);
    meshList.push(lowerShoulderR);
    meshList.push(handR);
    meshList.push(upperLegL);
    meshList.push(lowerLegL);
    meshList.push(footL);
    meshList.push(upperLegR);
    meshList.push(lowerLegR);
    meshList.push(footR);

    bodyList.push(headBody);
    bodyList.push(chestBody);
    bodyList.push(hipsBody);
    bodyList.push(upperShoulderLBody);
    bodyList.push(lowerShoulderLBody);
    bodyList.push(handLBody);
    bodyList.push(upperShoulderRBody);
    bodyList.push(lowerShoulderRBody);
    bodyList.push(handRBody);
    bodyList.push(upperLegLBody);
    bodyList.push(lowerLegLBody);
    bodyList.push(footLBody);
    bodyList.push(upperLegRBody);
    bodyList.push(lowerLegRBody);
    bodyList.push(footRBody);

    jointList.push(neckJoint);


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
      { mesh: head, body: headBody },
      { mesh: chest, body: chestBody },
      { mesh: hips, body: hipsBody },
      { mesh: upperShoulderL, body: upperShoulderLBody },
      { mesh: lowerShoulderL, body: lowerShoulderLBody },
      { mesh: handL, body: handLBody },
      { mesh: upperShoulderR, body: upperShoulderRBody },
      { mesh: lowerShoulderR, body: lowerShoulderRBody },
      { mesh: handR, body: handRBody },
      { mesh: upperLegL, body: upperLegLBody },
      { mesh: lowerLegL, body: lowerLegLBody },
      { mesh: footL, body: footLBody },
      { mesh: upperLegR, body: upperLegRBody },
      { mesh: lowerLegR, body: lowerLegRBody },
      { mesh: footR, body: footRBody },
    );

    //////////////////////////////////////////////////////////////
  }
  update(t: number) {
    // pivot.rotation.y += 0.005;
    super.update(t);
  }
}
