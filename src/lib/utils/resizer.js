
const createResizer = ({ element, camera, renderer }) => {
  const onResize = () => {
    const w = element.offsetWidth;
    const h = element.offsetHeight;

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


export {
  createResizer
};
