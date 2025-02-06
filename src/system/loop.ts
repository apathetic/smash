import { Clock } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';


interface TimelineProps {
  camera: PerspectiveCamera;
  scene: Scene;
  renderer: WebGLRenderer;
  physics: any;
}


function createTimeline({ camera, scene, renderer, physics }: TimelineProps) {
  const clock = new Clock();
  let timelineItems: IUpdatable[] = [];


  function start() {
    clock.start();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      timelineItems.forEach((item) => item.update?.(delta));
      physics.update(delta);
      renderer.render(scene, camera);
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
    clock.stop();
  }

  function reset() {
    //
  }

  function add(item: IUpdatable) {
    timelineItems.push(item);
  }

  function remove(item: IUpdatable) {
    // TODO won't work; filter by id or uuid
    timelineItems = timelineItems.filter((i) => i !== item);
  }

  return { start, stop, add, remove };
};


export { createTimeline };
