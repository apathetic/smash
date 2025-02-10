import { World } from '@dimforge/rapier3d';


  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const physics = new World(gravity);

  function update(delta: number) {
    physics.timestep = Math.min(delta, 0.01);
    physics.step();
  }

  return { physics, update };
}


export {
  createPhysics,
};
