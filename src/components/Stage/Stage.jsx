import { onMount } from "solid-js";
import { useWorld } from "~/system/world";



import { Cube } from '../../assets/models/Cube'; // i know not a model, but need a place for these
// import RagDoll from '../models/RagDoll';


const Stage = () => {
  let canvas;

  onMount(() => {
    const cube = Cube();
    const { add, start } = useWorld(canvas);
    add(cube);
    start();
  });

  return (
    <canvas ref={canvas} class="fixed  top-0 left-0 w-full h-full XXXinset-0 z-1 bg-red"></canvas>
  );
}

export { Stage };
