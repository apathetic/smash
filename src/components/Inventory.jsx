import { For, Show, createMemo } from "solid-js";
import { animate, stagger, spring } from "animejs";
import { useGameState } from "~/game/store";
import { spawnEntity, canSpawn } from "~/game/hooks/spawnEntity";
import { createCurtain } from "./curtain";
import { EntityIcon } from "./EntityIcon";

export function Inventory() {
  const [gameState] = useGameState();

  /**
   * One tile per type, in the order each was first bought.
   */
  const types = createMemo(() => [...new Set(gameState.inventory)]);
  const count = (type) => gameState.inventory.filter((item) => item === type).length;

  /**
   * A press on a tile becomes a spawn the moment the pointer is dragged off
   * the tile. Off the tile, not merely moved: spawning is irreversible.
   * Until then the press is nothing, and a release simply lets go.
   */
  function handlePointerDown(type, event) {
    const tile = event.currentTarget;
    const { pointerId } = event;
    const bounds = tile.getBoundingClientRect();

    if (!canSpawn()) return;
    if (!event.isPrimary || event.button !== 0) return;

    const onMove = (e) => {
      if (e.pointerId !== pointerId) return;
      if (e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom) return;

      release();
      spawnEntity(type, e);
    };

    const release = () => {
      if (tile.hasPointerCapture(pointerId)) tile.releasePointerCapture(pointerId);
      tile.removeEventListener('pointermove', onMove);
      tile.removeEventListener('pointerup', release);
      tile.removeEventListener('pointercancel', release);
    };

    tile.addEventListener('pointermove', onMove);
    tile.addEventListener('pointerup', release);
    tile.addEventListener('pointercancel', release);
    tile.setPointerCapture(pointerId); // keep the moves coming once the pointer has left the tile
  }

  const animationContainer = createCurtain({
    navigate: true,
    onEnter: (el) => {
      animate(Array.from(el.children), {
        opacity: [0, 1],
        scale: [0.6, 1],
        translateY: [20, 0],
        delay: stagger(35),
        ease: spring({ bounce: 0.5, duration: 380 })
      });
    },
    onExit: (el, done) => {
      animate(Array.from(el.children), {
        opacity: [1, 0],
        scale: [1, 0.4],
        translateY: [0, 20],
        delay: stagger(35, { from: "last" }),
        ease: spring({ bounce: 0.2, duration: 320 }),
        onComplete: done
      });
    }
  });

  return (
    <div
      ref={animationContainer}
      class="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 pointer-events-none transition-opacity duration-300"
      style={{ opacity: canSpawn() ? 1 : 0 }}
    >
      <For each={types()}>
        {(type) => (
          <div
            class="card-blur opacity-0 cursor-pointer touch-none"
            classList={{ 'pointer-events-auto': canSpawn() }}
            onPointerDown={(e) => handlePointerDown(type, e)}
            onMouseEnter={(e) => {
              animate(e.currentTarget, {
                scale: 1.05,
                duration: 100,
                ease: "outQuad"
              });
            }}
            onMouseLeave={(e) => {
              animate(e.currentTarget, {
                scale: 1,
                duration: 80,
                ease: "outQuad"
              });
            }}
          >
            <EntityIcon type={type} />
            <Show when={count(type) > 1}>
              <div class="absolute -top-3 -right-3 bg-fuchsia-600 text-white text-sm font-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                {count(type)}
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
