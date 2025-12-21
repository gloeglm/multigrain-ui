import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Create a new project folder
 */
export function registerProjectOperationsHandlers(): void {
  /**
   * Create a new project folder with the given number
   */
  ipcMain.handle(
    'project:create',
    async (_event, rootPath: string, projectNumber: number, customName?: string) => {
      try {
        // Validate project number (1-48)
        if (projectNumber < 1 || projectNumber > 48) {
          return {
            success: false,
            error: `Invalid project number: ${projectNumber}. Must be between 1 and 48.`,
          };
        }

        // Format project folder name (e.g., Project01, Project02, ..., Project48)
        const projectName = `Project${String(projectNumber).padStart(2, '0')}`;
        const projectPath = path.join(rootPath, projectName);

        // Check if project already exists
        try {
          await fs.access(projectPath);
          return {
            success: false,
            error: `Project ${projectName} already exists.`,
          };
        } catch {
          // Project doesn't exist, which is what we want
        }

        // Create the project folder
        await fs.mkdir(projectPath, { recursive: true });

        // If custom name is provided, create metadata file
        if (customName && customName.trim()) {
          const metadataPath = path.join(projectPath, '.project-metadata.json');
          const metadata = {
            customName: customName.trim(),
          };
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        }

        return {
          success: true,
          projectPath,
          projectName,
        };
      } catch (error) {
        console.error('Error creating project:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
