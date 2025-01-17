import { Router, Route, Navigate, useNavigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, isServer } from 'solid-js/web';
import { Header } from './components/Header';
import { ThreeStage } from "./components/ThreeStage"; // Question: does Solid/Start have ability to use dir aliases?  i.e. import Tool from "@three/tools"
import '@unocss/reset/tailwind.css'
import "uno.css"
import './app.css';


// const check = isServer ? () => {} : () => {
//   if (!localStorage.getItem('agree')) {
//     const navigate = useNavigate();
//     navigate('/enter', { replace: true });
//   }
// };
const check = () => {};

const Layout = ({ children }) => (
  <>
    <Header />
    <Suspense>{children}</Suspense>
    <ThreeStage />
  </>
);

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={() => <Navigate href="/home" />} />
      <Route path="*" load={check}><FileRoutes /></Route>
    </Router>
  );
}
