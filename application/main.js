import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'node:path';
import fs from 'fs';
import Store from 'electron-store';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const store = new Store();

let mainWindow;
let settingWindow;
let addDirectoryWindow; 
let editWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,            
        }
    })
    mainWindow.loadFile('index.html')
    ipcMain.on("show-context-menu", (event, params) => {
        const path = params.path;
        const menu = Menu.buildFromTemplate([
            { label: "Reveal in Finder", click: () => {
                console.log(path);
                // パスが存在する場合、ファイルマネージャーで開く
                if (path && fs.existsSync(path)) {
                    // macOSではopenコマンド、Windowsではexplorer、Linuxではxdg-open
                    shell.openPath(path);
                } else {
                    throw new Error(`Error: Directory '${path}' doesn't exist.`);
                }
            } },
            { label: "Edit", click: () => {
                createEditWindow(params);
            } },
            { label: "Show properties (Under development...)", click: () => mainWindow.webContents.send("menu-item-clicked", "Show properties") },
        ]);
        menu.popup({ window: mainWindow });
    });    
    parseDirectoryConfig(store.get('path'));
}

const createEditWindow = (params) => {
    console.log(params)
    if (editWindow) {
        if (editWindow.params.nodeId === params.nodeId) {
            editWindow.focus();
            return;
        } else {
            editWindow.params = params;
            editWindow.loadFile('edit.html')
            editWindow.webContents.on('did-finish-load', () => {
                editWindow.webContents.send('edit-params', params);
            });
            editWindow.focus();
        }
    } else {
        editWindow = new BrowserWindow({
            width: 600,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true
            }
        })
        editWindow.params = params;
        editWindow.loadFile('edit.html')
        console.log(params)
        // ウィンドウが準備できたらparamsを送信
        editWindow.webContents.on('did-finish-load', () => {
            editWindow.webContents.send('edit-params', params);
        });
    }
    // ウィンドウが閉じられたときにeditWindowをnullに設定
    editWindow.on('closed', () => {
        editWindow = null;
    });    
}

const createSettingWindow = () => {
    settingWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    })
    settingWindow.loadFile('setting.html')
}

const createAddDirectoryWindow = () => {
    addDirectoryWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    })
    addDirectoryWindow.loadFile('add-directory.html')
}



///////////
///////////
///////////
///////////

// レンダラーからの設定を保存するIPCハンドラ
ipcMain.handle('save-settings', async (event, key, value) => {
    store.set(key, value);
    if (mainWindow) {
        mainWindow.webContents.send('update-setting', key, value);
    }
    return true;
});

// レンダラーからの設定を取得するIPCハンドラ
ipcMain.handle('get-settings', async (event, key) => {
    return store.get(key);
});

// 設定ウィンドウを開くIPCハンドラ
ipcMain.handle('create-setting-window', async (event) => {
    createSettingWindow();
    return true;
});


// 設定ウィンドウを閉じるIPCハンドラ
ipcMain.handle('close-setting-window', async (event) => {
    settingWindow.close();
    return true;
});

