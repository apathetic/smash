import { useGameState } from "~/game/store";
import { useWorld } from "~/system/world";
import { Page } from "~/components/Page";
import { Nav } from "~/components/Nav";

import { RagDoll } from "~/game/objects/Ragdoll";
import { Terrain } from "~/game/ground/Terrain";
import { Cube } from "~/game/objects/Cube";


async function getLevelData(lvl) {
  try {
    const levelModule = await import(`~/game/levels/${lvl}.json`);
    const levelData = levelModule.default;
    return levelData;
  } catch (err) {
    console.error('Could not load level ', lvl);
  }
}






  // load the levelData into state.
  // only do this once
  // subsequent loads of this page should use state data
  // ie. where the entitiels have been positioned, etc.


async function loadLevel(lvl) {
  const { add, clear } = useWorld();
  const [game, setGameState] = useGameState();
  const levelData = await getLevelData(lvl);


  clear();


  /////////////////
  // setGameState(..  .levelData);
  /////////////

  levelData.entities.forEach((entity) => {
    switch(entity.type) {
      case "Cube":
        add(new Cube(entity.meta));
        break;
    }
  });

  levelData.environment.forEach((env) => {
    switch(env.type) {
      case "Terrain":
        add(new Terrain(env.meta));
        //  new Terrain({ id: "terrain" }); // assign a custom `id` to keep track of it, later retrieve it my its given id
        break;
      case "Floor":
        add(new Floor());
        break;
      case "Wall":
        break;
    }
  });

  const ragdoll = new RagDoll();
  add(ragdoll);
}











export default function Overview() {
  return (
    <>
      <Nav />
      behind text neato

      <Page>
        how to play.<br />
        stats. <br />
        choose a level or something.<br />
        high score, replays

        <ul>
          <li><button onclick={() => loadLevel('1-discovery')}>level 1</button></li>
          <li><button onclick={() => loadLevel('2-blocks')}>level 2</button></li>
          <li><button onclick={() => loadLevel(3)}>level 3</button></li>
        </ul>

      </Page>
    </>
  );
}
