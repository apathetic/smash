import { createStore } from "solid-js/store";


/**
 * GameSettings store
 *
 * setGamesettings(key, (setting) => ...some calculation...)
 *
 * e.g. setGamesettings('level', (currentLevel) => currentLevel + 1);
 */
const [gameSettings, setGamesettings] = createStore({
  level: 0,
  difficulty: 0,
});

export const useGameSettings = () => [gameSettings, setGamesettings];
