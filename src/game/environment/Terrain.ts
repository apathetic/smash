import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Vector3
} from 'three';
import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import { Base } from '~/game/entities/Base';
import { noise3 } from '~/game/utils/noise';
import type { World } from '@dimforge/rapier3d';
import type { Scene } from 'three';


  const TERRAIN_SIZE = 16;
  const TERRAIN_STRIDE = TERRAIN_SIZE + 1;


/**
 * Fixed Terrain game entity.
 * @returns IWorldEntity
 */
export class Terrain extends Base {
  setup (scene: Scene, physics: World) {
    for (let y = -32; y < 32; y += 16) {
      for (let x = -32; x < 32; x += 16) {
        const origin = new Vector3(x, 0, y);
        this.makeTile({ scene, physics, origin });
      }
    }
  }

  makeTile({ scene, physics, origin }: any) {
    const heightMap = new Float32Array(TERRAIN_STRIDE ** 2);
    const positionBuffer = new Float32BufferAttribute(TERRAIN_STRIDE ** 2 * 18, 3);
    const geometry = new BufferGeometry();
    const material = new MeshStandardMaterial({ color: new Color(0x448833) });
    const mesh = new Mesh(geometry, material);

    const position: number[] = [];
    const indices: number[] = [];

    const hmIndex = (x: number, y: number) => x * TERRAIN_STRIDE + y;
    const pushVertex = (x: number, y: number) => position.push(x, heightMap[hmIndex(x, y)], y);


    for (let y = 0; y < TERRAIN_STRIDE; y++) {
      for (let x = 0; x < TERRAIN_STRIDE; x++) {
        const index = hmIndex(x, y);
        let h = 0;

        // Cheesy multi-octave noise.
        for (let octave = 1; octave < 4; octave++) {
          const scale = 2 ** octave / 16;
          const xo = (x + origin.x) * scale;
          const yo = (y + origin.z) * scale;
          const xi = Math.floor(xo);
          const yi = Math.floor(yo);
          const xf = xo - xi;
          const yf = yo - yi;
          const h00 = noise3(xi, yi, octave);
          const h01 = noise3(xi, yi + 1, octave);
          const h10 = noise3(xi + 1, yi, octave);
          const h11 = noise3(xi + 1, yi + 1, octave);
          const h0 = h00 * (1 - xf) + h10 * xf;
          const h1 = h01 * (1 - xf) + h11 * xf;
          h += h0 * (1 - yf) + h1 * yf;
        }

        h = Math.max(h * 1.5 - 1.8, 0);
        heightMap[index] = h;
      }
    }

    // For this demo, we want terrain contours to be clearly visible, so generate separate triangles.
    for (let y = 0; y < TERRAIN_SIZE; y++) {
      for (let x = 0; x < TERRAIN_SIZE; x++) {
        const index = position.length / 3;
        pushVertex(x, y);
        pushVertex(x, y + 1);
        pushVertex(x + 1, y);
        pushVertex(x + 1, y);
        pushVertex(x, y + 1);
        pushVertex(x + 1, y + 1);
        indices.push(index, index + 1, index + 2);
        indices.push(index + 3, index + 4, index + 5);
      }
    }


    mesh.position.copy(origin);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.receiveShadow = true;

    positionBuffer.copyArray(position);
    positionBuffer.needsUpdate = true;

    geometry.setAttribute('position', positionBuffer);
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const rbDesc = RigidBodyDesc.fixed().setTranslation(
      origin.x + TERRAIN_SIZE * 0.5,
      origin.y,
      origin.z + TERRAIN_SIZE * 0.5
    );

    const clDesc = ColliderDesc.heightfield(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      heightMap,
      new Vector3(TERRAIN_SIZE, 1, TERRAIN_SIZE)
    );

    const body = physics.createRigidBody(rbDesc);

    physics.createCollider(clDesc, body);
    scene.add(mesh);


    // TODO. these don't update / need updating.
    // adding them here is a convenient way to hold on to their ref's if we ever need to remove / destroy them
    // however, it is a minor performance drag as they then need to be processed during the `update` loop
    this.dynamicBodies.push({ mesh, body });
  }


};