// ディレクトリ選択ダイアログを開くIPCハンドラ
ipcMain.handle('open-directory-dialog', async (event) => {
    const result = await dialog.showOpenDialog(settingWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths[0];
});

// ディレクトリ構造を追加するIPCハンドラ
ipcMain.handle('add-directory', async (event, structure) => {
    try {
        return createDirectoryStructure(structure);
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// ディレクトリ構造を編集するIPCハンドラ
ipcMain.handle('edit-directory', async (event, structure) => { 
    try {
        console.log('edit-directory')
        return editDirectoryStructure(structure);
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// ディレクトリ追加ウィンドウを開くIPCハンドラ
ipcMain.handle('create-add-directory-window', async (event) => {
    createAddDirectoryWindow();
    return true;
});

// ディレクトリ追加ウィンドウを閉じるIPCハンドラ
ipcMain.handle('close-add-directory-window', async (event) => {
    addDirectoryWindow.close();
    return true;
});

// 設定されたディレクトリの構造を取得するIPCハンドラ
ipcMain.handle('get-directory-structure', async (event) => {
    const basePath = store.get('path');
    return parseDirectoryConfig(basePath);
});

// 編集ウィンドウをリロードするIPCハンドラ
ipcMain.handle('reload-edit-window', async (event) => {
    editWindow.reload();
    return true;
});

// 編集ウィンドウを閉じるIPCハンドラ
ipcMain.handle('close-edit-window', async (event) => {
    editWindow.close();
    return true;
});

// メインウィンドウをリロードするIPCハンドラ
ipcMain.handle('reload-main-window', async (event) => {
    mainWindow.reload();
    return true;
});

// ディレクトリを削除するIPCハンドラ
ipcMain.handle('delete-directory', async (event, name) => {
    return deleteDirectory(name);
});

function parseDirectoryConfig(basePath) {
    const structure = {};

    // 指定ディレクトリ内のサブディレクトリ一覧を取得
    const directories = fs.readdirSync(basePath).filter(dir => 
        fs.statSync(path.join(basePath, dir)).isDirectory()
    );

    directories.forEach(dir => {
        const configPath = path.join(basePath, dir, '.config');

        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf-8');
            const lines = configData.split('\n');

            // 初期化
            structure[dir] = {
                id: dir,
                composition: [],
                super: null,
                path: path.join(basePath, dir)
            };

            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('#composition')) {
                    const items = line.split(' ').slice(1);
                    structure[dir].composition = items;
                } else if (line.startsWith('#super')) {
                    const items = line.split(' ').slice(1);
                    if (items.length > 0) {
                        structure[dir].super = items[0];
                    }
                }
            });
        }
    });
    return structure;
}


// 新しいディレクトリ作成
function createDirectoryStructure(structure) {
    const basePath = store.get('path');
    const blockName = Object.keys(structure)[0]; // 例: 'blockA'
    const { name, composition, super: superDir } = structure[blockName];
    const newDirPath = path.join(basePath, name);
    const configPath = path.join(newDirPath, '.config');

    // `composition` に指定されたディレクトリが存在するかチェック
    for (const comp of composition) {
        if (!fs.existsSync(path.join(basePath, comp))) {
            throw new Error(`Error: Composition directory '${comp}' does not exist.`);
        }
    }
    // `super` ディレクトリが存在するかチェック
    if (superDir && !fs.existsSync(path.join(basePath, superDir))) {
        throw new Error(`Error: Super directory '${superDir}' does not exist.`);
    }    

    // すでに `name` のディレクトリが存在する場合
    if (fs.existsSync(newDirPath)) {
        if (fs.existsSync(configPath)) {
            // 管理対象の同名ディレクトリが存在する場合はエラー
            throw new Error(`Error: Managed directory '${name}' already exists.`);
        } else {
            // 管理対象ではない同名のディレクトリが存在する場合
            const response = dialog.showMessageBoxSync({
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: `A non-managed directory with the name '${name}' exists. Do you want to set it as managed?`
            });

            if (response === 0) { // Yes
                // `.config` ファイルを作成
                const configContent = [
                    `#composition ${composition.join(' ')}`,
                    superDir ? `#super ${superDir}` : ''
                ].join('\n').trim();
                fs.writeFileSync(configPath, configContent);
                return { success: true, message: `Directory '${name}' is now managed.` };
            } else {
                // No
                return { success: false, message: `Directory '${name}' was not changed.` };
            }
        }
    } else {
        // 新しいディレクトリを作成
        fs.mkdirSync(newDirPath);

        // `.config` ファイルを作成
        const configContent = [
            `#composition ${composition.join(' ')}`,
            superDir ? `#super ${superDir}` : ''
        ].join('\n').trim();
        fs.writeFileSync(configPath, configContent);
        return { success: true, message: `Directory '${name}' created successfully.` };
    }
}

function editDirectoryStructure(structure) {
    const basePath = store.get('path');
    const name = structure.name
    const compositions_id = structure.composition
    const super_id = structure.super
    console.log(structure)
    const dirPath = path.join(basePath, name);
    if (fs.existsSync(dirPath)) {
        // ディレクトリが存在する場合は，composition と super を更新する
        // `composition` に指定されたディレクトリが存在するかチェック
        for (const comp of compositions_id) {
            if (!fs.existsSync(path.join(basePath, comp))) {
                throw new Error(`Error: Composition directory '${comp}' does not exist.`);
            }
        }
        // `super` ディレクトリが存在するかチェック
        if (super_id && !fs.existsSync(path.join(basePath, super_id))) {
            throw new Error(`Error: Super directory '${super_id}' does not exist.`);
        }                
        const configContent = [
            `#composition ${compositions_id.join(' ')}`,
            super_id ? `#super ${super_id}` : ''
        ].join('\n').trim();
        fs.writeFileSync(path.join(dirPath, '.config'), configContent);
        return { success: true, message: `Directory '${name}' updated successfully.` };
    } else {
        throw new Error(`Error: Directory '${basePath}' does not exist.`);
    }
};

function deleteDirectory(name) {
    const basePath = store.get('path');
    const dirPath = path.join(basePath, name);

    if (fs.existsSync(dirPath)) {
        const configPath = path.join(dirPath, '.config');
        // 指定されたディレクトリの.configを削除
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }

        // basePath内のすべてのディレクトリを取得
        const directories = fs.readdirSync(basePath).filter(dir => 
            fs.statSync(path.join(basePath, dir)).isDirectory()
        );

        directories.forEach(dir => {
            const configPath = path.join(basePath, dir, '.config');

            if (fs.existsSync(configPath)) {
                let configData = fs.readFileSync(configPath, 'utf-8');
                const lines = configData.split('\n');

                // 新しい構成を作成
                const newLines = lines.map(line => {
                    if (line.startsWith('#composition')) {
                        // #compositionから削除するディレクトリIDを取り除く
                        const items = line.split(' ').slice(1).filter(item => item !== name);
                        return `#composition ${items.join(' ')}`;
                    } else if (line.startsWith('#super')) {
                        // #superから削除するディレクトリIDを取り除く
                        const items = line.split(' ').slice(1).filter(item => item !== name);
                        return items.length > 0 ? `#super ${items.join(' ')}` : '';
                    }
                    return line;
                }).filter(line => line.trim() !== ''); // 空行を削除

                // 新しい構成をファイルに書き込む
                fs.writeFileSync(configPath, newLines.join('\n'));
            }
        });
        return { success: true, message: `Directory '${name}' deleted successfully.` };
    } else {
        throw new Error(`Error: Directory '${name}' does not exist.`);
    }
}



///////////
///////////
///////////
///////////

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
