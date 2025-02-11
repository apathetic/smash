import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";
import { RagDoll } from '~/game/objects/Ragdoll';
import { Terrain } from '~/game/ground/Terrain';
import { Floor } from '~/game/ground/Floor';
import { Cube } from '~/game/objects/Cube';


const Stage = () => {
  let canvas;

  onMount(() => {
    const { add, start } = useWorld(canvas);
    const terrain = new Terrain();
    const floor = new Floor();
    const cube = new Cube();
    const ragdoll = new RagDoll();

    add(terrain);
    // add(floor);
    add(ragdoll);
    add(cube);

    start();
  });

  onCleanup(() => {
    const { stop } = useWorld();
    stop();
  });

  return (
    //  NOTE: I'm coming around to having the <canvas> at the root / on all pages
    //        Then, pages would act as a way to "swap out the UI", or a modal, eg.
    //        Non-traditional application, but could be interesting. The "threlter" demo
    //        was _really_ fugly here imho, using bespoke portals and scraping the DOM to
    //        inject UI things at certain times.
    <canvas ref={canvas} class="fixed inset-0 z-1"></canvas>
  );
}

export { Stage };
