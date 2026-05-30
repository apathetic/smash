/// <reference types="@solidjs/start/env" />

type Tuple = [number, number, number];
type Position = Tuple;

interface IGraphics {
  camera: import("three").PerspectiveCamera;
  scene: import("three").Scene;
  renderer: import("three").WebGLRenderer;
}

interface IPhysics {
  world: import("rapier").World;
  dragger: any;
  stepId: number;
  update: (delta: number) => void;
  save: () => void;
  restore: () => void;
  isSettled: () => boolean;
  setGravity: (enabled: boolean) => void;
  setBodiesKinematic: (enabled: boolean) => void;

  // MEH: find a better / less hacky way for this:
  markEdited: () => void;
  get hasEdited(): boolean;
}

type Entities = "Cube" | "Wall" | "Floor" | "Terrain" | "Sphere" | "Ragdoll" | "Truck";

type DynamicBody = {
  name?: string;
  mesh: import("three").Mesh | any; // Visual representation (skin)
  body: import("rapier").RigidBody; // Physics collider (skeleton)
}

type Updatable = {
  dynamicBodies: DynamicBody[];
  update: (delta: number) => void;
  reset?: (position?: Position) => void;
}

type Damageable = {
  damage: any;
}

type WorldEntity = Updatable & Partial<Damageable> & {
  id: string;
  type?: string;
  position: Position;
  setup: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
  destroy: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
}

type Impact = {
  id: number;
  bodyPart: string;
  force: number;
  position: Position;
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
  rotation?: Tuple; // Euler angles in degrees [x, y, z]
  meta?: any;
}

type Level = {
  boosts: any;
  targetDamage: number;
  environment: LevelEntity[];
  entities: LevelEntity[];
}
