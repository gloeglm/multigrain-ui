/**
 * React Hook for PDF Export Operations
 * Handles export of overview and project reference sheets
 */

import { useState } from 'react';
import { MultigainStructure, Project } from '@shared/types';

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export overview sheet for all projects
   */
  const exportOverview = async (structure: MultigainStructure) => {
    setIsExporting(true);
    setError(null);

    try {
      const result = await window.electronAPI.exportOverviewPdf(structure);

      if (result.success && result.tempFilePath) {
        console.log('✅ Overview sheet generated and opened in browser:', result.tempFilePath);
        // PDF automatically opens in browser, no dialog needed
      } else {
        throw new Error(result.error || 'Failed to export overview sheet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const fullError = err instanceof Error ? err.stack || err.message : String(err);
      console.error('❌ Export failed:', fullError);
      setError(errorMessage);
      alert(`Export failed: ${errorMessage}\n\nCheck the console for full error details.`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export individual project sheet
   */
  const exportProject = async (project: Project, structure: MultigainStructure) => {
    setIsExporting(true);
    setError(null);

    try {
      const result = await window.electronAPI.exportProjectPdf(project, structure);

      if (result.success && result.tempFilePath) {
        console.log('✅ Project sheet generated and opened in browser:', result.tempFilePath);
        // PDF automatically opens in browser, no dialog needed
      } else {
        throw new Error(result.error || 'Failed to export project sheet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const fullError = err instanceof Error ? err.stack || err.message : String(err);
      console.error('❌ Export failed:', fullError);
      setError(errorMessage);
      alert(`Export failed: ${errorMessage}\n\nCheck the console for full error details.`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export all project sheets (batch export)
   */
  const exportAllProjects = async (structure: MultigainStructure) => {
    // Confirm before batch export
    const projectCount = structure.projects.length;
    if (!confirm(`Export reference sheets for all ${projectCount} projects?`)) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await window.electronAPI.exportAllProjectsPdf(structure);

      if (result.canceled) {
        return;
      }

      if (result.success) {
        const successCount = result.count || 0;
        const totalCount = result.total || 0;
        const failedCount = totalCount - successCount;

        console.log(
          `✅ Batch export complete: ${successCount}/${totalCount} projects exported successfully`
        );

        let message = `Successfully exported ${successCount} of ${totalCount} project sheets`;
        if (result.outputDir) {
          message += `\n\nLocation: ${result.outputDir}`;
        }

        if (failedCount > 0 && result.failed) {
          console.error('❌ Failed exports:', result.failed);
          message += `\n\nFailed exports (${failedCount}):`;
          result.failed.forEach((f) => {
            message += `\n- ${f.project}: ${f.error || 'Unknown error'}`;
          });
          message += '\n\nCheck the console for full error details.';
        }

        alert(message);
      } else {
        throw new Error(result.error || 'Failed to export project sheets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const fullError = err instanceof Error ? err.stack || err.message : String(err);
      console.error('❌ Batch export failed:', fullError);
      setError(errorMessage);
      alert(`Batch export failed: ${errorMessage}\n\nCheck the console for full error details.`);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportOverview,
    exportProject,
    exportAllProjects,
    isExporting,
    error,
  };
}
