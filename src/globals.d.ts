/// <reference types="@solidjs/start/env" />

// import { RigidBody } from "@dimforge/rapier3d";

// import { Collider } from '@dimforge/rapier3d';
// import type { Object3D } from 'three';


interface IDynamicBody {
  mesh: Mesh;
  body: RigidBody;
}

interface IUpdatable {
  id: string,
  update?: (delta: number) => void;
}


/*
// PSEUDO
When generating a game object, it requires 2 elements:
1. Visual (3D Mesh)
2. Model (Physics Collider)
*/

interface IWorldEntity extends IDynamicBody, IUpdatable {
  id: string;
  collider: any;       // physics
  // mesh: Mesh;       // skin
  // body?: RigidBody; // skeleton
  // update?: (delta: number) => void;
  dispose: () => void;
  // setup?: (world: any) => IDynamicBody;
}
