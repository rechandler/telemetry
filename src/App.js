import './App.css';
import GasBreak from './components/gasBrake/gasBreak.js'


function App() {
  return (
    <>
      <div className="widget">Telemetry</div>
      <div className="App">
        <div className="App-body">
          <GasBreak />
        </div>
      </div>
    </>
  );
}

export default App;
