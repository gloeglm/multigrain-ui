# Changelog

## v0.5.0 (2026-03-29)

### New Features
- **Sample number prefix management** — Assign or update number prefixes on existing samples directly from the file tree, not just during import
- **Export Overview Sheet** — Export a PDF overview sheet for a project from the Projects context menu, in addition to the existing per-project sheet export

### Bug Fixes
- Fixed a blank extra page appearing at the end of PDF overview and project reference sheets

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
