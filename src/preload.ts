// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { LectureMetadata } from './LectureMetadata';
import * as path from 'path';

contextBridge.exposeInMainWorld('electronAPI', {
  setProjectDirectory: (newPath: string) => ipcRenderer.invoke("setProjectDirectory", newPath),
  getProjectDirectory: () => ipcRenderer.invoke("getProjectDirectory") as Promise<string>,
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readJsonFile: (folderPath: string, fileName: string) => 
        ipcRenderer.invoke('file:readJsonFile', folderPath, fileName),
  generateAndWriteMainFile: (metadata: LectureMetadata, folderPath: string) => 
        ipcRenderer.invoke('generateAndWriteMainFile', metadata, folderPath)
        
  // ipcRenderer.invoke() is used to call the ipcMain.handle() function
});

