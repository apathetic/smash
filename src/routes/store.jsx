import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useGameState } from "~/game/store";
import { loadLevel } from "~/game/hooks/loadLevel";
import { Modal } from "~/components/Modal";

const STORE_ITEMS = [
  { id: 'Rocket', name: 'Rocket', cost: 500, description: 'A fast, explosive projectile.' },
  { id: 'Truck', name: 'Truck', cost: 800, description: 'A heavy vehicle for maximum impact.' },
  { id: 'Cube', name: 'Cube', cost: 100, description: 'A basic building block.' },
];


export default function Store() {
  const [gameState, setGameState] = useGameState();
  const navigate = useNavigate();

  onMount(() => {
    setGameState('mode', 'display');
  });

  const handleNextLevel = async () => {
    await loadLevel(gameState.level + 1);
    navigate('/set');
  };

  const handleBuy = (item) => {
    if (gameState.currency >= item.cost) {
      setGameState('currency', (c) => c - item.cost);
      setGameState('inventory', (i) => [...i, item.id]);
    }
  };

  return (
    <Modal>
      <h1 class="text-3xl font-black italic tracking-tighter mb-2 text-fuchsia-400 uppercase">Store</h1>
      <p class="mb-6 font-bold text-lg text-zinc-300 tracking-wider">
        DAMAGE POINTS: <span class="text-white">{Math.floor(gameState.currency)}</span>
      </p>

      <div class="flex-1 overflow-y-auto mb-6 flex flex-col gap-3 pr-2">
        {STORE_ITEMS.map((item) => {
          const canAfford = gameState.currency >= item.cost;
          const count = gameState.inventory.filter((id) => id === item.id).length;

          return (
            <div key={item.id} class="store-row">
              <div>
                <div class="font-bold text-lg uppercase tracking-wide flex items-center gap-2">
                  {item.name}
                  {count > 0 && (
                    <span class="text-xs bg-fuchsia-600/50 text-fuchsia-200 px-2 py-0.5 rounded-full">
                      Owned: {count}
                    </span>
                  )}
                </div>
                <div class="text-xs text-zinc-400 mt-1">{item.description}</div>
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={!canAfford}
                class={`px-4 py-2 ${
                  canAfford
                    ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_10px_rgba(192,38,211,0.3)] button-action'
                    : 'bg-zinc-800 text-zinc-500 button-base cursor-not-allowed'
                }`}
              >
                {item.cost} DP
              </button>
            </div>
          );
        })}
      </div>

      <div class="mt-auto flex justify-end">
        <button
          class="px-8 py-4 bg-green-500 hover:bg-green-400 text-black text-lg flex items-center gap-2 button-action"
          onClick={handleNextLevel}
        >
          Proceed &rarr;
        </button>
      </div>
    </Modal>
  );
}

