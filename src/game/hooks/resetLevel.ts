import { useGameState } from "~/game/store";
import { settleMeshes } from "~/game/hooks/settleMeshes";
import { useWorld } from "~/system/world";

/**
 * Resets entities to their saved positions from the game state.
 * This restores the level to the state it was in when saveLevel was called.
 */
async function resetLevel() {
  const [_, setGameState] = useGameState();
  const { restore } = useWorld();

  console.log('Resetting level');

  // 1. Destroy and restore the Rapier world
  restore();

  // 2. Animate the Three.js meshes to gently catch up to the restored bodies
  await settleMeshes();

  // Reset impacts and total damage only if we're still in reset mode
  // This prevents overwriting the mode if the user already clicked "Smash"
  const [gameState] = useGameState();
  if (gameState.mode === 'reset') {
    setGameState('impacts', []);
    setGameState('totalDamage', 0);
    setGameState('mode', 'edit');
  }

  console.log('Level reset complete');
}

export { resetLevel };