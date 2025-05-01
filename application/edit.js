
document.addEventListener('DOMContentLoaded', async () => {
    window.electronAPI.receiveEditParams(async (params) => {
        document.getElementById('edit-dir-id').textContent = 'Edit directory: ' + params.nodeId;
        document.getElementById('block-dlt-btn').textContent = 'Delete ' + params.nodeId;
        let structure = await window.electronAPI.getDirectoryStructure()    
        let compositions = structure[params.nodeId].composition
        let super_dir = structure[params.nodeId].super        
        
        document.getElementById('composition-dirs').innerHTML = compositions.map(composition => {                
            return `<li>${composition}</li>`;
        }).join('');        
        document.getElementById('super-dir').textContent = 'Super: ' + super_dir;

        document.getElementById('add-composition-btn').addEventListener('click', async () => {            
            const add_compositions = document.getElementById('composition-input')
                                            .value.split(',').map(item => item.trim())
                                            .filter(item => item !== "" && !compositions.includes(item));
            console.log(add_compositions)
            compositions.push(...add_compositions)
            const edited_structure = {
                name: params.nodeId,
                composition: compositions,                    
                super: super_dir
            };
            console.log(edited_structure)
            const result = await window.electronAPI.editDirectory(edited_structure);
            alert(result.message); 
            if (result.success) { 
                window.electronAPI.reloadEditWindow();
                window.electronAPI.reloadMainWindow();
            }
        });

        document.getElementById('delete-composition-btn').addEventListener('click', async () => {
            const composition = document.getElementById('composition-input').value;
            const edited_structure = {
                name: params.nodeId,
                composition: compositions.filter(item => item !== composition),                    
                super: super_dir
            };
            const result = await window.electronAPI.editDirectory(edited_structure);
            alert(result.message); 
            if (result.success) { 
                window.electronAPI.reloadEditWindow();
                window.electronAPI.reloadMainWindow();
            }
        });

        document.getElementById('change-super-btn').addEventListener('click', async () => {
            const super_id = document.getElementById('super-input').value;
            const edited_structure = {
                name: params.nodeId,
                composition: compositions,                    
                super: super_id
            };
            const result = await window.electronAPI.editDirectory(edited_structure);
            alert(result.message); 
            if (result.success) { 
                window.electronAPI.reloadEditWindow();
                window.electronAPI.reloadMainWindow();
            }
        });

        document.getElementById('delete-super-btn').addEventListener('click', async () => {
            const edited_structure = {
                name: params.nodeId,
                composition: compositions,                    
                super: null
            };
            const result = await window.electronAPI.editDirectory(edited_structure);
            alert(result.message); 
            if (result.success) { 
                window.electronAPI.reloadEditWindow();
                window.electronAPI.reloadMainWindow();
            }
        });

        document.getElementById('block-dlt-btn').addEventListener('click', async () => {
            console.log('block-dlt-btn')
            // 削除確認ダイアログを表示
            const userConfirmed = window.confirm(
                'Are you sure you want to delete this directory? Executing this will remove the .config file and the directory will no longer be managed, but the directory itself will not be deleted.'
            );
            if (userConfirmed) {
                const result = await window.electronAPI.deleteDirectory(params.nodeId);
                alert(result.message); 
                if (result.success) { 
                    window.electronAPI.reloadMainWindow();
                    window.electronAPI.closeEditWindow();
                }
            }
        });
    });
});
