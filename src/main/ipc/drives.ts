import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export function registerDriveHandlers(): void {
  ipcMain.handle('drives:list', async () => {
    // Platform-specific drive detection
    if (process.platform === 'win32') {
      return await listWindowsDrives();
    } else if (process.platform === 'darwin') {
      return await listMacDrives();
    } else {
      return await listLinuxDrives();
    }
  });
}

async function listWindowsDrives(): Promise<string[]> {
  const drives: string[] = [];
  // Check common drive letters
  const letters = 'DEFGHIJKLMNOPQRSTUVWXYZ';
  for (const letter of letters) {
    const drivePath = `${letter}:\\`;
    try {
      await fs.access(drivePath);
      drives.push(drivePath);
    } catch {
      // Drive doesn't exist
    }
  }
  return drives;
}

async function listMacDrives(): Promise<string[]> {
  const volumesPath = '/Volumes';
  try {
    const entries = await fs.readdir(volumesPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(volumesPath, entry.name));
  } catch {
    return [];
  }
}

async function listLinuxDrives(): Promise<string[]> {
  const drives: string[] = [];

  // Check /media/username for mounted drives
  const mediaPath = '/media';
  try {
    const users = await fs.readdir(mediaPath, { withFileTypes: true });
    for (const user of users) {
      if (user.isDirectory()) {
        const userMediaPath = path.join(mediaPath, user.name);
        const mounts = await fs.readdir(userMediaPath, { withFileTypes: true });
        for (const mount of mounts) {
          if (mount.isDirectory()) {
            drives.push(path.join(userMediaPath, mount.name));
          }
        }
      }
    }
  } catch {
    // /media doesn't exist or no access
  }

  // Also check /mnt
  const mntPath = '/mnt';
  try {
    const mounts = await fs.readdir(mntPath, { withFileTypes: true });
    for (const mount of mounts) {
      if (mount.isDirectory()) {
        drives.push(path.join(mntPath, mount.name));
      }
    }
  } catch {
    // /mnt doesn't exist or no access
  }

  return drives;
}
