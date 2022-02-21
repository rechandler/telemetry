import './App.css';
import Telemetry from './components/telemetry/telemetry'
import MainMenu from './components/dashboard/mainMenu'
import { BrowserRouter, HashRouter, NavLink, Route, Routes } from 'react-router-dom'


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu/*" element={<MainMenu />} />
        <Route path="/widgets/telemetry" element={<Telemetry />} />
      </Routes>
     
    </BrowserRouter>
  )
}

export default App;
