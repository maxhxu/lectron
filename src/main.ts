import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { readFile } from 'fs/promises';
import { LectureMetadata } from "./LectureMetadata";

let currentProjectPath = '';

/**
 * Escapes latex text
 * @param text Text to be escaped
 * @returns escapedText LaTeX that has been escaped
 */
const escapeLatex = (text: string): string => {
  if (!text) {
    return '';
  }

  // backslash
  let escapedText = text.replace(/\\/g, '\\textbackslash{}'); 
  
  escapedText = escapedText
    .replace(/{/g, '\\{') // braces
    .replace(/}/g, '\\}')
    .replace(/%/g, '\\%') // command termination
    .replace(/\$/g, '\\$') // mathmode
    .replace(/&/g, '\\&') // table alignment
    .replace(/#/g, '\\#') // command args
    .replace(/\^/g, '\\^{}') // superscript
    .replace(/_/g, '\\_') // subscript
    .replace(/~/g, '\\textasciitilde{}'); // unbreakable space

  return escapedText;
};

/**
 * Sanitizes a package name
 */
const sanitizeLatexPackage = (input: string): string => {
    if (!input) return '';
    // Only allow alphanumeric characters, hyphens, and periods
    return input.replace(/[^a-zA-Z0-9.\\-]/g, '');
}

/**
 * Sanitizes a file path component
 * Prevent directory traversal or command injection
 */
function sanitizeLatexPathSegment(input: string): string {
    if (!input) return '';
    // Prohibit '/', '\', '..'
    return input.replace(/[^a-zA-Z0-9_\-. ]/g, '');
}
function generateMainFileContent(content: LectureMetadata): string | null {
  if (!content || !content.title || !content.author || !content.packages || !content.mainfile || !content.directory || !Array.isArray(content.files)) {
    return null;
  }

  const safeTitle: string = escapeLatex(content.title);
  const safeAuthor: string = escapeLatex(content.author);
  
  const safePackages: string[] = content.packages.map(pkg => sanitizeLatexPackage(pkg));
  const safeDirectory: string = sanitizeLatexPathSegment(content.directory);

  const inputCommands: string = content.files
    .filter(filePair => Array.isArray(filePair) && filePair[0].length > 0)
    .map(([filename, label]) => {
      const safeFile = sanitizeLatexPathSegment(filename);
      const safeLabel = escapeLatex(label);
      
      return `\\section{${safeLabel}}\n\\input{${safeDirectory}/${safeFile}} \\newpage`;
    })
    .join('\n');

  const usepackageCommands: string = safePackages
    .filter(pkg => pkg.length > 0)
    .map(pkg => `\\usepackage{${pkg}}`)
    .join('\n');
  
  const latexContent = `\\documentclass[11pt]{article}
${usepackageCommands}

\\newcommand{\\documenttitle}{${safeTitle}}
\\newcommand{\\authorname}{${safeAuthor}}

\\begin{document}

\\title{\\documenttitle}
\\author{\\authorname}
\\maketitle

\\tableofcontents
\\newpage

${inputCommands}

\\end{document}`;

  return latexContent;
}

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
        return config;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return null; 
        }
        throw error;
    }
}


function setupIpcHandlers() {
  ipcMain.handle('setProjectDirectory', async(event, newPath: string) => {
    currentProjectPath = newPath;
  })

  ipcMain.handle('getProjectDirectory', async(event) => {
    return currentProjectPath;
  })

  // Add this inside your setupIpcHandlers() function in main.ts

  ipcMain.handle('initNewProject', async (event, metadata: LectureMetadata, folderPath: string) => {
    try {
      if (!folderPath) throw new Error("Target folder path is empty.");

      const fileContent = generateMainFileContent(metadata);
      if (!fileContent) {
        throw new Error("Invalid metadata: Failed to generate LaTeX content.");
      }

      const texFilePath = path.join(folderPath, metadata.mainfile);
      await fs.writeFile(texFilePath, fileContent, 'utf8');

      const jsonFilePath = path.join(folderPath, 'projectconfig.json');
      await fs.writeFile(jsonFilePath, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`Initialized new project at: ${folderPath}`);
      return {
        success: true,
        filePath: texFilePath
      };
    } catch (error) {
      console.error("Error in Main Process while initializing new project:", error);
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  });

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

  ipcMain.handle('file:readJsonFile', async (event, folderPath: string, fileName: string) => {
    console.log(`Trying to read file in dir:${folderPath} with name: ${fileName}`);
    try {
      return await readJsonFile(folderPath, fileName);
    } catch (error) {
      console.error('Error in main process reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  ipcMain.handle('generateAndWriteMainFile', async (event, metadata: LectureMetadata, folderPath: string) => {
    try {
      if (!folderPath) {
        throw new Error("Target folder path is empty.");
      }
      
      const fileContent = generateMainFileContent(metadata);

      if (!fileContent) {
        throw new Error("Failed to generate LaTeX content.");
      }

      // Construct full file path
      const baseFolder = path.normalize(folderPath);
      const filePath = path.join(folderPath, metadata.mainfile);
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(baseFolder)) {
        throw new Error("Unexpected mainfile path");
      }

      // Write the file
      await fs.writeFile(filePath, fileContent, 'utf8');

      const jsonFilePath = path.join(folderPath, 'projectconfig.json');
      await fs.writeFile(jsonFilePath, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`Successfully wrote main file: ${filePath}`);
      return {
        success: true,
        filePath: filePath
      };

    } catch (error) {
      console.error("Error in Main Process while generating/writing file:", error);
      return { 
        success: false, 
        error: `File write failed: ${(error as Error).message}` 
      };
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
