import { createStore } from "solid-js/store";


/**
 * GameStates store
 *
 * setGamestate(key, (setting) => ...some calculation...)
 *
 * e.g. setGamestate('level', (currentLevel) => currentLevel + 1);
 */
const [gameState, setGamestate] = createStore({
  isRunning: false,
  // mode: EDIT / SMASH / REPLAY
  level: 0,
  difficulty: 0,
});

export const useGameState = () => [gameState, setGamestate];
