import { describe, it, expect } from 'vitest';
import {
  getProjectFolderName,
  getPresetFileName,
  getProjectBankInfo,
  formatProjectDisplayName,
  STORAGE_LIMITS,
  BANK_NAMES,
} from './constants';

describe('getProjectFolderName', () => {
  it('generates correct folder name with zero padding', () => {
    expect(getProjectFolderName(1)).toBe('Project01');
    expect(getProjectFolderName(9)).toBe('Project09');
    expect(getProjectFolderName(10)).toBe('Project10');
    expect(getProjectFolderName(48)).toBe('Project48');
  });

  it('throws error for invalid project indices', () => {
    expect(() => getProjectFolderName(0)).toThrow('Project index must be between 1 and 48');
    expect(() => getProjectFolderName(49)).toThrow('Project index must be between 1 and 48');
    expect(() => getProjectFolderName(-1)).toThrow('Project index must be between 1 and 48');
  });

  it('generates all 48 project folder names', () => {
    const names = Array.from({ length: 48 }, (_, i) => getProjectFolderName(i + 1));
    expect(names).toHaveLength(48);
    expect(names[0]).toBe('Project01');
    expect(names[47]).toBe('Project48');
    // Check for no duplicates
    expect(new Set(names).size).toBe(48);
  });
});

describe('getPresetFileName', () => {
  it('generates correct preset filename with zero padding', () => {
    expect(getPresetFileName(1)).toBe('Preset01.mgp');
    expect(getPresetFileName(9)).toBe('Preset09.mgp');
    expect(getPresetFileName(10)).toBe('Preset10.mgp');
    expect(getPresetFileName(48)).toBe('Preset48.mgp');
  });

  it('throws error for invalid preset indices', () => {
    expect(() => getPresetFileName(0)).toThrow('Preset index must be between 1 and 48');
    expect(() => getPresetFileName(49)).toThrow('Preset index must be between 1 and 48');
  });

  it('always includes .mgp extension', () => {
    for (let i = 1; i <= 48; i++) {
      expect(getPresetFileName(i)).toMatch(/\.mgp$/);
    }
  });
});

describe('getProjectBankInfo', () => {
  it('calculates bank X (projects 1-8)', () => {
    expect(getProjectBankInfo(1)).toEqual({ bank: 'X', position: 1 });
    expect(getProjectBankInfo(5)).toEqual({ bank: 'X', position: 5 });
    expect(getProjectBankInfo(8)).toEqual({ bank: 'X', position: 8 });
  });

  it('calculates bank Y (projects 9-16)', () => {
    expect(getProjectBankInfo(9)).toEqual({ bank: 'Y', position: 1 });
    expect(getProjectBankInfo(12)).toEqual({ bank: 'Y', position: 4 });
    expect(getProjectBankInfo(16)).toEqual({ bank: 'Y', position: 8 });
  });

  it('calculates bank Z (projects 17-24)', () => {
    expect(getProjectBankInfo(17)).toEqual({ bank: 'Z', position: 1 });
    expect(getProjectBankInfo(24)).toEqual({ bank: 'Z', position: 8 });
  });

  it('calculates bank XX (projects 25-32)', () => {
    expect(getProjectBankInfo(25)).toEqual({ bank: 'XX', position: 1 });
    expect(getProjectBankInfo(32)).toEqual({ bank: 'XX', position: 8 });
  });

  it('calculates bank YY (projects 33-40)', () => {
    expect(getProjectBankInfo(33)).toEqual({ bank: 'YY', position: 1 });
    expect(getProjectBankInfo(40)).toEqual({ bank: 'YY', position: 8 });
  });

  it('calculates bank ZZ (projects 41-48)', () => {
    expect(getProjectBankInfo(41)).toEqual({ bank: 'ZZ', position: 1 });
    expect(getProjectBankInfo(48)).toEqual({ bank: 'ZZ', position: 8 });
  });

  it('throws error for invalid project indices', () => {
    expect(() => getProjectBankInfo(0)).toThrow('Project index must be between 1 and 48');
    expect(() => getProjectBankInfo(49)).toThrow('Project index must be between 1 and 48');
  });

  it('positions are always 1-8', () => {
    for (let i = 1; i <= 48; i++) {
      const { position } = getProjectBankInfo(i);
      expect(position).toBeGreaterThanOrEqual(1);
      expect(position).toBeLessThanOrEqual(8);
    }
  });

  it('uses all bank names exactly once per cycle', () => {
    const bankCounts = new Map<string, number>();
    for (let i = 1; i <= 48; i++) {
      const { bank } = getProjectBankInfo(i);
      bankCounts.set(bank, (bankCounts.get(bank) || 0) + 1);
    }

    BANK_NAMES.forEach((bankName) => {
      expect(bankCounts.get(bankName)).toBe(8);
    });
  });
});

