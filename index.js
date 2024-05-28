const { app, BrowserWindow, globalShortcut, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const path = require('path');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const createMenu = () => {
    const menu = Menu.getApplicationMenu();
    const viewMenu = menu.items.find(item => item.role === 'viewmenu');
    if (viewMenu) {
      const filteredItems = viewMenu.submenu.items;
      Menu.setApplicationMenu(Menu.buildFromTemplate(filteredItems));
    }
  };

  const createWindow = () => {
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1280,
      defaultHeight: 720,
    });

    const mainWindow = new BrowserWindow({
      ...mainWindowState,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        plugins: true,
      },
    });

    // Show the main window when it's ready
    mainWindow.once('ready-to-show', () => mainWindow.show());

    // Open external links in the user's default browser
    
    mainWindow.webContents.on('new-window', (event, navigationUrl) => {
      if (!navigationUrl.startsWith("https://blablalive.eu") && !navigationUrl.startsWith("https://www.blablalive.eu")) {
          event.preventDefault();
          shell.openExternal(navigationUrl);
        }
    });

    // Display context menu
    /*mainWindow.webContents.on('context-menu', (event, params) => {
      Menu.getApplicationMenu().popup(mainWindow, params.x, params.y);
    });*/

    // Load the URL into the main window
    mainWindow.loadURL('https://www.blablalive.eu');

    // Manage window state
    mainWindowState.manage(mainWindow);
  };

  const initializeFlashPlugin = () => {
    let pluginName;
    switch (process.platform) {
      case 'win32':
        pluginName = app.isPackaged ? 'pepflashplayer.dll' : 'win/x64/pepflashplayer.dll';
        break;
      case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin';
        break;
      default:
        pluginName = 'libpepflashplayer.so';
    }
    console.log(app.isPackaged + " : " + process.resourcesPath + " : " + __dirname);
    const resourcesPath = app.isPackaged ? process.resourcesPath : __dirname;

    if (['freebsd', 'linux', 'netbsd', 'openbsd'].includes(process.platform)) {
      app.commandLine.appendSwitch('no-sandbox');
    }

    app.commandLine.appendSwitch('ppapi-flash-path', path.join(resourcesPath, 'plugins', pluginName));
    app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');
  };

  app.on('second-instance', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  initializeFlashPlugin();

  app.whenReady().then(() => {
    createMenu();
    createWindow();
    autoUpdater.checkForUpdates();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    app.on('browser-window-focus', () => {
      if (process.platform !== 'darwin') {
        globalShortcut.register('Control+Shift+I', () => {
          //console.log('Le raccourci clavier "Ctrl+Shift+I" est bloqué.');
        });
      } else {
        // Bloquer le raccourci clavier "Cmd+Option+I" sur Mac
        globalShortcut.register('Cmd+Option+I', () => {
          //console.log('Le raccourci clavier "Cmd+Option+I" est bloqué.');
        });
      }
    })
    
    app.on('browser-window-blur', () => {
      globalShortcut.unregisterAll();
    })

  });
}
