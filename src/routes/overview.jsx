import { onMount, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useGameState } from "~/game/store";
import { loadLevel } from "~/game/hooks/loadLevel";
import { Modal } from "~/components/Modal";

export default function Overview() {
  const [_, setGameState] = useGameState();
  const navigate = useNavigate();

  const handleClose = () => {
    // Navigate back to the previous screen (e.g. the game)
    // Fallback to start level if history is empty could be done, but -1 usually works.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Default to picking a level if there's no history to go back to
      loadLevel(0);
      navigate('/set');
    }
  };

  onMount(() => {
    setGameState('mode', 'display');
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <>
      behind text neato

      <Modal>
        {/* Absolute positioned close button at top right inside modal */}
        <button
          onClick={handleClose}
          class="absolute top-0 right-0 z-50 p-2 text-white bg-transparent border-none cursor-pointer hover:text-fuchsia-400 transition-colors"
          aria-label="Close overview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h1 class="text-3xl font-bold mb-4">HOW TO PLAY</h1>
        <p class="mb-4">stats.</p>
        <p class="mb-4">choose a level or something.</p>
        <p class="mb-8">high score, replays</p>
      </Modal>
    </>
  );
}

