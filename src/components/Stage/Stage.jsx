import { onMount } from "solid-js";
import { useWorld } from "~/system/world";



import { Floor } from '~/game/ground/Floor';
import { Cube } from '~/game/objects/Cube';
// import { RagDoll } from '~/game/ragdoll';


const Stage = () => {
  let canvas;

  onMount(() => {
    const { add, start } = useWorld(canvas);

    // const ground = Ground();
    const floor = Floor(); // this ground by default? or dynamic / per level?
    const cube = new Cube();
    // const ragdoll = new RagDoll();

    add(floor);
    add(cube);
    start();
  });

  return (
    <canvas ref={canvas} class="fixed inset-0 z-1 bg-red"></canvas>
  );
}

export { Stage };
