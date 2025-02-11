import { World, EventQueue } from '@dimforge/rapier3d';


  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const world = new World(gravity);

  const eventQueue = new EventQueue(true); // Must be created with 'true' to capture contact force events

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
