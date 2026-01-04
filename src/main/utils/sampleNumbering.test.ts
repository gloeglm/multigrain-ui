import {
  hasNumberPrefix,
  extractPrefixNumber,
  detectNumberingScheme,
  applyNumberPrefix,
  removeNumberPrefix,
  generateNumberedFilenames,
} from './sampleNumbering';

describe('sampleNumbering', () => {
  describe('hasNumberPrefix', () => {
    it('returns true for 1-digit prefix (1_)', () => {
      expect(hasNumberPrefix('1_kick.wav')).toBe(true);
      expect(hasNumberPrefix('9_snare.wav')).toBe(true);
    });

    it('returns true for 2-digit prefix (01_)', () => {
      expect(hasNumberPrefix('01_kick.wav')).toBe(true);
      expect(hasNumberPrefix('99_snare.wav')).toBe(true);
    });

    it('returns true for 3-digit prefix (001_)', () => {
      expect(hasNumberPrefix('001_kick.wav')).toBe(true);
      expect(hasNumberPrefix('128_snare.wav')).toBe(true);
    });

    it('returns false for files without prefix', () => {
      expect(hasNumberPrefix('kick.wav')).toBe(false);
      expect(hasNumberPrefix('my_sample.wav')).toBe(false);
      expect(hasNumberPrefix('sample1.wav')).toBe(false);
    });

    it('returns false for numbers without separator', () => {
      expect(hasNumberPrefix('01kick.wav')).toBe(false); // No separator at all
      expect(hasNumberPrefix('sample1.wav')).toBe(false); // Number at end
      expect(hasNumberPrefix('a01_kick.wav')).toBe(false); // Letter before number
    });

    it('returns true for various separator styles', () => {
      // Dash
      expect(hasNumberPrefix('01-kick.wav')).toBe(true);
      // Space
      expect(hasNumberPrefix('01 kick.wav')).toBe(true);
      // Space-dash-space
      expect(hasNumberPrefix('01 - kick.wav')).toBe(true);
      // Dot
      expect(hasNumberPrefix('01.kick.wav')).toBe(true);
    });
  });

  describe('extractPrefixNumber', () => {
    it('extracts number from 1-digit prefix', () => {
      expect(extractPrefixNumber('1_kick.wav')).toBe(1);
      expect(extractPrefixNumber('9_snare.wav')).toBe(9);
    });

    it('extracts number from 2-digit prefix', () => {
      expect(extractPrefixNumber('01_kick.wav')).toBe(1);
      expect(extractPrefixNumber('42_snare.wav')).toBe(42);
    });

    it('extracts number from 3-digit prefix', () => {
      expect(extractPrefixNumber('001_kick.wav')).toBe(1);
      expect(extractPrefixNumber('128_snare.wav')).toBe(128);
    });

    it('returns null for files without prefix', () => {
      expect(extractPrefixNumber('kick.wav')).toBe(null);
      expect(extractPrefixNumber('my_sample.wav')).toBe(null);
    });

    it('extracts numbers from various separator styles', () => {
      expect(extractPrefixNumber('01-kick.wav')).toBe(1);
      expect(extractPrefixNumber('01 kick.wav')).toBe(1);
      expect(extractPrefixNumber('01 - kick.wav')).toBe(1);
      expect(extractPrefixNumber('01.kick.wav')).toBe(1);
    });
  });

  describe('detectNumberingScheme', () => {
    it('defaults to 2-digit with underscore when folder is empty', () => {
      const scheme = detectNumberingScheme([]);
      expect(scheme.pattern).toBe('01_');
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe('_');
      expect(scheme.nextNumber).toBe(1);
    });

    it('defaults to 2-digit with underscore when no numbered files exist', () => {
      const scheme = detectNumberingScheme(['kick.wav', 'snare.wav', 'hihat.wav']);
      expect(scheme.pattern).toBe('01_');
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe('_');
      expect(scheme.nextNumber).toBe(1);
    });

    it('detects 2-digit scheme from existing files', () => {
      const scheme = detectNumberingScheme(['01_kick.wav', '02_snare.wav', '03_hihat.wav']);
      expect(scheme.pattern).toBe('01_');
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe('_');
      expect(scheme.nextNumber).toBe(4);
    });

    it('detects 3-digit scheme from existing files', () => {
      const scheme = detectNumberingScheme(['001_kick.wav', '002_snare.wav']);
      expect(scheme.pattern).toBe('001_');
      expect(scheme.digits).toBe(3);
      expect(scheme.separator).toBe('_');
      expect(scheme.nextNumber).toBe(3);
    });

    it('detects 1-digit scheme from existing files', () => {
      const scheme = detectNumberingScheme(['1_kick.wav', '2_snare.wav', '3_hihat.wav']);
      expect(scheme.pattern).toBe('1_');
      expect(scheme.digits).toBe(1);
      expect(scheme.separator).toBe('_');
      expect(scheme.nextNumber).toBe(4);
    });

    it('detects space separator from existing files', () => {
      const scheme = detectNumberingScheme(['01 kick.wav', '02 snare.wav', '03 hihat.wav']);
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe(' ');
      expect(scheme.nextNumber).toBe(4);
    });

    it('detects dash separator from existing files', () => {
      const scheme = detectNumberingScheme(['01-kick.wav', '02-snare.wav']);
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe('-');
      expect(scheme.nextNumber).toBe(3);
    });

    it('detects space-dash-space separator from existing files', () => {
      const scheme = detectNumberingScheme(['01 - kick.wav', '02 - snare.wav']);
      expect(scheme.digits).toBe(2);
      expect(scheme.separator).toBe(' - ');
      expect(scheme.nextNumber).toBe(3);
    });

    it('uses majority voting for mixed patterns', () => {
      // 3 two-digit, 1 three-digit - should detect 2-digit
      const scheme = detectNumberingScheme([
        '01_kick.wav',
        '02_snare.wav',
        '03_hihat.wav',
        '001_bass.wav',
      ]);
      expect(scheme.pattern).toBe('01_');
      expect(scheme.digits).toBe(2);
    });

    it('finds highest number across all patterns', () => {
      const scheme = detectNumberingScheme(['01_kick.wav', '05_snare.wav', '03_hihat.wav']);
      expect(scheme.nextNumber).toBe(6);
    });

    it('handles gaps in numbering sequence', () => {
      const scheme = detectNumberingScheme(['01_kick.wav', '10_snare.wav']);
      expect(scheme.nextNumber).toBe(11);
    });

    it('ignores non-numbered files when detecting scheme', () => {
      const scheme = detectNumberingScheme([
        '01_kick.wav',
        'unnumbered.wav',
        '02_snare.wav',
        'another.wav',
      ]);
      expect(scheme.pattern).toBe('01_');
      expect(scheme.nextNumber).toBe(3);
    });
  });

  describe('applyNumberPrefix', () => {
    it('applies 2-digit prefix with underscore', () => {
      const scheme = { pattern: '01_' as const, digits: 2, separator: '_' as const, nextNumber: 1 };
      expect(applyNumberPrefix('kick.wav', 1, scheme)).toBe('01_kick.wav');
      expect(applyNumberPrefix('snare.wav', 42, scheme)).toBe('42_snare.wav');
    });

    it('applies 3-digit prefix', () => {
      const scheme = {
        pattern: '001_' as const,
        digits: 3,
        separator: '_' as const,
        nextNumber: 1,
      };
      expect(applyNumberPrefix('kick.wav', 1, scheme)).toBe('001_kick.wav');
      expect(applyNumberPrefix('snare.wav', 42, scheme)).toBe('042_snare.wav');
    });

    it('applies 1-digit prefix', () => {
      const scheme = { pattern: '1_' as const, digits: 1, separator: '_' as const, nextNumber: 1 };
      expect(applyNumberPrefix('kick.wav', 5, scheme)).toBe('5_kick.wav');
    });

    it('preserves existing prefix', () => {
      const scheme = { pattern: '01_' as const, digits: 2, separator: '_' as const, nextNumber: 1 };
      expect(applyNumberPrefix('05_kick.wav', 1, scheme)).toBe('05_kick.wav');
    });

    it('handles filenames with underscores', () => {
      const scheme = { pattern: '01_' as const, digits: 2, separator: '_' as const, nextNumber: 1 };
      expect(applyNumberPrefix('my_sample_v2.wav', 3, scheme)).toBe('03_my_sample_v2.wav');
    });

    it('applies space separator when detected', () => {
      const scheme = { pattern: '01_' as const, digits: 2, separator: ' ' as const, nextNumber: 1 };
      expect(applyNumberPrefix('kick.wav', 1, scheme)).toBe('01 kick.wav');
    });

    it('applies dash separator when detected', () => {
      const scheme = { pattern: '01_' as const, digits: 2, separator: '-' as const, nextNumber: 1 };
      expect(applyNumberPrefix('kick.wav', 1, scheme)).toBe('01-kick.wav');
    });

    it('applies space-dash-space separator when detected', () => {
      const scheme = {
        pattern: '01_' as const,
        digits: 2,
        separator: ' - ' as const,
        nextNumber: 1,
      };
      expect(applyNumberPrefix('kick.wav', 1, scheme)).toBe('01 - kick.wav');
    });
  });

  describe('removeNumberPrefix', () => {
    it('removes 1-digit prefix', () => {
      expect(removeNumberPrefix('1_kick.wav')).toBe('kick.wav');
    });

    it('removes 2-digit prefix', () => {
      expect(removeNumberPrefix('01_kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('42_snare.wav')).toBe('snare.wav');
    });

    it('removes 3-digit prefix', () => {
      expect(removeNumberPrefix('001_kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('128_snare.wav')).toBe('snare.wav');
    });

    it('returns unchanged filename if no prefix', () => {
      expect(removeNumberPrefix('kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('my_sample.wav')).toBe('my_sample.wav');
    });

    it('removes prefix with various separators', () => {
      expect(removeNumberPrefix('01 kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('01-kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('01 - kick.wav')).toBe('kick.wav');
      expect(removeNumberPrefix('01.kick.wav')).toBe('kick.wav');
    });
  });

  describe('generateNumberedFilenames', () => {
    it('generates sequential numbers for files', () => {
      const result = generateNumberedFilenames(['kick.wav', 'snare.wav', 'hihat.wav'], []);

      expect(result.get('kick.wav')).toBe('01_kick.wav');
      expect(result.get('snare.wav')).toBe('02_snare.wav');
      expect(result.get('hihat.wav')).toBe('03_hihat.wav');
    });

    it('continues from highest existing number', () => {
      const existingFiles = ['01_bass.wav', '02_pad.wav'];
      const result = generateNumberedFilenames(['kick.wav', 'snare.wav'], existingFiles);

      expect(result.get('kick.wav')).toBe('03_kick.wav');
      expect(result.get('snare.wav')).toBe('04_snare.wav');
    });

    it('preserves already-prefixed files', () => {
      const result = generateNumberedFilenames(
        ['05_existing.wav', 'new_sample.wav'],
        ['01_bass.wav']
      );

      expect(result.get('05_existing.wav')).toBe('05_existing.wav');
      expect(result.get('new_sample.wav')).toBe('02_new_sample.wav');
    });

    it('uses scheme override when provided', () => {
      const result = generateNumberedFilenames(['kick.wav', 'snare.wav'], [], '001_');

      expect(result.get('kick.wav')).toBe('001_kick.wav');
      expect(result.get('snare.wav')).toBe('002_snare.wav');
    });

    it('detects scheme from existing files when no override', () => {
      const existingFiles = ['001_bass.wav', '002_pad.wav'];
      const result = generateNumberedFilenames(['kick.wav'], existingFiles);

      expect(result.get('kick.wav')).toBe('003_kick.wav');
    });

    it('handles empty import list', () => {
      const result = generateNumberedFilenames([], ['01_bass.wav']);
      expect(result.size).toBe(0);
    });

    it('respects the order of files to import', () => {
      const result = generateNumberedFilenames(['z_last.wav', 'a_first.wav', 'm_middle.wav'], []);

      // Order should be preserved, not alphabetized
      expect(result.get('z_last.wav')).toBe('01_z_last.wav');
      expect(result.get('a_first.wav')).toBe('02_a_first.wav');
      expect(result.get('m_middle.wav')).toBe('03_m_middle.wav');
    });

    it('preserves separator style from existing files', () => {
      // Existing files use space separator
      const existingFiles = ['01 bass.wav', '02 pad.wav'];
      const result = generateNumberedFilenames(['kick.wav', 'snare.wav'], existingFiles);

      // New files should also use space separator
      expect(result.get('kick.wav')).toBe('03 kick.wav');
      expect(result.get('snare.wav')).toBe('04 snare.wav');
    });

    it('preserves dash separator style', () => {
      const existingFiles = ['01-bass.wav', '02-pad.wav'];
      const result = generateNumberedFilenames(['kick.wav'], existingFiles);

      expect(result.get('kick.wav')).toBe('03-kick.wav');
    });

    it('preserves space-dash-space separator style', () => {
      const existingFiles = ['01 - bass.wav', '02 - pad.wav'];
      const result = generateNumberedFilenames(['kick.wav'], existingFiles);

      expect(result.get('kick.wav')).toBe('03 - kick.wav');
    });
  });
});
