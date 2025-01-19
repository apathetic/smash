import { onMount } from "solid-js";
import * as THREE from "three";

const initThree = (ref, things) => {
  const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
  camera.position.z = 1;
  things.camera = camera;

  const scene = new THREE.Scene();
  things.scene = scene;

  const renderer = new THREE.WebGLRenderer( { canvas: ref, antialias: true, alpha: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  renderer.setClearColor( 0x000000, 0 );
  things.renderer = renderer;

  /// TODO: create assets store
  const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new THREE.MeshNormalMaterial();

  const mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
  // ////////


  //TODO: move raf handler out of init scope
  function animate( time ) {
    mesh.rotation.x = time / 2000;
    mesh.rotation.y = time / 1000;
    renderer.render(scene, camera)
  }
}


const ThreeStage = () => {
  let canvas;
  const things = {};

  onMount(() => {
    initThree(canvas, things);
  })

  return (
    <canvas ref={canvas} class={`fixed top-0 left-0 w-full h-full z-1 bg-red`}>No Canvas Available</canvas>
  );
}

export { ThreeStage };
