# Release Notes Template

Use this template when creating GitHub releases.

---

## What's New in v{VERSION}

<!-- Add your release notes here -->

## Features
- Feature 1
- Feature 2

## Bug Fixes
- Fix 1
- Fix 2

## Known Issues
- Issue 1

## Downloads

Choose the appropriate installer for your platform:
- **macOS**: `Multigrain-Sample-Manager-{VERSION}-arm64.dmg` or `Multigrain-Sample-Manager-{VERSION}-x64.dmg`
- **Windows**: `Multigrain-Sample-Manager-{VERSION}-Setup.exe`
- **Linux (Debian/Ubuntu)**: `multigrain-sample-manager_{VERSION}_amd64.deb`
- **Linux (RHEL/Fedora)**: `multigrain-sample-manager-{VERSION}-1.x86_64.rpm`

---

## ⚠️ Important Note for macOS Users

**macOS will block this application** because it's not code-signed with an Apple Developer certificate. This is not because the app is damaged - it's Apple's way of blocking unsigned applications.

**Apple requires developers to pay $99/year** for code signing, which is an unreasonable barrier for free and open-source software. We've chosen to keep this software free rather than pass that cost on to users or pay Apple's developer tax.

**To install on macOS:**
1. Download the `.dmg` file above
2. Follow the detailed bypass instructions: https://ordonez.tv/2024/11/04/how-to-run-unsigned-apps-in-macos-15-1/
3. See [MACOS_INSTALL.md](https://github.com/gloeglm/multigrain-ui/blob/main/MACOS_INSTALL.md) for more information

**Always download from this official GitHub repository** to ensure you're getting the authentic application.

---

## Full Changelog
{COMMIT_RANGE}
