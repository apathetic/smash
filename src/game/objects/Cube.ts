import { Mesh, BoxGeometry, MeshNormalMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { usePhysics } from '~/system/physics';


/**
 * Cube game object.
 * @returns IWorldEntity
 */
export function Cube() {
  const geometry = new BoxGeometry(0.2, 0.2, 0.2);
  const material = new MeshNormalMaterial();
  const mesh = new Mesh(geometry, material);

  const physics = usePhysics();
  const colliderDesc = ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5);
  const rigidBodyDesc = RigidBodyDesc.dynamic().setTranslation(0, 5, 0).setCanSleep(false);
  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);

  const update = (delta: number) => {
    mesh.position.copy(body.translation());
    mesh.quaternion.copy(body.rotation());
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  const cube: IWorldEntity = {
    id: 'cube',
    mesh,
    update,
    dispose,
    // collider,
    // body,
  };

  return cube;
}
