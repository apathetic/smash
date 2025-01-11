import * as CANNON from 'cannon-es';
import {
  BoxGeometry,
  MeshPhongMaterial,
  Mesh,
  Group
} from 'three';


function createBox(sizeX = 1, sizeY = 1, sizeZ = 1, color = 0xffffff) {
  const geometry = new BoxGeometry(sizeX, sizeY, sizeZ);
  const material = new MeshPhongMaterial({ color });

  return new Mesh(geometry, material);
}

function createBoxBody(sizeX = 0.5, sizeY = 0.5, sizeZ = 0.5, mass = 1) {
  const shape = new CANNON.Box(new CANNON.Vec3(sizeX, sizeY, sizeZ));

  return new CANNON.Body({ shape, mass });
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

class Character {
  constructor(_x = 0, _y = 0, _z = 0) {
    this.meshList = [];
    this.bodyList = [];
    this.jointList = [];

    let skin = skinColors[Math.floor(Math.random() * skinColors.length)];
    let shirt = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let pants = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    let foot = clothingColors[Math.floor(Math.random() * clothingColors.length)];

    this.head = createBox(0.5, 0.5, 0.5, skin);
    this.head.position.set(0, 2.18, 0);
    this.head.position.x += _x;
    this.head.position.y += _y;
    this.head.position.z += _z;
    this.headBody = createBoxBody(0.25, 0.25, 0.25);
    this.headBody.position.copy(this.head.position);

    this.chest = createBox(0.6, 0.6, 0.3, shirt);
    this.chest.position.set(0, 1.61, 0);
    this.chest.position.x += _x;
    this.chest.position.y += _y;
    this.chest.position.z += _z;
    this.chestBody = createBoxBody(0.3, 0.3, 0.15);
    this.chestBody.position.copy(this.chest.position);

    this.hips = createBox(0.6, 0.3, 0.3, shirt);
    this.hips.position.set(0, 1.14, 0);
    this.hips.position.x += _x;
    this.hips.position.y += _y;
    this.hips.position.z += _z;
    this.hipsBody = createBoxBody(0.3, 0.15, 0.15);
    this.hipsBody.position.copy(this.hips.position);

    this.upperShoulderL = createBox(0.4, 0.2, 0.2, shirt);
    this.upperShoulderL.position.set(0.51, 1.8, 0);
    this.upperShoulderL.position.x += _x;
    this.upperShoulderL.position.y += _y;
    this.upperShoulderL.position.z += _z;
    this.upperShoulderLBody = createBoxBody(0.2, 0.1, 0.1);
    this.upperShoulderLBody.position.copy(this.upperShoulderL.position);

    this.lowerShoulderL = createBox(0.4, 0.2, 0.2, skin);
    this.lowerShoulderL.position.set(0.92, 1.8, 0);
    this.lowerShoulderL.position.x += _x;
    this.lowerShoulderL.position.y += _y;
    this.lowerShoulderL.position.z += _z;
    this.lowerShoulderLBody = createBoxBody(0.2, 0.1, 0.1);
    this.lowerShoulderLBody.position.copy(this.lowerShoulderL.position);

    this.handL = createBox(0.2, 0.2, 0.2, skin);
    this.handL.position.set(1.23, 1.8, 0);
    this.handL.position.x += _x;
    this.handL.position.y += _y;
    this.handL.position.z += _z;
    this.handLBody = createBoxBody(0.1, 0.1, 0.1);
    this.handLBody.position.copy(this.handL.position);

    this.upperShoulderR = createBox(0.4, 0.2, 0.2, shirt);
    this.upperShoulderR.position.set(-0.51, 1.8, 0);
    this.upperShoulderR.position.x += _x;
    this.upperShoulderR.position.y += _y;
    this.upperShoulderR.position.z += _z;
    this.upperShoulderRBody = createBoxBody(0.2, 0.1, 0.1);
    this.upperShoulderRBody.position.copy(this.upperShoulderR.position);

    this.lowerShoulderR = createBox(0.4, 0.2, 0.2, skin);
    this.lowerShoulderR.position.set(-0.92, 1.8, 0);
    this.lowerShoulderR.position.x += _x;
    this.lowerShoulderR.position.y += _y;
    this.lowerShoulderR.position.z += _z;
    this.lowerShoulderRBody = createBoxBody(0.2, 0.1, 0.1);
    this.lowerShoulderRBody.position.copy(this.lowerShoulderR.position);

    this.handR = createBox(0.2, 0.2, 0.2, skin);
    this.handR.position.set(-1.23, 1.8, 0);
    this.handR.position.x += _x;
    this.handR.position.y += _y;
    this.handR.position.z += _z;
    this.handRBody = createBoxBody(0.1, 0.1, 0.1);
    this.handRBody.position.copy(this.handR.position);

    this.upperLegL = createBox(0.2, 0.4, 0.2, pants);
    this.upperLegL.position.set(0.2, 0.78, 0);
    this.upperLegL.position.x += _x;
    this.upperLegL.position.y += _y;
    this.upperLegL.position.z += _z;
    this.upperLegLBody = createBoxBody(0.1, 0.2, 0.1);
    this.upperLegLBody.position.copy(this.upperLegL.position);

    this.lowerLegL = createBox(0.2, 0.4, 0.2, skin);
    this.lowerLegL.position.set(0.2, 0.36, 0);
    this.lowerLegL.position.x += _x;
    this.lowerLegL.position.y += _y;
    this.lowerLegL.position.z += _z;
    this.lowerLegLBody = createBoxBody(0.1, 0.2, 0.1);
    this.lowerLegLBody.position.copy(this.lowerLegL.position);

    this.footL = createBox(0.2, 0.12, 0.35, foot);
    this.footL.position.set(0.2, 0.08, 0.05);
    this.footL.position.x += _x;
    this.footL.position.y += _y;
    this.footL.position.z += _z;
    this.footLBody = createBoxBody(0.1, 0.06, 0.1525);
    this.footLBody.position.copy(this.footL.position);

    this.upperLegR = createBox(0.2, 0.4, 0.2, pants);
    this.upperLegR.position.set(-0.2, 0.78, 0);
    this.upperLegR.position.x += _x;
    this.upperLegR.position.y += _y;
    this.upperLegR.position.z += _z;
    this.upperLegRBody = createBoxBody(0.1, 0.2, 0.1);
    this.upperLegRBody.position.copy(this.upperLegR.position);

    this.lowerLegR = createBox(0.2, 0.4, 0.2, skin);
    this.lowerLegR.position.set(-0.2, 0.36, 0);
    this.lowerLegR.position.x += _x;
    this.lowerLegR.position.y += _y;
    this.lowerLegR.position.z += _z;
    this.lowerLegRBody = createBoxBody(0.1, 0.2, 0.1);
    this.lowerLegRBody.position.copy(this.lowerLegR.position);

    this.footR = createBox(0.2, 0.12, 0.35, foot);
    this.footR.position.set(-0.2, 0.08, 0.05);
    this.footR.position.x += _x;
    this.footR.position.y += _y;
    this.footR.position.z += _z;
    this.footRBody = createBoxBody(0.1, 0.06, 0.1525);
    this.footRBody.position.copy(this.footR.position);

    this.meshList.push(this.head);
    this.meshList.push(this.chest);
    this.meshList.push(this.hips);
    this.meshList.push(this.upperShoulderL);
    this.meshList.push(this.lowerShoulderL);
    this.meshList.push(this.handL);
    this.meshList.push(this.upperShoulderR);
    this.meshList.push(this.lowerShoulderR);
    this.meshList.push(this.handR);
    this.meshList.push(this.upperLegL);
    this.meshList.push(this.lowerLegL);
    this.meshList.push(this.footL);
    this.meshList.push(this.upperLegR);
    this.meshList.push(this.lowerLegR);
    this.meshList.push(this.footR);

    this.bodyList.push(this.headBody);
    this.bodyList.push(this.chestBody);
    this.bodyList.push(this.hipsBody);
    this.bodyList.push(this.upperShoulderLBody);
    this.bodyList.push(this.lowerShoulderLBody);
    this.bodyList.push(this.handLBody);
    this.bodyList.push(this.upperShoulderRBody);
    this.bodyList.push(this.lowerShoulderRBody);
    this.bodyList.push(this.handRBody);
    this.bodyList.push(this.upperLegLBody);
    this.bodyList.push(this.lowerLegLBody);
    this.bodyList.push(this.footLBody);
    this.bodyList.push(this.upperLegRBody);
    this.bodyList.push(this.lowerLegRBody);
    this.bodyList.push(this.footRBody);

    //Head to Chest
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.headBody,
      this.chestBody, {
        pivotA: new CANNON.Vec3(0, -0.25, 0),
        pivotB: new CANNON.Vec3(0, 0.3, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //Chest to Hips
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.chestBody,
      this.hipsBody, {
        pivotA: new CANNON.Vec3(0, -0.3, 0),
        pivotB: new CANNON.Vec3(0, 0.075, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //Chest to UpperShoulderL
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.chestBody,
      this.upperShoulderLBody, {
        pivotA: new CANNON.Vec3(0.3, 0.25, 0),
        pivotB: new CANNON.Vec3(-0.2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 3,
        twistAngle: Math.PI / 8
      }
    ));

    //UpperShoulderL to LowerShoulderL
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.upperShoulderLBody,
      this.lowerShoulderLBody, {
        pivotA: new CANNON.Vec3(0.2, 0, 0),
        pivotB: new CANNON.Vec3(-0.2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //LowerShoulderL to HandL
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.lowerShoulderLBody,
      this.handLBody, {
        pivotA: new CANNON.Vec3(0.2, 0, 0),
        pivotB: new CANNON.Vec3(-0.1, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 8,
        twistAngle: Math.PI / 8
      }
    ));

    //Chest to UpperShoulderR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.chestBody,
      this.upperShoulderRBody, {
        pivotA: new CANNON.Vec3(-0.3, 0.25, 0),
        pivotB: new CANNON.Vec3(0.2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 3,
        twistAngle: Math.PI / 8
      }
    ));

    //UpperShoulderR to LowerShoulderR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.upperShoulderRBody,
      this.lowerShoulderRBody, {
        pivotA: new CANNON.Vec3(-0.2, 0, 0),
        pivotB: new CANNON.Vec3(0.2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //LowerShoulderR to HandR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.lowerShoulderRBody,
      this.handRBody, {
        pivotA: new CANNON.Vec3(-0.2, 0, 0),
        pivotB: new CANNON.Vec3(0.1, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: Math.PI / 8,
        twistAngle: Math.PI / 8
      }
    ));

    //Hips to UpperLegL
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.hipsBody,
      this.upperLegLBody, {
        pivotA: new CANNON.Vec3(0.2, -0.15, 0),
        pivotB: new CANNON.Vec3(0, 0.2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //UpperLegL to LowerLegL
    this.jointList.push(new CANNON.HingeConstraint(
      this.upperLegLBody,
      this.lowerLegLBody, {
        pivotA: new CANNON.Vec3(0, -0.2, 0),
        pivotB: new CANNON.Vec3(0, 0.2, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        //angle: Math.PI/4,
        //twistAngle: Math.PI/8
      }
    ));

    //LowerLegL to FootL
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.lowerLegLBody,
      this.footLBody, {
        pivotA: new CANNON.Vec3(0, -0.2, 0),
        pivotB: new CANNON.Vec3(0, 0.06, -0.04),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 8,
        twistAngle: Math.PI / 8
      }
    ));

    //Hips to UpperLegR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.hipsBody,
      this.upperLegRBody, {
        pivotA: new CANNON.Vec3(-0.2, -0.15, 0),
        pivotB: new CANNON.Vec3(0, 0.2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //UpperLegR to LowerLegR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.upperLegRBody,
      this.lowerLegRBody, {
        pivotA: new CANNON.Vec3(0, -0.2, 0),
        pivotB: new CANNON.Vec3(0, 0.2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 4,
        twistAngle: Math.PI / 8
      }
    ));

    //LowerLegR to FootR
    this.jointList.push(new CANNON.ConeTwistConstraint(
      this.lowerLegRBody,
      this.footRBody, {
        pivotA: new CANNON.Vec3(0, -0.2, 0),
        pivotB: new CANNON.Vec3(0, 0.06, -0.04),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: Math.PI / 8,
        twistAngle: Math.PI / 8
      }
    ));

    //Custom Mesh
    this.eyeL = createBox(0.04, 0.04, 0.04, 0x000000);
    this.eyeL.position.set(0.11, 0.09, 0.25);
    this.eyeBrowL = createBox(0.13, 0.05, 0.04, 0x000000);
    this.eyeBrowL.position.set(0.12, 0.15, 0.25);
    this.eyeR = createBox(0.04, 0.04, 0.04, 0x000000);
    this.eyeR.position.set(-0.11, 0.09, 0.25);
    this.eyeBrowR = createBox(0.13, 0.05, 0.04, 0x000000);
    this.eyeBrowR.position.set(-0.12, 0.15, 0.25);
    this.mouth = createBox(0.2, 0.05, 0.04, 0xff5555);
    this.mouth.position.set(0, -0.15, 0.25);
    this.ear = createBox(0.65, 0.15, 0.05, skin);
    this.ear.position.set(0, 0, 0);
    this.hairT = createBox(0.4, 0.5, 0.6, 0x000000);
    this.hairT.position.set(0, 0.2, -0.1);
    this.hairB = createBox(0.6, 0.5, 0.35, 0x000000);
    this.hairB.position.set(0, 0.1, -0.2);

    this.head.add(this.eyeL);
    this.head.add(this.eyeBrowL);
    this.head.add(this.eyeR);
    this.head.add(this.eyeBrowR);
    this.head.add(this.mouth);
    this.head.add(this.ear);
    this.head.add(this.hairT);
    this.head.add(this.hairB);
  }
}


class RagDoll {
  constructor() {
    const group = new Group();
    const ragdoll = new Character();

    for (let mesh of ragdoll.meshList) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh); // scene.add(
    }

    for (let body of ragdoll.bodyList) {
      world.addBody(body);
    }

    for (let joint of ragdoll.jointList) {
      world.addConstraint(joint);
    }
  }

  tick() {
    for (let a = 0; a < this.bodyList.length; a++) {
      this.meshList[a].position.copy(this.bodyList[a].position);
      this.meshList[a].quaternion.copy(this.bodyList[a].quaternion);
    }

    this.pivot.rotation.y += 0.005;
    this.world.step(this.dt);
  }
}


// export default Character;
export default () => new RagDoll(props);