describe('formatProjectDisplayName', () => {
  it('formats name with bank and position prefix', () => {
    const result = formatProjectDisplayName(1, 'Project01');
    expect(result).toBe('X / 1 - Project01');
  });

  it('uses custom name when provided', () => {
    const result = formatProjectDisplayName(1, 'Project01', 'My Custom Name');
    expect(result).toBe('X / 1 - My Custom Name');
  });

  it('uses project name when no custom name', () => {
    const result = formatProjectDisplayName(9, 'Project09');
    expect(result).toBe('Y / 1 - Project09');
  });

  it('formats different banks correctly', () => {
    expect(formatProjectDisplayName(1, 'Project01')).toMatch(/^X \/ 1/);
    expect(formatProjectDisplayName(9, 'Project09')).toMatch(/^Y \/ 1/);
    expect(formatProjectDisplayName(17, 'Project17')).toMatch(/^Z \/ 1/);
    expect(formatProjectDisplayName(25, 'Project25')).toMatch(/^XX \/ 1/);
    expect(formatProjectDisplayName(33, 'Project33')).toMatch(/^YY \/ 1/);
    expect(formatProjectDisplayName(41, 'Project41')).toMatch(/^ZZ \/ 1/);
  });

  it('formats last project in each bank', () => {
    expect(formatProjectDisplayName(8, 'Project08')).toBe('X / 8 - Project08');
    expect(formatProjectDisplayName(16, 'Project16')).toBe('Y / 8 - Project16');
    expect(formatProjectDisplayName(48, 'Project48')).toBe('ZZ / 8 - Project48');
  });

  it('handles empty custom name', () => {
    const result = formatProjectDisplayName(1, 'Project01', '');
    expect(result).toBe('X / 1 - Project01');
  });

  it('preserves special characters in names', () => {
    const result = formatProjectDisplayName(1, 'Project01', 'My (Cool) [Name] - v2');
    expect(result).toBe('X / 1 - My (Cool) [Name] - v2');
  });
});

describe('STORAGE_LIMITS', () => {
  it('has correct maximum values', () => {
    expect(STORAGE_LIMITS.MAX_PROJECTS).toBe(48);
    expect(STORAGE_LIMITS.PRESETS_PER_PROJECT).toBe(48);
    expect(STORAGE_LIMITS.SOUNDS_PER_PRESET).toBe(8);
    expect(STORAGE_LIMITS.SAMPLES_PER_PROJECT).toBe(128);
    expect(STORAGE_LIMITS.SAMPLES_IN_WAVS).toBe(128);
    expect(STORAGE_LIMITS.SAMPLES_IN_RECS).toBe(1024);
  });

  it('matches bank calculations', () => {
    expect(STORAGE_LIMITS.MAX_PROJECTS).toBe(BANK_NAMES.length * 8);
    expect(STORAGE_LIMITS.PRESETS_PER_PROJECT).toBe(BANK_NAMES.length * 8);
  });
});

describe('BANK_NAMES', () => {
  it('has exactly 6 banks', () => {
    expect(BANK_NAMES).toHaveLength(6);
  });

  it('has correct bank names in order', () => {
    expect(BANK_NAMES).toEqual(['X', 'Y', 'Z', 'XX', 'YY', 'ZZ']);
  });

  it('contains unique bank names', () => {
    expect(new Set(BANK_NAMES).size).toBe(BANK_NAMES.length);
  });
});
