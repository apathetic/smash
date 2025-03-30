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
  world: import("@dimforge/rapier3d").World;
  update: (delta: number) => void;
}

///

// interface IDynamicBody {
//   mesh: Mesh;       // skin
//   body: RigidBody;  // skeleton
// }

// interface IUpdatable {
//   dynamicBodies: IDynamicBody[];
//   update: (delta: number) => void;
// }

// interface IWorldEntity extends IUpdatable {
//   id?: string;
//   position: Position;
//   setup: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
//   destroy: () => void;
// }








type DynamicBody = {
  mesh: Mesh;       // skin
  body: RigidBody;  // skeleton
}

type Updatable = {
  dynamicBodies: IDynamicBody[];
  update: (delta: number) => void;
}

type WorldEntity = IUpdatable & {
  id?: string;
  position: Position;
  setup: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
  destroy: () => void;
}



type Entities = "Cube" | "Wall" | "Floor" | "Terrain";

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

