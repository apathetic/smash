import { createSignal } from "solid-js";
import {createStore, modifyMutable} from 'solid-js/store';

const [threeSettings, setThreeSettings] = createStore({
    canvas: undefined,
    threeObjs: createSignal({}),
    setCanvas(el) {
		setThreeSettings('canvas', el)
	},
    setThreeObj(prop, val) {
        setThreeSettings(prop, val);
    }
});


export const useThreeManifest = () => [threeSettings, setThreeSettings];