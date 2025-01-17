import { createSignal } from "solid-js";
import {createStore, modifyMutable} from 'solid-js/store';

const [gameSettings, setGamesettings] = createStore({
    level: 0,
    difficulty: 0,
    setLevel(val) { setGamesettings('level', el) },
    setDifficulty(val) { setGamesettings('difficulty', el) },
});

export const useGameSettings = () => [gameSettings, setGamesettings];