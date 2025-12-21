# CI/CD Documentation

## Current Setup

### Test Workflow (`.github/workflows/test.yml`)

Automatically runs tests on every push and pull request to the `main` branch.

**What it does:**
- Checks out the code
- Sets up Node.js 20 with npm caching
- Installs dependencies with `npm ci`
- Runs the full test suite (`npm test -- --run`)
- Uploads test results as artifacts

**Status Badge:**
```markdown
![Tests](https://github.com/gloeglm/multigrain-ui/actions/workflows/test.yml/badge.svg)
```

**Viewing Results:**
- Navigate to: https://github.com/gloeglm/multigrain-ui/actions
- Click on any workflow run to see detailed logs
- Download test artifacts if available

## Test Suite

**Current Status:** 111 tests passing across 7 test files

**Test Coverage:**
- Infrastructure & utilities (54 tests)
- IPC handlers with security validation (29 tests)
- App helper functions (11 tests)
- SampleInfo component (23 tests)
- Integration tests (2 tests)

**Running Tests Locally:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --run

# Run specific test file
npm test -- src/path/to/file.test.tsx
```

## Future Enhancements

### Multi-Platform Testing
Expand the test workflow to run on multiple platforms:
- ubuntu-latest (Linux)
- macos-latest (macOS)
- windows-latest (Windows)

This will catch platform-specific issues early.

### Release Workflow
Create a separate workflow for building and releasing:
- Trigger on version tags (`v*.*.*`)
- Build installers for Windows, macOS, Linux
- Upload to GitHub Releases
- Generate release notes automatically

### Code Coverage
Add coverage reporting:
- Generate coverage reports with vitest
- Upload to Codecov or similar service
- Add coverage badge to README

### Linting & Type Checking
Add additional quality checks:
- ESLint for code quality
- TypeScript type checking (`tsc --noEmit`)
- Prettier for formatting

## Troubleshooting

### Tests Failing on CI but Passing Locally

**Common causes:**
1. **Missing dependencies** - CI uses `npm ci` which requires exact versions
2. **Environment differences** - CI runs on Linux, your local might be macOS/Windows
3. **Timing issues** - CI might be slower, adjust timeouts in tests
4. **File paths** - Use path.join() for cross-platform compatibility

**Solution:**
- Run `npm ci` locally instead of `npm install`
- Test in a clean environment (delete node_modules and reinstall)
- Check GitHub Actions logs for specific error messages

### Workflow Not Triggering

**Checklist:**
- [ ] Workflow file is in `.github/workflows/` directory
- [ ] File has `.yml` or `.yaml` extension
- [ ] Pushed to the correct branch (main)
- [ ] No syntax errors in YAML (check indentation)

### Badge Not Showing

The badge will appear once:
1. The workflow has run at least once
2. You've pushed to GitHub
3. The badge URL matches your repository

**Badge URL format:**
```
https://github.com/{owner}/{repo}/actions/workflows/{workflow-file}/badge.svg
```

## Maintenance

### Keeping Actions Up to Date

GitHub Actions should be updated periodically:
```yaml
actions/checkout@v4      # Update to latest v4.x
actions/setup-node@v4    # Update to latest v4.x
actions/upload-artifact@v4  # Update to latest v4.x
```

Check for updates: https://github.com/actions

### Node.js Version

Currently using Node.js 20. Update when:
- New LTS version released
- Security vulnerabilities discovered
- Dependencies require newer version

## Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [Electron Forge CI/CD Guide](https://www.electronforge.io/guides/continuous-integration)
- [Vitest Documentation](https://vitest.dev/)
