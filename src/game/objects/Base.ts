import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


/**
 * Base game entity.
 * @returns IWorldEntity
 */
export class Base implements IWorldEntity {
  public id: string;
  public dynamicBodies: IDynamicBody[] = [];
  public position: any; // coords: any?

  constructor(id: string) {
    this.id = id || Math.random().toString(36).substring(2, 9); // for reference
    // this.uuid = Math.random().toString(36).substr(2, 9);     // for uniqueness
    console.log("Creating entity:", this.constructor.name);
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
      console.log("destroy this?", body);
    });
  };

}
