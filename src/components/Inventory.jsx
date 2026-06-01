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
        ease: spring({ bounce: 0.5, duration: 380 }),
        onComplete: (anim) => {
          anim.targets.forEach((t) => t.style.removeProperty('transform'))
        }
      });
    },
    onExit: (el, done) => {
      animate(Array.from(el.children), {
        opacity: [1, 0],
        scale: [1, 0.6],
        translateY: [0, 20],
        delay: stagger(35, { from: 'last' }),
        duration: 250,
        ease: "inBack",
        onComplete: done
      });
    }
  });


  return (
    <div ref={animationContainer} class="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 pointer-events-none">
      {inventoryCounts().map(({ type, count }) => (
        <div key={type} class="inventory-tile opacity-0 pointer-events-auto">
          <div class="card-blur">
            <EntityIcon type={type} />
            {count > 1 && (
              <div class="absolute -top-3 -right-3 bg-fuchsia-600 text-white text-sm font-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                {count}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
