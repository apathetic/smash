import { BoxGeometry, MeshPhongMaterial, Mesh, Group } from 'three';
import { RigidBodyDesc, ColliderDesc, JointData, Vector3 } from '@dimforge/rapier3d';
import { Base } from './Base';
// import { usePhysics } from '~/system/physics';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


function createBox(sizeX = 1, sizeY = 1, sizeZ = 1, color = 0xffffff) {
  const geometry = new BoxGeometry(sizeX, sizeY, sizeZ);
  const material = new MeshPhongMaterial({ color });

  return new Mesh(geometry, material);
}

const createBoxBody = (physics: World) => (sizeX = 0.5, sizeY = 0.5, sizeZ = 0.5, mass = 1) => {
  // const shape = new CANNON.Box(new Vector3(sizeX, sizeY, sizeZ));
  // return new CANNON.Body({ shape, mass });

  const rigidBodyDesc = RigidBodyDesc
    .dynamic()
    .setTranslation(0, 0, 0)
    .setCanSleep(false);

  const colliderDesc = ColliderDesc
    .cuboid(sizeX, sizeY, sizeZ)
    .setMass(mass)
    .setRestitution(0.5);

  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);

  return body;
}

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




//
// DISCLAIMER: WORK IN PROGRESS! WILL CLEAN UP!
//



/**
 * Ragdoll character
 */
