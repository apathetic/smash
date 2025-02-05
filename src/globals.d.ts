/// <reference types="@solidjs/start/env" />




/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/


interface IDynamicBody {
  mesh: Mesh;       // skin
  body: RigidBody;  // skeleton
}

interface IUpdatable {
  update?: (delta: number) => void;
}

interface IWorldEntity extends IDynamicBody, IUpdatable {
  id: string;
  collider?: Collider;
  body?: RigidBody; // make this optional
  dispose: () => void;
}
