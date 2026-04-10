import { useWorld } from "~/system/world";
import { useGameState } from "~/game/store";

import { Floor } from "~/game/environment/Floor";
import { Terrain } from "~/game/environment/Terrain";
import { RagDoll } from "~/game/entities/Ragdoll";
import { Cube } from "~/game/entities/Cube";










async function getLevelData(lvl: string) {
  try {
    const levelModule = await import(`~/game/levels/${lvl}.json`);
    const levelData = levelModule.default;
    return levelData;
  } catch (err) {
    console.error('Could not load level ', lvl, err);
  }
}






  // load the levelData into state.
  // only do this once
  // subsequent loads of this page should use state data
  // ie. where the entities have been positioned, etc.

/**
 *
 * @param lvl
  Load json data; generate entities from it; insert into the game canvas
 ///////// Load json data; extract initial data; initialize the store With this info
 */
async function loadLevel(lvl: string) {
  const { add, clear, start, stop } = useWorld();
  const [_, setGameState] = useGameState();

  stop();

  const levelData: Level = await getLevelData(lvl);

  if (!levelData) {
    console.error(`Failed to load level: ${lvl}`);
    return;
  }

  // Reset impact data when loading a new level
  setGameState('impacts', []);
  setGameState('totalDamage', 0);
  setGameState('targetDamage', levelData.targetDamage || 1000);


  clear();


  /////////////////
  // setGameState(
  //   'environment',
  //   levelData.environment.reduce((acc, env) => ({ ...acc, [env.type]: env.position }), {})
  // );

  // // i THINK this actually merges w/ current store entities
  // setGameState(
  //   'entities',
  //   levelData.entities.reduce((acc, ent) => ({ ...acc, [ent.type]: ent.position }), {})
  // );
  /////////////

  // console.log('loaded state', game);


  levelData.entities.forEach((entity) => {
    switch(entity.type) {
      case "Cube":
        add(new Cube(entity));
        // setGameState('entities', { 'cube': [0,0,0] }); // can position be a proxy that is shared by the class and by the store?
        break;
    }
  });

  levelData.environment.forEach((env) => {
    switch(env.type) {
      case "Terrain":
        add(new Terrain(env));
        //  new Terrain({ id: "terrain" }); // assign a custom `id` to keep track of it, later retrieve it my its given id
        break;
      case "Floor":
        add(new Floor());
        break;
      case "Wall":
        break;
    }
  });

  const ragdoll = new RagDoll({ position: [0,0,0] });
  add(ragdoll);

  start();
}




export { loadLevel };
