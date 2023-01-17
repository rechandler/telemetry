const { BrowserWindow, ipcMain } = require("electron");

const updateWindowPosition = ({x, y}, windowName, store) => {
  store.set(`${windowName}.position.x`, x)
  store.set(`${windowName}.position.y`, y)
}

const launchTelemetry = (app, store, iracing) => {
  if (store.get('telemetryWidget.displayed')) return

  const telemStore = store.get('telemetryWidget')

  let browserOptions = {
    width: 565,
    height: 180,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: ["Telemetry"]
    }
  }

  if (telemStore && telemStore.position && telemStore.positionEnabled) {
    const {x, y} = telemStore.position
    browserOptions = {
      ...browserOptions,
      x,
      y
    }
  }

  // Create the browser window.
  const telemetryWindow = new BrowserWindow(browserOptions)

  if(app.isPackaged) {
    // Production Mode
    telemetryWindow.loadFile(`${__dirname}/build/index.html`)
  } else {
    // Local Development. Must start react-dev-server
    telemetryWindow.loadURL('http://localhost:3000');
  }

  // Open the DevTools.
  // win.webContents.openDevTools()

  // This should be all we need to do for now in our main process.
  // Any future widgets that need telemetry data can just subscribe
  // UPDATE: add publishing to socket
  iracing.on('Telemetry', evt => {
    
    if(!telemetryWindow.isDestroyed()) {
      telemetryWindow.webContents.send('telemetry', evt.values)
    }
  })
  
  telemetryWindow.setAlwaysOnTop(true, 'screen')

  telemetryWindow.on('closed', () => {
    store.set('telemetryWidget.displayed', false)
  })

  telemetryWindow.on('move', () => {
    updateWindowPosition(telemetryWindow.getBounds(), 'telemetryWidget', store)
  })

  ipcMain.on('telemetryConversionSwitched', (_evt, usingMetric) => {
    if(!telemetryWindow.isDestroyed()) telemetryWindow.webContents.send('telemetryConversionUpdate', usingMetric)
  })

  store.set('telemetryWidget.displayed', true)
}


module.exports = launchTelemetry