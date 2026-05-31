import { onMount } from "solid-js";
import { resetLevel } from "~/game/hooks/resetLevel";
import { useGameState } from "~/game/store";
import { Inventory } from "~/components/Inventory";

export default function Set() {
  const [_, setGameState] = useGameState();

  onMount(async () => {
    setGameState('mode', 'reset');
    await resetLevel();
    setGameState('mode', 'edit');
  });

  return (
    <>
      <Inventory />
    </>
  );
}