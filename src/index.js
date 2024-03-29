import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/app/App';
import Telemetry from './components/telemetry/telemetry'
import TireWear from './components/tireWear/tireWear'
import RelativePosition from './components/relativePosition/relativePosition'
import reportWebVitals from './reportWebVitals';

const processes = [
  {'MainMenu': App},
  {'Telemetry': Telemetry},
  {'TireWear': TireWear},
  {'RelativePosition': RelativePosition}
]

const getProcessFromArgs = () => {
  for(const processObject of processes) {
    const key = Object.keys(processObject)[0]
    if (window.process.argv.includes(key)) return processObject[key]
  }
  return App //just a default
}

const getProps = () => {
  return window.process.argv.reduce((acc, arg) => {
    try {
      const parsed = JSON.parse(arg)
      acc.props = parsed.props;
      return acc
    } catch(err) {
      return acc
    }
  }, {})
}

const Component = getProcessFromArgs()

const props = getProps();

console.log(props);
ReactDOM.render(
  <React.StrictMode>
    <Component {...props}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
