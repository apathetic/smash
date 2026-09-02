import { Mesh, BoxGeometry, CylinderGeometry, ExtrudeGeometry, Shape, MeshStandardMaterial, Vector3, Quaternion, Group, Euler } from 'three';
import { ColliderDesc, RigidBodyDesc } from 'rapier';
import { COLLISION_GROUP_DYNAMIC } from '~/system/constants';
import { Base } from '~/game/entities/Base';
import type { World } from 'rapier';
import type { Scene } from 'three';

const MAX_FORWARD_VELOCITY = 10;
const FORWARD_THRUST = 100000;

// Overall footprint (local space, +Z is forward, y=0 is where the tires touch the ground)
const BODY_WIDTH = 3.6;
const BODY_LENGTH = 7.2;
const HALF_WIDTH = BODY_WIDTH / 2;
const HALF_LENGTH = BODY_LENGTH / 2;

// Wheels
const WHEEL_RADIUS = 0.6;
const WHEEL_WIDTH = 0.5;
const WHEEL_X = HALF_WIDTH - WHEEL_WIDTH / 2; // tires sit flush with the body sides
const WHEEL_Y = WHEEL_RADIUS;
const AXLE_Z = 2.3;
const WELL_HALF_LENGTH = 0.85; // wheel well cutout, fore/aft of the axle

// Vertical layout
const SKIRT_BOTTOM_Y = 0.35;  // ground clearance
const SKIRT_TOP_Y = 1.28;     // top of the wheel wells
const BELT_Y = 1.8;           // hood top / door belt line / bed rail
const ROOF_Y = 2.65;          // underside of the roof
const ROOF_THICKNESS = 0.12;

// Longitudinal layout
const CAB_REAR_Z = -0.9;          // cab back / front of the bed
const WINDSHIELD_BASE_Z = 1.3;    // cowl
const WINDSHIELD_TOP_Z = 0.55;
const WINDSHIELD_LENGTH = Math.hypot(WINDSHIELD_BASE_Z - WINDSHIELD_TOP_Z, ROOF_Y - BELT_Y);
const WINDSHIELD_ANGLE = -Math.atan2(WINDSHIELD_BASE_Z - WINDSHIELD_TOP_Z, ROOF_Y - BELT_Y); // tilt back
const WINDSHIELD_Y = (BELT_Y + ROOF_Y) / 2;
const WINDSHIELD_Z = (WINDSHIELD_BASE_Z + WINDSHIELD_TOP_Z) / 2;
const PILLAR = 0.16;
const GLASS_WIDTH = BODY_WIDTH - 0.2; // greenhouse is slightly inset from the body sides

