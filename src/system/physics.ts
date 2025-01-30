import RAPIER from '@dimforge/rapier3d';

const createPhysics = () => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const physicsWorld = new RAPIER.World(gravity);
  const dynamicBodies = [] as any;
  //TODO: tune physics props
  // - broadpass algorithms
  // - solver.iterations value
  // - allowSleep toggle

  function update(delta: number) {
    physicsWorld.timestep = Math.min(delta, 0.01)
    physicsWorld.step()

    for (let i = 0, n = dynamicBodies.length; i < n; i++) {
      dynamicBodies[i][0].position.copy(dynamicBodies[i][1].translation())
      dynamicBodies[i][0].quaternion.copy(dynamicBodies[i][1].rotation())
    }
  }

  function add(item: any) {
    // physicsWorld.add()// add phys obj
    console.log("PHYSICS: ", item);

    // const body = 

  //  // const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x0000FF}))
  //  // cubeMesh.castShadow = true
  //  // scene.add(cubeMesh)

    // const cubeBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-4, 5, 2).setCanSleep(false))
    // const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.5)
    // world.createCollider(cubeShape, cubeBody)
    
    // dynamicBodies.push([cubeMesh, cubeBody])


  }

  function remove(item: any) {
    // physicsWorld.remove()// add phys obj
    console.log("Removed ", item);
  }

  function getPhysicsWorld() {
    return physicsWorld;
  }

  return { add, remove, update, getPhysicsWorld };
}

export {
  createPhysics
};
