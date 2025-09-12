# Changelog

All notable changes to CustardWeb will be documented in this file.

## [Unreleased]

### Added
- **Enhanced JSON Editor**: 
  - Improved UX and validation with better error reporting
  - Collapsible panel with persistent state
  - Clear JSON toggle for preview-only mode
  
- **Properties Panel**:
  - New key inspector with custom/system key type selection
  - Duplicate and delete key controls
  - Comprehensive flick variation editor with direction-specific settings (up/left/right/down)
  - Cross-shaped selector for intuitive flick direction management
  - Individual enable/disable, label, color, and action settings per direction

- **Keyboard Settings Editor**:
  - New tabbed interface for comprehensive keyboard configuration
  - Support for layout, themes, and advanced settings
  
- **Key Editing Features**:
  - Click empty cells in preview to add new custom keys at grid positions
  - System image support for keys
  - Press and long-press action editors in inspector
  - Action chips with icons and tooltips in preview
  
- **Display Modes**:
  - Toggle between 表示 (display) and アクション (action) modes
  - Visual representation of key press and long-press actions
  - Action summary with icon chips and +N indicators

- **Export Enhancements**:
  - AzooKey export normalization support
  - Improved JSON validation and formatting

- **UI/UX Improvements**:
  - Reordered panels to Preview | Properties | JSON for better workflow
  - Enlarged phone frame with maximized keyboard area (360px grid)
  - Better action display with wrapping and tooltips
  - Long-press badges and indicators on keys
  
### Fixed
- Null reference error in flick debug logging
- TypeScript compilation errors for production build
- Hook order consistency in KeyInspector component
- Panel overflow issues with flick variation editor

### Changed
- Panel layout now follows Preview | Properties | JSON order
- Properties panel width increased for better content display
- Flick variations now displayed in spatial cross grid layout
- Key labels auto-wrap with underscores as break hints

## [0.1.0] - Initial Release

### Added
- Basic keyboard preview with grid-accurate layout
- JSON editor with syntax highlighting
- Preset support for QWERTY and Japanese Flick keyboards
- Local storage for custom keyboard layouts
- Resizable panels with persistent state
- Export functionality for keyboard layouts