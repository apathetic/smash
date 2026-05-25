import { reconcile } from "solid-js/store";
import { useWorld } from "~/system/world";
import { useTimeline } from "~/system/timeline";
import { useGameState } from "~/game/store";
import { Floor } from "~/game/environment/Floor";
import { Terrain } from "~/game/environment/Terrain";
import { RagDoll } from "~/game/entities/Ragdoll";
import { Cube } from "~/game/entities/Cube";
import { Truck } from "~/game/entities/Truck";


/**
 * Load JSON Level Data
 */
async function getLevelData(lvl: string) {
  try {
    const levelModule = await import(`~/game/levels/${lvl}.json`);
    const levelData = levelModule.default;
    return levelData;
  } catch (err) {
    console.error('Could not load level ', lvl, err);
  }
}


/**
 * Load Level
 * Load json data; generate entities from it; insert into the game canvas
 */
async function loadLevel(lvl: string) {
  const { add, clear, save } = useWorld();
  const { start, stop } = useTimeline();
  const [_, setGameState] = useGameState();
  const levelData: Level = await getLevelData(lvl);

  if (!levelData) { return; }

  stop();
  clear();

  setGameState('impacts', []);
  setGameState('totalDamage', 0);
  setGameState('targetDamage', levelData.targetDamage || 1000);
  setGameState('mode', 'edit');
  setGameState('entities', reconcile({}));


  levelData.entities.forEach((entity) => {
    switch(entity.type) {
      case "Cube":
        add(new Cube(entity));
        break;
      case "Truck":
        add(new Truck(entity));
        break;
    }
  });

  levelData.environment.forEach((env) => {
    switch(env.type) {
      case "Terrain":
        add(new Terrain(env));
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


  save(); // capture a snapshot for resetting
  start();
}


export { loadLevel };
