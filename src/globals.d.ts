/// <reference types="@solidjs/start/env" />
// import { Collider } from '@dimforge/rapier3d';
// import type { Object3D } from 'three';


interface IDynamicBody {
  mesh: any; // TBD
  body: any; /*rigidbody*/
}

interface IUpdatable {
  id: string,
  // mesh: Object3D,
  // collider: any;
  update: (delta: number) => void;
}

interface IWorldEntity extends IUpdatable {
  id: string;
  mesh: Mesh;
  collider: any;
  // update: (delta: number) => void;
  setup: (world: any) => IDynamicBody;
}
