import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * Base game entity.
 * @returns IWorldEntity
 */
export class Base implements IWorldEntity {
  public dynamicBodies: IDynamicBody[] = [];
  public position: any; // coords: any?

  constructor() {
    //
  }

  setup(scene: Scene, physics: World, /* position: Position */) {
    // to be extended
  }

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
