import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script: the ONLY bridge between renderer and main process.
 * Expose the minimal, explicit surface the UI needs — never `ipcRenderer`
 * itself, and never a generic "invoke anything" passthrough.
 */
contextBridge.exposeInMainWorld('desktopApi', {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  onUpdateAvailable: (callback: () => void): void => {
    ipcRenderer.on('update:available', callback);
  },
});
