import {
  Mesh,
  MathUtils,
  BoxGeometry,
  MeshNormalMaterial,
} from 'three';
import { IUpdatable } from '~/types';

export const Cube = () => {
  const geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new MeshNormalMaterial();
  const cube = new Mesh(geometry, material);
  const rotation = MathUtils.degToRad(30);

  cube.tick = (delta) => {
    cube.rotation.x += rotation * delta;
    cube.rotation.y += rotation * delta;
  };

  return cube as IUpdatable;
};
