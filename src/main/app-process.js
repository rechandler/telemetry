const { BrowserWindow } = require("electron");
const connectAndRun = require('./irsdk-socket-process');

let client;
const createAppWindow = (app, store, profile) => {
  const props = JSON.stringify({props: profile});
  let win = new BrowserWindow({
    width: 800,
    height: 800,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: ["MainMenu", props]
    }
  })

  if(app.isPackaged) {
    // Production Mode
    win.loadFile(`../../build/index.html`)
  } else {
    // Local Development. Must start react-dev-server
    win.loadURL('http://localhost:3000');
  }

  win.on('close', () => {
    store.set('telemetryWidget.displayed', false)
    store.set('relativePositionWidget.displayed', false)
    if(client && client.disconnect) client.disconnect();
    win = null
    app.quit()
  })

  if(store.get('telemetryWidget.launchEnabled')) {
    // launchTelemetry()
  }

  if(store.get('relativePositionWidget.launchEnabled')) {
    // launchRelativePosition()
  }

  client = connectAndRun(profile);
}

module.exports = createAppWindow;
