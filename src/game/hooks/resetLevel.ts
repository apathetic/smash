import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";
import { Vector3, Quaternion } from 'rapier';

/**
 * Resets entities to their saved positions from the game state.
 * This restores the level to the state it was in when saveLevel was called.
 */
function resetLevel() {
  const [gameState, setGameState] = useGameState();

  console.log('Resetting level to saved state');

  // Reset impacts and total damage
  setGameState('impacts', []);
  setGameState('totalDamage', 0);

  // Iterate through all entities in the world
  registry.each((entity) => {
    const entityData = gameState.entities[entity.id];

    entity.dynamicBodies?.forEach((dBody, index) => {
      const bodyState = entityData?.bodies?.[index];
      if (bodyState) {
        const pos = new Vector3(bodyState.position[0], bodyState.position[1], bodyState.position[2]);
        const rot = new Quaternion(bodyState.rotation[0], bodyState.rotation[1], bodyState.rotation[2], bodyState.rotation[3]);

        dBody.body.setTranslation(pos, true);
        dBody.body.setRotation(rot, true);
        dBody.mesh.position.set(pos.x, pos.y, pos.z);
        dBody.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

        dBody.body.setLinvel(new Vector3(0, 0, 0), true);
        dBody.body.setAngvel(new Vector3(0, 0, 0), true);
      }
    });
  });

  console.log('Level reset complete');
}

export { resetLevel };


/**
  RESET: pulls  data from GAMESTATE (o


*/