import { Clock } from 'three';
import { useGameState } from "~/stores/gameState";
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


interface TimelineProps {
  graphics: IGraphics;
  physics: IPhysics;
  entities: IUpdatable[];
  controls: OrbitControls;
}


function createTimeline({ graphics, physics, entities, controls }: TimelineProps) {
  const clock = new Clock();
  const { camera, scene, renderer } = graphics;
  const [game, setGameState] = useGameState();


  function loop() {
    controls.update();
    renderer.render(scene, camera);
  }

  function smash() {
    const delta = clock.getDelta();
    physics.update(delta); // does order matter? ie. update physics _World_ before physics in each entity
    entities.forEach((item) => item.update(delta));
  }


  function start() {
    clock.start();
// console.log(game.isRunning);
    renderer.setAnimationLoop(() => {
      loop();
      if (game.isRunning) {
        smash(); // if smash is enabled, then run physics
      }
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
    clock.stop();
  }

  function reset() {
    //
  }

  return { start, stop };
};


export { createTimeline };
