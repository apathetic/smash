import { useGameState } from "~/game/store";
import { Nav } from "~/components/Nav";
import { Damage } from "~/components/Damage";


export default function Smash() {
  const [_, setGameState] = useGameState();

  setGameState('mode', 'smash');

  return (
    <>
      <Damage />
      <Nav back />
    </>
  )
}