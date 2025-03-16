import { createEffect } from "solid-js"
import { World, EventQueue, RigidBodyType } from '@dimforge/rapier3d';
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


  const toggleGravity = (enabled: boolean) => world.gravity.y = enabled ? -9.81 : 0;




  // Function to make the ragdoll "posable" - stays where you put it
  function setPosableMode(enabled: boolean) {
    // ragdollBodies.forEach(body => {
    world.forEachRigidBody((body) => {
      if (enabled) {
        // High damping to stop movement quickly
        body.setLinearDamping(10.0);
        body.setAngularDamping(10.0);

        // Zero out velocities
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Wake up the body to ensure damping is applied
        // body.wakeUp(); // true above does this
      } else {
        // Normal damping for physics simulation
        body.setLinearDamping(0.2);
        body.setAngularDamping(0.2);
      }
    });
  }








  createEffect(() => {

    // Toggle gravity based on game state
    if (game.mode == 'smash') {
      toggleGravity(true);
      setPosableMode(false);
    } else {
      toggleGravity(false);
      setPosableMode(true);
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
    let handle1 = event.collider1(); // Handle of the first collider involved in the event.
    let handle2 = event.collider2(); // Handle of the second collider involved in the event.
    // console.log("Contact force:", handle1, event.totalForce());
  }


  function update(delta: number) {
    world.step(eventQueue);

    // eventQueue.drainCollisionEvents((...        // if `ActiveEvents.COLLISION_EVENTS` is set in the collider
    eventQueue.drainContactForceEvents(collisions); // if `ActiveEvents.CONTACT_FORCE_EVENTS` is set in the collider
  }

  return { world, update, collisions };
}


export {
  createPhysics,
};
