const { Menu, BrowserWindow, app, ipcMain } = require("electron");
const methods = require('./methods.js');

ipcMain.on('input:text', (err, data) => {
    switch (data[0]) {
        case 'save': methods.saveFile(data[1]); break;
        case 'save:as': methods.saveFileAs(data[1]); break;
        case 'new:file': methods.newFile(data[1]); break;
        case 'close:file': methods.closeFile(data[1]); break;
    }
});
ipcMain.on('close:app', (err, data) => {
    if (data) BrowserWindow.getFocusedWindow().destroy();
})

let template = [
    {
        label: 'Archivo',
        submenu:[
            {
                label: 'Nuevo',
                accelerator: process.platform == 'darwin' ? 'command+N' : 'Ctrl+N',
                click() {
                    BrowserWindow.getFocusedWindow().webContents.send('action','new');
                }
            },{
                label: 'Abrir',
                accelerator: process.platform == 'darwin' ? 'command+O' : 'Ctrl+O',
                click: async () => {
                    const data = await methods.openFile();
                    BrowserWindow.getFocusedWindow().webContents.send('text:file', data);
                }
            },{
                label: 'Guardar',
                accelerator: process.platform == 'darwin' ? 'command+S' : 'Ctrl+S',
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.send('action', 'save')
                }
            },{
                label: 'Guardar como',
                accelerator: process.platform == 'darwin' ? 'command+shift+S' : 'Ctrl+Shift+S',
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.send('action','saveOther');
                }
            },{ type: 'separator' },{
                label: 'Salir',
                accelerator: process.platform == 'darwin' ? 'command+Q' : 'Ctrl+Shift+Q',
                click() {
                    BrowserWindow.getFocusedWindow().webContents.send('action','quit');
                }
            }
        ]
    }, {
        label: 'Edición',
        submenu:[
           {
                label: 'Cortar',
                accelerator: process.platform == 'darwin' ? 'command+X' : 'Ctrl+X',
                role: 'cut',
            },{
                label: 'Copiar',
                accelerator: process.platform == 'darwin' ? 'command+C' : 'Ctrl+C',
                role: 'copy',
            },{
                label: 'Pegar',
                accelerator: process.platform == 'darwin' ? 'command+V' : 'Ctrl+V',
                role: 'paste',
            },{ type: 'separator' },{
                label: 'Seleccionar todo',
                accelerator: process.platform == 'darwin' ? 'command+A' : 'Ctrl+A',
                role: 'selectAll'
            }
        ]
    }, {
        label: 'Operación',
        submenu:[
            {
                label: 'Deshacer',
                role: 'undo'
            },{
                label: 'Rehacer',
                role: 'redo'
            }
        ]
    }
];

// borrar nombre por defecto 'Electron' en MAC OS
if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName()
    });
}

if (process.env.NODE_ENV !== 'production') {
    template.push({
        label: 'DevTools',
        submenu: [
            {
                label: 'Show/Hide Dev Tools',
                accelerator: 'Ctrl+D',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                label: 'Recargar',
                role: 'reload'
            }
        ]
    })
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)