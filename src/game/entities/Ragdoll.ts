import { BoxGeometry, MeshPhongMaterial, Mesh } from 'three';
import { RigidBodyDesc, ColliderDesc, JointData, ActiveEvents,   /* PrismaticImpulseJoint, SphericalImpulseJoint */ } from 'rapier';
import { COLLISION_GROUP_DYNAMIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World, RigidBody, RevoluteImpulseJoint } from 'rapier';
import type { Scene } from 'three';


/**
 * Muscle tone: every hinge joint gets a weak position motor pulling it
 * back toward the spawn pose, plus rotation limits, so limbs are
 * moderately stiff and only bend at natural angles.
 */
/**
 * Joint motor gains, expressed *per kg* of the limb the joint holds. Both
 * muscle tone and the gravity that fights it scale with mass, so scaling
 * the gains keeps that balance identical for a 0.6kg hand and a 10kg
 * thigh — gravity leads, the motor only supplies tone.
 */
const JOINT_STIFFNESS = 0.3;
const JOINT_DAMPING = 0.05;

/**
 * The only parts that may be grabbed. Dragging by a limb hangs the whole
 * body off one joint chain, which poses it in awkward ways that are hard
 * to undo; the core parts carry the body predictably.
 */
const DRAGGABLE_PARTS = ['head', 'chest', 'hips'];

/**
 * Body-part masses (kg): a standard anthropometric distribution for a
 * ~100kg adult. The *ratios* are what matter — the torso has to dominate
 * the limbs. When every part weighed the same, the arms and legs together
 * outweighed the torso 5:1, so anything holding the ragdoll was dragged
 * around by its own limbs.
 */
