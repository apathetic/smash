import rapier from '@dimforge/rapier3d';


const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const physicsWorld = new rapier.World(gravity);
  const dynamicBodies: IDynamicBody[] = [];

  // TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

  function update(delta: number) {
    physicsWorld.timestep = Math.min(delta, 0.01);
    physicsWorld.step();

    dynamicBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    });
  }

  function add(item: any) {
    console.log("PHYSICS: ", item);

    // call setup() fn to allow item to set itself up in the world.
    // i just like "set itself up in the world" like it's a teen leaving home for the first time
    const { mesh, body } = item.setup(physicsWorld);
    dynamicBodies.push({ mesh, body });
  }

  function remove(item: any) {
    console.log("Removed ", item);
  }

  return { add, remove, update };
}

export {
  createPhysics
};
