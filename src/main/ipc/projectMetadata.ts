import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const METADATA_FILENAME = '.project-metadata.json';

interface ProjectMetadata {
  customName?: string;
}

export function registerProjectMetadataHandlers(): void {
  // Read project metadata
  ipcMain.handle('project:readMetadata', async (_event, projectPath: string) => {
    try {
      const metadataPath = path.join(projectPath, METADATA_FILENAME);
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata: ProjectMetadata = JSON.parse(data);
      return {
        customName: metadata.customName || '',
      };
    } catch {
      // File doesn't exist or is invalid - return defaults
      return {
        customName: '',
      };
    }
  });

  // Write project metadata
  ipcMain.handle(
    'project:writeMetadata',
    async (_event, projectPath: string, customName: string) => {
      try {
        const metadataPath = path.join(projectPath, METADATA_FILENAME);

        // If customName is empty, delete the metadata file if it exists
        if (!customName || customName.trim() === '') {
          try {
            await fs.unlink(metadataPath);
          } catch {
            // File doesn't exist, that's fine
          }
          return { success: true };
        }

        // Only create the file if there's a custom name
        const metadata: ProjectMetadata = {
          customName: customName.trim(),
        };
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        return { success: true };
      } catch (error) {
        console.error('Error writing project metadata:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Batch write project metadata
  ipcMain.handle(
    'project:batchWriteMetadata',
    async (_event, updates: Array<{ projectPath: string; customName: string }>) => {
      try {
        const results = await Promise.all(
          updates.map(async ({ projectPath, customName }) => {
            try {
              const metadataPath = path.join(projectPath, METADATA_FILENAME);

              // If customName is empty, delete the metadata file if it exists
              if (!customName || customName.trim() === '') {
                try {
                  await fs.unlink(metadataPath);
                } catch {
                  // File doesn't exist, that's fine
                }
                return { projectPath, success: true };
              }

              // Only create the file if there's a custom name
              const metadata: ProjectMetadata = {
                customName: customName.trim(),
              };
              await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
              return { projectPath, success: true };
            } catch (error) {
              return {
                projectPath,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );

        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
          return {
            success: false,
            error: `Failed to update ${failures.length} project(s)`,
            failures,
          };
        }

        return { success: true, count: results.length };
      } catch (error) {
        console.error('Error batch writing project metadata:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
