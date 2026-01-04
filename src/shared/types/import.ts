/**
 * Type definitions for the audio import system
 */

/**
 * Issue found during audio file analysis
 */
export interface AudioIssue {
  type: 'duration' | 'sampleRate' | 'bitDepth' | 'channels' | 'format' | 'unreadable';
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Metadata extracted from an audio file
 */
export interface AudioMetadata {
  duration: number; // Duration in seconds
  sampleRate: number; // Sample rate in Hz
  bitDepth: number; // Bit depth (8, 16, 24, 32)
  channels: number; // Number of audio channels (1=mono, 2=stereo)
  format: string; // File format (WAV, MP3, FLAC, etc.)
}

/**
 * Result of analyzing an audio file for import
 */
export interface AudioAnalysis {
  path: string; // Full path to the audio file
  filename: string; // Just the filename
  isValid: boolean; // Can this file be imported?
  needsConversion: boolean; // Does it need format conversion?
  willBeTrimmed: boolean; // Will it be trimmed due to length >32s?
  issues: AudioIssue[]; // List of issues found
  metadata: AudioMetadata | null; // Extracted metadata (null if unreadable)
}

/**
 * Options for automatic sample numbering during import
 */
export interface NumberingOptions {
  enabled: boolean; // Whether to add number prefixes
  scheme?: 'auto' | '01_' | '001_'; // Numbering scheme (auto = detect from existing files)
}

/**
 * Request to import files
 */
export interface ImportRequest {
  files: string[]; // Full paths to files to import (in desired order for numbering)
  targetPath: string; // Destination folder (project or Wavs folder)
  numberingOptions?: NumberingOptions; // Optional numbering configuration
}

/**
 * File that was renamed during import
 */
export interface RenamedFile {
  original: string; // Original filename
  final: string; // Final filename after conflict resolution
}

/**
 * Error that occurred during import
 */
export interface ImportError {
  file: string; // Filename that failed
  error: string; // Error message
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean; // Overall success
  imported: number; // Number of files successfully imported
  failed: number; // Number of files that failed
  trimmed: string[]; // Filenames that were auto-trimmed
  renamed: RenamedFile[]; // Files that were renamed due to conflicts
  numbered: RenamedFile[]; // Files that received number prefixes
  errors: ImportError[]; // Errors that occurred
}

/**
 * Progress update during import
 */
export interface ImportProgress {
  currentFile: string; // Filename currently being processed
  currentIndex: number; // 0-based index of current file
  totalFiles: number; // Total number of files to import
  percent: number; // Overall progress percentage (0-100)
  stage: 'validating' | 'converting' | 'copying'; // Current stage
}

/**
 * Result of a single file conversion
 */
export interface ConversionResult {
  success: boolean;
  outputPath?: string; // Path to converted file (if successful)
  error?: string; // Error message (if failed)
}

/**
 * Numbering scheme info returned from validation
 */
export interface NumberingInfo {
  pattern: 'none' | '1_' | '01_' | '001_'; // Detected or default pattern
  digits: number; // Number of digits (1, 2, or 3)
  separator: string; // Separator between number and filename (e.g., '_', ' ', ' - ')
  nextNumber: number; // Next available number for new files
}
