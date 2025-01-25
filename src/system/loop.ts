import { Timer } from 'three/addons/misc/Timer.js';
import type { IUpdatable } from '~/types';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';


interface TimelineProps {
  camera: PerspectiveCamera;
  scene: Scene;
  renderer: WebGLRenderer;
  // physics: any;
}


function createTimeline({ camera, scene, renderer }: TimelineProps) {
  const timer = new Timer();
  const timelineItems: IUpdatable[] = [];

  function start() {
    renderer.setAnimationLoop(() => {
      const delta = timer.update().getDelta();
      // physics.update();
      timelineItems.forEach((item) => item.update(delta));
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
