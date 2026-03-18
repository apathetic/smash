import {
  World,
  EventQueue,
  RigidBodyType,
  RigidBody,
  Collider,
  ImpulseJointHandle,
  ActiveCollisionTypes,
} from "rapier";
import { Vector3 } from "three";
import { createEffect } from "solid-js"
import { useGameState } from "~/game/store";
import {
  GRAVITY,
  COLLISION_GROUP_DRAGGED
} from "~/system/constants";



/**
 * Creates the physics world.
 * @returns {object} An object containing the physics world, update and collisions functions.
 * @returns {World} return.world - The physics world.
 * @returns {function} return.update - The update function.
 * @returns {function} return.collisions - A collisions function.
 */
function createPhysics() {
  const gravity    = { x: 0.0, y: 0, z: 0.0 }; // { x: 0.0, y: -9.81, z: 0.0 };
  const world      = new World(gravity);
  const eventQueue = new EventQueue(true); // 'true' to capture contact force events
  const [game]     = useGameState();
  let stepId       = 0;

  // Increase solver iterations for more stable constraint solving
  world.integrationParameters.numSolverIterations = 20; // Default is ~4


  function collisions(event: any) { //  meant to be overwitten;
    let _handle1 = event.collider1(); // Handle of the first collider involved in the event.
    let _handle2 = event.collider2(); // Handle of the second collider involved in the event.
    // console.log("Contact force:", handle1, event.totalForce());
  }

  function update(_delta: number) {
    world.step(eventQueue);
    stepId += 1;

    (world as any).stepId = stepId;

    // eventQueue.drainCollisionEvents((...        // if `ActiveEvents.COLLISION_EVENTS` is set in the collider
    eventQueue.drainContactForceEvents(collisions); // if `ActiveEvents.CONTACT_FORCE_EVENTS` is set in the collider
  }

  function toggleGravity (enabled: boolean) {
    world.gravity.y = enabled ? GRAVITY : 0;
    if (enabled) {
      world.forEachRigidBody((body) => body.wakeUp());
    }
  }

  function setEditMode(enabled: boolean) {
    world.forEachRigidBody((body) => {

      // Always preserve Fixed bodies (terrain, floor, etc.) - never convert them
      if (body.bodyType() === RigidBodyType.Fixed) {
        return;
      }

      if (enabled) {
        // Set to kinematic so bodies are fixed in place and don't interact with each other
        body.setBodyType(RigidBodyType.KinematicPositionBased, true);

        // Zero out velocities - no momentum
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      } else {
        // Restore to dynamic for normal physics
        body.setBodyType(RigidBodyType.Dynamic, true);

        // Normal damping for physics simulation
        // body.setLinearDamping(0.5);
        // body.setAngularDamping(0.5);
      }
    });

    // Note: Joints between KinematicPositionBased bodies automatically maintain
    // their relative positions since kinematic bodies don't respond to forces.
    // This effectively makes joints rigid in edit mode.
  }



  createEffect(() => {

    // Toggle gravity based on game state
    if (game.mode == 'smash') {
      toggleGravity(true);
      setEditMode(false);
    } else {
      toggleGravity(false);
      setEditMode(true);
    }


    // Toggle between dynamic and kinematic bodies when smashing or editing, respectively.
    // This is a simple way to allow the user to interact with the scene without being
    // at-odds with the physics engine.
    // const type = game.mode === 'smash' ? RigidBodyType.Dynamic : RigidBodyType.KinematicPositionBased;
    // world.forEachRigidBody((body) => body.setBodyType(type, true));

    // collider.setActiveCollisionTypes(ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED);

    // onCleanup(() => ....
  });

  return { world, update, collisions };
}





      // Use the new simplified dragger.
      // Note: The dragger sets ActiveCollisionTypes so that the collider will still
      // interact with other non-dynamic colliders (like the floor) when being dragged.
      // https://rapier.rs/docs/user_guides/javascript/colliders/#active-collision-types
