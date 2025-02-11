import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";



import { Terrain } from '~/game/ground/Terrain';
import { Floor } from '~/game/ground/Floor';
import { Cube } from '~/game/objects/Cube';
import { RagDoll } from '~/game/objects/Ragdoll';


const Stage = () => {
  let canvas;

  onMount(() => {
    const { add, start } = useWorld(canvas);


    const terrain = new Terrain();
    // const ground = Ground();
    const floor = new Floor();
    const cube = new Cube();
    const ragdoll = new RagDoll();

    // OPTION 1
    // add(terrain);
    add(ragdoll);
    add(floor);
    add(cube);


    // OPTION 2
    // requires using a useWorld hook in the class to get refs to: scene and physics
    // floor.addToWorld();
    // cube.addToWorld();

    start();
  });

  onCleanup(() => {
    const { stop } = useWorld();
    stop();
  });

  return (
    <canvas ref={canvas} class="fixed inset-0 z-1 bg-red"></canvas>
  );
}

export { Stage };
