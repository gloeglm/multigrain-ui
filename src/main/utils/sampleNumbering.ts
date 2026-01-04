/**
 * Sample numbering utilities for prefixing samples with sequential digits
 * to enforce reliable alphabetical ordering on the Multigrain hardware.
 */

/**
 * Supported separator types between number and filename
 */
export type SeparatorType = '_' | ' ' | ' - ' | '-' | '.';

/**
 * Detected numbering scheme from existing files
 */
export interface NumberingScheme {
  /** The detected pattern type (for backwards compatibility) */
  pattern: 'none' | '1_' | '01_' | '001_';
  /** Number of digits in the pattern (1, 2, or 3) */
  digits: number;
  /** The separator used between number and filename */
  separator: SeparatorType;
  /** The next available number in the sequence */
  nextNumber: number;
}

/**
 * Flexible regex to detect number prefixes with various separators
 * Matches: 01_xxx, 01 xxx, 01 - xxx, 01-xxx, 01.xxx
 * Captures: (digits)(separator)
 */
const FLEXIBLE_PREFIX_REGEX = /^(\d{1,3})(\s*[-_.]\s*|\s+)(?=\S)/;

/**
 * Map separator strings to canonical types
 */
function normalizeSeparator(sep: string): SeparatorType {
  if (sep === '_') return '_';
  if (sep === '-') return '-';
  if (sep === '.') return '.';
  if (sep === ' - ' || sep === ' -' || sep === '- ') return ' - ';
  if (sep.trim() === '' && sep.length > 0) return ' ';
  // Default to underscore for any other separator
  return '_';
}

/**
 * Check if a filename has a number prefix (any format)
 * @param filename - The filename to check
 * @returns true if the filename starts with a number prefix pattern
 */
export function hasNumberPrefix(filename: string): boolean {
  return FLEXIBLE_PREFIX_REGEX.test(filename);
}

/**
 * Extract the number from a prefixed filename
 * @param filename - The filename to extract the number from
 * @returns The extracted number, or null if no prefix found
 */
export function extractPrefixNumber(filename: string): number | null {
  const match = filename.match(FLEXIBLE_PREFIX_REGEX);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Extract prefix info (number, digits, separator) from a filename
 * @param filename - The filename to analyze
 * @returns Object with number, digits, and separator, or null if no prefix
 */
function extractPrefixInfo(
  filename: string
): { number: number; digits: number; separator: SeparatorType } | null {
  const match = filename.match(FLEXIBLE_PREFIX_REGEX);
  if (match) {
    const numStr = match[1];
    return {
      number: parseInt(numStr, 10),
      digits: numStr.length,
      separator: normalizeSeparator(match[2]),
    };
  }
  return null;
}

/**
 * Detect the numbering scheme from existing files in a folder
 * Uses majority voting if mixed patterns exist.
 * Defaults to 2-digit with underscore (01_) if no pattern is detected.
 *
 * @param existingFiles - Array of filenames in the target folder
 * @returns The detected numbering scheme
 */
export function detectNumberingScheme(existingFiles: string[]): NumberingScheme {
  const digitCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const separatorCounts: Record<SeparatorType, number> = {
    _: 0,
    ' ': 0,
    ' - ': 0,
    '-': 0,
    '.': 0,
  };
  let maxNumber = 0;

  for (const filename of existingFiles) {
    const info = extractPrefixInfo(filename);
    if (info) {
      digitCounts[info.digits]++;
      separatorCounts[info.separator]++;
      if (info.number > maxNumber) {
        maxNumber = info.number;
      }
    }
  }

  // Find the majority pattern
  const totalPrefixed = digitCounts[1] + digitCounts[2] + digitCounts[3];

  if (totalPrefixed === 0) {
    // No existing pattern, use default (2-digit with underscore)
    return {
      pattern: '01_',
      digits: 2,
      separator: '_',
      nextNumber: 1,
    };
  }

  // Use majority voting for digits
  let winningDigits = 2; // default
  let maxDigitCount = 0;

  for (const [digits, count] of Object.entries(digitCounts)) {
    if (count > maxDigitCount) {
      maxDigitCount = count;
      winningDigits = parseInt(digits, 10);
    }
  }

  // Use majority voting for separator
  let winningSeparator: SeparatorType = '_'; // default
  let maxSepCount = 0;

  for (const [sep, count] of Object.entries(separatorCounts)) {
    if (count > maxSepCount) {
      maxSepCount = count;
      winningSeparator = sep as SeparatorType;
    }
  }

  const patternMap: Record<number, '1_' | '01_' | '001_'> = {
    1: '1_',
    2: '01_',
    3: '001_',
  };

  return {
    pattern: patternMap[winningDigits],
    digits: winningDigits,
    separator: winningSeparator,
    nextNumber: maxNumber + 1,
  };
}

/**
 * Apply a number prefix to a filename
 * If the file already has a matching prefix, it is preserved.
 *
 * @param filename - The filename to prefix
 * @param number - The number to use as prefix
 * @param scheme - The numbering scheme to use
 * @returns The filename with the number prefix applied
 */
export function applyNumberPrefix(
  filename: string,
  number: number,
  scheme: NumberingScheme
): string {
  // If file already has a prefix, preserve it
  if (hasNumberPrefix(filename)) {
    return filename;
  }

  // Pad the number according to the scheme
  const paddedNumber = String(number).padStart(scheme.digits, '0');

  // Use the detected separator (default to underscore if not set)
  const separator = scheme.separator || '_';

  return `${paddedNumber}${separator}${filename}`;
}

/**
 * Remove a number prefix from a filename
 * @param filename - The filename to strip the prefix from
 * @returns The filename without the number prefix
 */
export function removeNumberPrefix(filename: string): string {
  return filename.replace(FLEXIBLE_PREFIX_REGEX, '');
}

/**
 * Generate numbered filenames for a batch of files to import
 * Files that already have prefixes are preserved.
 *
 * @param filesToImport - Array of filenames to be imported (in desired order)
 * @param existingFiles - Array of filenames already in the target folder
 * @param schemeOverride - Optional scheme override ('01_' or '001_'), otherwise auto-detect
 * @returns Map of original filename to numbered filename
 */
export function generateNumberedFilenames(
  filesToImport: string[],
  existingFiles: string[],
  schemeOverride?: '01_' | '001_'
): Map<string, string> {
  const result = new Map<string, string>();

  // Detect or use override scheme
  let scheme: NumberingScheme;
  if (schemeOverride) {
    // Use override but still detect next number and separator from existing files
    const detected = detectNumberingScheme(existingFiles);
    scheme = {
      pattern: schemeOverride,
      digits: schemeOverride === '001_' ? 3 : 2,
      separator: detected.separator,
      nextNumber: detected.nextNumber,
    };
  } else {
    scheme = detectNumberingScheme(existingFiles);
  }

  let currentNumber = scheme.nextNumber;

  for (const filename of filesToImport) {
    if (hasNumberPrefix(filename)) {
      // Preserve existing prefix
      result.set(filename, filename);
    } else {
      // Apply new prefix
      const numbered = applyNumberPrefix(filename, currentNumber, scheme);
      result.set(filename, numbered);
      currentNumber++;
    }
  }

  return result;
}
