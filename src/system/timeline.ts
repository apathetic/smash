import { Clock } from 'three';
import { registry } from "~/game/store/registry";
import { useGameState } from '~/game/store';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


type TimelineProps = {
  graphics: IGraphics;
  physics: IPhysics;
  controls: OrbitControls;
  gui: any;
}


/**
 * Creates a timeline for managing the time-evolution of the world. It is
 * responsible for updating physics, entities, and rendering the scene.
 *
 * @param {TimelineProps} props - All the items in the world that need updating.
 * @returns {object} - A timeline handle with start and stop methods.
 */
function createTimeline({ graphics, physics, controls, gui }: TimelineProps) {
  const clock = new Clock();
  const [game] = useGameState();
  const { camera, scene, renderer } = graphics;

  /**
   * Starts the animation loop.
   */
  function start() {
    const ragdoll = registry.get('ragdoll') as any;
    const timeStep = 1.0 / 60.0;
    let accumulator = 0;

    clock.start();

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.1);
      accumulator += delta;

      gui.update(delta);
      gui.stats.begin();

      while (accumulator >= timeStep) {
        physics.update(timeStep);
        registry.each((entity) => entity.update(timeStep));
        accumulator -= timeStep;
      }

      controls.update();
      ragdoll.damage(game.impacts);
      renderer.render(scene, camera);
      gui.stats.end();
    });
  }

  /**
   * Stops the animation loop.
   */
  function stop() {
    renderer.setAnimationLoop(null);
    clock.stop();
  }


  return { start, stop };
};


export { createTimeline };
