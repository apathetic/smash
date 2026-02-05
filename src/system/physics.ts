import {
  World,
  EventQueue,
  RigidBodyType,
  RigidBody,
  Collider,
  ImpulseJoint,
  ImpulseJointHandle,
  ActiveCollisionTypes,
  RigidBodyDesc,
  ColliderDesc,
  JointData
} from "rapier";
import { Quaternion, Vector3 } from "three";
import { createEffect } from "solid-js"
import { useGameState } from "~/game/store";
import {
  GRAVITY,
  COLLISION_GROUP_DRAGGED,
  COLLISION_GROUP_DRAG_PROXY
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
        body.setLinearDamping(0.2);
        body.setAngularDamping(0.2);
      }
    });

    // Note: Joints between KinematicPositionBased bodies automatically maintain
    // their relative positions since kinematic bodies don't respond to forces.
    // This effectively makes joints rigid in edit mode.
  }

  function collisions(event: any) { //  meant to be overwitten;
    let _handle1 = event.collider1(); // Handle of the first collider involved in the event.
    let _handle2 = event.collider2(); // Handle of the second collider involved in the event.
    // console.log("Contact force:", handle1, event.totalForce());
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
  characterController.enableAutostep(0.5, 0.2, true); // Allow stepping over small obstacles
  characterController.enableSnapToGround(0.2);

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

  let proxyBody: RigidBody | null = null;
  let proxyCollider: Collider | null = null;
  let dragJoint: ImpulseJoint | null = null;
  let draggedBodies: RigidBody[] = [];
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
    start(body: RigidBody, hitPoint: { x: number, y: number, z: number }) {
      this.stop(); // Ensure cleanup

      draggedBodies = getConnectedBodies(body);
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

        b.setBodyType(RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);
        b.setGravityScale(0.0, true);
        b.lockRotations(true, true);
        b.enableCcd(true);
        b.wakeUp();
      });

      const proxyDesc = RigidBodyDesc.kinematicPositionBased().setTranslation(hitPoint.x, hitPoint.y, hitPoint.z);
      proxyBody = world.createRigidBody(proxyDesc);

      // Add a small ball collider to the proxy so it can be seen by character controllers
      const proxyColliderDesc = ColliderDesc.ball(0.05)
        .setCollisionGroups(COLLISION_GROUP_DRAG_PROXY)
        .setSensor(false);
      proxyCollider = world.createCollider(proxyColliderDesc, proxyBody);

      const invRot = new Quaternion(
        body.rotation().x,
        body.rotation().y,
        body.rotation().z,
        body.rotation().w
      ).invert();

      const worldAnchor = new Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
      const bodyPos = body.translation();
      const diff = worldAnchor.clone().sub(new Vector3(bodyPos.x, bodyPos.y, bodyPos.z)).applyQuaternion(invRot);

      const anchorOnProxy = { x: 0, y: 0, z: 0 };
      const anchorOnBody = { x: diff.x, y: diff.y, z: diff.z };

      const jointParams = JointData.spherical(anchorOnProxy, anchorOnBody);
      dragJoint = world.createImpulseJoint(jointParams, proxyBody, body, true);
    },

    move(targetPoint: { x: number, y: number, z: number }) {
      if (proxyBody && proxyCollider) {
        // Use CharacterController to move the proxy body
        const currentPos = new Vector3().copy(proxyBody.translation() as any);
        const movement = new Vector3().copy(targetPoint as any).sub(currentPos);

        characterController.computeColliderMovement(proxyCollider, movement);
        const computedMovement = characterController.computedMovement();

        proxyBody.setNextKinematicTranslation({
          x: currentPos.x + computedMovement.x,
          y: currentPos.y + computedMovement.y,
          z: currentPos.z + computedMovement.z
        });
      }
    },

    stop() {
      if (dragJoint) {
        world.removeImpulseJoint(dragJoint, true);
        dragJoint = null;
      }
      if (proxyBody) {
        if (proxyCollider) {
          world.removeCollider(proxyCollider, false);
          proxyCollider = null;
        }
        world.removeRigidBody(proxyBody);
        proxyBody = null;
      }

      draggedBodies.forEach((b) => {
        const props = storedBodyProps.get(b);
        if (props) {
          b.setBodyType(props.type, true);
          b.setLinearDamping(props.damping);
          b.setAngularDamping(props.angularDamping);
          b.setGravityScale(1.0, true);
          b.enableCcd(props.ccd);
          b.lockRotations(false, true);
          for (let i = 0; i < props.colliderGroups.length; i++) {
            b.collider(i).setCollisionGroups(props.colliderGroups[i]);
          }
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
          b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      });

      draggedBodies = [];
      storedBodyProps.clear();
    },

    isDragging() {
      return !!proxyBody;
    }
  };
}

export {
  createPhysics,
  createDragger,
};
