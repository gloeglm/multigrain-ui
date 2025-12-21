import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to vi global', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should have window.electronAPI mocked', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.renameSample).toBeDefined();
  });
});
