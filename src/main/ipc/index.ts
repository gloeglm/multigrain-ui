import { registerFileSystemHandlers } from './fileSystem';
import { registerDriveHandlers } from './drives';
import { registerMultigrainHandlers } from './multigrain';
import { registerAudioHandlers } from './audio';
import { registerProjectMetadataHandlers } from './projectMetadata';
import { setupPresetHandlers } from './preset';
import { registerAudioImportHandlers } from './audioImport';
import { registerProjectOperationsHandlers } from './projectOperations';
import { registerFileOperationsHandlers } from './fileOperations';
import { registerPdfExportHandlers } from './pdfExport';

export function registerAllHandlers(): void {
  registerFileSystemHandlers();
  registerDriveHandlers();
  registerMultigrainHandlers();
  registerAudioHandlers();
  registerProjectMetadataHandlers();
  setupPresetHandlers();
  registerAudioImportHandlers();
  registerProjectOperationsHandlers();
  registerFileOperationsHandlers();
  registerPdfExportHandlers();
}
