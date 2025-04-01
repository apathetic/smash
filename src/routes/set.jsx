import { Nav } from "~/components/Nav";
import { SmashButton } from "~/components/SmashButton";
import { resetLevel } from "~/game/hooks/resetLevel";
import { useGameState } from "~/game/store";


export default function Set() {
  const [_, setGameState] = useGameState();

  resetLevel();
  setGameState('mode', 'edit');

  return (
    <>
      <Nav />
      <SmashButton />
    </>
  );
}