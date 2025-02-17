import { useNavigate } from "@solidjs/router";

import { Nav } from "~/components/Nav";
import { useWorld } from "~/system/world";
import { useGameState } from "~/stores/gameState";

import { RagDoll } from "~/game/objects/Ragdoll";
import { Terrain } from "~/game/ground/Terrain";
import { Floor } from "~/game/ground/Floor";
import { Cube } from "~/game/objects/Cube";



function level() {
  const { add, start, stop } = useWorld();
  stop();

  const terrain = new Terrain();
  const floor = new Floor();
  const cube = new Cube();
  const ragdoll = new RagDoll();

  add(terrain);
  // add(floor);
  add(ragdoll);
  add(cube);


  start();
}





export default function Set() {
  const navigate = useNavigate();
  const [game, setGameState] = useGameState();

  setGameState('isRunning', false);


  // temp boilerplate for now:
  level();



  function goSmash() {
    // cool animation while holding button....
    // then...
      navigate('/smash');
  }



  return (
    <>
      <Nav />

      <button
        class="fixed bottom-0 right-0 nav-button"
        onClick={goSmash}
      >
        SMASH
      </button>
      SET!
    </>
  );
}