const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;
const {basename} = require('path');

let textarea = document.querySelector("#textarea");
let mytextarea = document.querySelector("#my-textarea");

ipcRenderer.on("action", (err, data) => {
    switch (data) {
        case "new":
            newFile();
            break;
        case "open":
            openFile();
            break;
        case "save":
            saveFile();
            break;
        case "saveOther":
            saveOtherFile();
            break;
        case "quit":
            quitFile();
            break;
    }
});
ipcRenderer.on('text:file', (err, data) => {
    openFile(data);
    readInput(textarea.value);
})
ipcRenderer.on('is:save', (err, data) => {
    isSave = data;
    if (document.title.slice(-1) == '*')
        document.title = document.title.slice(0, -1)
})
ipcRenderer.on('clear:textarea', (err, data) => {
    if (data) {
        textarea.value = '';
        document.title = title;
        savePath = '';
    }
    else {
        console.log('ocurrio un error al crear un nuevo archivo');
    }
    readInput(textarea.value);
})
ipcRenderer.on('new:path', (err, data) => {
    savePath = data;
    document.title = title + ' - ' + basename(savePath) + ' (' + savePath + ')';
})

let isSave = true; // se guarda
let savePath = ''; // Ruta de guardado actual
let title = document.title;
let tagTitle = " * ";


textarea.addEventListener("input", (e) => {// cuando cambia el cuadro de entrada, el disparador no se guarda.
    document.title = title + ' - ' + basename(savePath) + ' (' + savePath + ')' + tagTitle;
    isSave = false;
    readInput(textarea.value);
})
textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.which === 87) {
        putSymbol('$$');
    }
    else if (e.ctrlKey && e.which === 84) {
        putSymbol('##');
    }
    else if (e.ctrlKey && e.which === 69) {
        putSymbol('&&');
    }
    readInput(textarea.value);
})

function putSymbol(symbol) {
    var startPosition = textarea.selectionStart;
    var endPosition = textarea.selectionEnd;
    var textareaValue = textarea.value;
    var textareaLen = textarea.value.length;
    textarea.value = '';
    for (var i = 0; i <= textareaLen; i++) {
        if (i == startPosition && startPosition == endPosition) {
            textarea.value += symbol;
        }
        if (i < textareaLen)
            textarea.value += textareaValue[i];
    }
    textarea.selectionStart = startPosition + 1;
    textarea.selectionEnd = startPosition + 1
}

function newFile() {
    if (isSave) {
        textarea.value = "";
        savePath = '';
        document.title = title;
        ipcRenderer.send('is:new', savePath);
        readInput(textarea.value);
    } else {
        const currentTextValue = textarea.value;
        ipcRenderer.send('input:text', ['new:file', currentTextValue]);
    }
}

function openFile(text) {
    if (text === 0) return ;
    savePath = text[0]
    textarea.value = text[1];
    document.title = title + ' - ' + basename(savePath) + ' (' + savePath + ')';
}

function saveFile() {
    const currentTextValue = textarea.value;
    ipcRenderer.send('input:text', ['save', currentTextValue]);
}

function saveOtherFile() {
    const currentTextValue = textarea.value;
    ipcRenderer.send('input:text', ['save:as', currentTextValue]);
}

function quitFile() {// 6. Salir
    if (isSave) ipcRenderer.send('close:app', true);
    else {
        const currentTextValue = textarea.value;
        ipcRenderer.send('input:text', ['close:file', currentTextValue]);
    }
}

function readInput(text) {
    var i = 0;
    var textlen = text.length;
    var normal = document.createElement('p');
    var div = document.createElement('div');
    var subdiv = document.createElement('div');
    var p = '';
    var k = 1;
    while (i < textlen) {
        if (text[i] == '$') {
            var textResult = defineSymbol('$', 'title', text, i);
            p += textResult[0];
            i = textResult[1];
        }
        else if (text[i] == '#') {
            var textResult = defineSymbol('#', 'subtitle', text, i);
            p += textResult[0];
            i = textResult[1];
        }
        else if (text[i] == '&') {
            var textResult = defineSymbol('&', 'equation', text, i);
            p += textResult[0];
            i = textResult[1];
        }
        else if (text[i] == '\n') {
            var newnormal = document.createElement('p');
            var subdiv2 = document.createElement('div')
            var index = document.createElement('div');
            var number = document.createElement('a');
            index.classList.add('index');
            number.innerText = k;
            index.appendChild(number);
            newnormal.innerHTML = p;
            subdiv2.appendChild(index);
            subdiv2.appendChild(newnormal);
            div.appendChild(subdiv2);
            p = '';
            k++;
        }
        else {
            p += text[i];
        }
        i++;
    }
    var index = document.createElement('div');
    var number = document.createElement('a');
    index.classList.add('index');
    number.innerText = k;
    index.appendChild(number);
    normal.innerHTML = p;
    subdiv.appendChild(index);
    subdiv.appendChild(normal);
    div.appendChild(subdiv);
    mytextarea.innerHTML = div.innerHTML;
    setEvent(text, textlen)
}

function setEvent(text, textlen) {
    const as = document.getElementsByTagName('a');
    Array.from(as).forEach(a => {
        a.addEventListener('dblclick', () => {
            var num = parseInt(a.innerText);
            var j = 1;
            if (num == 1) {
                textarea.focus();
                textarea.selectionStart = 0;
                textarea.selectionEnd = 0;
            }
            else {
                for (var i = 0; i < textlen; i++) {
                    if (text[i] == '\n') j++;
                    if (j == num) {
                        textarea.focus();
                        textarea.selectionStart = i + 1;
                        textarea.selectionEnd = i + 1;
                        break;
                    }
                }
            }
            
        })
    });
}

function defineSymbol(symbol, type, text, i) {
    var span = `<span class='${type}'>` + text[i];
    var textlen = text.length;
    i++;
    while (text[i] != symbol && i < textlen) {
        span += text[i];
        i++;
    }
    span += (text[i] ? text[i] : '') + '</span>';
    return [span, i];
}