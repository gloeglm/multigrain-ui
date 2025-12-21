# Testing Guide

## Running Tests

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode (re-run on file changes)
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Global test setup and Electron API mocks
│   ├── helpers.tsx        # Test utilities and mock factories
│   ├── setup.test.ts      # Infrastructure verification tests
│   └── README.md          # This file
├── main/
│   └── **/*.test.ts       # Unit tests for main process code
└── renderer/
    └── **/*.test.tsx      # Component and integration tests
```

## Writing Tests

### Utility Function Tests

```typescript
// src/main/utils/fileConflictResolver.test.ts
import { describe, it, expect } from 'vitest';
import { generateUniqueFilename } from './fileConflictResolver';

describe('generateUniqueFilename', () => {
  it('returns original filename when no conflicts', () => {
    const result = generateUniqueFilename('test.wav', []);
    expect(result).toBe('test.wav');
  });

  it('adds _1 suffix when file exists', () => {
    const result = generateUniqueFilename('test.wav', ['test.wav']);
    expect(result).toBe('test_1.wav');
  });
});
```

### IPC Handler Tests

```typescript
// src/main/ipc/fileOperations.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';

// Mock fs module with memfs
vi.mock('fs', () => ({ default: vol }));
vi.mock('fs/promises', () => vol.promises);

describe('renameSample', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/test/sample.wav': 'audio data',
    });
  });

  it('renames sample successfully', async () => {
    const result = await renameSample('/test/sample.wav', 'renamed');
    expect(result.success).toBe(true);
    expect(result.newName).toBe('renamed.wav');
  });

  it('rejects invalid characters', async () => {
    const result = await renameSample('/test/sample.wav', 'bad:name');
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid characters');
  });
});
```

### Component Tests

```typescript
// src/renderer/components/AudioPlayer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';
import { createMockSample } from '../../test/helpers';

describe('AudioPlayer', () => {
  it('renders sample name', () => {
    const sample = createMockSample({ name: 'test.wav' });
    render(<AudioPlayer sample={sample} />);
    expect(screen.getByText('test.wav')).toBeInTheDocument();
  });

  it('enters edit mode on rename button click', async () => {
    const sample = createMockSample();
    render(<AudioPlayer sample={sample} />);

    await userEvent.click(screen.getByText('Rename'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

## Mock Factories

Use helper functions from `src/test/helpers.tsx` to create mock data:

```typescript
import {
  createMockStructure,
  createMockSample,
  createMockPreset,
  createMockProject,
  createMockStructureWithData
} from '../test/helpers';

// Create minimal mock
const sample = createMockSample();

// Override specific properties
const sample = createMockSample({ name: 'custom.wav', size: 2048 });

// Create complete structure with relationships
const structure = createMockStructureWithData();
```

## Testing Best Practices

1. **Focus on behavior, not implementation**
   - Test what the user sees and does
   - Avoid testing internal state or private methods

2. **Use descriptive test names**
   - `it('shows error message when rename fails')`
   - Not: `it('test rename error')`

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('updates display when sample renamed', async () => {
     // Arrange - set up test data
     const sample = createMockSample();
     render(<Component sample={sample} />);

     // Act - perform action
     await userEvent.click(screen.getByText('Rename'));

     // Assert - verify result
     expect(screen.getByRole('textbox')).toBeInTheDocument();
   });
   ```

4. **Mock external dependencies**
   - File system operations (use memfs)
   - Electron APIs (already mocked in setup.ts)
   - Network requests (if any)

5. **Keep tests fast**
   - Use mocks instead of real I/O
   - Avoid setTimeout/delays when possible
   - Use `userEvent` instead of `fireEvent`

## Coverage Goals

- **Utilities**: 80%+ (easy to test, high value)
- **IPC Handlers**: 60%+ (mock file system)
- **Components**: 30%+ (critical paths only)

Run `npm run test:coverage` to see current coverage.

## Debugging Tests

1. **Use test.only to focus on one test**
   ```typescript
   it.only('should debug this test', () => {
     // Only this test will run
   });
   ```

2. **Use screen.debug() to see DOM**
   ```typescript
   render(<Component />);
   screen.debug(); // Prints current DOM
   ```

3. **Run tests with UI for better debugging**
   ```bash
   npm run test:ui
   ```

4. **Check mock calls**
   ```typescript
   expect(window.electronAPI.renameSample).toHaveBeenCalledWith(
     '/path/to/sample.wav',
     'newname'
   );
   ```
