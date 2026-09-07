import { Box3, Vector3 } from "three";
import { useGameState } from "~/game/store";
import { useWorld } from "~/system/world";
import { useGraphics } from "~/system/scene";
import { distanceForSize } from "~/system/projection";
import { useControls, orbitDistance } from "~/system/controls";
import { ENTITIES } from "~/game/entities";
import type { EntityName } from "~/game/entities";

/**
 * Nearest the camera may orbit and still allow spawning from the tray.
 * Zoomed in closer than this, a spawned entity would arrive larger than
 * its tile with nowhere to go, so the tray hides itself instead.
 */
const SPAWN_MIN_DISTANCE = 12;

/**
 * How big an item taken from the tray should look when it lands, in CSS
 * pixels across: about the tile it came off.
 */
const SPAWN_SIZE_PX = 90;

/**
 * Whether an item may be taken from the tray right now.
 * Reactive, so the tray can hide itself the moment it stops being true.
 */
function canSpawn() {
  const [gameState] = useGameState();
  return gameState.mode === 'edit' && orbitDistance() >= SPAWN_MIN_DISTANCE;
}

/**
 * The entity's largest dimension, in world units.
 */
function extentOf(entity: WorldEntity) {
  const mesh = entity.dynamicBodies[0]?.mesh;
  if (!mesh) return 0;

  const size = new Box3().setFromObject(mesh).getSize(new Vector3());
  return Math.max(size.x, size.y, size.z);
}

/**
 * How far from the camera a newly spawned entity is set down.
 *
 * At the orbit's focus, the depth the camera is already looking at, or
 * nearer if it has to be to look SPAWN_SIZE_PX across. Without that second
 * rule an item pulled off a tile at the edge of the screen lands wherever
 * the pointer happens to aim, which can be most of a level away, and it
 * arrives as a speck.
 */
function spawnDistance(entity: WorldEntity) {
  const extent = extentOf(entity);
  const fitted = extent > 0 ? distanceForSize(useGraphics().camera, extent, SPAWN_SIZE_PX) : Infinity;

  return Math.min(orbitDistance(), fitted);
}

/**
 * Takes one item of `type` out of the inventory and into the world, under
 * the pointer and already held, so the gesture that pulled it off the tile
 * carries straight on into placing it.
 *
 * The item is spent the moment this returns an entity: there is no way to
 * put it back.
 *
 * @param type - Which entity to spawn; must be one the player can hold
 * @param event - The pointer event that left the tile; the pointer must still be down
 * @returns The spawned entity, or undefined if nothing was spent
 */
function spawnEntity(type: EntityName, event: PointerEvent) {
  const [gameState, setGameState] = useGameState();
  const index = gameState.inventory.indexOf(type);
  const Entity = ENTITIES[type];

  if (index < 0 || !Entity || !canSpawn()) return;

  const { add } = useWorld();
  const entity = new Entity();

  setGameState('inventory', (items) => items.filter((_, i) => i !== index));
  add(entity);
  useControls().holdEntity(entity, event, spawnDistance(entity));

  return entity;
}

export { spawnEntity, canSpawn };
