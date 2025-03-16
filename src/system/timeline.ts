import { Clock } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


interface TimelineProps {
  graphics: IGraphics;
  physics: IPhysics;
  entities: IUpdatable[];
  controls: OrbitControls;
}


/**
 * Creates a timeline for managing the time-evolution of the world. It is
 * responsible for updating physics, entities, and rendering the scene.
 *
 * @param {TimelineProps} props - All the items in the world that need updating.
 * @returns {object} - A timeline handle with start and stop methods.
 */
function createTimeline({ graphics, physics, entities, controls }: TimelineProps) {
  const clock = new Clock();
  const { camera, scene, renderer } = graphics;


  function start() {
    clock.start();

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      physics.update(delta);
      entities.forEach((item) => item.update(delta));
      controls.update();
      renderer.render(scene, camera);
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
    clock.stop();
  }


  return { start, stop };
};


export { createTimeline };
