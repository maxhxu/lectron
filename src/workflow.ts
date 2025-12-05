type ElectronAPI = Window['electronAPI']; // TODO: this is cursed

export async function handleOpenFolderWorkflow(electronAPI : ElectronAPI): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
        const selectedPaths = await electronAPI.openFolder();

        if (!selectedPaths || selectedPaths.length === 0) {
            return { success: false, message: 'Folder selection cancelled.' };
        }

        const folderPath = selectedPaths[0];
        const fileName = 'projectconfig.json';
        const fileContent = await electronAPI.readJsonFile(folderPath, fileName);

        if (!fileContent) {
            return { success: false, message: `Incorrect JSON format, or ${fileName} not found in the selected folder.` };
        }

        const result = await electronAPI.generateAndWriteMainFile(fileContent, folderPath);

        if (result.success) {
            return { success: true, message: `Success! Main file created at: ${result.filePath}`, filePath: result.filePath };
        } else {
            return { success: false, message: `Failed to create file: ${result.error}` };
        }
    } catch (error) {
        console.error('Workflow error:', error);
        return { success: false, message: 'An unknown error occurred during the workflow.' };
    }
}