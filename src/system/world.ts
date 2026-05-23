import { createScene, createLights } from "./scene";
import { createResizer } from "./resizer";
import { useTimeline } from "./timeline";
import { createControls } from "./controls";
import { usePhysics } from "./physics";
import { createGUI } from "./gui";
import { registry } from "~/game/store/registry";

/**
 * A reference to a World instance.
 * The return object exposes a number of functions for interacting
 * with the World: `add` `start`, `stop`, etc
 */
let worldHandle: ReturnType<typeof createWorld>;


/**
 * Creates a new World, which contains visual elements (ThreeJS) and
 * physical rules (Rapier). Also creates a loop for managing the time-
 * evolution of these items and controls for interactivity.
 * @param canvas
 * @returns ...
 */
function createWorld(canvas: HTMLCanvasElement) {
  const graphics = createScene(canvas);
  const physics  = usePhysics();
  const lights   = createLights();
  const gui      = createGUI({ graphics, physics });
  const controls = createControls({ graphics, physics });
  const timeline = useTimeline({ graphics, physics, controls, gui });

  createResizer(graphics);
  graphics.scene.add(...lights);

  /**
   * Adds an entity to the world.
   */
  function add(entity: WorldEntity) {
    entity.setup(graphics.scene, physics.world);
    registry.add(entity);
  }

  /**
   * Removes a single entity from the world.
   */
  function remove(entity: WorldEntity) {
    entity.destroy(graphics.scene, physics.world);
    registry.remove(entity);
  }

  /**
   * Clears the world of all entities.
   */
  function clear() {
    registry.each((entity) => entity.destroy(graphics.scene, physics.world));
    registry.clear();
  }

  /**
   * Destroys the world and all its associated resources.
   */
  function destroy() {
    clear();
    gui.destroy();
    timeline.stop();
    controls.destroy();
    graphics.renderer.dispose();
    graphics.scene.clear();
  }

  /**
   * Saves a deterministic snapshot of the physics world.
   */
  function save() {
    physics.save();
  }

  /**
   * Restores the physics world from a previously saved snapshot.
   */
  function restore() {
    physics.restore();
  }

  return { add, remove, clear, destroy, save, restore };
};


/**
 * A hook to provide access to the world instance.
 * This is a singleton pattern, so the world instance is
 * created once and then returned on subsequent calls.
 *
 * @param canvas
 * @returns
 */
function useWorld(canvas?: HTMLCanvasElement) {
  if (canvas) {
    worldHandle = createWorld(canvas);
  }

  if (!worldHandle) {
    throw new Error('[useWorld]: was not initialized with a `canvas`');
  }

  return worldHandle;
}


export { useWorld };
