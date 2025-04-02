import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";

/**
 * Resets entities to their saved positions from the game state.
 * This restores the level to the state it was in when saveLevel was called.
 */
function resetLevel() {
  const [_gameState] = useGameState();

  console.log('Resetting level to saved state');

  // Iterate through all entities in the world
  registry.each((_entity) => {
    // const data = gameState.entities.get
    // entity.reset();
  });

  console.log('Level reset complete');
}

export { resetLevel };



/**
  RESET: pulls  data from GAMESTATE (o


*/