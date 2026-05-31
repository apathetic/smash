import anime from "animejs";
import { useGameState } from "~/game/store";
import { EntityIcon } from "./EntityIcon";
import { createCurtain } from "~/system/curtain";

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
      anime({
        targets: el.querySelectorAll(".inventory-tile"),
        opacity: [0, 1],
        scale: [0.6, 1],
        translateY: [20, 0],
        delay: anime.stagger(60),
        duration: 650,
        easing: "easeOutElastic(1.2, 0.6)"
      });
    },
    onExit: (el, done) => {
      anime({
        targets: el.querySelectorAll(".inventory-tile"),
        opacity: [1, 0],
        scale: [1, 0.6],
        translateY: [0, 20],
        delay: anime.stagger(60, { from: 'last' }),
        duration: 300,
        easing: "easeInBack",
        complete: done
      });
    }
  });

  return (
    <div ref={animationContainer} class="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 pointer-events-none">
      {inventoryCounts().map(({ type, count }) => (
        <div key={type} class="inventory-tile opacity-0 pointer-events-auto">
          <div class="relative backdrop-blur-md border border-white/50 rounded-2xl p-3 shadow-2xl transition-transform hover:scale-105">
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
