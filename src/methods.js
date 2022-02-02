const { dialog, BrowserWindow, ipcMain, app } = require('electron');
const fs = require('fs');

let savePath = '';
let isSave = false;

ipcMain.on('is:new', (err, data) => {
    savePath = data;
})

function dialogShowMessageBox(options) {
    dialog.showMessageBox({
        title: options.title ? options.title : "Mensaje de alerta",
        type: options.type ? options.type : "info",
        message: options.message ? options.message : "El archivo no ha sido guardado. ¿Quiere guardarlo?",
        buttons: options.buttons ? options.buttons : ['Sí', 'No', 'Cancelar'],
        cancelId: 2
    }).then(res => {
        if (res.response === 0) {
            options.sureCallback ? options.sureCallback() : false;
        }
        else if (res.response === 1) {
            if (options.close) BrowserWindow.getFocusedWindow().destroy();
            else BrowserWindow.getFocusedWindow().webContents.send('clear:textarea', true);
        }
        else {
            options.cancelCallback ? options.cancelCallback() : false;
        }
    })
}

function dialogShowSaveDialog(options) {
    dialog.showSaveDialog({
        title: options.title ? options.title : "Guardar",
        defaultPath: options.defaultPath ? options.defaultPath : "*.txt",
        filters: options.filters ? options.filters : [
                         { name: 'Archivo de documentos', extensions: ['* .txt'] },
                         { name: 'Todos los archivos', extensions: ['*'] }
        ],
        properties: ['showOverwriteConfirmation', 'createDirectory']
    }).then(res => {
        options.successCallback ? options.successCallback(res) : false;
    })
}

function fsWriteFile(options) {
    fs.writeFile(options.savePath, options.text, {}, (err, data) => {
        if (err) throw err;
        isSave = true;
        options.callback ? options.callback(data) : false;
        BrowserWindow.getFocusedWindow().webContents.send('is:save', isSave);
    })
}

function newFile(text) {
    if (savePath === "") {
        let options = {
            sureCallback: () => {
                let params = {
                    successCallback: (res) => {
                        if (res.canceled) {return}
                        fsWriteFile({savePath: res.filePath, text:text, callback: (data) => {
                            //savePath = res.filePath;
                            BrowserWindow.getFocusedWindow().webContents.send('clear:textarea', true)
                        }})
                    }
                }
                dialogShowSaveDialog(params);
            },
        }
        dialogShowMessageBox(options);
    } else {
        let options = {
            sureCallback: () => {
                fsWriteFile({savePath: savePath, text: text, callback: (err, data) => {
                    BrowserWindow.getFocusedWindow().webContents.send('clear:textarea', true);
                }})
            },
        }
        dialogShowMessageBox(options);
    }
}

async function openFile() {
    const { filePaths, canceled } = await dialog.showOpenDialog({properties: ['openFile']});
    if (!canceled) {
        const file = filePaths[0];
        savePath = filePaths[0];
        const content = fs.readFileSync(file, "utf-8");
        return [savePath, content];
    }
    return 0;
}

function saveFile(text) {
    if (savePath === "") {
        saveFileAs(text);
    } else {
        fsWriteFile({savePath: savePath, text: text})
    }
}

function saveFileAs(text) {
    let options = {
        successCallback: (res) => {
            if (res.canceled) {return}
            fsWriteFile({savePath: res.filePath, text: text, callback: (data) => {
                savePath = res.filePath;
                BrowserWindow.getFocusedWindow().webContents.send('new:path', savePath)
            }})
        }
    }
    dialogShowSaveDialog(options);
}

function closeFile(text) {
    if (savePath === "") {
        let options = {
            close: true,
            sureCallback: () => {
                let params = {
                    successCallback: (res) => {
                        if (res.canceled) {return}
                        fsWriteFile({savePath: res.filePath, text:text, callback: (data) => {
                            app.quit();
                        }})
                    }
                }
                dialogShowSaveDialog(params);
            },
        }
        dialogShowMessageBox(options);
    } else {
        let options = {
            close: true,
            sureCallback: () => {
                fsWriteFile({savePath: savePath, text: text, callback: (err, data) => {
                    app.quit();
                }})
            },
        }
        dialogShowMessageBox(options);
    }
}

module.exports = {
    newFile,
    openFile,
    saveFile,
    saveFileAs,
    closeFile
}