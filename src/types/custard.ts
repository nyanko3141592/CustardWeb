export interface CustardKeyboard {
  identifier: string
  language: string
  input_style: string
  metadata: {
    custard_version: string
    display_name: string
  }
  interface: {
    key_layout: {
      type: 'grid_fit' | 'grid_scroll'
      row_count?: number
      column_count?: number
    }
    key_style: 'tenkey_style' | 'pc_style'
    keys: (Key | KeyWrapper)[]
  }
}

export interface KeyWrapper {
  key_type: 'custom' | 'system'
  specifier_type?: 'grid_fit'
  specifier?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
  key: Key | SystemKey
}

export interface SystemKey {
  type: string
}

export interface Key {
  design: {
    label: LabelDesign
    color?: 'normal' | 'special' | 'selected' | 'unimportant'
  }
  press_actions?: Action[]
  longpress_actions?: {
    start?: Action[]
    repeat?: Action[]
    duration?: string
  }
  variations?: (Key | FlickVariation)[]
  specifier?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
}

export interface FlickVariation {
  type: 'flick_variation'
  direction: 'left' | 'top' | 'right' | 'bottom'
  key: Key
}

export type LabelDesign = 
  | { text: string }
  | { 
      main: { text: string }
      sub?: { text: string }
    }
  | { system_image: string }

export interface Action {
  type: string
  [key: string]: any
}

export interface InputAction extends Action {
  type: 'input'
  text: string
}

export interface DeleteAction extends Action {
  type: 'delete'
  count: number
  direction?: 'forward' | 'backward'
}

export interface MoveCursorAction extends Action {
  type: 'move_cursor'
  count: number
  direction: 'forward' | 'backward'
}

export interface CompleteAction extends Action {
  type: 'complete'
}

export interface MoveTabAction extends Action {
  type: 'move_tab'
  tab_type: string
}