import { LineBasicMaterial, BufferGeometry, LineSegments, BufferAttribute } from 'three';
import { version } from "rapier";
import Stats from "stats.js";
// import { xxhash128 } from "hash-wasm";
import GUI from "lil-gui";
import { useGameState } from "~/game/store";
import { NUM_SOLVER_ITERATIONS, SESSION_STORAGE_KEY } from "~/system/constants";
import { loadLevel } from "~/game/hooks/loadLevel";


type GuiProps = {
  graphics: IGraphics;
  physics: IPhysics;
};


/**
 *
 */
const params = {
  numSolverIters: NUM_SOLVER_ITERATIONS,
  debugRender: false,
  debugInfos: false,
  level: 0,
  reset: () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.href = '/';
  }
};


/**
 * Debugging widgets
 * @param {GuiProps}
 * @returns
 */
export const createGUI = ({ graphics, physics }: GuiProps) => {
  const gui = new GUI({ title: "SMASH" });
  const _rapierVersion = version();

  let maxTimePanelValue = 16.0;

  const [gameState] = useGameState();
  params.level = gameState.level;

  gui.add(params, "numSolverIters", 0, 20)
    .step(1)
    .listen();

  gui.add(params, "debugRender")
    .listen();

  gui.add(params, "level", { "1-discovery": 0, "2-blocks": 1, "3-alpha": 2 }).name("Select Level").onChange((lvl: number) => {
    loadLevel(lvl);
  }).listen();

  gui.add(params, "reset").name("Clear Game State");

  const damageFolder = gui.addFolder("Damage Debug");
  const damageStats = {
    get total() { return gameState.totalDamage.toFixed(2); },
    get target() { return gameState.targetDamage; },
    get impacts() { return gameState.impacts.length; }
  };

  damageFolder.add(damageStats, 'total').name('Total Damage').listen();
  damageFolder.add(damageStats, 'target').name('Target Damage').listen();
  damageFolder.add(damageStats, 'impacts').name('Impact Count').listen();


  const stats = new Stats();
  const stepTimePanel = stats.addPanel(
    new Stats.Panel("ms (step)", "#ff8", "#221"),
  );

  stats.dom.style.cssText = 'position: relative; display: flex; width: 100%; pointer-events: none; opacity: 0.9;';

  const originalShowPanel = stats.showPanel;
  stats.showPanel = function(id: number) {
    originalShowPanel.call(stats, id);
    Array.from(stats.dom.children).forEach((child, index) => {
      const el = child as HTMLElement;
      if (index === 3) { // Hide the custom yellow ms (step) panel
        el.style.display = 'none';
      } else {
        el.style.display = 'block';
        el.style.flex = '1';
        el.style.width = '100%';
      }
    });
  };
  stats.showPanel(0);

  const childrenEl = gui.domElement.querySelector('.children');
  if (childrenEl) {
    childrenEl.prepend(stats.dom);
  } else {
    gui.domElement.appendChild(stats.dom);
  }



  const setTiming = (timing: number) => {
    if (timing) {
      maxTimePanelValue = Math.max(maxTimePanelValue, timing);
      stepTimePanel.update(timing, maxTimePanelValue);
    }
  };

  // const resetTiming = () => {
  //   maxTimePanelValue = 1.0;
  //   stepTimePanel.update(0.0, 16.0);
  // };

  const material = new LineBasicMaterial({ color: 0xffffff, vertexColors: true });
  const geometry = new BufferGeometry();
  const lines = new LineSegments(geometry, material);

  graphics.scene.add(lines);



  function update(delta: number) {

    physics.world.numSolverIterations = params.numSolverIters;
    setTiming(delta);  // setTiming(new Date().getTime() - t0);

    if (params.debugRender) {
      let buffers = physics.world.debugRender();
      lines.visible = true;
      lines.geometry.setAttribute("position", new BufferAttribute(buffers.vertices, 3));
      lines.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));
    } else {
      lines.visible = false;
    }
  };

  function destroy() {
    gui.destroy();
    stats.dom.remove();
  }

  return { stats, update, destroy };
};
