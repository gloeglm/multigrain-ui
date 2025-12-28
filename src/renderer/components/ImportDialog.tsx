import React, { useState, useEffect } from 'react';
import { AudioAnalysis, ImportProgress, ImportResult } from '@shared/types/import';

interface ImportDialogProps {
  isOpen: boolean;
  targetPath: string;
  onClose: () => void;
  onImportComplete: () => void;
}

type Stage = 'selecting' | 'validation' | 'progress' | 'results';

export function ImportDialog({ isOpen, targetPath, onClose, onImportComplete }: ImportDialogProps) {
  const [stage, setStage] = useState<Stage>('selecting');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AudioAnalysis[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    currentCount: number;
    limit: number;
    availableSlots: number;
    wouldExceed: boolean;
  } | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStage('selecting');
      setSelectedFiles([]);
      setAnalyses([]);
      setStorageInfo(null);
      setProgress(null);
      setResult(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle file selection
  useEffect(() => {
    if (isOpen && stage === 'selecting') {
      handleSelectFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stage]);

  // Register progress listener
  useEffect(() => {
    if (stage === 'progress') {
      const cleanup = window.electronAPI.onImportProgress((prog) => {
        setProgress(prog);
      });
      return cleanup;
    }
  }, [stage]);

  const handleSelectFiles = async () => {
    try {
      const files = await window.electronAPI.selectImportFiles();
      if (!files || files.length === 0) {
        onClose();
        return;
      }

      setSelectedFiles(files);
      setStage('validation');

      // Validate files
      const validationResult = await window.electronAPI.validateImportFiles(files, targetPath);
      setAnalyses(validationResult.analyses);
      setStorageInfo(validationResult.storageInfo);
    } catch (error) {
      console.error('Failed to select/validate files:', error);
      onClose();
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setStage('progress');

    try {
      const importResult = await window.electronAPI.executeImport(selectedFiles, targetPath);
      setResult(importResult);
      setStage('results');
    } catch (error) {
      console.error('Import failed:', error);
      setResult({
        success: false,
        imported: 0,
        failed: selectedFiles.length,
        trimmed: [],
        renamed: [],
        errors: [
          {
            file: 'All files',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      });
      setStage('results');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (stage === 'results' && result && result.imported > 0) {
      onImportComplete();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const targetFolderName = targetPath.split(/[/\\]/).pop() || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-light rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-dark flex items-center justify-between">
          <h2 className="text-xl font-semibold text-label-black">
            Import Samples to {targetFolderName}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-label-gray hover:text-label-black disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {stage === 'selecting' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-4">📂</div>
                <p className="text-label-gray">Selecting files...</p>
              </div>
            </div>
          )}

          {stage === 'validation' && (
            <div>
              {/* Storage info */}
              {storageInfo && (
                <div
                  className={`mb-4 p-4 rounded ${
                    storageInfo.wouldExceed
                      ? 'bg-button-red bg-opacity-20 border border-button-red'
                      : 'bg-label-blue bg-opacity-10 border border-label-blue'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    Storage: {storageInfo.currentCount}/{storageInfo.limit} samples
                  </p>
                  <p className="text-xs text-label-gray">
                    {storageInfo.availableSlots} slot(s) available
                  </p>
                  {storageInfo.wouldExceed && (
                    <p className="text-xs text-button-red mt-2">
                      ⚠ Warning: Not all files can be imported due to storage limit
                    </p>
                  )}
                </div>
              )}

              {/* File list */}
              <div className="space-y-2">
                {analyses.map((analysis, index) => (
                  <div key={index} className="p-3 bg-panel-dark rounded border border-panel-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-label-black truncate">{analysis.filename}</p>
                        {analysis.isValid ? (
                          <div className="mt-1 space-y-1">
                            {analysis.needsConversion || analysis.willBeTrimmed ? (
                              analysis.issues.map((issue, i) => (
                                <p key={i} className="text-xs text-knob-ring">
                                  ⚠ {issue.message}
                                </p>
                              ))
                            ) : (
                              <p className="text-xs text-label-gray">
                                ✓ Ready to import (no conversion needed)
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1">
                            {analysis.issues.map((issue, i) => (
                              <p key={i} className="text-xs text-button-red">
                                ✗ {issue.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm text-label-gray">
                {analyses.filter((a) => a.isValid).length} file(s) ready to import
                {analyses.filter((a) => !a.isValid).length > 0 &&
                  `, ${analyses.filter((a) => !a.isValid).length} file(s) will be skipped`}
              </p>
            </div>
          )}

          {stage === 'progress' && progress && (
            <div className="py-8">
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-label-black mb-2">
                  {progress.stage === 'validating' && 'Analyzing...'}
                  {progress.stage === 'converting' && 'Converting...'}
                  {progress.stage === 'copying' && 'Importing...'}
                </p>
                <p className="text-sm text-label-gray truncate">
                  {progress.currentFile || 'Processing...'}
                </p>
                <p className="text-xs text-label-gray mt-1">
                  {progress.currentIndex + 1} of {progress.totalFiles}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-panel-dark rounded-full h-3 overflow-hidden">
                <div
                  className="bg-label-blue h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <p className="text-center text-sm text-label-gray mt-2">{progress.percent}%</p>
            </div>
          )}

          {stage === 'results' && result && (
            <div>
              <div
                className={`p-4 rounded mb-4 ${
                  result.success
                    ? 'bg-label-blue bg-opacity-10 border border-label-blue'
                    : 'bg-button-red bg-opacity-20 border border-button-red'
                }`}
              >
                <p className="font-semibold">
                  {result.success ? '✓ Import Complete' : '⚠ Import Completed with Errors'}
                </p>
                <p className="text-sm mt-1">
                  {result.imported} file(s) imported successfully
                  {result.failed > 0 && `, ${result.failed} file(s) failed`}
                </p>
              </div>

              {/* Trimmed files */}
              {result.trimmed.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-sm text-label-black mb-2">
                    Trimmed Files ({result.trimmed.length})
                  </p>
                  <div className="space-y-1">
                    {result.trimmed.map((file, i) => (
                      <p key={i} className="text-xs text-label-gray pl-4">
                        • {file}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Renamed files */}
              {result.renamed.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-sm text-label-black mb-2">
                    Renamed Files ({result.renamed.length})
                  </p>
                  <div className="space-y-1">
                    {result.renamed.map((rename, i) => (
                      <p key={i} className="text-xs text-label-gray pl-4">
                        • {rename.original} → {rename.final}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-sm text-button-red mb-2">
                    Errors ({result.errors.length})
                  </p>
                  <div className="space-y-2">
                    {result.errors.map((error, i) => (
                      <div key={i} className="pl-4 text-xs">
                        <p className="font-medium text-label-black">{error.file}</p>
                        <p className="text-button-red">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-panel-dark flex justify-end gap-3">
          {stage === 'validation' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-button-gray hover:bg-panel-dark text-label-black rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={analyses.filter((a) => a.isValid).length === 0}
                className="px-4 py-2 bg-label-blue hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white rounded"
              >
                Import {analyses.filter((a) => a.isValid).length} File(s)
              </button>
            </>
          )}

          {stage === 'results' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-label-blue hover:bg-knob-ring text-white rounded"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
