import { registerFileSystemHandlers } from './fileSystem';
import { registerDriveHandlers } from './drives';
import { registerMultigrainHandlers } from './multigrain';

export function registerAllHandlers(): void {
  registerFileSystemHandlers();
  registerDriveHandlers();
  registerMultigrainHandlers();
}
