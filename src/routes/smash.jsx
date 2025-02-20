import { useGameState } from "~/game/store";
import { Nav } from "~/components/Nav";


export default function Smash() {
  const [_, setGameState] = useGameState();

  setGameState('isRunning', true); // isSmash.... game.mode...? ...

  return (
    <>
      <Nav back />
    </>
  )
}