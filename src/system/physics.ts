import { World } from '@dimforge/rapier3d';

/**
 * A reference to a physics World instance.
 * The return object exposes a number of functions for interacting with
 * the World, but this provides a direct reference to the World instance.
 */
let physicsHandle: World;


  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const physicsWorld = new World(gravity);
  const dynamicBodies: IDynamicBody[] = [];

  function update(delta: number) {
    physicsWorld.timestep = Math.min(delta, 0.01);
    physicsWorld.step();

    dynamicBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    });
  }

  function add(item: any) {
    const { mesh, body } = item;
    dynamicBodies.push({ mesh, body });
  }

  function remove(item: any) {
    console.log("Removed ", item);
  }

  // NOTE: this may be a bit weird. We use the physicsHandle/phsyicsWorld in
  // the hook, but return `add`,`remove`, and `update` functions here.
  // TBD
  physicsHandle = physicsWorld;

  return { add, remove, update };
}


/**
 * A hook to provide access to the physics world instance.
 * This is a singleton pattern, so the world instance is
 * created once and then returned on subsequent calls.
 *
 * @returns World
 */
function usePhysics() {
  if (!physicsHandle) {
    throw new Error('[usePhysics]: createPhysics has not been called!');
  }

  return physicsHandle;
}


export {
  createPhysics,
  usePhysics
};
