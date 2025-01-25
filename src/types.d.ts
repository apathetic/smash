/// <reference types="@solidjs/start/env" />
import type { Object3D } from 'three';


export interface IUpdatable extends Object3D {
  tick: (delta: number) => void;
}


// OR, would a "container" for the 3d object + its update function be better?
// ie.
export interface IUpdatableV2 {
  object: Object3D;

  // ALSO  - what's, better, a `delta` or a `time`?
  tick: (delta: number) => void;
}
