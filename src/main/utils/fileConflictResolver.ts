import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Resolves filename conflicts by generating unique filenames with numeric suffixes
 * Pattern: kick.wav → kick_1.wav → kick_2.wav → etc.
 *
 * @param targetDir - Directory where file will be placed
 * @param desiredName - Desired filename (e.g., "kick.wav")
 * @returns Promise<string> - Available filename that doesn't conflict
 */
export async function resolveConflict(targetDir: string, desiredName: string): Promise<string> {
  // Parse the filename into name and extension
  const ext = path.extname(desiredName);
  const baseName = path.basename(desiredName, ext);

  // First, check if the desired name is available
  const desiredPath = path.join(targetDir, desiredName);
  try {
    await fs.access(desiredPath);
    // File exists, need to find alternative
  } catch {
    // File doesn't exist, we can use the desired name
    return desiredName;
  }

  // File exists, try numeric suffixes
  let counter = 1;
  while (counter < 1000) {
    // Safety limit to prevent infinite loops
    const newName = `${baseName}_${counter}${ext}`;
    const newPath = path.join(targetDir, newName);

    try {
      await fs.access(newPath);
      // This name also exists, try next number
      counter++;
    } catch {
      // This name is available!
      return newName;
    }
  }

  // If we somehow hit the limit, use timestamp as fallback
  const timestamp = Date.now();
  return `${baseName}_${timestamp}${ext}`;
}

/**
 * Sanitize a filename by removing invalid characters
 * This is a safety measure for unusual filenames
 *
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid Windows filename characters: < > : " / \ | ? *
  // Also remove control characters (ASCII 0-31)
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}
