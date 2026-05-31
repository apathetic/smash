import { Router, Route, useNavigate, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount, createEffect, on } from "solid-js";
import { Stage } from "~/components/Stage";
import { useGameState, hydrateSession } from "~/game/store";
import { loadLevel } from "~/game/hooks/loadLevel";
import { SESSION_STORAGE_KEY } from "~/system/constants";
import "@unocss/reset/tailwind.css"
import "uno.css"
import "./app.css";


const Layout = ({ children }) => {
  const [gameState] = useGameState();
  const navigate = useNavigate();
  const location = useLocation();

  onMount(() => {
    if (location.pathname !== '/') {
      const hasSession = hydrateSession();
      if (hasSession) {
        // HACK: Delay loading to ensure the <Stage /> component and its canvas 
        // have fully mounted and initialized the singletons (same issue as in src/routes/index.jsx).
        // A better solution would be using a reactive Solid signal (e.g. `isReady`)
        // or an event emitter from the Stage component to guarantee safe initialization.
        setTimeout(() => {
          loadLevel(gameState.level);
        }, 100);
      } else {
        navigate('/');
      }
    }
  });

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
