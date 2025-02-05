import { Mesh, BoxGeometry, MeshPhongMaterial } from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { usePhysics } from '~/system/physics';


/**
 * The Floor.
 * @returns IWorldEntity
 */
export function Floor() {
  const geometry = new BoxGeometry(100, 1, 100);
  const material = new MeshPhongMaterial();
  const mesh = new Mesh(geometry, material);

  const physics = usePhysics();
  const floorBody = RigidBodyDesc.fixed().setTranslation(0, -1, 0);
  const floorShape = ColliderDesc.cuboid(50, 0.5, 50);
  const body = physics.createRigidBody(floorBody);
  const collider = physics.createCollider(floorShape, body);

  mesh.receiveShadow = true
  mesh.position.y = -1;

  const floor: IWorldEntity = {
    id: 'floor',
    collider,
    mesh,
    body,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };

  return floor;
}
