import { app, BrowserWindow, session, screen } from 'electron';
import { registerAllHandlers } from './ipc';
import Store from 'electron-store';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Store for persisting window state
const store = new Store();

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createWindow = (): void => {
  // Get stored window bounds or use defaults
  const defaultBounds = {
    width: 1200,
    height: 800,
  };

  const storedBounds = store.get('windowBounds') as WindowBounds | undefined;

  // Validate that the stored position is still within display bounds
  let bounds = { ...defaultBounds, ...storedBounds };

  if (storedBounds) {
    const displays = screen.getAllDisplays();
    const isValidPosition = displays.some(display => {
      const area = display.workArea;
      return (
        storedBounds.x >= area.x &&
        storedBounds.y >= area.y &&
        storedBounds.x + storedBounds.width <= area.x + area.width &&
        storedBounds.y + storedBounds.height <= area.y + area.height
      );
    });

    // If stored position is off-screen, reset to defaults
    if (!isValidPosition) {
      bounds = defaultBounds;
    }
  }

  const mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Save window bounds when they change
  const saveBounds = () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  };

  // Save bounds on move and resize
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  // Set CSP to allow blob URLs for audio playback
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: blob:; " +
          "script-src 'self' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' ws://localhost:* blob:; " +
          "media-src 'self' blob: data:"
        ]
      }
    });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  registerAllHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
