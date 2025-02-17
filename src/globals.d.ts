/// <reference types="@solidjs/start/env" />



/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/


type Position = [number, number, number];

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

interface IDynamicBody {
  mesh: Mesh;       // skin
  body: RigidBody;  // skeleton
}

interface IUpdatable {
  dynamicBodies: IDynamicBody[];
  update: (delta: number) => void;
}

interface IWorldEntity extends IUpdatable {
  setup: (scene: IGraphics['scene'], physics: IPhysics['world']) => void;
  destroy: () => void;
}
