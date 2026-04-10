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

const FORCE_SCALAR = 1000;


/**
 * Creates the physics world.
 * @returns {object} An object containing the physics world, update and collisions functions.
 * @returns {World} return.world - The physics world.
 * @returns {function} return.update - The update function.
 * @returns {function} return.collisions - A collisions function.
 */
function createPhysics() {
  const gravity    = { x: 0.0, y: 0, z: 0.0 };
  const world      = new World(gravity);
  const eventQueue = new EventQueue(true); // 'true' to capture contact force events
  // const [game]     = useGameState();
  const [game, setGameState] = useGameState();
  let stepId       = 0;
  let ragdoll: WorldEntity | undefined;

  // Increase solver iterations for more stable constraint solving
  world.integrationParameters.numSolverIterations = 20; // Default is ~4


  // function collisions(event: any) { //  meant to be overwitten;
  //   let _handle1 = event.collider1(); // Handle of the first collider involved in the event.
  //   let _handle2 = event.collider2(); // Handle of the second collider involved in the event.
  //   // console.log("Contact force:", handle1, event.totalForce());
  // }

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
        body.setLinearDamping(0);
        body.setAngularDamping(0);
      }
    });

    // Note: Joints between KinematicPositionBased bodies automatically maintain
    // their relative positions since kinematic bodies don't respond to forces.
    // This effectively makes joints rigid in edit mode.
  }



  // Handle collision events and record impacts
  function collisions(event: any) {
    if (!ragdoll) return;
    if (game.mode !== 'smash') return;

    // RigidBody attached to the first collider
    const handle1 = event.collider1();
    const collider1 = world.getCollider(handle1);
    const body1 = collider1 ? collider1.parent() : undefined;
    const part1 = ragdoll.dynamicBodies.find(({ body }) => body === body1);

    // RigidBody of the second collider involved in the event.
    const handle2 = event.collider2();
    const collider2 = world.getCollider(handle2);
    const body2 = collider2 ? collider2.parent() : undefined;
    const part2 = ragdoll.dynamicBodies.find(({ body }) => body === body2);

    const ragdollPart = part1 || part2;
    if (!ragdollPart) return;

    const ragdollBody = ragdollPart.body;

    // Disregard if being positioned/dragged (kinematic)
    if (ragdollBody.bodyType() !== RigidBodyType.Dynamic) return;

    const bodyPartName = ragdollPart.name || 'ragdoll';

    // Calculate impact force
    const rawForce = event.totalForceMagnitude();

    let multiplier = 1.0;
    switch (bodyPartName) {
      case 'head':
        multiplier = 3.0; // counts for the most
        break;
      case 'chest':
      case 'hips':
        multiplier = 1.5;
        break;
      case 'upperArmL':
      case 'upperArmR':
      case 'upperLegL':
      case 'upperLegR':
        multiplier = 1.0;
        break;
      case 'foreArmL':
      case 'foreArmR':
      case 'lowerLegL':
      case 'lowerLegR':
        multiplier = 0.5;
        break;
      case 'handL':
      case 'handR':
      case 'footL':
      case 'footR':
        multiplier = 0.2; // lowest for extremities
        break;
    }

    // Scale force down relative to our 1000 target level.
    // E.g., 100,000 force / 200 = 500 damage.
    const scaledForce = (rawForce / FORCE_SCALAR) * multiplier;

    // Only record solid impacts
    if (scaledForce > 0) {
      // Update the game state with impact data
      setGameState('impacts', (impacts) => [
        ...impacts,
        {
          id: Date.now() + Math.random(),
          bodyPart: bodyPartName,
          force: scaledForce,
          position: [ragdollBody.translation().x, ragdollBody.translation().y, ragdollBody.translation().z],
          rigidBody: ragdollBody,
          timestamp: Date.now()
        }
      ]);

      // Update total damage
      setGameState('totalDamage', (current) => current + scaledForce);
    }
  };


  // React to game state changes
  createEffect(() => {
    if (!ragdoll) {
      ragdoll = registry.get('ragdoll');
    }

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
