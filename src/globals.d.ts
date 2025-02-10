/// <reference types="@solidjs/start/env" />

// import type { World } from '@dimforge/rapier3d';
// import type { Scene } from 'three';



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
  dynamicBodies: IDynamicBody[];
  update: (delta: number) => void;
}

interface IWorldEntity extends IUpdatable {
  setup: (scene, physics) => void; // TODO type w/ three, rapier
  update: (delta: number) => void;
  destroy: () => void;
}
