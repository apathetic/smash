import { useGameState } from "~/game/store";
import { useWorld } from "~/system/world";
import { Page } from "~/components/Page";
import { Nav } from "~/components/Nav";

import { RagDoll } from "~/game/objects/Ragdoll";
import { Terrain } from "~/game/ground/Terrain";
import { Cube } from "~/game/objects/Cube";



/// TODO store/load as json:
const levelData = {
  objects: [
    {
      id: 'xxx',  // so that the user's saved data can be associated
      type: 'Cube',
      meta: {
        active: false, // if added to the world, or not
        position: { x: 0, y: 0, z: 0 }, // starting position. re-use
      }
    }
  ],
  terrain: {
    id: 'bumpy',
    type: 'Bumpy'
  }
};


function getLevelData(lvl) {
  const ragdoll = {
    id: 0,
    type: 'Ragdoll',
    meta: {
      position: { x: 0, y: 0, z: 0 },
      // ..
    }
  };

  const level = levelData['objects'];
  return [...level, ragdoll];
}






  // load the levelData into state.
  // only do this once
  // subsequent loads of this page should use state data
  // ie. where the entitiels have been positioned, etc.


function loadLevel(lvl) {
  const { add, clear } = useWorld();
  const [game, setGameState] = useGameState();
  const levelData = getLevelData(lvl);

  clear();
  console.log(lvl);


  /////////////////
  // setGameState(..  .levelData);
  /////////////
  levelData.forEach((entity) => {
    switch(entity.type) {
      case "Cube":
        add(new Cube(entity.meta));
        break;
      case "RagDoll":
        add(new RagDoll(entity.meta));
        break;
    }
  });




  // const terrain = new Terrain({ id: "terrain" }); // assign a custom `id` to keep track of it, later retrieve it my its given id
  const terrain = new Terrain(); // vs. better to put it in the store / level?
             // why not both?

    add(terrain);

  // const terrain = new Terrain();
  // const floor = new Floor();
  // const cube = new Cube();
  const ragdoll = new RagDoll();

  // add(terrain);
  // add(floor);
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
          <li><button onclick={() => loadLevel(1)}>level 1</button></li>
          <li><button onclick={() => loadLevel(2)}>level 2</button></li>
          <li><button onclick={() => loadLevel(3)}>level 3</button></li>
        </ul>

      </Page>
    </>
  );
}
