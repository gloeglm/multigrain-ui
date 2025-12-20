import { useState, useCallback, useEffect } from 'react';
import { MultigainStructure, ValidationResult } from '../../shared/types';

interface UseMultigrainReturn {
  structure: MultigainStructure | null;
  isLoading: boolean;
  error: string | null;
  selectAndValidate: () => Promise<void>;
  loadPath: (path: string) => Promise<void>;
  reloadStructure: () => Promise<void>;
}

const STORAGE_KEY = 'multigrain-last-path';

export function useMultigrain(): UseMultigrainReturn {
  const [structure, setStructure] = useState<MultigainStructure | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPath = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: ValidationResult = await window.electronAPI.validateMultigrain(path);

      if (result.isValid && result.structure) {
        setStructure(result.structure);
        // Save the path to localStorage for next time
        localStorage.setItem(STORAGE_KEY, path);
      } else {
        setError(result.errors.join(', ') || 'Invalid Multigrain structure');
        // Still set structure if available for partial display
        if (result.structure) {
          setStructure(result.structure);
          localStorage.setItem(STORAGE_KEY, path);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load structure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectAndValidate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selectedPath = await window.electronAPI.selectDirectory();

      if (!selectedPath) {
        setIsLoading(false);
        return;
      }

      await loadPath(selectedPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select directory');
      setIsLoading(false);
    }
  }, [loadPath]);

  // Reload the current structure (useful when metadata changes)
  const reloadStructure = useCallback(async () => {
    if (structure) {
      await loadPath(structure.rootPath);
    }
  }, [structure, loadPath]);

  // Load the last used path on mount
  useEffect(() => {
    const lastPath = localStorage.getItem(STORAGE_KEY);
    if (lastPath) {
      // Automatically load the last path
      loadPath(lastPath).catch(() => {
        // If loading fails, clear the stored path
        localStorage.removeItem(STORAGE_KEY);
      });
    }
  }, [loadPath]);

  return {
    structure,
    isLoading,
    error,
    selectAndValidate,
    loadPath,
    reloadStructure,
  };
}