export class RagDoll extends Base {
  setup (scene: Scene, physics: World) {
    const meshList = [];
    const bodyList = [];
    const jointList = [];

    let x = 0;
    let y = 0;
    let z = 0;

    let skin = skinColors[Math.floor(Math.random() * skinColors.length)];
    let shirt = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let pants = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let foot = clothingColors[Math.floor(Math.random() * clothingColors.length)];

    const createBody = createBoxBody(physics);

    const head = createBox(0.5, 0.5, 0.5, skin);
    const headBody = createBody(0.25, 0.25, 0.25);
    head.position.set(0, 2.18, 0);
    head.position.x += x;
    head.position.y += y;
    head.position.z += z;
    // headBody.position.copy(head.position);
    head.position.copy(headBody.translation());

    const chest = createBox(0.6, 0.6, 0.3, shirt);
    const chestBody = createBody(0.3, 0.3, 0.15);
    chest.position.set(0, 1.61, 0);
    chest.position.x += x;
    chest.position.y += y;
    chest.position.z += z;
    chest.position.copy(chestBody.translation());

    const hips = createBox(0.6, 0.3, 0.3, shirt);
    const hipsBody = createBody(0.3, 0.15, 0.15);
    hips.position.set(0, 1.14, 0);
    hips.position.x += x;
    hips.position.y += y;
    hips.position.z += z;
    hips.position.copy(hipsBody.translation());

    const upperShoulderL = createBox(0.4, 0.2, 0.2, shirt);
    const upperShoulderLBody = createBody(0.2, 0.1, 0.1);
    upperShoulderL.position.set(0.51, 1.8, 0);
    upperShoulderL.position.x += x;
    upperShoulderL.position.y += y;
    upperShoulderL.position.z += z;
    upperShoulderL.position.copy(upperShoulderLBody.translation());

    const lowerShoulderL = createBox(0.4, 0.2, 0.2, skin);
    const lowerShoulderLBody = createBody(0.2, 0.1, 0.1);
    lowerShoulderL.position.set(0.92, 1.8, 0);
    lowerShoulderL.position.x += x;
    lowerShoulderL.position.y += y;
    lowerShoulderL.position.z += z;
    lowerShoulderL.position.copy(lowerShoulderLBody.translation());

    const handL = createBox(0.2, 0.2, 0.2, skin);
    const handLBody = createBody(0.1, 0.1, 0.1);
    handL.position.set(1.23, 1.8, 0);
    handL.position.x += x;
    handL.position.y += y;
    handL.position.z += z;
    handL.position.copy(handLBody.translation());

    const upperShoulderR = createBox(0.4, 0.2, 0.2, shirt);
    const upperShoulderRBody = createBody(0.2, 0.1, 0.1);
    upperShoulderR.position.set(-0.51, 1.8, 0);
    upperShoulderR.position.x += x;
    upperShoulderR.position.y += y;
    upperShoulderR.position.z += z;
    upperShoulderR.position.copy(upperShoulderRBody.translation());

    const lowerShoulderR = createBox(0.4, 0.2, 0.2, skin);
    const lowerShoulderRBody = createBody(0.2, 0.1, 0.1);
    lowerShoulderR.position.set(-0.92, 1.8, 0);
    lowerShoulderR.position.x += x;
    lowerShoulderR.position.y += y;
    lowerShoulderR.position.z += z;
    lowerShoulderR.position.copy(lowerShoulderRBody.translation());

    const handR = createBox(0.2, 0.2, 0.2, skin);
    const handRBody = createBody(0.1, 0.1, 0.1);
    handR.position.set(-1.23, 1.8, 0);
    handR.position.x += x;
    handR.position.y += y;
    handR.position.z += z;
    handR.position.copy(handRBody.translation());

    const upperLegL = createBox(0.2, 0.4, 0.2, pants);
    const upperLegLBody = createBody(0.1, 0.2, 0.1);
    upperLegL.position.set(0.2, 0.78, 0);
    upperLegL.position.x += x;
    upperLegL.position.y += y;
    upperLegL.position.z += z;
    upperLegL.position.copy(upperLegLBody.translation());

    const lowerLegL = createBox(0.2, 0.4, 0.2, skin);
    const lowerLegLBody = createBody(0.1, 0.2, 0.1);
    lowerLegL.position.set(0.2, 0.36, 0);
    lowerLegL.position.x += x;
    lowerLegL.position.y += y;
    lowerLegL.position.z += z;
    lowerLegL.position.copy(lowerLegLBody.translation());

    const footL = createBox(0.2, 0.12, 0.35, foot);
    const footLBody = createBody(0.1, 0.06, 0.1525);
    footL.position.set(0.2, 0.08, 0.05);
    footL.position.x += x;
    footL.position.y += y;
    footL.position.z += z;
    footL.position.copy(footLBody.translation());

    const upperLegR = createBox(0.2, 0.4, 0.2, pants);
    const upperLegRBody = createBody(0.1, 0.2, 0.1);
    upperLegR.position.set(-0.2, 0.78, 0);
    upperLegR.position.x += x;
    upperLegR.position.y += y;
    upperLegR.position.z += z;
    upperLegR.position.copy(upperLegRBody.translation());

    const lowerLegR = createBox(0.2, 0.4, 0.2, skin);
    const lowerLegRBody = createBody(0.1, 0.2, 0.1);
    lowerLegR.position.set(-0.2, 0.36, 0);
    lowerLegR.position.x += x;
    lowerLegR.position.y += y;
    lowerLegR.position.z += z;
    lowerLegR.position.copy(lowerLegRBody.translation());

    const footR = createBox(0.2, 0.12, 0.35, foot);
    const footRBody = createBody(0.1, 0.06, 0.1525);
    footR.position.set(-0.2, 0.08, 0.05);
    footR.position.x += x;
    footR.position.y += y;
    footR.position.z += z;
    footR.position.copy(footRBody.translation());

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

  /** /

    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0, -0.25, 0),
          new Vector3(0, 0.3, 0),
        ),
        //   axisA: CANNON.Vec3.UNITY,
        //   axisB: CANNON.Vec3.UNITY,
        //   angle: Math.PI / 4,
        //   twistAngle: Math.PI / 8
        // },
      headBody,
      chestBody,
      ));

      //Chest to Hips
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0, -0.3, 0),
          new Vector3(0, 0.075, 0),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      chestBody,
      hipsBody,
      ));

      //Chest to UpperShoulderL
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0.3, 0.25, 0),
          new Vector3(-0.2, 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 3,
          // twistAngle: Math.PI / 8
        ),
      chestBody,
      upperShoulderLBody
      ));

      //UpperShoulderL to LowerShoulderL
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0.2, 0, 0),
          new Vector3(-0.2, 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      upperShoulderLBody,
      lowerShoulderLBody,
      ));

      //LowerShoulderL to HandL
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0.2, 0, 0),
          new Vector3(-0.1, 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 8,
          // twistAngle: Math.PI / 8
        ),
      lowerShoulderLBody,
      handLBody
      ));

      //Chest to UpperShoulderR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(-0.3, 0.25, 0),
          new Vector3(0.2, 0, 0),
          // axisA: CANNON.Vec3.UNITX,
          // axisB: CANNON.Vec3.UNITX,
          // angle: Math.PI / 3,
          // twistAngle: Math.PI / 8
        ),
      chestBody,
      upperShoulderRBody
      ));

      //UpperShoulderR to LowerShoulderR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(-0.2, 0, 0),
          new Vector3(0.2, 0, 0),
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
          new Vector3(-0.2, 0, 0),
          new Vector3(0.1, 0, 0),
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
          new Vector3(0.2, -0.15, 0),
          new Vector3(0, 0.2, 0),
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
          new Vector3(0, -0.2, 0),
          new Vector3(0, 0.2, 0),

          new Vector3(0, 1, 0), // ///????

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
          new Vector3(0, -0.2, 0),
          new Vector3(0, 0.06, -0.04),
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
          new Vector3(-0.2, -0.15, 0),
          new Vector3(0, 0.2, 0),
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
          new Vector3(0, -0.2, 0),
          new Vector3(0, 0.2, 0),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 4,
          // twistAngle: Math.PI / 8
        ),
      upperLegRBody,
      lowerLegRBody
      ));

      //LowerLegR to FootR
    jointList.push(physics.createImpulseJoint(
        JointData.spherical(
          new Vector3(0, -0.2, 0),
          new Vector3(0, 0.06, -0.04),
          // axisA: CANNON.Vec3.UNITY,
          // axisB: CANNON.Vec3.UNITY,
          // angle: Math.PI / 8,
          // twistAngle: Math.PI / 8
        ),
      lowerLegRBody,
      footRBody
      ));


  /**/

      //Custom Mesh
    const eyeL = createBox(0.04, 0.04, 0.04, 0x000000);
    eyeL.position.set(0.11, 0.09, 0.25);
    const eyeBrowL = createBox(0.13, 0.05, 0.04, 0x000000);
    eyeBrowL.position.set(0.12, 0.15, 0.25);
    const eyeR = createBox(0.04, 0.04, 0.04, 0x000000);
    eyeR.position.set(-0.11, 0.09, 0.25);
    const eyeBrowR = createBox(0.13, 0.05, 0.04, 0x000000);
    eyeBrowR.position.set(-0.12, 0.15, 0.25);
    const mouth = createBox(0.2, 0.05, 0.04, 0xff5555);
    mouth.position.set(0, -0.15, 0.25);
    const ear = createBox(0.65, 0.15, 0.05, skin);
    ear.position.set(0, 0, 0);
    const hairT = createBox(0.4, 0.5, 0.6, 0x000000);
    hairT.position.set(0, 0.2, -0.1);
    const hairB = createBox(0.6, 0.5, 0.35, 0x000000);
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
    meshList.forEach((mesh) => scene.add(mesh));
    // this.dynamicBodies.push({ mesh, body });
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
  update() {
    // pivot.rotation.y += 0.005;
  }
}
