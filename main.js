const { app, BrowserWindow, autoUpdater, dialog } = require('electron')

if (require('electron-squirrel-startup')) return;

const iracing = require('node-irsdk').getInstance()

const UPDATE_CHECK_INTERVAL = 10 * 60 * 1000
const server = 'https://telemetry-lc9vbg16r-rechandler.vercel.app'
const url = `${server}/update/${process.platform}/${app.getVersion()}`  
autoUpdater.setFeedURL({ url })

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 505,
    height: 115,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
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

  // Open the DevTools.
  // win.webContents.openDevTools()

  // This should be all we need to do for now in our main process.
  // Any future widgets that need telemetry data can just subscribe
  iracing.on('Telemetry', evt => {
    win.webContents.send('telemetry', evt.values)
  })

  win.setAlwaysOnTop(true, 'screen')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

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

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, UPDATE_CHECK_INTERVAL)
  autoUpdater.checkForUpdates()
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.