const { app, BrowserWindow } = require("electron");
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    //require('electron-reload')(__dirname, {electron: path.join(__dirname, '..node_modules', '.bin', 'electron')});
    require('electron-reload')(__dirname);
}

let mainWindow = null;

function createBrowser(){
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences:{
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    mainWindow.loadFile(path.join(__dirname, "/index.html"));
    require("./menu.js");
    // mainWindow.webContents.openDevTools();
    mainWindow.on('close', (e) => {
        e.preventDefault();
        BrowserWindow.getFocusedWindow().webContents.send('action','quit');
    })
    mainWindow.on("closed", () => {
        mainWindow = null;
        app.quit();
    })
}

app.on("ready", createBrowser);
app.on("window-all-closed", () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})