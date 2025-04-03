/// <reference types="@solidjs/start/env" />



/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/


type Position = [number, number, number];
type Tuple = [number, number, number];

interface IGraphics {
  camera: import("three").PerspectiveCamera;
  scene: import("three").Scene;
  renderer: import("three").WebGLRenderer;
}

interface IPhysics {
  world: import("rapier").World;
  collisions: (event: any) => void;
  update: (delta: number) => void;
}

///







type Entities = "Cube" | "Wall" | "Floor" | "Terrain";


type DynamicBody = {
  mesh: Mesh;       // skin
  body: RigidBody;  // skeleton
}

type Updatable = {
  dynamicBodies: DynamicBody[];
  update: (delta: number) => void;
}

type Damageable = {
  damage: any;
}

type WorldEntity = Updatable & Partial<Damageable> & {
  id: string;
  position: Position;
  setup: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
  destroy: () => void;
}



type Impact = {
  id: number;
  bodyPart: string;
  force: number;
  position: [number, number, number];
  // collidedWith: string;
  timestamp: number;
}




/* // -------------------------


JSON
- each worldEntity in a serializable JSON

REGISTRY
- each _instantiated_ worldEntity object, in a store

LEVEL STORE
- current details (position, rotation, meta) of each
  _instantiated_ worldEntity object, duplicated and
  available here


 */

// type StoreEntity =  WorldEntity  &   {
//   id: string;
//   type: string; // e.g., 'cube', 'sphere', etc.
//   position: Position;
//   rotation: EntityRotation;
// };


//// from the JSON:

type LevelEntity = {
  type: Entities; //string;
  position?: Position; // can be undefined b/c Floor / Terrain just hard-code it
  meta?: any;
}

type Level = {
  boosts: any;
  environment: LevelEntity[];
  entities: LevelEntity[];
}

