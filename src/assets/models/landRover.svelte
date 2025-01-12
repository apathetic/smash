<script>
  import { GLTF } from '@threlte/extras'
</script>

	<!-- url={'/models/LandRover/scene.gltf'} -->
<GLTF
  castShadow
	receiveShadow
	url={'/models/LandRover.glb'}
	position={{ y: 1 }}
	scale={3}
  on:click={() => {
    console.log('User clicked!')
  }}
/>
