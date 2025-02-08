import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * Base game object.
 */
export class Base implements IWorldEntity {
  public dynamicBodies: IDynamicBody[] = [];

  constructor() {
    //
  }

  // because some of things things are complex (objects, multiple rigid bodies)
  // and cannot be represented in a single `mesh` or `body` in the returned obj.
  //
  setup(scene: Scene, physics: World) { // or `addToWorld` or `add`
    // to be extended
  }

  //  this is in the base class, so is inherited by all the things. unless overridden
  //
  // also required here (and not in physics) b/c there be other things? ie.  pivot.rotation.y += 0.005;  etc
  update(delta: number) {
    this.dynamicBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    });
  }

  destroy() {
    this.dynamicBodies.forEach(({ mesh, body }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      // ...
    });
  };

}
