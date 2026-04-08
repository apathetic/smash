import { generateEntityId } from "~/game/store";
import { Vector3, Quaternion } from 'three';
import type { World } from 'rapier';
import type { Scene } from 'three';

type BaseProps = Partial<LevelEntity>

/**
 * Base game entity.
 * @returns WorldEntity
 */
export class Base implements WorldEntity {
  public id: string;
  public dynamicBodies: DynamicBody[];
  public position: Position; // coords: any?
  public type: string;
  static count: Record<string, number> = {}; // Track count per entity type


  constructor({ type, position, meta }: BaseProps = {}) {
    type ??= 'Cube'; // TBD
    Base.count[type] ??= 0;
    this.type = type;
    this.id = generateEntityId(type, Base.count[type]++);
    this.dynamicBodies = [];
    this.position = position || [0, 0, 0];

    console.log("Creating entity:", this.constructor.name, meta);
  }

  setup(_scene: Scene, _physics: World, /* position: Position */) {
    // to be extended
  }

  update(_delta: number) {
    this.dynamicBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    });
  }

  reset(position?: Position) {
    this.dynamicBodies.forEach(({ mesh, body }) => {
      // If a position is provided, use it; otherwise use the stored position
      const pos = position || this.position;

      // Set the physics body position
      body.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);

      // Reset rotation to identity if not specified
      // We could also store and restore rotation from this.rotation if needed
      body.setRotation(new Quaternion(0, 0, 0, 1), true);

      // Reset velocities
      body.setLinvel(new Vector3(0, 0, 0), true);
      body.setAngvel(new Vector3(0, 0, 0), true);

      // Update the mesh to match
      mesh.position.set(pos[0], pos[1], pos[2]);
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
