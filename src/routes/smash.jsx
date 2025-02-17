import { useGameState } from "~/stores/gameState";
import { Nav } from "~/components/Nav";


export default function Smash() {
  const [game, setGameState] = useGameState();

  setGameState('isRunning', true); // isSmash.... game.mode...? ...


  return (
    <>
      <Nav back />
      <div>edit to my smash!</div>;
    </>
  )
}