function createDragger(world: World) {
  const characterController = world.createCharacterController(0.01);
  characterController.setApplyImpulsesToDynamicBodies(false); // Don't push other dynamic bodies during drag
  // characterController.enableAutostep(0.5, 0.2, true); // Allow stepping over small obstacles
  // characterController.enableSnapToGround(0.2);

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

  let grabbedCollider: Collider | null = null;
  let grabbedBody: RigidBody | null = null;
  let draggedBodies: RigidBody[] = [];
  let grabOffset: Vector3 | null = null;

  const storedBodyProps = new Map<RigidBody, {
    type: RigidBodyType,
    damping: number,
    angularDamping: number,
    ccd: boolean,
    colliderGroups: number[]
  }>();

  // TODO optimize this. Don't do a full scan every time.
  function getConnectedBodies(startBody: RigidBody): RigidBody[] {
    const connected = new Set<RigidBody>();
    const queue = [startBody];
    connected.add(startBody);

    while (queue.length > 0) {
      const current = queue.shift()!;
      world.impulseJoints.forEachJointHandleAttachedToRigidBody(current.handle, (jointHandle: ImpulseJointHandle) => {
        const joint = world.impulseJoints.get(jointHandle);
        if (joint) {
          const b1 = joint.body1();
          const b2 = joint.body2();
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

  return {
    start(collider: Collider, hitPoint: { x: number, y: number, z: number }) {
      this.stop(); // Ensure cleanup

      grabbedCollider = collider;
      grabbedBody = collider.parent() as RigidBody;
      if (!grabbedBody) return;

      draggedBodies = getConnectedBodies(grabbedBody);
      storedBodyProps.clear();

      draggedBodies.forEach((b) => {
        storedBodyProps.set(b, {
          type: b.bodyType(),
          damping: b.linearDamping(),
          angularDamping: b.angularDamping(),
          ccd: b.isCcdEnabled(),
          colliderGroups: Array.from({ length: b.numColliders() }, (_, i) => {
            const c = b.collider(i);
            const g = c.collisionGroups();
            c.setCollisionGroups(COLLISION_GROUP_DRAGGED);

            // So that the collider will still interact with other non-dynamic colliders.
            // This is the case when this collider gets set to kinematic so that it may be dragged around.
            // https://rapier.rs/docs/user_guides/javascript/colliders/#active-collision-types
            c.setActiveCollisionTypes(ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED);

            return g;
          })
        });

        // Use KinematicPositionBased so the body stays exactly where we put it and joints stay rigid
        b.setBodyType(RigidBodyType.KinematicPositionBased, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        b.enableCcd(true);
        b.wakeUp();
      });

      const bodyPos = grabbedBody.translation();
      const posVec = new Vector3(bodyPos.x, bodyPos.y, bodyPos.z);
      const hitVec = new Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
      grabOffset = hitVec.clone().sub(posVec);
    },

    move(targetPoint: { x: number, y: number, z: number }) {
      if (!grabbedCollider || !grabbedBody || !grabOffset) return;

      const targetVec = new Vector3(targetPoint.x, targetPoint.y, targetPoint.z);
      const targetBodyPos = targetVec.clone().sub(grabOffset);

      const bodyPos = grabbedBody.translation();
      const currentPos = new Vector3(bodyPos.x, bodyPos.y, bodyPos.z);
      const desiredMovement = targetBodyPos.clone().sub(currentPos);

      // Compute movement to avoid obstacles
      characterController.computeColliderMovement(grabbedCollider, desiredMovement);
      const computedMovement = characterController.computedMovement();

      // Apply the exact same translation to all connected constituent bodies
      // so the whole object (e.g., RagDoll) moves rigidly without flopping or coming apart
      draggedBodies.forEach((b) => {
        const bPos = b.translation();
        b.setNextKinematicTranslation({
          x: bPos.x + computedMovement.x,
          y: bPos.y + computedMovement.y,
          z: bPos.z + computedMovement.z
        });
      });
    },

    stop() {
      draggedBodies.forEach((b) => {
        const props = storedBodyProps.get(b);
        if (props) {
          b.setBodyType(props.type, true);
          b.setLinearDamping(props.damping);
          b.setAngularDamping(props.angularDamping);
          b.setGravityScale(1.0, true);
          b.enableCcd(props.ccd);
          for (let i = 0; i < props.colliderGroups.length; i++) {
            const numColliders = b.numColliders();
            if (i < numColliders) {
              b.collider(i).setCollisionGroups(props.colliderGroups[i]);
              b.collider(i).setActiveCollisionTypes(ActiveCollisionTypes.DEFAULT);
            }
          }
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
          b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      });

      grabbedCollider = null;
      grabbedBody = null;
      grabOffset = null;
      draggedBodies = [];
      storedBodyProps.clear();
    },

    isDragging() {
      return !!grabbedBody;
    }
  };
}

export {
  createPhysics,
  createDragger,
};
