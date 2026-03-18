import {
  World,
  EventQueue,
  RigidBodyType,
  RigidBody,
  Collider,
  ImpulseJointHandle,
} from "rapier";
import { Vector3 } from "three";
import { createEffect } from "solid-js";
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";
import { GRAVITY } from "~/system/constants";
import { createDamageHandler } from "~/system/damage";


/**
 * Creates the physics world.
 * @returns {object} An object containing the physics world, update and collisions functions.
 * @returns {World} return.world - The physics world.
 * @returns {function} return.update - The update function.
 * @returns {function} return.collisions - A collisions function.
 */
function createPhysics() {
  const gravity       = { x: 0.0, y: 0, z: 0.0 };
  const world         = new World(gravity);
  const eventQueue    = new EventQueue(true); // 'true' to capture contact force events
  const damageHandler = createDamageHandler(world);
  const [game]        = useGameState();
  let stepId          = 0;

  // Increase solver iterations for more stable constraint solving
  world.integrationParameters.numSolverIterations = 20; // Default is ~4



  function update(_delta: number) {
    world.step(eventQueue);
    stepId += 1;
    (world as any).stepId = stepId;
    eventQueue.drainContactForceEvents(damageHandler);
  }

  function toggleGravity (enabled: boolean) {
    world.gravity.y = enabled ? GRAVITY : 0;
    if (enabled) {
      // Iterate deterministically via registry instead of world.forEachRigidBody
      registry.each((entity) => {
        entity.dynamicBodies?.forEach(({ body }) => body.wakeUp());
      });
    }
  }

  function setEditMode(enabled: boolean) {
    // Iterate deterministically via registry instead of world.forEachRigidBody
    registry.each((entity) => {
      entity.dynamicBodies?.forEach(({ body }) => {
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
          body.resetForces(true);
          body.resetTorques(true);
        } else {
          // Restore to dynamic for normal physics
          body.setBodyType(RigidBodyType.Dynamic, true);

          // Normal damping for physics simulation
          body.setLinearDamping(0);
          body.setAngularDamping(0);
        }
      });
    });

    // Note: Joints between KinematicPositionBased bodies automatically maintain
    // their relative positions since kinematic bodies don't respond to forces.
    // This effectively makes joints rigid in edit mode.
  }


  // React to game state changes
  createEffect(() => {
    if (game.mode == 'smash') {
      toggleGravity(true);
      setEditMode(false);
    } else {
      toggleGravity(false);
      setEditMode(true);
    }
  });

  return { world, update };
}




/**
 * Creates a dragger for the physics world.
 * @param world The physics world.
 * @returns An object containing the dragger.
 */
function createDragger(world: World) {
  const [game] = useGameState();
  const characterController = world.createCharacterController(0.01);
  characterController.setApplyImpulsesToDynamicBodies(false);

  let grabbedCollider: Collider | null = null;
  let grabbedBody: RigidBody | null = null;
  let draggedBodies: RigidBody[] = [];
  let grabOffset: Vector3 | null = null;

  const settlingIntervals = new Map<RigidBody, ReturnType<typeof setInterval>>();
  const connectedBodiesCache = new Map<number, RigidBody[]>();

  function getConnectedBodies(startBody: RigidBody): RigidBody[] {
    if (connectedBodiesCache.has(startBody.handle)) {
      return connectedBodiesCache.get(startBody.handle)!;
    }
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
    const arr = Array.from(connected);
    arr.forEach(b => {
      connectedBodiesCache.set(b.handle, arr);
    });
    return arr;
  }

  return {
    start(collider: Collider, hitPoint: { x: number, y: number, z: number }) {
      this.stop(); // Ensure cleanup

      grabbedCollider = collider;
      grabbedBody = collider.parent() as RigidBody;
      if (!grabbedBody) return;

      const bodyPos = grabbedBody.translation();
      grabOffset = new Vector3(bodyPos.x, bodyPos.y, bodyPos.z).sub(new Vector3(hitPoint.x, hitPoint.y, hitPoint.z));

      draggedBodies = getConnectedBodies(grabbedBody);

      draggedBodies.forEach((b) => {
        if (settlingIntervals.has(b)) {
          clearInterval(settlingIntervals.get(b));
          settlingIntervals.delete(b);
        }

        if (b === grabbedBody) {
          b.setBodyType(RigidBodyType.KinematicPositionBased, true);
        } else {
          b.setBodyType(RigidBodyType.Dynamic, true);
          b.setLinearDamping(10.0);
          b.setAngularDamping(10.0);
        }

        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        b.wakeUp();
      });
    },

    move(targetPoint: { x: number, y: number, z: number }) {
      if (!grabbedBody || !grabbedCollider || !grabOffset) return;

      const currentPos = new Vector3().copy(grabbedBody.translation() as any);
      const desiredPos = new Vector3(targetPoint.x, targetPoint.y, targetPoint.z).add(grabOffset);
      const movement = new Vector3().subVectors(desiredPos, currentPos);

      // Compute movement to avoid obstacles, ignore other bodies in this entity group
      characterController.computeColliderMovement(
        grabbedCollider,
        movement,
        undefined,
        undefined,
        (c) => {
          const parent = c.parent();
          if (parent) {
             return !draggedBodies.includes(parent as RigidBody);
          }
          return true;
        }
      );
      const computedMovement = characterController.computedMovement();

      grabbedBody.setNextKinematicTranslation({
        x: currentPos.x + computedMovement.x,
        y: currentPos.y + computedMovement.y,
        z: currentPos.z + computedMovement.z
      });
    },

    stop() {
      if (!grabbedBody) return;

      draggedBodies.forEach((b) => {
        if (game.mode !== 'edit') {
          // In smash mode, the global setEditMode(false) forces bodies to Dynamic and resets damping.
          return;
        }

        if (b === grabbedBody) {
          b.setBodyType(RigidBodyType.KinematicPositionBased, true);
          b.setLinearDamping(0);
          b.setAngularDamping(0);
        } else {
          // Attached bodies stop normally, heavily damped
          b.setBodyType(RigidBodyType.Dynamic, true);
          b.setLinearDamping(10.0);
          b.setAngularDamping(10.0);

          const interval = setInterval(() => {
            try {
              if (game.mode !== 'edit') {
                 // Game switched to smash mode while settling! Global setEditMode handles cleanup.
                 clearInterval(interval);
                 settlingIntervals.delete(b);
                 return;
              }

              const lv = b.linvel();
              const av = b.angvel();
              const speedSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z;
              const angSq = av.x * av.x + av.y * av.y + av.z * av.z;
              if (speedSq < 0.005 && angSq < 0.005) {
                b.setBodyType(RigidBodyType.KinematicPositionBased, true);
                b.setLinearDamping(0);
                b.setAngularDamping(0);
                clearInterval(interval);
                settlingIntervals.delete(b);
              }
            } catch (_err) {
              // Body was likely destroyed
              clearInterval(interval);
              settlingIntervals.delete(b);
              console.error(_err);
            }
          }, 100);
          settlingIntervals.set(b, interval);
        }
      });

      grabbedCollider = null;
      grabbedBody = null;
      grabOffset = null;
      draggedBodies = [];
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
