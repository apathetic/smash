import { createSignal } from 'solid-js'
import solidLogo from './assets/solid.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = createSignal(0)

  return (
    <>
      <div>
        <h1>Smash.</h1>
        <button onClick={()=>setCount((count) => count+1)}>{count}</button>
      </div>
      
    </>
  )
}

export default App
