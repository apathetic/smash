import { onMount } from "solid-js";
import { useWorld } from "~/system/world";



import { Cube } from '~/game/objects/Cube';
// import { RagDoll } from '~/game/ragdoll';


const Stage = () => {
  let canvas;

  onMount(() => {
    const { add, start } = useWorld(canvas);

    const cube = /* new */ Cube();
    // const ragdoll = new RagDoll();

    add(cube);
    start();
  });

  return (
    <canvas ref={canvas} class="fixed  top-0 left-0 w-full h-full XXXinset-0 z-1 bg-red"></canvas>
  );
}

export { Stage };
