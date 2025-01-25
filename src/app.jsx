import { Router, Route, Navigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Header } from "./components/Header";
import "@unocss/reset/tailwind.css"
import "uno.css"
import "./app.css";

const Layout = ({ children }) => (
  <>
    <Header />
    <Suspense>{children}</Suspense>
  </>
);

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={() => <Navigate href="/home" />} /> {/* example redirect. useful if we want to check user/state/auth/etc/etc */}
      <Route path="*"><FileRoutes /></Route>
    </Router>
  );
}
