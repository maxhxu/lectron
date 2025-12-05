import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { readFile } from 'fs/promises';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

async function readJsonFile(folderPath: string, fileName: string): Promise<any | null> {
    const fullPath = path.join(folderPath, fileName);

    try {
        // Reading file content as a string
        const data = await readFile(fullPath, { encoding: 'utf8' });
        const config = JSON.parse(data); 
        // TODO: actually implement JSON
        return config;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return null; 
        }
        throw error;
    }
}


function setupIpcHandlers() {
  ipcMain.handle('dialog:openFile', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openFile']
    });

    if (canceled) {
      return null;
    } else {
      return filePaths;
    }
  });

  ipcMain.handle('dialog:openFolder', async (event) => {
    const window = BrowserWindow.getFocusedWindow();
    
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'] 
    });

    if (canceled) {
      return null;
    } else {
      return filePaths;
    }
  });

  ipcMain.handle('readJsonFile', async (event, folderPath: string, fileName: string) => {
    console.log("trying to read file");
    try {
      return await readJsonFile(folderPath, fileName);
    } catch (error) {
      console.error('Error in main process reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // 1. Set up all IPC handlers
  setupIpcHandlers(); 
  
  // 2. Create the window
  createWindow(); 
});



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
