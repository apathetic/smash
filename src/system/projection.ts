import type { PerspectiveCamera } from 'three';

/**
 * Converting between what something measures in the world and what it
 * measures on screen.
 *
 * Pure functions rather than a system: there is no state here and nothing
 * to own, only the camera's frustum and the height of the viewport. Taking
 * the camera as an argument keeps that one dependency visible, and lets
 * both the controls and the game reach this without either importing the
 * other -- which they cannot do, being on opposite sides of a hook.
 */


/**
 * The width of one CSS pixel, in world units, at `distance` from the camera.
 *
 * Note: presupposes the canvas fills the window, as the pointer maths in
 * `controls` does. The renderer knows its own size and would be the sounder
 * source, should that ever stop being true.
 */
function worldPerPixel(camera: PerspectiveCamera, distance: number) {
  return 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance / window.innerHeight;
}

/**
 * How far from the camera something `worldExtent` across has to sit to look
 * `pixels` wide on screen. The inverse of `worldPerPixel`.
 *
 * What the pixel figure *means* is deliberately not decided here: how much
 * slop a grab is allowed belongs to the controls, and how big a newly
 * placed item should look belongs to the game.
 */
function distanceForSize(camera: PerspectiveCamera, worldExtent: number, pixels: number) {
  return worldExtent / (worldPerPixel(camera, 1) * pixels);
}


export { worldPerPixel, distanceForSize };
