document.addEventListener('DOMContentLoaded', async () => {
    const pathInput = document.getElementById('path-input');
    const path = await window.electronAPI.getSetting('path');
    pathInput.placeholder = path || 'Please enter the path of your project directory';

    document.getElementById('save-btn').addEventListener('click', async () => {
        const key = 'path'
        const value = document.getElementById("path-input").value;
        await window.electronAPI.saveSetting(key, value)
        alert('Setting saved!');
        window.electronAPI.closeSettingWindow();
    });

    document.getElementById('browse-btn').addEventListener('click', async () => {
        const selectedPath = await window.electronAPI.openDirectoryDialog();
        if (selectedPath) {
            document.getElementById('path-input').value = selectedPath;
        }
    });
});