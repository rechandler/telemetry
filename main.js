const { app, ipcMain, autoUpdater, BrowserWindow } = require('electron');

const { createAuthWindow, createLogoutWindow } = require('./src/main/auth-process');
const createAppWindow = require('./src/main/app-process');
const authService = require('./src/services/auth-service');
const launchTelemetry = require('./src/main/telemetry-process');
const irsdk = require('node-irsdk')
const iracing = irsdk.init()

const Store = require('electron-store')
const schema = require('./schema.json')

const store = new Store({schema})

const server = 'https://telemetry-lc9vbg16r-rechandler.vercel.app'
const url = `${server}/update/${process.platform}/${app.getVersion()}`  
autoUpdater.setFeedURL({ url })


if(app.isPackaged) {
  // Production Mode
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


async function showWindow() {
  try {
    await authService.refreshTokens();
    const profile = await authService.getProfile()
    createAppWindow(app, store, profile);
  } catch (err) {
    createAuthWindow(app, store);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  ipcMain.on('auth:log-out', () => {
    BrowserWindow.getAllWindows().forEach(window => window.close());
    createLogoutWindow();
    createAuthWindow(app, store);
  });
  ipcMain.on('telemetryLaunch', () => {
    launchTelemetry(app, store, iracing)
  })
  
  showWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});
