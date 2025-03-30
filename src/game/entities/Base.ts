import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';
import { generateEntityId } from "~/game/store";
import { Vector3, Quaternion } from 'three';


// ALL "static" elements (walls, floor, etc) are GROUP 1 (in binary)
// ALL "interactable" entities (ragdoll, cube, etc) are GROUP 2 (in binary)
// ALL GROUPS interact with one another. HOWEVER, we have these GROUPS so as
// to FILTER raycasts / clicks / interactions / etc. appropriately
// https://rapier.rs/docs/user_guides/javascript/colliders/#collision-groups-and-solver-groups

// 0b0000_0000_0000_0001 = 0x0001 ==> is a member of GROUP 1.
// 0b0000_0000_0000_0011 = 0x0003 ==> may interact with GROUPS 1 and 2
// 0x0001 (member of) + 0x0003 (interactable with) = 0x00010003
const COLLISION_GROUP_STATIC = 0x00010003;

// same as above, but 0x0002 ==> is a member of GROUP 2
const COLLISION_GROUP_DYNAMIC = 0x00020003;


// type BaseProps = Omit<LevelEntity, 'type'>
type BaseProps = Partial<LevelEntity>


// type BaseProps = Partial<{
//   // id: string;
//   position: Position;
//   meta: any;
// }>


/**
 * Base game entity.
 * @returns IWorldEntity
 */
export class Base implements WorldEntity {
  public id: string;
  public dynamicBodies: DynamicBody[];
  public position: Position; // coords: any?



  public type: string;
  static count: Record<string, number> = {}; // Track count per entity type




  static COLLISION_GROUP_STATIC = 0x00010003;
  static COLLISION_GROUP_DYNAMIC = 0x00020003;

  constructor({ type,  /* id, */ position, meta }: BaseProps = { }) {
    // this.id = /* id || */ Math.random().toString(36).substring(2, 9); // for reference
    // this.uuid = Math.random().toString(36).substr(2, 9);     // for uniqueness




    type ??= 'Cube';
    // Base.count[type] = Base.count[type] || 0;
    Base.count[type] ??= 0;
    this.type = type;
    this.id = generateEntityId(type, Base.count[type]++);





    // if (!position) { console.error('NO POSITION SET FOR ' + this.constructor.name); }

    this.dynamicBodies = [];
    this.position = position || [0, 0, 0];

    console.log("Creating entity:", this.constructor.name);
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
      body.setTranslation(...pos, true);

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
