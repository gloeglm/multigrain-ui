# Installing Multigrain Sample Manager on macOS

## Important Note About Code Signing

This application is **not code-signed** with an Apple Developer certificate. Apple requires developers to pay $99/year for code signing certificates, which is an unreasonable barrier for free and open-source software. As a result, macOS Gatekeeper will block the application from running with an error message claiming the app is "damaged."

**The app is not actually damaged** - this is Apple's way of blocking unsigned applications.

## Installation Steps

1. Download the `.dmg` file from the [Releases](https://github.com/gloeglm/multigrain-ui/releases) page
2. Open the downloaded `.dmg` file
3. Drag the application to your Applications folder
4. **Follow the bypass instructions below** to allow the app to run

## Bypassing Gatekeeper

To run unsigned applications on modern macOS, follow this detailed guide:

**https://ordonez.tv/2024/11/04/how-to-run-unsigned-apps-in-macos-15-1/**

This guide provides step-by-step instructions with screenshots for removing the quarantine flag and allowing the application to run.

## Why Is This Necessary?

Apple requires all distributed macOS applications to be code-signed and notarized, which requires:
- An Apple Developer account ($99/year)
- Submitting the app to Apple for review before each release

For free, open-source projects like Multigrain Sample Manager, this creates an unnecessary financial burden. We've chosen to distribute the app unsigned rather than charge users or pay Apple's developer fee.

**Your security is still important:** Always download the app from the official [GitHub Releases](https://github.com/gloeglm/multigrain-ui/releases) page to ensure you're getting the authentic, unmodified application.

## Need Help?

If you encounter issues during installation:
1. Check the [main README](README.md) for general troubleshooting
2. Review the detailed guide linked above
3. Open an issue on [GitHub](https://github.com/gloeglm/multigrain-ui/issues)
