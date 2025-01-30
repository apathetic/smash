import { Clock } from 'three';
import type { IUpdatable } from '~/types.d';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';


interface TimelineProps {
  camera: PerspectiveCamera;
  scene: Scene;
  renderer: WebGLRenderer;
  physics?: any;
}


function createTimeline({ camera, scene, renderer, physics }: TimelineProps) {
  const clock = new Clock();

  const timelineItems: IUpdatable[] = [];

  function start() {
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      physics.update(delta);
      timelineItems.forEach((item) => {
        item.update(delta)
      });

      renderer.render(scene, camera);
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
  };

  function add(item: IUpdatable) {
    timelineItems.push(item);
  };

  return { start, stop, add };
};


export { createTimeline };
