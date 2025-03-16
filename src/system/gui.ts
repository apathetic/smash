import Stats from "stats.js";
// import { xxhash128 } from "hash-wasm";
import { version, World } from "@dimforge/rapier3d";
import GUI from "lil-gui";


import { LineBasicMaterial, BufferGeometry, LineSegments, BufferAttribute } from 'three';


interface GuiProps {
  graphics: IGraphics;
  physics: IPhysics;
}


export interface DebugInfos {
  // token: number;
  stepId: number;
  worldHash: string;
  worldHashTime: number;
  snapshotTime: number;
}


const params = {
  numSolverIters: 4,
  debugRender: false,
  debugInfos: false,
  running: false,
  stepping: false,
  step: () => params.stepping = true,
  takeSnapshot: () => {},
  restoreSnapshot: () => {},
};



export const createGUI = ({ graphics, physics }: GuiProps) => {
  const { scene } = graphics;
  const { world } = physics;

  const gui = new GUI({ title: "SMASH" });

  const rapierVersion = version();
  let maxTimePanelValue = 16.0;
  let snap: Uint8Array;
  let snapStepId = 0;

  gui.add(params, "numSolverIters", 0, 20)
    .step(1)
    .listen();

  // const debugText = document.createElement("div");
  // debugText.style.position = "absolute";
  // debugText.innerHTML = "";
  // debugText.style.top = 50 + "px";
  // debugText.style.visibility = "visible";
  // debugText.style.color = "#fff";
  // debugText.style.fontFamily = "monospace";
  // debugText.style.pointerEvents = "none";
  // document.body.appendChild(debugText);

  // gui.add(params, "debugInfos")
  //   .listen()
  //   .onChange((value: boolean) => debugText.style.visibility = value ? "visible" : "hidden");

  gui.add(params, "debugRender")
    .listen();

  gui.add(params, "running")
    .listen();

  gui.add(params, "step");

  /** */
  gui.add(params, "takeSnapshot");
  params.takeSnapshot = () => {
    snap = world.takeSnapshot();
    snapStepId = (world as any).stepId;
  };

  gui.add(params, "restoreSnapshot");
  params.restoreSnapshot = () => {
    if (!!snap) {
      world.free();
      // world = World.restoreSnapshot(snap);
      (world as any).stepId = snapStepId;
    }
  };

  // gui.add(params, "restart");
  // params.restart = () => {
  //   ....
  // };




  const stats = new Stats();
  const stepTimePanel = stats.addPanel(
    new Stats.Panel("ms (step)", "#ff8", "#221"),
  );

  stats.dom.style.top = 'unset';
  stats.dom.style.bottom = '0px';
  stats.showPanel(stats.dom.children.length - 1);  // 0: fps, 1: ms, 2: mb, 3+: custom
  stats.showPanel(0);
  document.body.appendChild(stats.dom);



  const setTiming = (timing: number) => {
    if (!!timing) {
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
  scene.add(lines);



  function update(delta: number) {

    // params.running vs. game.isRunning ????


    world.numSolverIterations = params.numSolverIters;
    setTiming(delta);  // setTiming(new Date().getTime() - t0);


    if (params.debugRender) {
      let buffers = world.debugRender();
      lines.visible = true;
      lines.geometry.setAttribute("position", new BufferAttribute(buffers.vertices, 3));
      lines.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));
    } else {
      lines.visible = false;
    }

    /*
    if (params.debugInfos) {
      let t0 = performance.now();
      let snapshot = world.takeSnapshot();
      let t1 = performance.now();
      let snapshotTime = t1 - t0;

      t0 = performance.now();
      xxhash128(snapshot).then((worldHash) => {
        t1 = performance.now();

        setDebugInfos({
          stepId: (world as any).stepId,
          worldHash,
          worldHashTime: t1 - t0,
          snapshotTime,
        });
      });
    }
    */

    if (params.stepping) {
      params.running = false; //  game.isRunning = false;
      params.stepping = false;
    }
  };


  // return { params };

  return { stats, update };
};
