import { useNavigate } from "@solidjs/router";
import { onMount, onCleanup } from "solid-js";
import { Nav } from "~/components/Nav";

import { useWorld } from "~/system/world";
import { RagDoll } from "~/game/objects/Ragdoll";
import { Terrain } from "~/game/ground/Terrain";
import { Floor } from "~/game/ground/Floor";
import { Cube } from "~/game/objects/Cube";



function level() {
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
  const nav = (route) => () => navigate(route);

  onMount(() => {
    level();
  });



  function smash() {
    // cool animation while holding button....
    // then...
      navigate('/smash');
  }



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