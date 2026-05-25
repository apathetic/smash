import { createEffect } from "solid-js";
import { World, EventQueue, RigidBodyType} from "rapier";
import { registry } from "~/game/store/registry";
import { useGameState } from "~/game/store";
import { GRAVITY, NUM_SOLVER_ITERATIONS } from "~/system/constants";
import { createDamageHandler } from "~/system/damage";
import { createDragger } from "~/system/dragger";


/**
 * A reference to a Physics instance.
 * The return object exposes a number of functions for interacting
 * with the
 */
let physicsHandle: ReturnType<typeof createPhysics>;


/**
 * Creates the physics world.
 * @returns {object} An object containing the physics world, update and collisions functions.
 * @returns {World} return.world - The physics world.
 * @returns {function} return.update - The update function.
 * @returns {function} return.collisions - A collisions function.
 */
function createPhysics() {
  const gravity = { x: 0.0, y: 0, z: 0.0 };
  const world = new World(gravity);
  let eventQueue = new EventQueue(true);
  let damageHandler = createDamageHandler(world);
  let snapshot: Uint8Array | null = null;
  let hasEdited = true;

  function update(_delta: number) {
    instance.world.step(eventQueue);
    instance.stepId += 1;
    eventQueue.drainContactForceEvents(damageHandler);
  }

  function save() {
    instance.setBodiesKinematic(true);
    snapshot = instance.world.takeSnapshot();
    hasEdited = false;
  }

  function restore() {
    if (snapshot) {
      instance.dragger.cleanup();
      instance.world.free();
      instance.world = World.restoreSnapshot(snapshot);
      instance.world.integrationParameters.numSolverIterations = NUM_SOLVER_ITERATIONS;
      instance.stepId = 0;
      eventQueue = new EventQueue(true);
      damageHandler = createDamageHandler(instance.world);

      // Relink existing dynamicBodies to the newly restored Rapier bodies
      registry.each((entity) => {
        entity.dynamicBodies?.forEach((dBody) => {
          if (dBody.body) {
            dBody.body = instance.world.getRigidBody(dBody.body.handle);
          }
        });
      });

      hasEdited = false;
    }
  }

  function setGravity(enabled: boolean) {
    instance.world.gravity.y = enabled ? GRAVITY : 0;
    if (enabled) {
      registry.each((entity) => {
        entity.dynamicBodies?.forEach(({ body }) => body.wakeUp());
      });
    }
  }

  function setBodiesKinematic(enabled: boolean) {
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
          body.wakeUp();
        }
      });
    });
  }


  const instance: IPhysics = {
    world,
    stepId: 0,
    dragger: null, // Connected below due to circular construction
    save,
    update,
    restore,
    setGravity,
    setBodiesKinematic,
    markEdited: () => { hasEdited = true; },
    get hasEdited() { return hasEdited; },
  };

  instance.dragger = createDragger(instance);
  instance.world.integrationParameters.numSolverIterations = NUM_SOLVER_ITERATIONS;


  createEffect(() => {
    const [game] = useGameState();

    if (game.mode === 'smash') {
      if (instance.hasEdited) {
        instance.save();
      }

      // Always restore before a smash to guarantee a 100% clean slate
      instance.restore();

      // note: order is important:
      instance.setBodiesKinematic(false);
      instance.setGravity(true);
    } else if (game.mode === 'edit') {
      instance.setGravity(false);
      instance.setBodiesKinematic(true);
    }
  });

  return instance;
}


/**
 * A hook to provide access to the physics instance.
 * This is a singleton pattern, so the physics instance is
 * created once and then returned on subsequent calls.
 */
function usePhysics() {
  if (!physicsHandle) {
    physicsHandle = createPhysics();
  }

  return physicsHandle;
}


export {
  usePhysics,
};
