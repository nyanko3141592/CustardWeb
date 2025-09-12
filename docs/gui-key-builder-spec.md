# GUI Key Builder Specification

## Goals
- Build keys visually and export valid Custard JSON.
- Map every GUI control to a concrete JSON field.
- Support flick (4 directions) and long press (start/repeat, duration).

## JSON Model (subset used by GUI)
- Keyboard (CustardKeyboard)
  - `identifier`, `language`, `input_style`
  - `interface.key_style`: `tenkey_style` | `pc_style`
  - `interface.key_layout`: `{ type: 'grid_fit', column_count, row_count }`
  - `interface.keys`: Array of KeyWrapper | Key
- KeyWrapper (preferred in presets)
  - `key_type`: `custom` | `system`
  - `specifier`: `{ x, y, width, height }` (grid units)
  - `key`: Key | SystemKey
- Key (custom)
  - `design.label`: one of
    - `{ text: string }`
    - `{ system_image: string }` (e.g., `delete.left`, `return`)
    - `{ type: 'main_and_sub', main: string, sub?: string }` or `{ main: { text }, sub?: { text } }`
  - `design.color`: `normal` | `special` | `selected` | `unimportant`
  - `press_actions`: Action[]
  - `longpress_actions`: `{ start?: Action[]; repeat?: Action[]; duration?: 'short'|'normal'|'long' }`
  - `variations`: up to 4 flick variations as
    - `{ type: 'flick_variation', direction: 'left'|'top'|'right'|'bottom', key: Key }`
- Common Actions (examples in presets)
  - `input` `{ type: 'input', text }`
  - `delete` `{ type: 'delete', count }`
  - `complete` `{ type: 'complete' }`
  - `move_cursor` `{ type: 'move_cursor', count, direction? }`
  - `smart_delete_default`, `toggle_cursor_bar`, etc.

## GUI Mapping
- Canvas (Preview)
  - Grid-based placement; drag to select a key. Dashed outline for empty cells.
  - Cross focus shows center + flick directions.
- Inspector (Properties)
  1) Label
     - Type: Text | Main+Sub | System Image
     - Inputs: text/main/sub or system_image name
  2) Color
     - Enum select: normal/special/selected/unimportant
  3) Actions
     - Press actions: add/remove/reorder common actions with params
     - Long press: sections for Start / Repeat, Duration select
  4) Flick Variations
     - Left/Up/Right/Down: enable toggle per direction, edit nested Key like above
  5) Layout
     - X, Y, Width, Height (grid units)

## Preview Improvements (Long Press)
- Show a small "LP" badge if longpress_actions exist.
- Optional: simulate long press (press-and-hold) to highlight long-press actions.

## Defaults & Validation
- New keys start as `{ design: { label: { text: '' }, color: 'normal' }, press_actions: [] }`.
- Validate: label present for non-placeholder; directions unique; widths/heights >=1; action params required.

## Export/Import
- Export entire keyboard JSON (download). Import JSON to resume editing.
- Presets from `src/lib/templates/` appear in Preset select; editing forks into `Keyboard{n}` in localStorage.
