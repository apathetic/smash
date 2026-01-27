import * as rapier from 'rapier';
import { Raycaster, Vector2, Vector3, Plane, Quaternion } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";
import { Base } from "~/game/entities/Base";



interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
}


// TODO optimize this whole monstrosity

/**
 * Handles mouse interaction with World entities.
 *
 * In smash mode:
 * - Allows user to manipulate orbit (camera) controls
 *
 * In edit mode:
 * - Allows selecting and dragging objects
 * - Allows user to manipulate orbit (camera) controls
 * - Disables orbit controls when dragging
 *
 * @param {Object} props - The control properties
 * @param {IGraphics} props.graphics - The graphics system containing camera and renderer
 * @param {IPhysics} props.physics - The physics system containing the world
 * @returns {Object} Control functions for interacting with the world
 */
function createControls({ graphics, physics }: ControlProps) {
  const [gameState] = useGameState();
  const { camera, renderer } = graphics;
  const { world } = physics;
  const canvas = renderer.domElement;
  const controls = new OrbitControls(camera, canvas);

  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const dragPlane = new Plane();

  // Drag state
  let proxyBody: rapier.RigidBody | null = null;
  let dragJoint: rapier.ImpulseJoint | null = null;
  let affectedBodies: rapier.RigidBody[] = [];
  let storedBodyProps: Map<rapier.RigidBody, {
    type: rapier.RigidBodyType,
    damping: number,
    angularDamping: number,
    // Continuous Collision Detection: prevents fast moving objects (like dragged ones) from tunneling through static geometry
    ccd: boolean,
    colliderGroups: number[]
  }> = new Map();

  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera's near clipping plane
  controls.maxDistance = 100; // not greater than far clipping
  controls.maxPolarAngle = Math.PI / 2; // don't allow to look below the horizon
  controls.enabled = true;




  /**
   * Converts mouse coordinates to normalized device coordinates and updates the raycaster
   * Note: This assumes the canvas is full-window size.
   *
   * @param {MouseEvent} event - The mouse event containing client coordinates
   */
  function raycast(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;  // note: pre-supposes <canvas> is full-window size
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function getConnectedBodies(startBody: rapier.RigidBody): rapier.RigidBody[] {
    const connected = new Set<rapier.RigidBody>();
    const queue = [startBody];
    connected.add(startBody);

    while (queue.length > 0) {
      const current = queue.shift()!;

      world.impulseJoints.forEachJointHandleAttachedToRigidBody(current.handle, (jointHandle) => {
        const joint = world.impulseJoints.get(jointHandle);
        if (joint) {
          const b1 = joint.body1();
          const b2 = joint.body2();
          // Identify the other body attached to this joint
          const neighbor = (b1.handle === current.handle) ? b2 : b1;

          if (!connected.has(neighbor)) {
            connected.add(neighbor);
            queue.push(neighbor);
          }
        }
      });
    }

    return Array.from(connected);
  }

  function onMouseDown(event: MouseEvent) {
    // In smash mode, no entity interaction - only camera controls
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    const maxDistance = 100;
    const solid = true;
    const ray = new rapier.Ray(origin, direction);

    // In edit mode (Kinematic), we want to hit the kinematic bodies.
    const filterFlags = rapier.QueryFilterFlags.EXCLUDE_SENSORS;
    // let filterGroups = 0x00010003;
    // let filterExcludeCollider;
    // let filterExcludeRigidBody; // = RAGDOLL / player_rigid_body;
    // let filterPredicate = (collider: rapier.Collider) => {}; // data.get(collider.handle) == 10.0;

    // const hit = world.castRay(ray, maxDistance, solid, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);
    const hit = world.castRay(ray, maxDistance, solid, filterFlags);

    if (hit) {
      const body = hit.collider.parent();

      // Don't drag Fixed bodies
      if (!body || body.bodyType() === rapier.RigidBodyType.Fixed) {
        return;
      }

      // Only disable OrbitControls when we actually hit an entity to drag
      controls.enabled = false;

      // So that the collider will still interact with other non-dynamic colliders.
      // This is the case when this collider gets set to kinematic so that it may be dragged around.
      // https://rapier.rs/docs/user_guides/javascript/colliders/#active-collision-types
      // hit.collider.setActiveCollisionTypes(rapier.ActiveCollisionTypes.DEFAULT | rapier.ActiveCollisionTypes.KINEMATIC_FIXED);



      // 1. Identify all connected bodies
      affectedBodies = getConnectedBodies(body);
      storedBodyProps.clear();

      // 2. Prepare them for dragging: switch to Dynamic, high damping, no gravity
      affectedBodies.forEach((b) => {
        const ccd = b.isCcdEnabled();
        storedBodyProps.set(b, {
          type: b.bodyType(),
          damping: b.linearDamping(),
          angularDamping: b.angularDamping(),
          ccd,
          // Store collider groups
          colliderGroups: []
        });

        // Store and update collision groups for all colliders
        const numColliders = b.numColliders();
        for (let i = 0; i < numColliders; i++) {
          const collider = b.collider(i);
          storedBodyProps.get(b)!.colliderGroups.push(collider.collisionGroups());
          collider.setCollisionGroups(Base.COLLISION_GROUP_DRAGGED);

        }

        b.setBodyType(rapier.RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);
        b.setGravityScale(0.0, true);
        b.lockRotations(true, true);
        b.enableCcd(true);
        b.wakeUp();
      });

      // 3. Create Kinematic Proxy at hit point
      const hitPoint = {
        x: origin.x + direction.x * hit.timeOfImpact,
        y: origin.y + direction.y * hit.timeOfImpact,
        z: origin.z + direction.z * hit.timeOfImpact,
      };

      // Set up drag plane
      const normal = new Vector3();
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, new Vector3(hitPoint.x, hitPoint.y, hitPoint.z));

      const proxyDesc = rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(hitPoint.x, hitPoint.y, hitPoint.z);
      proxyBody = world.createRigidBody(proxyDesc);

      // 4. Create Joint between Proxy and Clicked Body
      // Calculate anchors.
      // Anchor on proxy is 0,0,0 (center of proxy is at hit point).
      // Anchor on body is local coordinate of hit point.
      const anchorOnProxy = { x: 0, y: 0, z: 0 };
      const bodyTranslation = body.translation();
      const bodyRotation = body.rotation();

      // Transform world hit point to local body space is complex with raw math,
      // but we can trust Rapier's joint creation to handle world-space anchoring if we use the right data,
      // OR we calculate the local anchor manually.
      // Rapier JS `JointData.spherical` takes local anchors.

      // Let's calculate local anchor on the body.
      // q_inv * (point - origin)
      const invRot = new Quaternion(bodyRotation.x, bodyRotation.y, bodyRotation.z, bodyRotation.w).invert();
      const diff = new Vector3(hitPoint.x - bodyTranslation.x, hitPoint.y - bodyTranslation.y, hitPoint.z - bodyTranslation.z);
      diff.applyQuaternion(invRot);
      const anchorOnBody = { x: diff.x, y: diff.y, z: diff.z };

      // Use a spherical joint (3 DOF rotation, 0 DOF translation)
      // Ideally we'd use a Fixed joint if we want to grab and twist, but Spherical is good for "grabbing a point".
      const jointParams = rapier.JointData.spherical(anchorOnProxy, anchorOnBody);
      // jointParams.stiffness = 1.0e7; // If it was a spring, but this is a hard constraint joint usually?
      // Actually ImpulseJoints are hard constraints by default.

      dragJoint = world.createImpulseJoint(jointParams, proxyBody, body, true);
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!proxyBody) return;
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const worldPos = new Vector3();
    raycaster.ray.intersectPlane(dragPlane, worldPos);

    if (worldPos) {
      // Move proxy to new mouse position
      proxyBody.setNextKinematicTranslation({ x: worldPos.x, y: worldPos.y, z: worldPos.z });
    }
  }

  function onMouseUp() {
    controls.enabled = true;

    // Cleanup Joint
    if (dragJoint) {
      world.removeImpulseJoint(dragJoint, true);
      dragJoint = null;
    }

    // Cleanup Proxy
    if (proxyBody) {
      world.removeRigidBody(proxyBody);
      proxyBody = null;
    }

    // Restore Body States
    affectedBodies.forEach((b) => {
      const props = storedBodyProps.get(b);
      if (props) {
        b.setBodyType(props.type, true);
        b.setLinearDamping(props.damping);
        b.setAngularDamping(props.angularDamping);
        b.setGravityScale(1.0, true); // Restore gravity

        // Restore CCD
        b.enableCcd(props.ccd);

        // Restore collider groups
        const numColliders = b.numColliders();
        for (let i = 0; i < numColliders; i++) {
          if (i < props.colliderGroups.length) {
            b.collider(i).setCollisionGroups(props.colliderGroups[i]);
          }
        }

        // Zero out velocities to stop any residual drift
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Unlock rotations (unless they were originally locked, but we assume default is unlocked for ragdolls)
        // Ideally we should store the original lock state too, but for now we assume they should rotate freely.
        b.lockRotations(false, true);
      }
    });

    affectedBodies = [];
    storedBodyProps.clear();
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
