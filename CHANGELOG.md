# Changelog

## v0.5.0 (2026-03-29)

First signed and notarized release — no more Gatekeeper warnings on macOS.

### What's New
- **Renumber existing samples** — You can now assign or update number prefixes on samples already on your SD card, not just during import. Right-click any sample in the file tree to manage its numbering.
- **Export project overview sheet** — Right-click a project in the file tree to export a PDF overview of all its samples and presets in one go, great for keeping a printed reference for your case.

### Fixes
- PDF reference sheets no longer include a blank page at the end

---

## v0.1.0-beta.3

### New Features
- **Sample numbering during import** — Samples are automatically assigned number prefixes when imported, keeping them in a predictable order on the module

### Bug Fixes
- Fixed macOS DMG maker configuration

---

## v0.1.0-beta.2

### New Features
- **PDF reference sheet export** — Export printable reference sheets for projects showing sample assignments and preset layouts

### Bug Fixes
- Fixed ImportDialog state not resetting correctly between imports

---

## v0.1.0-beta.1

Initial beta release.

### Features
- Browse and navigate SD card structure with validation
- Audio preview with waveform visualization
- Sample import with auto-conversion (48kHz / 16-bit / stereo via FFmpeg)
- Rename and delete samples and projects
- Create projects with custom naming and factory presets
- Preset viewer with intelligent sample location resolution
- Metadata editing — custom descriptions for projects and samples
- Project overview dashboard with statistics