const MASS = {
  head:     8,
  chest:    35,
  hips:     14,
  upperArm: 3,
  foreArm:  1.5,
  hand:     0.6,
  upperLeg: 10,
  lowerLeg: 4.5,
  foot:     1.5,
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


const createMesh = (x: number, y: number, z: number, color: number) => {
  const geometry = new BoxGeometry(x, y, z);
  const material = new MeshPhongMaterial({ color });
  const mesh     = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

const createBoxBody = (physics: World, meshList: Mesh[], bodyList: RigidBody[]) => ({
  size =     [0, 0, 0] as Tuple,
  position = [0, 0, 0] as Position,
  mass = 1,
  color = 0xffffff
}) => {
  const [x, y, z] = size;
  const mesh = createMesh(x, y, z, color);

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
    .setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS)
    .setContactForceEventThreshold(10) // the amount of force required to trigger a "damage" event
    .setCollisionGroups(COLLISION_GROUP_DYNAMIC);

  const body = physics.createRigidBody(rigidBodyDesc);
  const _collider = physics.createCollider(colliderDesc, body);

  mesh.position.set(...position);
  meshList.push(mesh);
  bodyList.push(body);

  return [mesh, body] as any;
};


/**
 * Ragdoll
 * @returns WorldEntity
 */
export class RagDoll extends Base {
  private lastImpactCount = 0;

  constructor(props: any = {}) {
    super(props);
    this.id = 'ragdoll';
  }

  setup(scene: Scene, physics: World) {

    const meshList: Mesh[] = [];
    const bodyList: RigidBody[] = [];
    const createMeshBody = createBoxBody(physics, meshList, bodyList);

    // Jointed neighbours overlap at their anchor points; disabling their
    // contacts stops them fighting the joint (standard ragdoll practice).
    // Non-adjacent parts still collide normally. Hinge joints created with
    // `limits` also get a position motor for muscle tone.
    const createJoint = (data: JointData, b1: RigidBody, b2: RigidBody, limits?: [number, number]) => {
      const joint = physics.createImpulseJoint(data, b1, b2, true);
      joint.setContactsEnabled(false);
      if (limits) {
        // Gains scale with the lighter of the two bodies — the segment the
        // joint actually holds up (a hand at the wrist, the head at the neck).
        const held = Math.min(b1.mass(), b2.mass());
        (joint as RevoluteImpulseJoint).setLimits(...limits);
        (joint as RevoluteImpulseJoint).configureMotorPosition(0, JOINT_STIFFNESS * held, JOINT_DAMPING * held);
      }
      return joint;
    };

    const skin  =     skinColors[Math.floor(Math.random() * skinColors.length)];
    const shirt = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    const pants = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    const foot  = clothingColors[Math.floor(Math.random() * clothingColors.length)];


    const [head, headBody] = createMeshBody({
      size:     [0.5, 0.5,  0.5],
      position: [0.0, 2.35, 0.0],
      mass: MASS.head,
      color: skin
    });

    const [chest, chestBody] = createMeshBody({
      size:     [0.6, 0.6,  0.3],
      position: [0.0, 1.8, 0.0],
      mass: MASS.chest,
      color: shirt
    });

    const [hips, hipsBody] = createMeshBody({
      size:     [0.6, 0.3,  0.3],
      position: [0.0, 1.425, 0.0],
      mass: MASS.hips,
      color: shirt
    });

    const [upperArmL, upperArmLBody] = createMeshBody({
      size:     [0.4,  0.2, 0.2],
      position: [0.5, 2.05, 0.0],
      mass: MASS.upperArm,
      color: shirt
    });

    const [foreArmL, foreArmLBody] = createMeshBody({
      size:     [0.4,  0.2, 0.2],
      position: [0.9, 2.05, 0.0],
      mass: MASS.foreArm,
      color: skin
    });

    const [handL, handLBody] = createMeshBody({
      size:     [0.2,  0.2, 0.2],
      position: [1.2, 2.05, 0.0],
      mass: MASS.hand,
      color: skin
    });

    const [upperArmR, upperArmRBody] = createMeshBody({
      size:     [ 0.4,  0.2, 0.2],
      position: [-0.5, 2.05, 0.0],
      mass: MASS.upperArm,
      color: shirt
    });

    const [foreArmR, foreArmRBody] = createMeshBody({
      size:     [ 0.4,  0.2, 0.2],
      position: [-0.9, 2.05, 0.0],
      mass: MASS.foreArm,
      color: skin
    });

    const [handR, handRBody] = createMeshBody({
      size:     [ 0.2,  0.2, 0.2],
      position: [-1.2, 2.05, 0.0],
      mass: MASS.hand,
      color: skin
    });

    const [upperLegL, upperLegLBody] = createMeshBody({
      size:     [0.2, 0.4,  0.2],
      position: [0.2, 1.075, 0.0],
      mass: MASS.upperLeg,
      color: pants
    });

    const [lowerLegL, lowerLegLBody] = createMeshBody({
      size:     [0.2, 0.4,  0.2],
      position: [0.2, 0.675, 0.0],
      mass: MASS.lowerLeg,
      color: skin
    });

    const [footL, footLBody] = createMeshBody({
      size:     [0.2, 0.12, 0.35],
      position: [0.2, 0.415, 0.04],
      mass: MASS.foot,
      color: foot
    });

    const [upperLegR, upperLegRBody] = createMeshBody({
      size:     [ 0.2, 0.4,  0.2],
      position: [-0.2, 1.075, 0.0],
      mass: MASS.upperLeg,
      color: pants
    });

    const [lowerLegR, lowerLegRBody] = createMeshBody({
      size:     [ 0.2, 0.4,  0.2],
      position: [-0.2, 0.675, 0.0],
      mass: MASS.lowerLeg,
      color: skin
    });

    const [footR, footRBody] = createMeshBody({
      size:     [ 0.2, 0.12, 0.35],
      position: [-0.2, 0.415, 0.04],
      mass: MASS.foot,
      color: foot
    });


    //////////


    const neckJointData = JointData.revolute(
      { x: 0, y: -0.25, z: 0 },  // Point where the joint is attached on the first rigid-body
      { x: 0, y: 0.3, z: 0 },    // Point where the joint is attached on the second rigid-body
      { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 } // Different axis (front-to-back movement); must be a unit vector
    );
    const _neckJoint = createJoint(neckJointData, headBody, chestBody, [-0.6, 0.6]);


    const waistData = JointData.revolute(
      { x: 0, y: -0.3, z: 0 },
      { x: 0, y: 0.075, z: 0 },
      { x: 1, y: 0, z: 0 }          // Axis of rotation (x-axis = side-to-side bending)
    );
    const limitAngle = Math.PI / 6; // 30 degrees rotation limit
    const _waistJoint = createJoint(waistData, chestBody, hipsBody, [-limitAngle, limitAngle]);


    // Shoulders hinge about the Z-axis so the arms swing between the
    // T-pose and hanging at the sides; elbows hinge about Y and bend
    // forward only, like real elbows
    const shoulderLData = JointData.revolute({ x: 0.3, y: 0.25, z: 0 }, { x: -0.2, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const _shoulderLJoint = createJoint(shoulderLData, chestBody, upperArmLBody, [-1.6, 0.3]);


    const elbowLData = JointData.revolute({ x: 0.2, y: 0, z: 0 }, { x: -0.2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    const _elbowLJoint = createJoint(elbowLData, upperArmLBody, foreArmLBody, [-2.4, 0]);


    const wristLData = JointData.revolute({ x: 0.2, y: 0, z: 0 }, { x: -0.1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    const _wristLJoint = createJoint(wristLData, foreArmLBody, handLBody, [-0.5, 0.5]);


    const shoulderRData = JointData.revolute({ x: -0.3, y: 0.25, z: 0 }, { x: 0.2, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const _shoulderRJoint = createJoint(shoulderRData, chestBody, upperArmRBody, [-0.3, 1.6]);


    // axisA: CANNON.Vec3.UNITX,
    // axisB: CANNON.Vec3.UNITX,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const elbowRData = JointData.revolute({ x: -0.2, y: 0, z: 0 }, { x: 0.2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    const _elbowRJoint = createJoint(elbowRData, upperArmRBody, foreArmRBody, [0, 2.4]);


    // axisA: CANNON.Vec3.UNITX,
    // axisB: CANNON.Vec3.UNITX,
    // angle: Math.PI / 8,
    // twistAngle: Math.PI / 8
    const wristRData = JointData.revolute({ x: -0.2, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    createJoint(wristRData, foreArmRBody, handRBody, [-0.5, 0.5]);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    // Hips and knees hinge about the X-axis (fore-aft swing); the limits
    // stop legs folding up the back or knees bending forward
    const hipLData = JointData.revolute(
      { x: 0.2, y: -0.15, z: 0 },
      { x: 0, y: 0.2, z: 0 },
      { x: 1, y: 0, z: 0 }
    );
    createJoint(hipLData, hipsBody, upperLegLBody, [-1.6, 0.5]);


    // axisA: CANNON.Vec3.UNITX,
    // axisB: CANNON.Vec3.UNITX,
    // angle: Math.PI/4,
    // twistAngle: Math.PI/8
    const kneeLData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },  // Anchor point on upper leg
      { x: 0, y: 0.2, z: 0 },   // Anchor point on lower leg
      { x: 1, y: 0, z: 0 }      // Axis of rotation (x-axis = side-to-side knee movement)
    );
    createJoint(kneeLData, upperLegLBody, lowerLegLBody, [0, 2.4]);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 8,
    // twistAngle: Math.PI / 8
    const ankleLData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },
      { x: 0, y: 0.06, z: -0.04 },
      { x: 1, y: 0, z: 0 }
    );
    const _ankleLJoint = createJoint(ankleLData, lowerLegLBody, footLBody, [-0.5, 0.5]);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const hipRData = JointData.revolute(
      { x: -0.2, y: -0.15, z: 0 },
      { x: 0,    y: 0.2,   z: 0 },
      { x: 1, y: 0, z: 0 }
    );
    const _hipRJoint = createJoint(hipRData, hipsBody, upperLegRBody, [-1.6, 0.5]);


    // axisA: CANNON.Vec3.UNITY,
    // axisB: CANNON.Vec3.UNITY,
    // angle: Math.PI / 4,
    // twistAngle: Math.PI / 8
    const kneeRData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },  // Anchor point on upper leg
      { x: 0, y: 0.2, z: 0 },   // Anchor point on lower leg
      { x: 1, y: 0, z: 0 }      // Axis of rotation (x-axis = side-to-side knee movement)
    );
    createJoint(kneeRData, upperLegRBody, lowerLegRBody, [0, 2.4]);


    const ankleRData = JointData.revolute(
      { x: 0, y: -0.2, z: 0 },     // Anchor point on lower leg
      { x: 0, y: 0.06, z: -0.04 }, // Anchor point on foot
      { x: 1, y: 0, z: 0 }         // Axis of rotation (side-to-side)
    );
    const _ankleRJoint = createJoint(ankleRData, lowerLegRBody, footRBody, [-0.5, 0.5]);


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

    meshList.forEach((mesh) => scene.add(mesh));

    this.dynamicBodies.push(
      { name: 'head',      mesh: head,      body: headBody },
      { name: 'chest',     mesh: chest,     body: chestBody },
      { name: 'hips',      mesh: hips,      body: hipsBody },
      { name: 'upperArmL', mesh: upperArmL, body: upperArmLBody },
      { name: 'foreArmL',  mesh: foreArmL,  body: foreArmLBody },
      { name: 'handL',     mesh: handL,     body: handLBody },
      { name: 'upperArmR', mesh: upperArmR, body: upperArmRBody },
      { name: 'foreArmR',  mesh: foreArmR,  body: foreArmRBody },
      { name: 'handR',     mesh: handR,     body: handRBody },
      { name: 'upperLegL', mesh: upperLegL, body: upperLegLBody },
      { name: 'lowerLegL', mesh: lowerLegL, body: lowerLegLBody },
      { name: 'footL',     mesh: footL,     body: footLBody },
      { name: 'upperLegR', mesh: upperLegR, body: upperLegRBody },
      { name: 'lowerLegR', mesh: lowerLegR, body: lowerLegRBody },
      { name: 'footR',     mesh: footR,     body: footRBody },
    );

    this.dynamicBodies.forEach((part) => {
      part.draggable = DRAGGABLE_PARTS.includes(part.name!);
    });

  }

  //////////////////////////////////////////////////////////////

  update(t: number) {
    // Decay emissive colors for flashing effect
    this.dynamicBodies.forEach(({ mesh }) => {
      if (!mesh || !mesh.material) return;
      const decayEmissive = (mat: any) => {
        if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
           mat.emissive.multiplyScalar(0.9);
        }
      };
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(decayEmissive);
      } else {
        decayEmissive(mesh.material);
      }
    });

    super.update(t);
  }

  destroy(scene: Scene, physics: World) {
    super.destroy(scene, physics);
  }

  damage(impacts: any /* Impact[] */) {
    if (!impacts || impacts.length === 0 || impacts.length === this.lastImpactCount) return;
    this.lastImpactCount = impacts.length;

    // Calculate damage per body part
    const bodyPartDamage = impacts.reduce((acc: Record<string, number>, impact: any) => {
      const part = impact.bodyPart;
      if (!acc[part]) acc[part] = 0;
      acc[part] += impact.force;
      return acc;
    }, {});

    // Update appearance of each body part based on damage
    Object.entries(bodyPartDamage).forEach(([partName, _damage]) => {
      // Find the mesh for this body part using the impacts that affected this part
      const relevantImpact = impacts.find((impact: any) => impact.bodyPart === partName);
      if (!relevantImpact) return;

      // Get the mesh associated with this rigid body
      const partMesh = this.dynamicBodies.find(
        body => body.body === relevantImpact.rigidBody
      )?.mesh;

      if (partMesh) {
        // Flash red by setting emissive hex color to max red
        if (partMesh.material) {
          const setEmissive = (mat: any) => {
             if (mat.emissive) {
                mat.emissive.setHex(0xff0000);
             }
          };
          if (Array.isArray(partMesh.material)) {
            partMesh.material.forEach(setEmissive);
          } else {
            setEmissive(partMesh.material);
          }
        }
      }
    });
  }
}
