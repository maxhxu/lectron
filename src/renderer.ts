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
import { handleOpenFolderWorkflow, handleUpdateWorkflow } from './workflow';

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);

document.addEventListener('DOMContentLoaded', () => {
  const openFileButton = document.getElementById('openFileButton');
  const openFolderButton = document.getElementById('openFolderButton');
  const pathDisplay = document.getElementById('filePathDisplay');
  const formContainer = document.getElementById('metadataForm');
  const saveButton = document.getElementById('saveButton');

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
    const result = await handleOpenFolderWorkflow(window.electronAPI);
    
    if (pathDisplay) {
      pathDisplay.innerText = result.message; 
    }
    
    if (result.success && result.message) {
      console.log(result.message);
      // alert(result.message);

      formContainer.style.display = 'block';

      (document.getElementById('inputTitle') as HTMLInputElement).value = result.data.title;
      (document.getElementById('inputAuthor') as HTMLInputElement).value = result.data.author;
      (document.getElementById('inputMainFile') as HTMLInputElement).value = result.data.mainfile;
      (document.getElementById('inputDirectory') as HTMLInputElement).value = result.data.directory;
    } else {
      console.error(result.message);
      if (result.message.includes('cancelled')) {
          // Not an error, just cancellation
      } else {
        alert(`Error: ${result.message}`);
      }
    }
  });

  saveButton.addEventListener('click', async () => {
    const titleEl = document.getElementById('inputTitle') as HTMLInputElement;
    const authorEl = document.getElementById('inputAuthor') as HTMLInputElement;
    const mainFileEl = document.getElementById('inputMainFile') as HTMLInputElement;
    const directoryEl = document.getElementById('inputDirectory') as HTMLInputElement;

    const metadata: LectureMetadata = {
      title: titleEl.value,
      author: authorEl.value,
      mainfile: mainFileEl.value,
      directory: directoryEl.value,
      // TODO: empty arrays for now
      packages: [], 
      files: []
    };

    const result = await handleUpdateWorkflow(window.electronAPI, metadata);

    if (result.success && result.message) {
      console.log(result.message);
      // alert(result.message);
      pathDisplay.innerText = "Successfully updated config.";

    } else {
      console.error(result.message);
      if (result.message.includes('cancelled')) {
          // Not an error, just cancellation
      } else {
        alert(`Error: ${result.message}`);
      }
    }
  });

});

