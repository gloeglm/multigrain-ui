import { useState, useCallback } from 'react';
import { MultigainStructure, ValidationResult } from '../../shared/types';

interface UseMultigrainReturn {
  structure: MultigainStructure | null;
  isLoading: boolean;
  error: string | null;
  selectAndValidate: () => Promise<void>;
  loadPath: (path: string) => Promise<void>;
}

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
      } else {
        setError(result.errors.join(', ') || 'Invalid Multigrain structure');
        // Still set structure if available for partial display
        if (result.structure) {
          setStructure(result.structure);
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

  return {
    structure,
    isLoading,
    error,
    selectAndValidate,
    loadPath,
  };
}
