import rapier from '@dimforge/rapier3d';
import { Mesh, MathUtils, BoxGeometry, MeshNormalMaterial } from 'three';

/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/

export interface IWorldEntity {
  id: string;
  mesh: Mesh;
  collider: any;
  update: (delta: number) => void;
  setup: (world: any) => void;
}

export const Cube = () => {
  const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new MeshNormalMaterial();
  const rotation = MathUtils.degToRad(30);
  const mesh = new Mesh(geometry, material);

    // cubeMesh.castShadow = true

  const collider = rapier.ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5);
  const rigidBody = rapier.RigidBodyDesc.dynamic().setTranslation(0, 5, 0).setCanSleep(false);

  const cube: IWorldEntity = {
    id: 'cube',
    mesh,
    collider,
    // or setupPhysics() etc. physics(), or addPhysics()
    setup: (physicsWorld: any) => {
      const body = physicsWorld.createRigidBody(rigidBody)
      physicsWorld.createCollider(collider, body)

      return { mesh, body };
    },

    // [question]
    // question: is this actually... necessary?  worn't the physics system handle how the cube moves?
    // and, if an object had its own animation, isn't that handled in the model?
    update: (delta: number) => {
      cube.mesh.rotation.x += rotation * delta;
      cube.mesh.rotation.y += rotation * delta;
    }
  };


  return cube;
};
