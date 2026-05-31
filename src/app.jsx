import { Router, Route, useNavigate, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, createEffect, on } from "solid-js";
import { Stage } from "~/components/Stage";
import { loadLevel } from "~/game/hooks/loadLevel";
import { useGameState, hydrateSession } from "~/game/store";
import { SESSION_STORAGE_KEY } from "~/system/constants";
import { isWorldReady } from "~/system/world";
import "@unocss/reset/tailwind.css"
import "uno.css"
import "./app.css";


const Layout = ({ children }) => {
  const [gameState] = useGameState();
  const navigate = useNavigate();
  const location = useLocation();

  // Hydrate session (if present)
  createEffect(on(isWorldReady, (ready) => {
    if (ready) {
      if (location.pathname !== '/') {
        const hasSession = hydrateSession();
        if (hasSession) {
          loadLevel(gameState.level);
        } else {
          navigate('/');
        }
      }
    }
  }));

  // Persist session changes
  createEffect(on(
    () => [gameState.level, gameState.currency, gameState.inventory],
    ([level, currency, inventory]) => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ level, currency, inventory }));
    },
    { defer: true }
  ));

  return (
    <main>
      <Suspense>{children}</Suspense>
      <Stage />
    </main>
  );
};

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="*"><FileRoutes /></Route>
    </Router>
  );
}
