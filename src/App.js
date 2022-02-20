import './App.css';
import Telemetry from './components/telemetry/telemetry.js'


function App() {
  return (
    <>
      <div className="widget">Telemetry</div>
      <div className="App">
        <div className="App-body">
          <Telemetry />
        </div>
      </div>
    </>
  );
}

export default App;
