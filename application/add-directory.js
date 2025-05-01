document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('save-btn').addEventListener('click', async () => {
        const addDirName = document.getElementById('dirname-input').value;
        const addDirComposition = document.getElementById('composition-input').value;
        const addDirSuper = document.getElementById('super-input').value;
        const structure = {
            [addDirName]: {
                name: addDirName,
                composition: addDirComposition.split(',').map(item => item.trim()).filter(item => item !== ""),
                super: addDirSuper
            }
        };
        const result = await window.electronAPI.addDirectory(structure);
        alert(result.message); 
        if (result.success) { 
            window.electronAPI.closeAddDirectoryWindow();
            window.electronAPI.reloadMainWindow();            
        }
    });
});
