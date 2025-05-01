const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node, 
    chrome: () => process.versions.chrome, 
    electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('electronAPI', {
    saveSetting: (key, value) => ipcRenderer.invoke('save-settings', key, value),
    getSetting: (key) => ipcRenderer.invoke('get-settings', key),
    createSettingWindow: () => ipcRenderer.invoke('create-setting-window'),
    closeSettingWindow: () => ipcRenderer.invoke('close-setting-window'),
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    onUpdatePath: (callback) => ipcRenderer.on('update-setting', (event, key, value) => callback(key, value)),
    addDirectory: (structure) => ipcRenderer.invoke('add-directory',structure),
    createAddDirectoryWindow: () => ipcRenderer.invoke('create-add-directory-window'),
    closeAddDirectoryWindow: () => ipcRenderer.invoke('close-add-directory-window'),
    basename: (fullpath) => path.basename(fullpath),
    getDirectoryStructure: () => ipcRenderer.invoke('get-directory-structure'),
    showContextMenu: (data) => ipcRenderer.send("show-context-menu", data),
    onMenuItemClicked: (callback) => ipcRenderer.on("menu-item-clicked", (event, action) => callback(action)),
    receiveEditParams: (callback) => ipcRenderer.on("edit-params", (event, params) => callback(params)),
    editDirectory: (structure) => ipcRenderer.invoke('edit-directory', structure),
    reloadEditWindow: () => ipcRenderer.invoke('reload-edit-window'),
    reloadMainWindow: () => ipcRenderer.invoke('reload-main-window'),
    deleteDirectory: (name) => ipcRenderer.invoke('delete-directory', name),
    closeEditWindow: () => ipcRenderer.invoke('close-edit-window'),
});

