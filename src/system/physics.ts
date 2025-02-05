import { World } from '@dimforge/rapier3d';

/**
 * A reference to a physics World instance.
 * The return object exposes an update function, but
 * this is a direct reference to the World instance.
 */
let physicsWorld: World;


  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  physicsWorld = new World(gravity);


  function update(delta: number) {
    physicsWorld.timestep = Math.min(delta, 0.01);
    physicsWorld.step();
  }

  return { update };
}


/**
 * A hook to provide access to the physics world instance.
 * This is a singleton pattern, so the world instance is
 * created once and then returned on subsequent calls.
 *
 * @returns World
 */
function usePhysics() {
  if (!physicsWorld) {
    throw new Error('[usePhysics]: createPhysics has not been called!');
  }

  return physicsWorld;
}


export {
  createPhysics,
  usePhysics
};
