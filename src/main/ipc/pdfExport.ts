/**
 * IPC Handlers for PDF Export Operations
 * Handles overview sheets, project sheets, and batch exports
 */

import { ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { MultigainStructure, Project } from '@shared/types';
import { aggregateOverviewData, aggregateProjectData } from '../utils/exportDataAggregator';
import { generateOverviewSheet, generateProjectSheet } from '../utils/pdfGenerator';

/**
 * Sanitize filename by replacing invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\:*?"<>|]/g, '_');
}

export function registerPdfExportHandlers(): void {
  /**
   * Export overview sheet - opens in system browser
   */
  ipcMain.handle('pdf:exportOverview', async (_event, structure: MultigainStructure) => {
    try {
      // Aggregate data
      const data = await aggregateOverviewData(structure);

      // Generate PDF to buffer
      const pdfBuffer = await generateOverviewSheet(data);

      // Write to temp file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `Multigrain_Overview_${Date.now()}.pdf`);
      await fs.writeFile(tempFile, pdfBuffer);

      // Open in system's default application (browser)
      await shell.openPath(tempFile);

      return {
        success: true,
        tempFilePath: tempFile,
        suggestedFilename: 'Multigrain_Overview.pdf',
      };
    } catch (error) {
      console.error('Error exporting overview sheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Export single project sheet - opens in system browser
   */
  ipcMain.handle(
    'pdf:exportProject',
    async (_event, project: Project, structure: MultigainStructure) => {
      try {
        const displayName = project.customName || project.name;
        const suggestedFilename = sanitizeFilename(`${displayName}_Reference.pdf`);

        // Aggregate data
        const data = await aggregateProjectData(project, structure);

        // Generate PDF to buffer
        const pdfBuffer = await generateProjectSheet(data);

        // Write to temp file with descriptive name
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, suggestedFilename);
        await fs.writeFile(tempFile, pdfBuffer);

        // Open in system's default application (browser)
        await shell.openPath(tempFile);

        return {
          success: true,
          tempFilePath: tempFile,
          suggestedFilename,
        };
      } catch (error) {
        console.error('Error exporting project sheet:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  /**
   * Export all project sheets - batch export to a folder
   */
  ipcMain.handle('pdf:exportAllProjects', async (_event, structure: MultigainStructure) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Folder for Project Sheets',
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const outputDir = result.filePaths[0];
      const results: Array<{ project: string; success: boolean; error?: string }> = [];

      // Export each project
      for (const project of structure.projects) {
        const displayName = project.customName || project.name;
        const fileName = sanitizeFilename(`${project.index}_${displayName}.pdf`);
        const outputPath = path.join(outputDir, fileName);

        try {
          const data = await aggregateProjectData(project, structure);
          const pdfBuffer = await generateProjectSheet(data);
          await fs.writeFile(outputPath, pdfBuffer);
          results.push({ project: displayName, success: true });
        } catch (_error) {
          console.error(`Error exporting project ${project.name}:`, _error);
          results.push({
            project: displayName,
            success: false,
            error: _error instanceof Error ? _error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedResults = results.filter((r) => !r.success);

      return {
        success: true,
        count: successCount,
        total: results.length,
        failed: failedResults.length > 0 ? failedResults : undefined,
        outputDir,
      };
    } catch (error) {
      console.error('Error in batch export:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
