import { Mesh, MathUtils, BoxGeometry, MeshNormalMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { usePhysics } from '~/system/physics';

const rotateBy = MathUtils.degToRad(30);


/**
 * Cube game object.
 * @returns IWorldEntity
 */
export function Cube() {
  const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new MeshNormalMaterial();
  const mesh = new Mesh(geometry, material);

  const physics = usePhysics();
  const colliderDesc = ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5);
  const rigidBodyDesc = RigidBodyDesc.dynamic().setTranslation(0, 5, 0).setCanSleep(false);
  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);

  // [question]
  // question: is this actually... necessary?  won't the physics system handle how the cube moves?
  // and, if an object had its own animation, isn't that handled in the model?
  const update = (delta: number) => {
    mesh.rotation.x += rotateBy * delta;
    mesh.rotation.y += rotateBy * delta;
  };

  const destroy = () => {

  };

  const cube: IWorldEntity = {
    id: 'cube',
    collider,
    mesh,
    body,
    update,
    destroy,
  };

  return cube;
}
