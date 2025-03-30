import { useGameState } from "~/game/store";

/**
 * Saves the current level state.
 * State includes the position/rotation of each entity, gravity,
 * (boosts?), ...
 */
function saveLevel() {
  const [gameState, setGameState] = useGameState();

  console.log('Saving current level state');

  // Clear existing entities data
  setGameState('entities', {});

  // Iterate through all entities in the game state
  Object.values(gameState.entities).forEach((entity) => {
    // Skip entities without an ID
    if (!entity.id) {
      console.warn('Found entity without ID', entity);
      return;
    }

    // Update the entity's position and rotation in the store
    // We're assuming each entity already has its current position/rotation
    // reflected in its dynamicBodies
    if (entity.dynamicBodies) {
      const { body } = entity.dynamicBodies[0];

      // Update the entity's position in the store
      setGameState('entities', entity.id, 'position',
        [body.translation().x, body.translation().y, body.translation().z]);

      // Update the entity's rotation in the store
      setGameState('entities', entity.id, 'rotation',
        [body.rotation().x, body.rotation().y, body.rotation().z, body.rotation().w]);
    }
  });

  console.log('Level state saved successfully');
}

export { saveLevel };
