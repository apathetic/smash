/// <reference types="@solidjs/start/env" />
import { Collider } from '@dimforge/rapier3d';
import type { Object3D } from 'three';


export interface IUpdatable extends Object3D  {
  id: string,
  mesh: Object3D,
  physics: Collider,
  update: (delta: number) => void;
}