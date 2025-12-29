import { electron } from "node:process";
import { LectureMetadata } from "./LectureMetadata";

type ElectronAPI = Window['electronAPI']; // TODO: this is cursed

export async function handleNewFolderWorkflow(electronAPI: any): Promise<{ success: boolean; message: string; data?: LectureMetadata }> {
    try {
        const selectedPaths = await electronAPI.openFolder();

        if (!selectedPaths || selectedPaths.length === 0) {
            return { success: false, message: 'Folder selection cancelled.' };
        }

        const folderPath = selectedPaths[0];

        const newMetadata: LectureMetadata = {
            title: 'New Lecture',
            author: 'Author Name',
            mainfile: 'main.tex',
            directory: 'sections',
            packages: ['amsmath', 'amssymb', 'graphicx'],
            files: []
        };
        
        // call handler
        const result = await electronAPI.initNewProject(newMetadata, folderPath);

        if (result.success) {
            await electronAPI.setProjectDirectory(folderPath);
            return { 
                success: true, 
                message: `Project created successfully!`, 
                data: newMetadata 
            };
        } else {
            return { success: false, message: `Failed to create project: ${result.error}` };
        }
    } catch (error) {
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function handleOpenFolderWorkflow(electronAPI : ElectronAPI): Promise<{ success: boolean; message: string; folderPath?: string; data?: LectureMetadata }> {
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
          electronAPI.setProjectDirectory(folderPath);
            return { success: true, message: `Success! Main file created at: ${result.filePath}`, folderPath: folderPath, data: fileContent};
        } else {
            return { success: false, message: `Failed to create file: ${result.error}` };
        }
    } catch (error) {
        console.error('Workflow error:', error);
        return { success: false, message: 'An unknown error occurred during the workflow.' };
    }
}

export async function handleUpdateWorkflow(electronAPI : ElectronAPI, metadata : LectureMetadata): Promise<{ success: boolean; message: string; data?: LectureMetadata }> {
    try {
        const folderPath = await (electronAPI.getProjectDirectory() as Promise<string>);
        const fileName = 'projectconfig.json';
        const fileContent = await electronAPI.readJsonFile(folderPath, fileName);

        if (!fileContent) {
            return { success: false, message: `Incorrect JSON format, or ${fileName} not found in the selected folder.` };
        }

        const result = await electronAPI.generateAndWriteMainFile(metadata, folderPath);

        if (result.success) {
            return { success: true, message: `Success! Main file created at: ${result.filePath}`, data: fileContent};
        } else {
            return { success: false, message: `Failed to create file: ${result.error}` };
        }
    } catch (error) {
        console.error('Workflow error:', error);
        return { success: false, message: 'An unknown error occurred during the workflow.' };
    }
}