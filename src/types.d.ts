/// <reference types="@solidjs/start/env" />

import type { Object3D } from 'three';

// declare namespace Three {
//   declare module 'three/addons/misc/Timer.js';

//   export interface IUpdatable extends Mesh {
//     tick: (delta: number) => void;
//   }
// }



export interface IUpdatable extends Object3D {
  tick: (delta: number) => void;
}
