import { createStore } from "solid-js/store";
import type { SetStoreFunction } from "solid-js/store";


interface GameState {
  entities: Record<string, Position>; // TEMP. Will make this more verbose.

  level: number;
  mode: 'edit' | 'smash' | 'replay';
  terrain: 'tiles' | 'bumpy' | 'stairs';
  gravity: number;
}

type gameHook = () => [GameState, SetStoreFunction<GameState>]; // not sure why this needs typing

// Set store data via:
//  * setGamestate(key, (setting) => ...some calculation...)
//  *
//  * e.g. setGamestate('mode', 'smash');
//  * e.g. setGamestate('level', (currentLevel) => currentLevel + 1);

/**
 * GameState store
 *
 */
const [gameState, setGameState] = createStore({
  mode: 'edit',
  terrain: 'tiles',
  gravity: 0,
  entities: {}, // keyed by uuid ...?
  level: 0,
} as GameState);



const [levelData, setLevelData] = createStore({
  1: {
    entities: { /**; positions n such */},
    gravity: 0,
    boosts: { /** which were used/applied? */}
  }
});



export const useGameState: gameHook = () => [gameState, setGameState];
