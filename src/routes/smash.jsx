import { onMount, onCleanup } from "solid-js";
import { useGameState } from "~/game/store";
import { Damage } from "~/components/Damage";
import { usePhysics } from "~/system/physics";

export default function Smash() {
  const [gameState, setGameState] = useGameState();
  const physics = usePhysics();

  let checkInterval;
  let timeoutTimer;
  let checkTimeout;

  onMount(() => {
    setGameState('mode', 'smashing');

    // Wait 2 seconds before we even start checking if physics are settled
    // (Prevents accidental triggers if an object is at the apex of a bounce)
    checkTimeout = setTimeout(() => {
      checkInterval = setInterval(() => {
        if (physics.isSettled()) {
          finishSmash();
        }
      }, 500);
    }, 2000);

    // Also set a maximum timeout based on the level settings
    timeoutTimer = setTimeout(() => {
      finishSmash();
    }, (gameState.timeout || 10) * 1000);
  });

  function finishSmash() {
    console.log("SMASH FINISHED"); setGameState('mode', 'smashed');
    clearTimeout(checkTimeout);
    clearInterval(checkInterval);
    clearTimeout(timeoutTimer);
  }

  onCleanup(() => {
    clearTimeout(checkTimeout);
    clearInterval(checkInterval);
    clearTimeout(timeoutTimer);
  });

  return (
    <>
      <Damage />
    </>
  )
}