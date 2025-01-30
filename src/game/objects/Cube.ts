import rapier from '@dimforge/rapier3d';

import {
  Mesh,
  MathUtils,
  BoxGeometry,
  MeshNormalMaterial
} from 'three';
import { useWorld } from '~/system/world';
import { IUpdatable } from '~/types.d';


export interface IWorldEntity extends IUpdatable {
  setup: (world: any) => void;
}



/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/



/// Cube AS A CLASS
// --------------------------------------------------

/**
  * Cube
  *
  * A Cube class that extends Mesh and adds an update method (IWorldEntity).
  * And maybe a physics setup method. TBD.
  */
export class Cube extends Mesh implements IWorldEntity {
  private rotateBy: number = MathUtils.degToRad(30);
  public collider: any;


  constructor() {
    const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
    const material = new MeshNormalMaterial();

    super(geometry, material);


    this.collider = rapier.ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5);


    // OPTION 1
    //   -- assuems world will have been setup by this point
    //   -- not wrong, but a hook is really weird in a class
    // const { physicsWorld } = useWorld();
    // physicsWorld.add(collider);
  };

  // OPTION 2
  // or addPhysics() or ...
  setup(physicsWorld: any) {
    physicsWorld.add(this.collider);
  }

  update(delta: number) {
    this.rotation.x += this.rotateBy * delta;
    this.rotation.y += this.rotateBy * delta;
  };
}


///////////////////////////////////////////////////////////////////////////////////////


/// Cube AS A FUNCTION
// --------------------------------------------------

export interface IWorldEntityII {
  id: string;
  mesh: Mesh;
  collider: any;
  update: (delta: number) => void;
  setup: (world: any) => void;
}

export const CubeII = () => {
  const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new MeshNormalMaterial();
  const rotation = MathUtils.degToRad(30);

    // OPTION 1
    // const { physicsWorld } = useWorld(); // assumes world will have been setup by this point
    // physicsWorld.add(collider);

  const cube: IWorldEntityII = {
    id: 'cube',
    mesh: new Mesh(geometry, material),
    collider: rapier.ColliderDesc.cuboid(0.2, 0.2, 0.2).setMass(1).setRestitution(0.5),

    // OPTION 2
    // allows for async setup. more verbose.
    setup: (physicsWorld: any) => { //  (or setupPhysics etc)
      physicsWorld.add(cube.collider);
    },

    update: (delta: number) => {
      cube.mesh.rotation.x += rotation * delta;
      cube.mesh.rotation.y += rotation * delta;
    }
  };


  return cube;
};
