import { createSignal, onMount, For } from "solid-js";
import { useGameSettings } from "../../stores/gameState";
import { useThreeManifest } from "../../stores/threeState";
import * as THREE from 'three';

const initThree = (ref) => {
    const [threeManifest, setthreeManifest] = useThreeManifest();

    const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.position.z = 1;
    threeManifest.setThreeObj('camera', camera);

    const scene = new THREE.Scene();
    threeManifest.setThreeObj('scene', scene);

    const renderer = new THREE.WebGLRenderer( { canvas: ref, antialias: true, alpha: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.setClearColor( 0x000000, 0 ); 

    threeManifest.setThreeObj('renderer', renderer); // set store ref
    threeManifest.setCanvas(renderer.domElement); // set store ref



    /// TODO: create assets store
    const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    const material = new THREE.MeshNormalMaterial();

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    // ////////

    
    function animate( time ) {
        mesh.rotation.x = time / 2000;
        mesh.rotation.y = time / 1000;
        threeManifest.renderer.render( scene, camera );
    }
}

const ThreeStage = ({ children }) => (
    <section class="w-full border">
        <canvas ref={initThree} class={`top-0 fixed w-full h-full z-1 bg-red`}>No Canvas Available</canvas>
    </section>
  );
  
  export { ThreeStage };
  