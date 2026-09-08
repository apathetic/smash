import { animate } from "animejs";
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

/**
 * How long the camera takes to sweep, and how often a fresh scene created.
 */
const SWEEP_MS = 5000;

/**
 * A number somewhere in [min, max).
 */
const randomBetween = (min, max) => min + Math.random() * (max - min);

/**
 * Heads or tails, evenly.
 */
const coinFlip = () => Math.random() > 0.5;

/**
 * How far along from `from` to `to`, `t` of the way.
 */
const lerp = (from, to, t) => from + (to - from) * t;

/**
 * A spot in the play area, dropped in from between `minY` and `maxY` up.
 */
const randomDrop = (minY, maxY) => [
  randomBetween(-5, 5),
  randomBetween(minY, maxY),
  randomBetween(-5, 5)
];

/**
 * Fades the whole page, resolving once it has finished.
 */
const fadePage = (from, to, duration) => new Promise((resolve) => {
  animate(document.body, { opacity: [from, to], duration, onComplete: resolve });
});


export default function Index() {
  const [_, setGameState] = useGameState();
  const navigate = useNavigate();

  // Attract mode: a shuffle of random scenes, each watched by a camera
  // drifting from one end of `sweep` to the other over SWEEP_MS.
  let timer;
  let animFrame;
  let sweep = {
    from: { angle: 0, radius: 15, height: 5 },
    to:   { angle: 0, radius: 15, height: 5 },
    startedAt: Date.now()
  };

  const animateCamera = () => {
    try {
      const { camera } = useGraphics();

      if (camera) {
        const progress = Math.min((Date.now() - sweep.startedAt) / SWEEP_MS, 1);
        const angle    = lerp(sweep.from.angle, sweep.to.angle, progress);
        const radius   = lerp(sweep.from.radius, sweep.to.radius, progress);
        const height   = lerp(sweep.from.height, sweep.to.height, progress);

        camera.position.set(
           Math.sin(angle) * radius,
           height,
           Math.cos(angle) * radius
        );
      }
    } catch {}

    animFrame = requestAnimationFrame(animateCamera);
  };

  /**
   * Stops attract mode: the scene shuffle, and the camera sweep it drives.
   */
  const stopAttract = () => {
    clearInterval(timer);
    cancelAnimationFrame(animFrame);
    timer = null;
    animFrame = null;
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

      // Setup sweeping trajectory: a radian around to one side, and
      // slightly up/down and in/out from where it started
      const from = {
        angle: randomBetween(0, Math.PI * 2),
        radius: randomBetween(12, 20),
        height: randomBetween(4, 10)
      };

      const to = {
        angle: from.angle + (coinFlip() ? 1.0 : -1.0),
        radius: from.radius + (coinFlip() ? 4 : -4),
        height: from.height + randomBetween(-2, 2)
      };

      sweep = {
        from,
        to,
        startedAt: Date.now()
      };

      // Add Terrain
      add(new Terrain());

      // Add Ragdoll
      add(new RagDoll());

      // Add random cubes
      const numCubes = Math.floor(randomBetween(3, 8));
      for (let i = 0; i < numCubes; i++) {
        add(new Cube({ position: randomDrop(5, 15) }));
      }

      // Add a truck sometimes
      if (coinFlip()) {
        add(new Truck({ position: randomDrop(3, 8) }));
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
      timer = setInterval(createRandomScene, SWEEP_MS);
    }
  });

  onCleanup(stopAttract);

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center z-10 bg-black/10 backdrop-blur-[2px]">
      <button
        onClick={async () => {
          stopAttract(); // before the level places the camera

          await fadePage(1, 0, 400);
          await loadLevel(0);

          navigate("/set");

          await fadePage(0, 1, 500);
        }}
        class="text-white text-3xl drop-shadow-md bg-transparent border-none cursor-pointer font-lilita"
      >
        PLAY
      </button>
    </div>
  );
}
