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

  return (
    <div class="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 pointer-events-none">
      {inventoryCounts().map(({ type, count }) => (
        <div key={type} class="relative bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl pointer-events-auto transition-transform hover:scale-105">
          <EntityIcon type={type} />
          {count > 1 && (
            <div class="absolute -top-3 -right-3 bg-fuchsia-600 text-white text-sm font-black rounded-full w-8 h-8 flex items-center justify-center border-4 border-zinc-900 shadow-lg">
              {count}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
