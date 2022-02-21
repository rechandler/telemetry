import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Telemetry from './components/telemetry/telemetry'
import reportWebVitals from './reportWebVitals';

const processes = [
  {'MainMenu': App},
  {'Telemetry': Telemetry}
]

const getProcessFromArgs = () => {
  for(const processObject of processes) {
    const key = Object.keys(processObject)[0]
    if (window.process.argv.includes(key)) return processObject[key]
  }
  return App //just a default
}

const Component = getProcessFromArgs()

ReactDOM.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
