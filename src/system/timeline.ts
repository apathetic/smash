import { Clock } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';


interface TimelineProps {
  graphics: {
    camera: PerspectiveCamera;
    scene: Scene;
    renderer: WebGLRenderer;
  };
  physics: {
    world: any;
    update: (delta: number) => void;
  }
}


function createTimeline({ graphics, physics }: TimelineProps) {
  const clock = new Clock();
  const { camera, scene, renderer } = graphics;
  let timelineItems: IUpdatable[] = [];


  function start() {
    clock.start();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();




      physics.update(delta); // does order matter? ie. update physics _World_ before physics in each entity
      timelineItems.forEach((item) => item.update(delta));
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
