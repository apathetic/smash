import { createStore } from "solid-js/store";
import { Vector3, Quaternion } from 'rapier';
import type { SetStoreFunction } from "solid-js/store";
import type { Mesh } from 'three';
import type { RigidBody } from 'rapier';


type EntityRotation = [number, number, number, number];

type StoreEntity =  WorldEntity & {
  id: string;
  type: string; // e.g., 'cube', 'sphere', etc.
  position: Position;
  rotation: EntityRotation;
};

type GameState = {
  entities: Record<StoreEntity['id'], StoreEntity>;
  environment: Record<string, Position>;
  level: number;
  mode: 'edit' | 'smash' | 'replay';
  gravity: number;
  impacts: Impact[];
  targetDamage: number;
  totalDamage: number;
}

type gameHook = () => [GameState, SetStoreFunction<GameState>];

// Set store data via:
//  * setGamestate(key, (setting) => ...some calculation...)
//  *
//  * e.g. setGamestate('mode', 'smash');
//  * e.g. setGamestate('level', (currentLevel) => currentLevel + 1);

/**
 * GameState store
 * This stores all static information from the level, including
 * data for each entity (position, rotation), ...
 */
// const [levelData, setLevelData] = createStore({
const [gameState, setGameState] = createStore({
  mode: 'edit',
  environment: {
    // 'floor': [0, 0, 0]
  },
  entities: {
    // Will be populated with entity positions and rotations
  },
  gravity: 0,
  level: 0,
  impacts: [],
  targetDamage: 1000,
  totalDamage: 0,
  // boosts: { /** which were used/applied? */}
} as GameState);




// Helper functions for entity management
function generateEntityId(type: string, index: number): string {
  return `${type}_${index}`;
}

/**
 * Saves the current state of an entity to the store
 */
function saveEntityToStore(
  id: string,
  type: string,
  position: Vector3,
  rotation: Quaternion
) {
  setGameState('entities', id, {
    id,
    type,
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z, rotation.w]
  });
}

/**
 * Updates an entity's position and rotation based on store data
 */
function updateEntityFromStore(
  id: string,
  body: RigidBody,
  mesh: Mesh
) {
  const entityData = gameState.entities[id];
  if (!entityData) return false;

  // Apply position if available
  if (entityData.position) {
    const [x, y, z] = entityData.position;
    body.setTranslation(new Vector3(x, y, z), true);
    mesh.position.set(x, y, z);
  }

  // Apply rotation if available
  if (entityData.rotation) {
    const [x, y, z, w] = entityData.rotation;
    body.setRotation(new Quaternion(x, y, z, w), true);
    mesh.quaternion.set(x, y, z, w);
  }

  return true;
}

const useGameState: gameHook = () => [gameState, setGameState];

export {
  useGameState,
  saveEntityToStore, updateEntityFromStore, generateEntityId };
