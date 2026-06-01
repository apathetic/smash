import { onCleanup, createEffect, onMount } from "solid-js";
import { reconcile } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { useWorld, isWorldReady } from "~/system/world";
import { useTimeline } from "~/system/timeline";
import { useGraphics } from "~/system/scene";
import { useGameState } from "~/game/store";
import { usePhysics } from "~/system/physics";
import { Terrain } from "~/game/environment/Terrain";
import { RagDoll } from "~/game/entities/Ragdoll";
import { Cube } from "~/game/entities/Cube";
import { Truck } from "~/game/entities/Truck";
import { loadLevel } from "~/game/hooks/loadLevel";

export default function Index() {
  const [_, setGameState] = useGameState();
  const navigate = useNavigate();

  let timer;
  let animFrame;
  let sceneStartTime = Date.now();
  let angle = 0;
  let endAngle = 0;
  let startRadius = 15;
  let endRadius = 15;
  let height = 5;
  let endHeight = 5;

  const animateCamera = () => {
    try {
      const { camera } = useGraphics();

      if (camera) {
        const elapsed = Date.now() - sceneStartTime;
        const progress = Math.min(elapsed / 5000, 1);
        const currentAngle = angle + (endAngle - angle) * progress;
        const currentHeight = height + (endHeight - height) * progress;
        const currentRadius = startRadius + (endRadius - startRadius) * progress;

        camera.position.set(
           Math.sin(currentAngle) * currentRadius,
           currentHeight,
           Math.cos(currentAngle) * currentRadius
        );
      }
    } catch {}

    animFrame = requestAnimationFrame(animateCamera);
  };

  const createRandomScene = () => {
    try {
      const { add, clear } = useWorld();
      const { start, stop } = useTimeline();
      const physics = usePhysics();

      stop();
      clear();

      setGameState('impacts', []);
      setGameState('totalDamage', 0);
      setGameState('entities', reconcile({}));

      // Setup sweeping trajectory
      angle = Math.random() * Math.PI * 2;
      startRadius = 12 + Math.random() * 8;
      height = 4 + Math.random() * 6;

      // End position sweeps 0.5 to 1.0 radians to the side and slightly up/down
      endAngle = angle + (Math.random() > 0.5 ? 1.0 : -1.0);
      endHeight = height + (Math.random() * 4 - 2);
      endRadius = startRadius + (Math.random() > 0.5 ? 4 : -4);

      sceneStartTime = Date.now();

      // Add Terrain
      add(new Terrain());

      // Add Ragdoll
      add(new RagDoll());

      // Add random cubes
      const numCubes = Math.floor(Math.random() * 5) + 3; // 3 to 7 cubes
      for (let i = 0; i < numCubes; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = Math.random() * 10 + 5; // drop from height 5-15
        const z = (Math.random() - 0.5) * 10;
        add(new Cube({ position: [x, y, z] }));
      }

      // Add a truck sometimes
      if (Math.random() > 0.5) {
        const x = (Math.random() - 0.5) * 10;
        const y = Math.random() * 5 + 3;
        const z = (Math.random() - 0.5) * 10;
        add(new Truck({ position: [x, y, z] }));
      }

      // Manually enable gravity and dynamics for the demo
      physics.setBodiesKinematic(false);
      physics.setGravity(true);

      start();

      // Start camera loop if not running
      if (!animFrame) {
        animFrame = requestAnimationFrame(animateCamera);
      }
    } catch (e) {
      console.warn("World not ready yet, retrying...", e);
    }
  };


  onMount(() => {
    setGameState('mode', 'display');
  });

  createEffect(() => {
    if (isWorldReady()) {
      createRandomScene();
      timer = setInterval(createRandomScene, 5000);
    }
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
    if (animFrame) cancelAnimationFrame(animFrame);
  });

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center z-10 bg-black/10 backdrop-blur-[2px]">
      <button
        onClick={async () => {
          await loadLevel(0);
          navigate('/set');
        }}
        class="text-white text-3xl tracking-widest drop-shadow-md bg-transparent border-none cursor-pointer"
        style="font-family: 'Lilita One', sans-serif;"
      >
        PLAY
      </button>
    </div>
  );
}
