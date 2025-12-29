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
import Sortable from 'sortablejs';

import { handleOpenFolderWorkflow, handleUpdateWorkflow, handleNewFolderWorkflow } from './workflow';
import { LectureMetadata } from './LectureMetadata';

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);

document.addEventListener('DOMContentLoaded', () => {
  const newFolderButton = document.getElementById('newFolderButton'); // TODO
  const openFolderButton = document.getElementById('openFolderButton');
  const pathDisplay = document.getElementById('filePathDisplay');
  const formContainer = document.getElementById('metadataForm');
  const saveButton = document.getElementById('saveButton');
  
  // Containers and Buttons
  const fileListContainer = document.getElementById('fileListContainer') as HTMLDivElement;
  const addFileButton = document.getElementById('addFileButton');
  const packageListContainer = document.getElementById('packageListContainer') as HTMLDivElement;
  const addPackageButton = document.getElementById('addPackageButton');


  new Sortable(fileListContainer, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost'
  });

  new Sortable(packageListContainer, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost'
  });

  /**
   * Helper to create a generic row (used for both files and packages)
   */
  const createRow = (container: HTMLDivElement, value: string | [string, string] = '', inputClass: string) => {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '8px';

    let inputsHtml = '';
    
    if (inputClass === 'file-input') {
      // Handle the [filename, label] pair
      const [filename, label] = Array.isArray(value) ? value : [value, ''];
      inputsHtml = `
        <input type="text" class="file-name-input" placeholder="filename.tex" value="${filename}" style="flex: 2;">
        <input type="text" class="file-label-input" placeholder="Display Label" value="${label}" style="flex: 3;">
      `;
    } else {
      // Handle standard packages (single string)
      inputsHtml = `<input type="text" class="${inputClass}" value="${value}" style="flex: 1;">`;
    }

    row.innerHTML = `
      <span class="drag-handle" style="cursor:grab;">⠿</span>
      ${inputsHtml}
      <button type="button" class="remove-btn" style="padding: 0 8px;">×</button>
    `;

    row.querySelector('.remove-btn')?.addEventListener('click', () => row.remove());
    container.appendChild(row);
  };

  addFileButton?.addEventListener('click', () => createRow(fileListContainer, '', 'file-input'));
  addPackageButton?.addEventListener('click', () => createRow(packageListContainer, '', 'package-input'));

  newFolderButton?.addEventListener('click', async () => {
    const result = await handleNewFolderWorkflow(window.electronAPI);
    
    if (pathDisplay) pathDisplay.innerText = result.message;

    if (result.success && result.data) {
      formContainer.style.display = 'block';

      (document.getElementById('inputTitle') as HTMLInputElement).value = '';
      (document.getElementById('inputAuthor') as HTMLInputElement).value = '';
      (document.getElementById('inputMainFile') as HTMLInputElement).value = 'main.tex';
      (document.getElementById('inputDirectory') as HTMLInputElement).value = '';


      fileListContainer.innerHTML = '';
      packageListContainer.innerHTML = '';
      
      createRow(fileListContainer, ['', ''], 'file-input');
    }
  });
  
  openFolderButton?.addEventListener('click', async () => {
    const result = await handleOpenFolderWorkflow(window.electronAPI);
    
    if (pathDisplay) pathDisplay.innerText = result.message;
    
    if (result.success && result.data) {
      formContainer.style.display = 'block';

      (document.getElementById('inputTitle') as HTMLInputElement).value = result.data.title || '';
      (document.getElementById('inputAuthor') as HTMLInputElement).value = result.data.author || '';
      (document.getElementById('inputMainFile') as HTMLInputElement).value = result.data.mainfile || '';
      (document.getElementById('inputDirectory') as HTMLInputElement).value = result.data.directory || '';

      // populate lists
      fileListContainer.innerHTML = '';
      if (result.data.files) {
        // result.data.files is now expected to be [string, string][]
        result.data.files.forEach((filePair: [string, string]) => 
          createRow(fileListContainer, filePair, 'file-input')
        );
      }

      packageListContainer.innerHTML = '';
      if (result.data.packages) {
        result.data.packages.forEach((pkg: string) => 
          createRow(packageListContainer, pkg, 'package-input')
        );
      }
    } else {
      formContainer.style.setProperty('display', 'none', 'important');
    }
  });

  saveButton.addEventListener('click', async () => {
    const btn = saveButton as HTMLButtonElement;
    
    btn.disabled = true; 
    btn.innerText = "Saving...";

    try {
      const metadata: LectureMetadata = {
        title: (document.getElementById('inputTitle') as HTMLInputElement).value,
        author: (document.getElementById('inputAuthor') as HTMLInputElement).value,
        mainfile: (document.getElementById('inputMainFile') as HTMLInputElement).value,
        directory: (document.getElementById('inputDirectory') as HTMLInputElement).value,
        packages: Array.from(packageListContainer.querySelectorAll('.package-input'))
          .map(i => (i as HTMLInputElement).value).filter(v => v.trim() !== ''), 
        files: Array.from(fileListContainer.querySelectorAll('.list-row')).map(row => {
          const name = (row.querySelector('.file-name-input') as HTMLInputElement).value;
          const label = (row.querySelector('.file-label-input') as HTMLInputElement).value;
          return [name, label] as [string, string];
        }).filter(([name]) => name.trim() !== '')
      };
      
      const result = await handleUpdateWorkflow(window.electronAPI, metadata);
      if (result.success) {
        pathDisplay.innerText = "Successfully updated config.";
      } else {
        pathDisplay.innerText = "Error: ${result.message}";
      }
    } catch (err) {
      console.error(err);
    } finally {
      // This ensures the button is ALWAYS re-enabled
      btn.disabled = false;
      btn.innerText = "Save All Changes";
    }
  });

});

