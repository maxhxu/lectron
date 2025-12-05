/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { LectureMetadata } from './interfaces/LectureMetadata';

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string[] | null>;
      openFolder: () => Promise<string[] | null>;
      readJsonFile: (folderPath: string, fileName: string) => Promise<any | null>;
      generateAndWriteMainFile: (metadata: LectureMetadata, folderPath: string) => Promise<{ success: boolean, filePath?: string, error?: string }>;
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const openFileButton = document.getElementById('openFileButton');
  const openFolderButton = document.getElementById('openFolderButton');
  const pathDisplay = document.getElementById('filePathDisplay');

  openFileButton?.addEventListener('click', async () => {
    try {
      // Call exposed function
      const paths = await window.electronAPI.openFile();
      
      if (paths && paths.length > 0) {
        if (pathDisplay) {
          pathDisplay.innerText = paths.join(', ');
        }
        console.log('Selected file(s):', paths);
      } else {
        if (pathDisplay) {
          pathDisplay.innerText = 'Dialog cancelled.';
        }
        console.log('File selection cancelled.');
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
      if (pathDisplay) {
        pathDisplay.innerText = 'Error: Check console.';
      }
    }
  });

  openFolderButton?.addEventListener('click', async () => {
    try {
      // Call exposed function
      const selectedPaths = await window.electronAPI.openFolder();

      if (selectedPaths && selectedPaths.length > 0) {
        const folderPath = selectedPaths[0];
        console.log('Selected Folder:', folderPath);
        if (pathDisplay) {
          pathDisplay.innerText = folderPath + " selected";
        }
        const fileName = 'projectconfig.json';
        
        // Call exposed function
        const fileContent = await window.electronAPI.readJsonFile(folderPath, fileName);

        if (fileContent) {
          console.log(`Found and read ${fileName}:`, fileContent);

          // Found such a file proceed with further processing

          console.log(fileContent);
          console.log(fileName);
          console.log(folderPath);

          try {
            // Call exposed function
            const result = await window.electronAPI.generateAndWriteMainFile(fileContent, folderPath);

            if (result.success) {
                console.log(`Success! Main file created at: ${result.filePath}`);
                alert(`File successfully created: ${result.filePath}`);
            } else {
                console.error(`Failed to create file: ${result.error}`);
                alert(`Error creating file: ${result.error}`);
            }
          } catch (error) {
            console.error("IPC call failed:", error);
            alert("An unknown error occurred during file creation.");
          }

        } else {
          console.log(`Incorrect JSON format, or ${fileName} not found in the selected folder.`);
        }
      } else {
        if (pathDisplay) {
          pathDisplay.innerText = 'Dialog cancelled.';
        }
        console.log('Folder selection cancelled.');
      }
    } catch (error) {
      console.error('Error opening folder dialog:', error);
      if (pathDisplay) {
        pathDisplay.innerText = 'Error: Check console.';
      }
    }
  });

});

