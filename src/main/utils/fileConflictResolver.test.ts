import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { resolveConflict, sanitizeFilename } from './fileConflictResolver';

// Mock the fs module with memfs
vi.mock('fs/promises', () => vol.promises);

describe('resolveConflict', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns original filename when no conflict exists', async () => {
    vol.fromJSON({
      '/test/dir': null, // Create empty directory
    });

    const result = await resolveConflict('/test/dir', 'kick.wav');
    expect(result).toBe('kick.wav');
  });

  it('adds _1 suffix when file exists', async () => {
    vol.fromJSON({
      '/test/dir/kick.wav': 'audio data',
    });

    const result = await resolveConflict('/test/dir', 'kick.wav');
    expect(result).toBe('kick_1.wav');
  });

  it('increments suffix when multiple conflicts exist', async () => {
    vol.fromJSON({
      '/test/dir/kick.wav': 'audio data',
      '/test/dir/kick_1.wav': 'audio data',
      '/test/dir/kick_2.wav': 'audio data',
    });

    const result = await resolveConflict('/test/dir', 'kick.wav');
    expect(result).toBe('kick_3.wav');
  });

  it('handles files with no extension', async () => {
    vol.fromJSON({
      '/test/dir/README': 'content',
    });

    const result = await resolveConflict('/test/dir', 'README');
    expect(result).toBe('README_1');
  });

  it('handles files with multiple dots in name', async () => {
    vol.fromJSON({
      '/test/dir/my.sample.wav': 'audio data',
    });

    const result = await resolveConflict('/test/dir', 'my.sample.wav');
    expect(result).toBe('my.sample_1.wav');
  });

  it('preserves extension case', async () => {
    vol.fromJSON({
      '/test/dir/test.WAV': 'audio data',
    });

    const result = await resolveConflict('/test/dir', 'test.WAV');
    expect(result).toBe('test_1.WAV');
  });

  it('finds first available slot in sequence', async () => {
    vol.fromJSON({
      '/test/dir/sample.wav': 'audio data',
      '/test/dir/sample_1.wav': 'audio data',
      // Gap at _2
      '/test/dir/sample_3.wav': 'audio data',
    });

    const result = await resolveConflict('/test/dir', 'sample.wav');
    expect(result).toBe('sample_2.wav');
  });

  it('handles long filenames', async () => {
    const longName = 'very_long_sample_name_with_lots_of_characters_in_it.wav';
    vol.fromJSON({
      [`/test/dir/${longName}`]: 'audio data',
    });

    const result = await resolveConflict('/test/dir', longName);
    expect(result).toBe('very_long_sample_name_with_lots_of_characters_in_it_1.wav');
  });

  it('returns original name for different directory', async () => {
    vol.fromJSON({
      '/test/dir1/kick.wav': 'audio data',
    });

    // Same filename but different directory should be available
    const result = await resolveConflict('/test/dir2', 'kick.wav');
    expect(result).toBe('kick.wav');
  });
});

describe('sanitizeFilename', () => {
  it('removes invalid Windows characters', () => {
    const dirty = 'bad<name>with:invalid"chars/and\\pipes|question?marks*.wav';
    const clean = sanitizeFilename(dirty);
    expect(clean).toBe('bad_name_with_invalid_chars_and_pipes_question_marks_.wav');
  });

  it('removes control characters', () => {
    const dirty = 'file\x00with\x1Fcontrol\x0Achars.wav';
    const clean = sanitizeFilename(dirty);
    expect(clean).toBe('file_with_control_chars.wav');
  });

  it('preserves valid characters', () => {
    const valid = 'valid-filename_with.spaces (and) [brackets] 123.wav';
    const result = sanitizeFilename(valid);
    expect(result).toBe(valid);
  });

  it('handles empty string', () => {
    const result = sanitizeFilename('');
    expect(result).toBe('');
  });

  it('handles filename with only invalid characters', () => {
    const result = sanitizeFilename('<<>>**');
    expect(result).toBe('______');
  });

  it('preserves unicode characters', () => {
    const unicode = 'sample-名前-файл.wav';
    const result = sanitizeFilename(unicode);
    expect(result).toBe(unicode);
  });

  it('handles special but valid characters', () => {
    const special = 'sample-name_v2.0 (final) [mix].wav';
    const result = sanitizeFilename(special);
    expect(result).toBe(special);
  });
});
