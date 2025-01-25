/// <reference types="@solidjs/start/env" />
import type { Object3D } from 'three';


export interface IUpdatable extends Object3D {
  update: (delta: number) => void;
}
