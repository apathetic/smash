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


  const tick = () => {
    // physics.update();
    timer.update();
    const delta = timer.getDelta();

    timelineItems.forEach((item) => item.tick(delta));
  };

  const start = () => {
    renderer.setAnimationLoop(() => {
      tick();
      renderer.render(scene, camera);
    });
  };

  const stop = () => {
    renderer.setAnimationLoop(null);
  };

  const add = (item: IUpdatable) => {
    timelineItems.push(item);
  };


  return { start, stop, add };
};


export { createTimeline };
