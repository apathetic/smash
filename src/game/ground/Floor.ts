import rapier from '@dimforge/rapier3d';
import { Mesh, MathUtils, BoxGeometry, MeshPhongMaterial } from 'three';

export function Floor() {
  const geometry = new BoxGeometry(100, 1, 100);
  const material = new MeshPhongMaterial();
  const mesh = new Mesh(geometry, material);

  const floorBody = rapier.RigidBodyDesc.fixed().setTranslation(0, -1, 0);
  const floorShape = rapier.ColliderDesc.cuboid(50, 0.5, 50);

  mesh.receiveShadow = true
  mesh.position.y = -1

  const floor: IWorldEntity = {
    id: 'floor',
    mesh,
    collider: floorShape,
    setup: (physics: any) => {
      // const body = physics.createRigidBody(floorBody)
      // physics.createCollider(floorShape, body)

      const body = physics.createRigidBody(floorBody)
      physics.createCollider(floorShape, body)

      return { mesh, body };
    },
  };


  return floor;
}
