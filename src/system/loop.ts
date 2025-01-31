import { Clock } from 'three';
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

  function update(delta: number) {
    timelineItems.forEach((item) => {
      item.update?.(delta)
    });
  }

  function start() {
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      update(delta); // update visual (3d mesh)
      physics.update(delta); // update physics models
      renderer.render(scene, camera);
    });
  }

  function stop() {
    renderer.setAnimationLoop(null);
  }

  function add(item: IUpdatable) {
    timelineItems.push(item);
  }

  return { start, stop, add };
};


export { createTimeline };
