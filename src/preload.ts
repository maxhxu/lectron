// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import * as path from 'path';

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readJsonFile: (folderPath: string, fileName: string) => 
        ipcRenderer.invoke('readJsonFile', folderPath, fileName)
  // ipcRenderer.invoke() is used to call the ipcMain.handle() function
});