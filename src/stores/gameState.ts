import { createStore } from "solid-js/store";
import type { SetStoreFunction } from "solid-js/store";


interface GameState {
  isRunning: any; // mode?  isSmash? ...???
  entities: Record<string, Position>; // TEMP. Will make this more verbose.
  level: number;
}

type gameHook = () => [GameState, SetStoreFunction<GameState>]; // not sure why this needs typing


/**
 * GameStates store
 *
 * setGamestate(key, (setting) => ...some calculation...)
 *
 * e.g. setGamestate('isRunning', true);
 * e.g. setGamestate('level', (currentLevel) => currentLevel + 1);
 */
const [gameState, setGameState] = createStore({
  isRunning: false,
  // mode: EDIT / SMASH / REPLAY

  entities: {}, // keyed by uuid ...?
  level: 0,

} as GameState);

// type XXX = [game: any; setGame: any];

export const useGameState: gameHook = () => [gameState, setGameState];
