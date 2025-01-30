import RAPIER from '@dimforge/rapier3d';

import {
  Mesh,
  MathUtils,
  BoxGeometry,
  MeshNormalMaterial,
  Object3D
} from 'three';
import { IUpdatable } from '~/types';

/**
  * Cube
  *
  * A Cube class that extends Object3D and adds an update method (IUpdatable).
  */
// export class CubeSS extends Object3D implements IUpdatable {
//   // public cube: Mesh;
//   private rotationAmount: number;

//   constructor() {
//     super();
//     const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
//     const material = new MeshNormalMaterial();
//     const cube = new Mesh(geometry, material);
//     const rotation = MathUtils.degToRad(30);

//     this.rotationAmount = rotation;
//   }

//   update(delta: number) {
//     this.cube.rotation.x += this.rotationAmount * delta;
//     this.cube.rotation.y += this.rotationAmount * delta;
//   };
// }


// or, keep it as a function:
///////////////////////////



/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/



export const Cube = () => {
  
  const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new MeshNormalMaterial();
  const rotation = MathUtils.degToRad(30);

  // const cube = new Mesh(geometry, material) as unknown as IUpdatable;
  // cube.update = (delta) => {
  //   cube.rotation.x += rotation * delta;
  //   cube.rotation.y += rotation * delta;
  // };



  const cube = {
    id: 'cube',
    mesh: new Mesh(geometry, material),
    collider: RAPIER.ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5)
  }  as unknown as IUpdatable;

  cube.update = (delta: number) => {
    cube.mesh.rotation.x += rotation * delta;
    cube.mesh.rotation.y += rotation * delta;
  };

  return cube;
};
