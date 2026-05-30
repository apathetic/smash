import { useGameState } from "~/game/store";
import { Nav } from "~/components/Nav";
import { Damage } from "~/components/Damage";
import { SmashButton } from "~/components/SmashButton";
import { usePhysics } from "~/system/physics";
import { onMount, onCleanup } from "solid-js";

export default function Smash() {
  const [gameState, setGameState] = useGameState();
  const physics = usePhysics();

  let checkInterval;
  let timeoutTimer;

  onMount(() => {
    setGameState('mode', 'smashing');

    // Check if physics have settled every 500ms
    checkInterval = setInterval(() => {
      if (physics.isSettled()) {
        finishSmash();
      }
    }, 500);

    // Also set a maximum timeout based on the level settings
    timeoutTimer = setTimeout(() => {
      finishSmash();
    }, (gameState.timeout || 10) * 1000);
  });

  function finishSmash() {
    setGameState('mode', 'smashed');
    if (checkInterval) clearInterval(checkInterval);
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }

  onCleanup(() => {
    if (checkInterval) clearInterval(checkInterval);
    if (timeoutTimer) clearTimeout(timeoutTimer);
  });

  return (
    <>
      <Damage />
      <Nav back />
      <SmashButton />
    </>
  )
}