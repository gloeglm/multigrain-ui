import { registerFileSystemHandlers } from './fileSystem';
import { registerDriveHandlers } from './drives';
import { registerMultigrainHandlers } from './multigrain';
import { registerAudioHandlers } from './audio';
import { registerProjectMetadataHandlers } from './projectMetadata';
import { setupPresetHandlers } from './preset';

export function registerAllHandlers(): void {
  registerFileSystemHandlers();
  registerDriveHandlers();
  registerMultigrainHandlers();
  registerAudioHandlers();
  registerProjectMetadataHandlers();
  setupPresetHandlers();
}
