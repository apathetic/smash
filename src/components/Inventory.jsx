import { animate, stagger, spring } from "animejs";
import { createCurtain } from "~/system/curtain";
import { useGameState } from "~/game/store";
import { EntityIcon } from "./EntityIcon";

export function Inventory() {
  const [gameState] = useGameState();

  const inventoryCounts = () => {
    const counts = {};
    for (const item of gameState.inventory) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  };

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
    <div ref={animationContainer} class="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 pointer-events-none">
      {inventoryCounts().map(({ type, count }) => (
        <div
          key={type}
          class="card-blur opacity-0 pointer-events-auto cursor-pointer"
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
          {count > 1 && (
            <div class="absolute -top-3 -right-3 bg-fuchsia-600 text-white text-sm font-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              {count}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
