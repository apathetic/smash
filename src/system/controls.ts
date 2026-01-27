import * as rapier from 'rapier';
import { Raycaster, Vector2, Vector3, Plane, Quaternion } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLLISION_GROUP_DRAGGED } from "~/system/physics";
import { useGameState } from "~/game/store";



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
  let draggedBodies: rapier.RigidBody[] = [];
  let storedBodyProps: Map<rapier.RigidBody, {
    type: rapier.RigidBodyType,
    damping: number,
    angularDamping: number,
    ccd: boolean, // Continuous Collision Detection: prevents fast moving objects (like dragged ones) from tunneling through static geometry
    colliderGroups: number[]
  }> = new Map();

  /**
   * Continuous Collision Detection (CCD) vs ActiveCollisionTypes:
   *
   * CCD (Continuous Collision Detection):
   * This is used to prevent "tunneling" where fast-moving objects pass through other objects
   * between physics steps. When enabled, Rapier performs additional checks to ensure
   * collisions are detected along the object's path.
   *
   * ActiveCollisionTypes:
   * This determines which pairs of colliders are eligible for collision detection.
   * By default, Static-Static or Kinematic-Kinematic pairs are often ignored to save CPU.
   * If you want a Kinematic body (like one being dragged) to still hit Static geometry,
   * you might need to enable KINEMATIC_FIXED in ActiveCollisionTypes.
   */

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

  // TODO don't do a full-body search each time;
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
    const filterFlags = rapier.QueryFilterFlags.EXCLUDE_FIXED | rapier.QueryFilterFlags.EXCLUDE_SENSORS;
    // let filterGroups = 0x00010003;
    // let filterExcludeCollider;
    // let filterExcludeRigidBody; // = RAGDOLL / player_rigid_body;
    // let filterPredicate = (collider: rapier.Collider) => {}; // data.get(collider.handle) == 10.0;

    // TODO cannot we use a COLLISION_GROUP to filter out non-draggable bodies?
    // const hit = world.castRay(ray, maxDistance, solid, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);
    const hit = world.castRay(ray, maxDistance, solid, filterFlags);

    if (hit) {
      const body = hit.collider.parent();
      if (!body) return;

      // Only disable OrbitControls when we actually hit an entity to drag
      controls.enabled = false;

      // So that the collider will still interact with other non-dynamic colliders.
      // This is the case when this collider gets set to kinematic so that it may be dragged around.
      // https://rapier.rs/docs/user_guides/javascript/colliders/#active-collision-types
      // hit.collider.setActiveCollisionTypes(rapier.ActiveCollisionTypes.DEFAULT | rapier.ActiveCollisionTypes.KINEMATIC_FIXED);



      // 1. Identify all connected bodies
      draggedBodies = getConnectedBodies(body);
      storedBodyProps.clear();

      // 2. Prepare them for dragging: switch to Dynamic, high damping, no gravity
      draggedBodies.forEach((b) => {
        const props = {
          type: b.bodyType(),
          damping: b.linearDamping(),
          angularDamping: b.angularDamping(),
          ccd: b.isCcdEnabled(),
          colliderGroups: Array.from({ length: b.numColliders() }, (_, i) => {
            const c = b.collider(i);
            const g = c.collisionGroups();
            c.setCollisionGroups(COLLISION_GROUP_DRAGGED);
            return g;
          })
        };

        storedBodyProps.set(b, props);

        b.setBodyType(rapier.RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);
        b.setGravityScale(0.0, true);
        b.lockRotations(true, true);
        b.enableCcd(true);
        b.wakeUp();
      });

      // 3. Create Kinematic Proxy at hit point
      const hitPoint = new Vector3().copy(origin).addScaledVector(direction, hit.timeOfImpact);

      // Set up drag plane
      const normal = new Vector3();
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);

      const proxyDesc = rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(hitPoint.x, hitPoint.y, hitPoint.z);
      proxyBody = world.createRigidBody(proxyDesc);

      // 4. Create Joint between Proxy and Clicked Body
      // Calculate anchors.
      // Anchor on proxy is 0,0,0 (center of proxy is at hit point).
      // Anchor on body is local coordinate of hit point.
      const anchorOnProxy = { x: 0, y: 0, z: 0 };
      // Calculate local anchor on the body.
      // q_inv * (point - origin)
      const invRot = new Quaternion().copy(body.rotation() as any).invert();
      const diff = new Vector3().copy(hitPoint)
        .sub(body.translation() as any)
        .applyQuaternion(invRot);
      const anchorOnBody = { x: diff.x, y: diff.y, z: diff.z };

      // Use a spherical joint (3 DOF rotation, 0 DOF translation)
      // Ideally we'd use a Fixed joint if we want to grab and twist, but Spherical is good for "grabbing a point".
      const jointParams = rapier.JointData.spherical(anchorOnProxy, anchorOnBody);
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
    draggedBodies.forEach((b) => {
      const props = storedBodyProps.get(b);
      if (props) {
        b.setBodyType(props.type, true);
        b.setLinearDamping(props.damping);
        b.setAngularDamping(props.angularDamping);
        b.setGravityScale(1.0, true); // Restore gravity
        b.enableCcd(props.ccd);        // Restore CCD
        b.lockRotations(false, true);

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
      }
    });

    draggedBodies = [];
    storedBodyProps.clear();
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
