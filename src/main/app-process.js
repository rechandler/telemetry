const { BrowserWindow } = require("electron");
const connectAndRun = require('./irsdk-socket-process');

const setupAutoUpdater = () => {
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    }
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.checkForUpdates()
}

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
    win.loadFile(`${__dirname}/build/index.html`)
    setupAutoUpdater()
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
