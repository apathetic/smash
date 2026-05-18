import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";


/**
 * Saves the current level state.
 * State includes the position/rotation of each entity, gravity,
 * (boosts?), ...
 */
function saveLevel() {
  const [_, setGameState] = useGameState();

  console.log('Saving current level state');

  // Clear existing entities data
  setGameState('entities', {});

  // Iterate through all live entities in the registry
  registry.each((entity) => {
    if (!entity.id) {
      console.warn('Found entity without ID', entity);
      return;
    }

    if (entity.dynamicBodies?.length > 0) {
      const bodies = entity.dynamicBodies.map((dBody) => {
        const position = dBody.body.translation();
        const rotation = dBody.body.rotation();
        return {
          position: [position.x, position.y, position.z] as [number, number, number],
          rotation: [rotation.x, rotation.y, rotation.z, rotation.w] as [number, number, number, number]
        };
      });

      setGameState('entities', entity.id, {
        id: entity.id,
        type: entity.id, // Or entity.type if available
        bodies
      });
    }
  });

  console.log('Level state saved successfully');
}

export { saveLevel };
