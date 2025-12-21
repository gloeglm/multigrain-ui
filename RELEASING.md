# Release Process

This document describes how to create a new release of Multigrain Sample Manager.

## Prerequisites

- Push access to the repository
- All changes committed and pushed to `main` branch
- All tests passing locally and on CI
- No uncommitted changes

## Release Steps

### 1. Update Version

Use npm's version command to bump the version in `package.json`:

```bash
# For bug fixes (1.0.0 -> 1.0.1)
npm version patch

# For new features (1.0.0 -> 1.1.0)
npm version minor

# For breaking changes (1.0.0 -> 2.0.0)
npm version major
```

This will:
- Update the version in `package.json`
- Create a git commit with message "v1.0.1" (or whatever version)
- Create a git tag "v1.0.1"

### 2. Push Changes and Tags

```bash
git push origin main --follow-tags
```

This pushes both the version commit and the tag to GitHub.

### 3. Wait for GitHub Actions

The release workflow (`.github/workflows/release.yml`) will automatically:
1. Run on the new tag
2. Build installers for Windows, macOS, and Linux in parallel
3. Run tests, type checking, and linting on each platform
4. Create a **draft** GitHub Release with all installers attached

**Status**: Monitor progress at https://github.com/gloeglm/multigrain-ui/actions

### 4. Review and Publish the Release

1. Navigate to: https://github.com/gloeglm/multigrain-ui/releases
2. Find the draft release created by the workflow
3. Review the auto-generated release notes
4. Edit if needed (add highlights, breaking changes, etc.)
5. Click **Publish release** to make it public

## Release Artifacts

Each release includes installers for:

- **Windows**: `Multigrain-Sample-Manager-Setup-{version}.exe` (Squirrel installer)
- **macOS**: `Multigrain-Sample-Manager-{version}-universal.zip` (Universal binary)
- **Linux**:
  - `.deb` package for Debian/Ubuntu
  - `.rpm` package for Fedora/RedHat

## Troubleshooting

### Build Failed on One Platform

If a build fails on one platform but succeeds on others:
1. Check the GitHub Actions logs for the failing platform
2. Fix the issue in the code
3. Create a new patch version and repeat the process

### Release Not Created

If the workflow runs but no release is created:
1. Check that `GITHUB_TOKEN` has proper permissions
2. Verify the tag matches the pattern `v*.*.*`
3. Check the workflow logs for errors from `npm run publish`

### Duplicate Releases

If you need to delete a release and re-run:
1. Delete the release on GitHub (this keeps the tag)
2. Delete the tag locally: `git tag -d v1.0.1`
3. Delete the tag remotely: `git push origin :refs/tags/v1.0.1`
4. Start over from step 1 (Update Version)

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes that require user action
- **MINOR** (1.0.0 -> 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 -> 1.0.1): Bug fixes, backwards compatible

## Code Signing (Future)

Currently, the builds are **not code signed**. This means:
- **Windows**: Users will see a SmartScreen warning
- **macOS**: Users will need to right-click and select "Open" the first time

To add code signing in the future:
1. Obtain certificates (Apple Developer ID, Windows Code Signing Certificate)
2. Add secrets to GitHub repository settings
3. Update `forge.config.js` with signing configuration
4. Update the release workflow to use signing secrets

## Auto-Updates (Future)

Electron Forge supports auto-updates via electron-updater. This can be added later by:
1. Configuring update servers
2. Adding update check code to the app
3. Testing update flows thoroughly

For now, users will need to manually download new versions.
