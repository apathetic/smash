import { createEffect } from "solid-js"
import { World, EventQueue, RigidBodyType } from 'rapier';
import { useGameState } from "~/game/store";


const GRAVITY = -9.81;

  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

function createPhysics() {
  // const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const gravity = { x: 0.0, y: 0, z: 0.0 };
  const world = new World(gravity);
  const eventQueue = new EventQueue(true); // 'true' to capture contact force events
  const [game] = useGameState();

  // Increase solver iterations for more stable constraint solving
  world.integrationParameters.numSolverIterations = 20; // Default is usually 4


  const toggleGravity = (enabled: boolean) => {
    world.gravity.y = enabled ? GRAVITY : 0;
    // Wake up all bodies when gravity is enabled to ensure they respond
    if (enabled) {
      world.forEachRigidBody((body) => body.wakeUp());
    }
  };




  // Function to make the ragdoll "posable" - stays where you put it
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




  let stepId = 0;






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




  const collisions = (event: any) => { ///// meant to be overwitten;
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

  return { world, update, collisions };
}


export {
  createPhysics,
};