// Bed
const BED_LENGTH = HALF_LENGTH + CAB_REAR_Z;
const BED_Z = CAB_REAR_Z - BED_LENGTH / 2;
const BED_FLOOR_THICKNESS = 0.1;
const BED_FLOOR_Y = SKIRT_TOP_Y + BED_FLOOR_THICKNESS / 2;
const BED_WALL_THICKNESS = 0.12;
const BED_WALL_HEIGHT = BELT_Y - SKIRT_TOP_Y - BED_FLOOR_THICKNESS;
const BED_WALL_Y = BELT_Y - BED_WALL_HEIGHT / 2;

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
    const glassMaterial = new MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.3 });
    const trimMaterial = new MeshStandardMaterial({ color: 0x374151 }); // Dark grey bumpers / grille
    const headlightMaterial = new MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde68a, emissiveIntensity: 0.4 });
    const taillightMaterial = new MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.4 });
    const wheelMaterial = new MeshStandardMaterial({ color: 0x111111 }); // Black tires
    const spokeMaterial = new MeshStandardMaterial({ color: 0xcccccc }); // Light grey hub / spokes

    const skirtHeight = SKIRT_TOP_Y - SKIRT_BOTTOM_Y;
    const skirtY = (SKIRT_TOP_Y + SKIRT_BOTTOM_Y) / 2;
    const skirtEndLength = HALF_LENGTH - AXLE_Z - WELL_HALF_LENGTH;
    const skirtMiddleLength = 2 * (AXLE_Z - WELL_HALF_LENGTH);
    const upperHeight = BELT_Y - SKIRT_TOP_Y;
    const upperY = (BELT_Y + SKIRT_TOP_Y) / 2;
    const upperLength = HALF_LENGTH - CAB_REAR_Z;
    const upperZ = CAB_REAR_Z + upperLength / 2;
    const greenhouseHeight = ROOF_Y - BELT_Y;
    const greenhouseLength = WINDSHIELD_TOP_Z - CAB_REAR_Z;
    const greenhouseZ = CAB_REAR_Z + greenhouseLength / 2;
    const roofY = ROOF_Y + ROOF_THICKNESS / 2;
    const windshieldRotation = new Quaternion().setFromEuler(new Euler(WINDSHIELD_ANGLE, 0, 0));

    const wheelPositions: Tuple[] = [
      [WHEEL_X, WHEEL_Y, AXLE_Z],    // Front left
      [-WHEEL_X, WHEEL_Y, AXLE_Z],   // Front right
      [WHEEL_X, WHEEL_Y, -AXLE_Z],   // Back left
      [-WHEEL_X, WHEEL_Y, -AXLE_Z]   // Back right
    ];

    const addBox = (size: Tuple, at: Tuple, mat: MeshStandardMaterial, tiltX = 0) => {
      const mesh = new Mesh(new BoxGeometry(...size), mat);
      mesh.position.set(...at);
      mesh.rotation.x = tiltX;
      group.add(mesh);
      return mesh;
    };

    // Lower body: a narrow chassis down the middle plus full-width skirts
    // fore, aft and between the axles, which leaves a pocket (wheel well) around each wheel.
    addBox([BODY_WIDTH - 2 * WHEEL_WIDTH - 0.2, skirtHeight - 0.05, BODY_LENGTH], [0, skirtY + 0.025, 0], material);
    addBox([BODY_WIDTH, skirtHeight, skirtEndLength], [0, skirtY, HALF_LENGTH - skirtEndLength / 2], material);
    addBox([BODY_WIDTH, skirtHeight, skirtMiddleLength], [0, skirtY, 0], material);
    addBox([BODY_WIDTH, skirtHeight, skirtEndLength], [0, skirtY, -HALF_LENGTH + skirtEndLength / 2], material);

    // Hood and lower cab (belt line), one slab from the cab back to the nose
    addBox([BODY_WIDTH, upperHeight, upperLength], [0, upperY, upperZ], material);

    // Greenhouse: a trapezoidal glass prism whose slanted front face is the windshield
    const cabShape = new Shape();
    cabShape.moveTo(CAB_REAR_Z, BELT_Y);
    cabShape.lineTo(WINDSHIELD_BASE_Z, BELT_Y);
    cabShape.lineTo(WINDSHIELD_TOP_Z, ROOF_Y);
    cabShape.lineTo(CAB_REAR_Z, ROOF_Y);
    cabShape.closePath();
    const cabGeo = new ExtrudeGeometry(cabShape, { depth: GLASS_WIDTH, bevelEnabled: false });
    cabGeo.rotateY(-Math.PI / 2); // extrude along X: shape (z, y) -> world (x, y, z)
    cabGeo.translate(GLASS_WIDTH / 2, 0, 0);
    const cabMesh = new Mesh(cabGeo, glassMaterial);
    group.add(cabMesh);

    // Roof and pillars
    addBox([BODY_WIDTH, ROOF_THICKNESS, greenhouseLength + 0.05], [0, roofY, greenhouseZ - 0.025], material);
    [HALF_WIDTH - PILLAR / 2, -HALF_WIDTH + PILLAR / 2].forEach((x) => {
      addBox([PILLAR, WINDSHIELD_LENGTH, PILLAR], [x, WINDSHIELD_Y, WINDSHIELD_Z], material, WINDSHIELD_ANGLE); // A-pillar
      addBox([PILLAR, greenhouseHeight, PILLAR * 0.75], [x, WINDSHIELD_Y, greenhouseZ], material);              // B-pillar
      addBox([PILLAR, greenhouseHeight, PILLAR], [x, WINDSHIELD_Y, CAB_REAR_Z + PILLAR / 2 - 0.05], material);  // C-pillar, proud of the rear glass
    });

    // Bed: floor, side walls and tailgate
    addBox([BODY_WIDTH, BED_FLOOR_THICKNESS, BED_LENGTH], [0, BED_FLOOR_Y, BED_Z], material);
    addBox([BED_WALL_THICKNESS, BED_WALL_HEIGHT, BED_LENGTH], [HALF_WIDTH - BED_WALL_THICKNESS / 2, BED_WALL_Y, BED_Z], material);
    addBox([BED_WALL_THICKNESS, BED_WALL_HEIGHT, BED_LENGTH], [-HALF_WIDTH + BED_WALL_THICKNESS / 2, BED_WALL_Y, BED_Z], material);
    addBox([BODY_WIDTH - 2 * BED_WALL_THICKNESS, BED_WALL_HEIGHT, BED_WALL_THICKNESS], [0, BED_WALL_Y, -HALF_LENGTH + BED_WALL_THICKNESS / 2], material);

    // Bumpers, grille and lights
    addBox([BODY_WIDTH + 0.1, 0.24, 0.3], [0, 0.55, HALF_LENGTH], trimMaterial);
    addBox([BODY_WIDTH + 0.1, 0.24, 0.3], [0, 0.55, -HALF_LENGTH], trimMaterial);
    addBox([2.2, 0.5, 0.08], [0, upperY, HALF_LENGTH + 0.02], trimMaterial);
    addBox([0.5, 0.28, 0.08], [1.4, upperY, HALF_LENGTH + 0.02], headlightMaterial);
    addBox([0.5, 0.28, 0.08], [-1.4, upperY, HALF_LENGTH + 0.02], headlightMaterial);
    addBox([0.3, 0.4, 0.08], [1.5, BED_WALL_Y, -HALF_LENGTH - 0.02], taillightMaterial);
    addBox([0.3, 0.4, 0.08], [-1.5, BED_WALL_Y, -HALF_LENGTH - 0.02], taillightMaterial);

    // Wheels
    const wheelGeo = new CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = new CylinderGeometry(WHEEL_RADIUS * 0.5, WHEEL_RADIUS * 0.5, WHEEL_WIDTH + 0.02, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const spokeGeo = new BoxGeometry(WHEEL_WIDTH + 0.04, WHEEL_RADIUS * 1.6, 0.12); // Spokes to visualize rotation

    wheelPositions.forEach(pos => {
      const wheel = new Mesh(wheelGeo, wheelMaterial);
      wheel.position.set(...pos);

      // Add a hub and crossed spokes to make rotation visible
      wheel.add(new Mesh(hubGeo, spokeMaterial));
      wheel.add(new Mesh(spokeGeo, spokeMaterial));
      const crossSpoke = new Mesh(spokeGeo, spokeMaterial);
      crossSpoke.rotation.x = Math.PI / 2;
      wheel.add(crossSpoke);

      group.add(wheel);
      this.wheels.push(wheel);
    });

    const rigidBodyDesc = RigidBodyDesc
      .dynamic()
      .setTranslation(...position)
      .setCanSleep(false); // keep awake to constantly move

    const body = physics.createRigidBody(rigidBodyDesc);

    const addCuboid = (halfExtents: Tuple, at: Tuple, mass: number, rotation?: Quaternion) => {
      const desc = ColliderDesc
        .cuboid(...halfExtents)
        .setTranslation(...at)
        .setMass(mass)
        .setCollisionGroups(COLLISION_GROUP_DYNAMIC);
      if (rotation) desc.setRotation(rotation);
      physics.createCollider(desc, body);
      return desc;
    };

    // Lower body (including bumpers); most of the mass sits down here
    addCuboid([HALF_WIDTH, skirtHeight / 2, HALF_LENGTH + 0.15], [0, skirtY, 0], 8600).setRestitution(0.2);

    // Hood and lower cab
    addCuboid([HALF_WIDTH, upperHeight / 2, upperLength / 2], [0, upperY, upperZ], 1200);

    // Greenhouse (roof included) and windshield
    addCuboid([GLASS_WIDTH / 2, (greenhouseHeight + ROOF_THICKNESS) / 2, greenhouseLength / 2], [0, WINDSHIELD_Y + ROOF_THICKNESS / 2, greenhouseZ], 600);
    addCuboid([GLASS_WIDTH / 2, WINDSHIELD_LENGTH / 2, 0.05], [0, WINDSHIELD_Y, WINDSHIELD_Z], 200, windshieldRotation);

    // Bed floor and walls (hollow so things can ride in the bed)
    addCuboid([HALF_WIDTH, BED_FLOOR_THICKNESS / 2, BED_LENGTH / 2], [0, BED_FLOOR_Y, BED_Z], 300);
    addCuboid([BED_WALL_THICKNESS / 2, BED_WALL_HEIGHT / 2, BED_LENGTH / 2], [HALF_WIDTH - BED_WALL_THICKNESS / 2, BED_WALL_Y, BED_Z], 100);
    addCuboid([BED_WALL_THICKNESS / 2, BED_WALL_HEIGHT / 2, BED_LENGTH / 2], [-HALF_WIDTH + BED_WALL_THICKNESS / 2, BED_WALL_Y, BED_Z], 100);
    addCuboid([HALF_WIDTH - BED_WALL_THICKNESS, BED_WALL_HEIGHT / 2, BED_WALL_THICKNESS / 2], [0, BED_WALL_Y, -HALF_LENGTH + BED_WALL_THICKNESS / 2], 100);

    // Wheel colliders (Sphere) to make them physically rest on the floor
    wheelPositions.forEach((pos) => {
      const wheelColliderDesc = ColliderDesc
        .ball(WHEEL_RADIUS)
        .setTranslation(...pos)
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
      const rotationAngle = (currentSpeed * delta / WHEEL_RADIUS) * rollDirection;
      this.wheels.forEach(wheel => {
        wheel.rotateX(rotationAngle);
      });
    });
  }
}
