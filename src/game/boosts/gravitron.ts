// mess w/ gravity
import { createEffect } from "solid-js"
import { useGameState } from "~/game/store";


const world = { gravity: { y:0 } }


export const boost = () => {
  const [game] = useGameState();

  const toggleGravity = (enabled: boolean) => world.gravity.y = enabled ? -9.81 : 0;
  const reverseGravity = () => world.gravity.y = 9.81;


  createEffect(() => {

    // Toggle gravity based on game state
    if (game.gravity/* .enabled */) {
      toggleGravity(true);
    } else {
      toggleGravity(false);
    }

    // You could also implement a gravity cycle for your "reverse / re-enable gravity" boost
    if (game.gravity/* .BoostActive */) {
      // This could be controlled by a timer or other game logic
      const cycleTime = (Date.now() % 6000) / 1000; // 6-second cycle

      if (cycleTime < 2) {
        // Normal gravity for 2 seconds
        toggleGravity(true);
      } else if (cycleTime < 4) {
        // Zero gravity for 2 seconds
        toggleGravity(false);
      } else {
        // Reverse gravity for 2 seconds
        reverseGravity();
      }
    }

  });
};
