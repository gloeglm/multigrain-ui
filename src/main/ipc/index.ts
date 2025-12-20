import { registerFileSystemHandlers } from './fileSystem';
import { registerDriveHandlers } from './drives';

export function registerAllHandlers(): void {
  registerFileSystemHandlers();
  registerDriveHandlers();
}
