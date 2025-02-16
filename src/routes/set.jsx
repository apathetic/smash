import { useNavigate } from "@solidjs/router";
// import { createAsync } from "solid/router";
import { onMount, onCleanup } from "solid-js";
import { Nav } from "~/components/Nav";


// import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";
import { Stage } from "~/components/Stage";

import { RagDoll } from '~/game/objects/Ragdoll';
import { Terrain } from '~/game/ground/Terrain';
import { Floor } from '~/game/ground/Floor';
import { Cube } from '~/game/objects/Cube';





function xxxx() {
  console.log('set!!');
  const { add, start } = useWorld();
  const terrain = new Terrain();
  const floor = new Floor();
  const cube = new Cube();
  const ragdoll = new RagDoll();

  add(terrain);
  // add(floor);
  add(ragdoll);
  add(cube);


    // NOTE: this should not be in this file (likely smash.jsx), but is here for now
    start();
}





export default function Set() {
  const navigate = useNavigate();

  onMount(() => {
    xxxx();
  });



  function smash() {
    // cool animation while holding button....
    // then...
      navigate('/smash');
  }

  const nav = (route) => () => navigate(route);


  return (
    <>
      <Nav />

      <button
        class="fixed bottom-0 right-0 nav-button"
        onClick={nav('/smash')}
      >
        SMASH
      </button>
      SET!
    </>
  );
}