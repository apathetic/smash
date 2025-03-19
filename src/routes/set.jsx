import { Nav } from "~/components/Nav";
import { SmashButton } from "~/components/SmashButton";
import { useGameState } from "~/game/store";
import { useWorld } from "~/system/world";


export default function Set() {
  const [game, setGameState] = useGameState();

  setGameState('mode', 'edit');
  console.log('SETTTTTING ');

  // reset(); // wipe canvas
  // load();  // load from state

  //          ... OR

  // reset(); // reset positions only, from state


  return (
    <>
      <Nav />
      <SmashButton />
    </>
  );
}