import { Nav } from "~/components/Nav";
import { SmashButton } from "~/components/SmashButton";
import { useGameState } from "~/game/store";

import { useWorld } from "~/system/world";
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
  const [_, setGameState] = useGameState();

  setGameState('isRunning', false);


  // temp boilerplate for now:
  level();


  return (
    <>
      <Nav />
      <SmashButton />
    </>
  );
}