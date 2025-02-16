import { Router, Route, Navigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Stage } from "~/components/Stage";
import "@unocss/reset/tailwind.css"
import "uno.css"
import "./app.css";


const Layout = ({ children }) => (
  <main>
    <Suspense>{children}</Suspense>
    <Stage />
  </main>
);

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={() => <Navigate href="/overview" />} />
      <Route path="*"><FileRoutes /></Route>
    </Router>
  );
}
