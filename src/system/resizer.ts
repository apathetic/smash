import type { PerspectiveCamera, WebGLRenderer } from 'three';

interface ResizerProps {
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}

function createResizer({ camera, renderer }: ResizerProps) {
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  window.addEventListener('resize', onResize);
  onResize();

  return () => {
    window.removeEventListener('resize', onResize);
  };
};


export { createResizer };
