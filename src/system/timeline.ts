import { Clock } from 'three';
import { registry } from "~/game/store/registry";
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


interface TimelineProps {
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
  const { camera, scene, renderer } = graphics;

  function start() {
    clock.start();

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      gui.update(delta);
      gui.stats.begin();
      physics.update(delta);
      registry.each((entity) => entity.update(delta));
      controls.update();
      renderer.render(scene, camera);
      gui.stats.end();
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
    clock.stop();
  }


  return { start, stop };
};


export { createTimeline };
