import React, { useMemo, useState, useEffect, useRef } from 'react'
import KeyButton from './KeyButton'
import { CustardKeyboard, KeyWrapper, Key } from '@/types/custard'

interface KeyInspectorProps {
  keyboard: CustardKeyboard
  selectedIndex: number | null
  onChange: (kb: CustardKeyboard) => void
}

function coerceKeyAt(item: KeyWrapper | Key): Key | null {
  if (!item) return null as any
  if ((item as any).key_type) {
    const wrapper = item as KeyWrapper
    return (wrapper.key as Key) || null
  }
  return item as Key
}

export default function KeyInspector({ keyboard, selectedIndex, onChange }: KeyInspectorProps) {
  const item = selectedIndex != null ? keyboard.interface.keys[selectedIndex] : undefined
  const keyData = item ? coerceKeyAt(item as any) : null
  const isWrapper = !!(item as any)?.key_type
  const isSystem = isWrapper && (item as any).key_type === 'system'

  const labelType = useMemo(() => {
    const label = (keyData as any)?.design?.label
    if (!label) return 'text'
    if (typeof label.system_image === 'string') return 'system_image'
    if (typeof label.text === 'string') return 'text'
    if (typeof label.main === 'string' || (label.main && typeof label.main.text === 'string')) return 'main_and_sub'
    return 'text'
  }, [keyData])

  // UI state (must be declared before any conditional return to keep hook order stable)
  const [activeVarDir, setActiveVarDir] = useState<null | 'left' | 'up' | 'right' | 'down'>(null)
  const [customSystemType, setCustomSystemTypeState] = useState('')
  
  // Label input states for controlled components
  const [labelInputs, setLabelInputs] = useState({
    text: '',
    main: '',
    sub: '',
    system_image: ''
  })
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    keyType: true,
    label: true,
    color: true,
    layout: true,
    press: true,
    longpress: true,
    flick: true,
  })
  useEffect(() => {
    try {
      const raw = localStorage.getItem('custard:inspectorOpen')
      if (raw) setOpenSections(prev => ({ ...prev, ...(JSON.parse(raw)||{}) }))
    } catch {}
  }, [])
  const toggleSection = (k: string) => setOpenSections(prev => {
    const next = { ...prev, [k]: !prev[k] }
    try { localStorage.setItem('custard:inspectorOpen', JSON.stringify(next)) } catch {}
    return next
  })

  const updateKeyboard = (updater: (k: CustardKeyboard) => void) => {
    const kb = JSON.parse(JSON.stringify(keyboard)) as CustardKeyboard
    updater(kb)
    onChange(kb)
  }

  const setKeyType = (type: 'custom'|'system') => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      const it: any = kb.interface.keys[selectedIndex]
      if (it && it.key_type) {
        it.key_type = type
        if (type === 'system') {
          it.key = { type: (it.key && (it.key as any).type) || '' }
        } else {
          it.key = (coerceKeyAt(it) as any) || { design: { label: { type: 'text', text: '' }, color: 'normal' }, press_actions: [] }
        }
      } else {
        // Wrap into KeyWrapper
        const spec = (it as any)?.specifier
        const wrapped: any = { key_type: type, specifier: spec, key: type==='system' ? { type: '' } : (it as any) }
        kb.interface.keys[selectedIndex] = wrapped
      }
    })
  }

  const setSystemType = (value: string) => {
    if (selectedIndex == null) return
    if (value === 'custom') {
      // カスタム選択時は何もしない（入力フィールドで設定）
      return
    }
    updateKeyboard(kb => {
      const it: any = kb.interface.keys[selectedIndex]
      if (!it || it.key_type !== 'system') return
      it.key = { type: value }
    })
  }
  
  const setCustomSystemTypeValue = (value: string) => {
    if (selectedIndex == null) return
    setCustomSystemTypeState(value)
    updateKeyboard(kb => {
      const it: any = kb.interface.keys[selectedIndex]
      if (!it || it.key_type !== 'system') return
      it.key = { type: value }
    })
  }

  const duplicateKey = () => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      const it = JSON.parse(JSON.stringify(kb.interface.keys[selectedIndex]!))
      kb.interface.keys.splice(selectedIndex! + 1, 0, it)
    })
  }

  const deleteKey = () => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      kb.interface.keys.splice(selectedIndex!, 1)
    })
  }

  const updateLabelField = (field: 'text'|'system_image'|'main'|'sub', value: string) => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      const item = kb.interface.keys[selectedIndex] as any
      const k: Key = (item.key_type ? item.key : item) as Key
      k.design = k.design || ({} as any)
      const curr = (k.design as any).label || {}
      let next: any = {}
      if (field === 'system_image') {
        next = { type: 'system_image', system_image: value }
      } else if (field === 'text') {
        next = { type: 'text', text: value }
      } else {
        // main_and_sub
        const main = field === 'main' ? value : (curr.main?.text || curr.main || '')
        const sub = field === 'sub' ? value : (curr.sub?.text || curr.sub || '')
        next = { type: 'main_and_sub', main, sub }
      }
      ;(k.design as any).label = next
    })
  }

  const updateColor = (color: string) => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      const item = kb.interface.keys[selectedIndex] as any
      const k: Key = (item.key_type ? item.key : item) as Key
      k.design = k.design || ({} as any)
      ;(k.design as any).color = color as any
    })
  }

  const updateSpecifier = (field: 'x'|'y'|'width'|'height', value: number) => {
    if (selectedIndex == null) return
    updateKeyboard(kb => {
      const item = kb.interface.keys[selectedIndex] as any
      const target = item.key_type ? item : (item) // wrapper preferred for specifier
      target.specifier = target.specifier || {}
      target.specifier[field] = value
    })
  }

  const label = (keyData as any)?.design?.label || {}
  
  // Sync label inputs when selected key changes - MUST be before conditional return
  useEffect(() => {
    if (keyData) {
      setLabelInputs({
        text: label.text || '',
        main: label.main?.text || label.main || '',
        sub: label.sub?.text || label.sub || '',
        system_image: label.system_image || ''
      })
    }
  }, [selectedIndex, keyData, label.text, label.main, label.sub, label.system_image])

  if (!keyData) {
    return <div className="text-sm text-gray-500">キーを選択してください</div>
  }
  const color = (keyData as any).design?.color || 'normal'
  const spec = (item as any)?.specifier || {}

  return (
    <div className="space-y-4">
      {/* Key Type & Ops */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('keyType')} className="text-left text-xs font-semibold text-gray-600">Key Type {openSections.keyType ? '▾' : '▸'}</button>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => {
                if (confirm('キーの全設定（ラベル、アクション、フリック）をリセットしますか？')) {
                  updateKeyboard(kb => {
                    const item = kb.interface.keys[selectedIndex!] as any
                    const k: Key = (item.key_type ? item.key : item) as Key
                    // Reset all key data
                    k.design = { label: { text: '' } as any, color: 'normal' }
                    ;(k as any).press_actions = []
                    ;(k as any).variations = []
                    delete (k as any).longpress_actions
                  })
                  // Reset UI state
                  setLabelInputs({
                    text: '',
                    main: '',
                    sub: '',
                    system_image: ''
                  })
                  setActiveVarDir(null)
                }
              }}
              className="px-2 py-1 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded"
              title="キーの全設定をリセット"
            >
              🔄 リセット
            </button>
            <button className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200" onClick={duplicateKey}>Duplicate</button>
            <button className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100" onClick={deleteKey}>Delete</button>
          </div>
        </div>
        {openSections.keyType && (
          <>
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-1"><input type="radio" name="key-type" checked={!isSystem} onChange={()=>setKeyType('custom')} /> <span>Custom</span></label>
              <label className="flex items-center space-x-1"><input type="radio" name="key-type" checked={isSystem} onChange={()=>setKeyType('system')} /> <span>System</span></label>
            </div>
            {isSystem && (
              <div className="mt-2">
                <select 
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={(item as any)?.key?.type || ''}
                  onChange={(e) => setSystemType(e.target.value)}
                >
                  <option value="">システムキータイプを選択</option>
                  <optgroup label="タブ切り替え">
                    <option value="flick_abc_tab">英数字タブ (flick_abc_tab)</option>
                    <option value="flick_hira_tab">ひらがなタブ (flick_hira_tab)</option>
                    <option value="flick_star123_tab">記号・数字タブ (flick_star123_tab)</option>
                  </optgroup>
                  <optgroup label="入力機能">
                    <option value="enter">エンター (enter)</option>
                    <option value="change_keyboard">キーボード切り替え (change_keyboard)</option>
                    <option value="flick_kogaki">小文字化 (flick_kogaki)</option>
                    <option value="flick_kutoten">句読点 (flick_kutoten)</option>
                    <option value="upper_lower">英字 大小切替 (upper_lower)</option>
                    <option value="next_candidate">次候補 (next_candidate)</option>
                  </optgroup>
                  <optgroup label="その他">
                    <option value="custom">カスタム...</option>
                  </optgroup>
                </select>
                {(item as any)?.key?.type === 'custom' && (
                  <input 
                    className="w-full border rounded px-2 py-1 text-sm mt-2" 
                    placeholder="カスタムシステムキータイプを入力"
                    value={customSystemType}
                    onChange={(e) => setCustomSystemTypeValue(e.target.value)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </section>
      {/* Label */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('label')} className="text-left text-xs font-semibold text-gray-600">Label {openSections.label ? '▾' : '▸'}</button>
          {openSections.label && (
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => {
                  if (confirm('メインラベルのみ残して、サブラベルをクリアしますか？')) {
                    updateKeyboard(kb => {
                      const item = kb.interface.keys[selectedIndex!] as any
                      const k: Key = (item.key_type ? item.key : item) as Key
                      if (k.design && k.design.label) {
                        const currentLabel = k.design.label
                        let mainText = ''
                        
                        // 現在のラベルからメインテキストを取得
                        const label = currentLabel as any
                        if (typeof label.text === 'string') {
                          mainText = label.text
                        } else if (typeof label.main === 'string') {
                          mainText = label.main
                        } else if (label.main && typeof label.main.text === 'string') {
                          mainText = label.main.text
                        } else if (typeof label.system_image === 'string') {
                          mainText = label.system_image
                        }
                        
                        // メインテキストのみでシンプルなラベルに設定
                        k.design.label = { text: mainText }
                      }
                    })
                    // Update input states
                    const currentLabel = (keyData as any)?.design?.label
                    let mainText = ''
                    if (currentLabel) {
                      if (typeof currentLabel.text === 'string') {
                        mainText = currentLabel.text
                      } else if (typeof currentLabel.main === 'string') {
                        mainText = currentLabel.main
                      } else if (currentLabel.main && typeof currentLabel.main.text === 'string') {
                        mainText = currentLabel.main.text
                      } else if (typeof currentLabel.system_image === 'string') {
                        mainText = currentLabel.system_image
                      }
                    }
                    setLabelInputs({
                      text: mainText,
                      main: '',
                      sub: '',
                      system_image: ''
                    })
                  }
                }}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                title="メインラベルのみ残す"
              >
                🎯 メインのみ
              </button>
              <button 
                onClick={() => {
                  if (confirm('ラベル設定をクリアしますか？')) {
                    updateKeyboard(kb => {
                      const item = kb.interface.keys[selectedIndex!] as any
                      const k: Key = (item.key_type ? item.key : item) as Key
                      if (k.design) {
                        k.design.label = { text: '' } as any
                      }
                    })
                    // Reset input states
                    setLabelInputs({
                      text: '',
                      main: '',
                      sub: '',
                      system_image: ''
                    })
                  }
                }}
                className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                title="ラベル設定をクリア"
              >
                🗑️ クリア
              </button>
            </div>
          )}
        </div>
        {openSections.label && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs">
            <label className="flex items-center space-x-1"><input type="radio" name="label-type" defaultChecked={labelType==='text'} onChange={() => updateLabelField('text', (label.text||''))}/> <span>Text</span></label>
            <label className="flex items-center space-x-1"><input type="radio" name="label-type" defaultChecked={labelType==='main_and_sub'} onChange={() => updateLabelField('main', (label.main?.text||label.main||''))}/> <span>Main+Sub</span></label>
            <label className="flex items-center space-x-1"><input type="radio" name="label-type" defaultChecked={labelType==='system_image'} onChange={() => updateLabelField('system_image', (label.system_image||''))}/> <span>System</span></label>
          </div>
          {labelType === 'text' && (
            <input 
              className="w-full border rounded px-2 py-1 text-sm" 
              value={labelInputs.text} 
              onChange={(e) => {
                setLabelInputs(prev => ({ ...prev, text: e.target.value }))
                updateLabelField('text', e.target.value)
              }} 
              placeholder="Label text" 
            />
          )}
          {labelType === 'main_and_sub' && (
            <div className="flex space-x-2">
              <input 
                className="flex-1 border rounded px-2 py-1 text-sm" 
                value={labelInputs.main} 
                onChange={(e) => {
                  setLabelInputs(prev => ({ ...prev, main: e.target.value }))
                  updateLabelField('main', e.target.value)
                }} 
                placeholder="Main" 
              />
              <input 
                className="w-28 border rounded px-2 py-1 text-sm" 
                value={labelInputs.sub} 
                onChange={(e) => {
                  setLabelInputs(prev => ({ ...prev, sub: e.target.value }))
                  updateLabelField('sub', e.target.value)
                }} 
                placeholder="Sub" 
              />
            </div>
          )}
          {labelType === 'system_image' && (
            <div>
              <input 
                className="w-full border rounded px-2 py-1 text-sm" 
                value={labelInputs.system_image} 
                onChange={(e) => {
                  setLabelInputs(prev => ({ ...prev, system_image: e.target.value }))
                  updateLabelField('system_image', e.target.value)
                }} 
                placeholder="SFSymbol (e.g., delete.left)" 
                list="sfsymbols-list"
              />
              <datalist id="sfsymbols-list">
                <option value="delete.left" />
                <option value="delete.backward" />
                <option value="xmark" />
                <option value="return" />
                <option value="space" />
                <option value="globe" />
                <option value="arrow.left" />
                <option value="arrow.right" />
                <option value="chevron.left" />
                <option value="chevron.right" />
                <option value="square.and.arrow.up" />
                <option value="mic" />
                <option value="ellipsis" />
                <option value="gearshape" />
                <option value="hand.tap" />
              </datalist>
              <div className="mt-1 text-[11px] text-gray-500">
                よく使うSFSymbol例を候補から選択できます（自由入力も可）。
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {['delete.left','xmark','return','arrow.left','arrow.right','square.and.arrow.up','gearshape'].map(sym => (
                  <button key={sym} className="px-1.5 py-0.5 text-[11px] border rounded hover:bg-gray-50" onClick={()=>{ setLabelInputs(prev=>({...prev, system_image: sym})); updateLabelField('system_image', sym) }}>{sym}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </section>

      {/* Flick Variations (Cross selector + detail editor) */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('flick')} className="text-left text-xs font-semibold text-gray-600">Flick Variations {openSections.flick ? '▾' : '▸'}</button>
          {openSections.flick && (
            <button 
              onClick={() => {
                if (confirm('全てのフリックバリエーションをクリアしますか？')) {
                  updateKeyboard(kb => {
                    const item = kb.interface.keys[selectedIndex!] as any
                    const k: Key = (item.key_type ? item.key : item) as Key
                    ;(k as any).variations = []
                  })
                }
              }}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
              title="全てのフリックバリエーションをクリア"
            >
              🗑️ 全クリア
            </button>
          )}
        </div>
        {openSections.flick && (
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <div>
            <VariationCard dirLabel="上" dirKey="up" keyboard={keyboard} selectedIndex={selectedIndex!} onChange={onChange} onEdit={setActiveVarDir} />
          </div>
          <div></div>

          <div>
            <VariationCard dirLabel="左" dirKey="left" keyboard={keyboard} selectedIndex={selectedIndex!} onChange={onChange} onEdit={setActiveVarDir} />
          </div>
          <div className="flex items-center justify-center text-[11px] text-gray-400">
            基準キー
          </div>
          <div>
            <VariationCard dirLabel="右" dirKey="right" keyboard={keyboard} selectedIndex={selectedIndex!} onChange={onChange} onEdit={setActiveVarDir} />
          </div>

          <div></div>
          <div>
            <VariationCard dirLabel="下" dirKey="down" keyboard={keyboard} selectedIndex={selectedIndex!} onChange={onChange} onEdit={setActiveVarDir} />
          </div>
          <div></div>
        </div>
        )}
        {openSections.flick && activeVarDir && (
          <div className="mt-3 p-2 border rounded">
            <VariationDetailEditor dirKey={activeVarDir} keyboard={keyboard} selectedIndex={selectedIndex!} onChange={onChange} />
          </div>
        )}
      </section>

      {/* Color */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('color')} className="text-left text-xs font-semibold text-gray-600">Color {openSections.color ? '▾' : '▸'}</button>
        </div>
        {openSections.color && (
          <select className="w-full border rounded px-2 py-1 text-sm" value={color} onChange={(e)=>updateColor(e.target.value)}>
            <option value="normal">normal</option>
            <option value="special">special</option>
            <option value="selected">selected</option>
            <option value="unimportant">unimportant</option>
          </select>
        )}
      </section>

      {/* Layout */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('layout')} className="text-left text-xs font-semibold text-gray-600">Layout {openSections.layout ? '▾' : '▸'}</button>
        </div>
        {openSections.layout && (
        <>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">X</label>
            <input className="w-full border rounded px-2 py-1 text-sm" type="number" min={0} value={spec.x ?? 0} onChange={(e)=>updateSpecifier('x', Math.max(0, Number(e.target.value)))} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Y</label>
            <input className="w-full border rounded px-2 py-1 text-sm" type="number" min={0} value={spec.y ?? 0} onChange={(e)=>updateSpecifier('y', Math.max(0, Number(e.target.value)))} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Width</label>
            <input className="w-full border rounded px-2 py-1 text-sm" type="number" min={1} value={spec.width ?? 1} onChange={(e)=>updateSpecifier('width', Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Height</label>
            <input className="w-full border rounded px-2 py-1 text-sm" type="number" min={1} value={spec.height ?? 1} onChange={(e)=>updateSpecifier('height', Math.max(1, Number(e.target.value)))} />
          </div>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">Grid units • 0-based X,Y • ≥1 for width/height</div>
        </>
        )}
      </section>

      {/* Press Actions */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('press')} className="text-left text-xs font-semibold text-gray-600">Press Actions {openSections.press ? '▾' : '▸'}</button>
          {openSections.press && (
            <button 
              onClick={() => {
                if (confirm('全てのプレスアクションをクリアしますか？')) {
                  updateKeyboard(kb => {
                    const item = kb.interface.keys[selectedIndex!] as any
                    const k: Key = (item.key_type ? item.key : item) as Key
                    ;(k as any).press_actions = []
                  })
                }
              }}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
              title="全てのプレスアクションをクリア"
            >
              🗑️ 全クリア
            </button>
          )}
        </div>
        {openSections.press && (
          <ActionList kind="press" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} />
        )}
      </section>

      {/* Long Press */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button onClick={()=>toggleSection('longpress')} className="text-left text-xs font-semibold text-gray-600">Long Press {openSections.longpress ? '▾' : '▸'}</button>
          {openSections.longpress && (
            <button 
              onClick={() => {
                if (confirm('全てのロングプレスアクションをクリアしますか？')) {
                  updateKeyboard(kb => {
                    const item = kb.interface.keys[selectedIndex!] as any
                    const k: Key = (item.key_type ? item.key : item) as Key
                    delete (k as any).longpress_actions
                  })
                }
              }}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
              title="全てのロングプレスアクションをクリア"
            >
              🗑️ 全クリア
            </button>
          )}
        </div>
        {openSections.longpress && (
        <>
        <div className="mb-2">
          <label className="text-xs text-gray-600 mr-2">Duration</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={(keyData as any).longpress_actions?.duration || 'normal'}
            onChange={(e)=>updateKeyboard(kb => {
              const item = kb.interface.keys[selectedIndex!] as any
              const k: Key = (item.key_type ? item.key : item) as Key
              k.longpress_actions = k.longpress_actions || {}
              ;(k.longpress_actions as any).duration = e.target.value
            })}
          >
            <option value="short">short</option>
            <option value="normal">normal</option>
            <option value="long">long</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-gray-600 mb-1">Start</div>
            <ActionList kind="lp-start" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} />
          </div>
          <div>
            <div className="text-[11px] text-gray-600 mb-1">Repeat</div>
            <ActionList kind="lp-repeat" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} />
          </div>
        </div>
        </>
        )}
      </section>
    </div>
  )
}

// --- Actions Editor ---
interface ActionListProps {
  kind: 'press' | 'lp-start' | 'lp-repeat'
  keyboard: CustardKeyboard
  selectedIndex: number | null
  onChange: (kb: CustardKeyboard) => void
}

function ActionList({ kind, keyboard, selectedIndex, onChange, resolveKey }: ActionListProps & { resolveKey?: (kb: CustardKeyboard) => Key | null }) {
  const item = selectedIndex != null ? keyboard.interface.keys[selectedIndex] : undefined
  const keyData = resolveKey ? resolveKey(keyboard) : (item ? coerceKeyAt(item as any) : null)
  if (!keyData) return null

  const getList = (k: Key): any[] => {
    if (kind === 'press') return (k as any).press_actions || []
    const lp = (k as any).longpress_actions || {}
    return kind === 'lp-start' ? (lp.start || []) : (lp.repeat || [])
  }

  const updateKB = (updater: (k: CustardKeyboard)=>void) => {
    const kb = JSON.parse(JSON.stringify(keyboard)) as CustardKeyboard
    updater(kb)
    onChange(kb)
  }

  const mutate = (fn: (list: any[], k: Key)=>void) => {
    if (selectedIndex == null) return
    updateKB(kb => {
      const k: Key = resolveKey ? (resolveKey(kb) as Key) : (()=>{ const item = kb.interface.keys[selectedIndex!] as any; return (item.key_type ? item.key : item) as Key })()
      const list = getList(k)
      fn(list, k)
      if (kind === 'press') (k as any).press_actions = list
      else {
        k.longpress_actions = k.longpress_actions || {}
        if (kind === 'lp-start') (k.longpress_actions as any).start = list
        if (kind === 'lp-repeat') (k.longpress_actions as any).repeat = list
      }
    })
  }

  const addAction = () => mutate((list) => list.push({ type: 'input', text: '' }))
  const removeAction = (idx: number) => mutate((list) => list.splice(idx, 1))
  const updateType = (idx: number, t: string) => mutate((list) => { list[idx] = { type: t } })
  const updateField = (idx: number, field: string, value: any) => mutate((list) => { list[idx] = { ...(list[idx]||{}), type: (list[idx]||{}).type || 'input', [field]: value } })
  const moveAction = (from: number, to: number) => mutate((list) => {
    if (to < 0 || to >= list.length) return
    const [it] = list.splice(from, 1)
    list.splice(to, 0, it)
  })

  const dragIndex = useRef<number | null>(null)
  const onDragStart = (i: number) => (e: React.DragEvent) => { dragIndex.current = i; e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (i: number) => (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDrop = (i: number) => (e: React.DragEvent) => { e.preventDefault(); if (dragIndex.current!=null) moveAction(dragIndex.current, i); dragIndex.current = null }

  const list = getList(keyData)
  return (
    <div>
      {list.map((a, i) => (
        <div key={i} className="mb-2 p-2 border rounded" draggable onDragStart={onDragStart(i)} onDragOver={onDragOver(i)} onDrop={onDrop(i)}>
          <div className="flex items-center space-x-2 mb-2">
            <div className="cursor-move text-gray-400" title="drag to reorder">⋮⋮</div>
            <select className="border rounded px-2 py-1 text-sm" value={a.type || 'input'} onChange={(e)=>updateType(i, e.target.value)}>
              <option value="input">input</option>
              <option value="delete">delete</option>
              <option value="complete">complete</option>
              <option value="move_cursor">move_cursor</option>
              <option value="move_tab">move_tab</option>
              <option value="smart_delete_default">smart_delete_default</option>
              <option value="toggle_cursor_bar">toggle_cursor_bar</option>
              <option value="toggle_shift">toggle_shift</option>
            </select>
            <div className="ml-auto space-x-2">
              <button className="text-xs text-gray-600 hover:underline" onClick={()=>moveAction(i, i-1)} title="上へ">↑</button>
              <button className="text-xs text-gray-600 hover:underline" onClick={()=>moveAction(i, i+1)} title="下へ">↓</button>
              <button className="text-xs text-red-600 hover:underline" onClick={()=>removeAction(i)}>remove</button>
            </div>
          </div>
          {/* Params */}
          {a.type === 'input' && (
            <div>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="text"
                title="ヒント: \\t=タブ, \\n=改行, \\r=CR, \\uXXXX=Unicode (エクスポート時に実文字へ)"
                value={a.text || ''}
                onChange={(e)=>updateField(i,'text', e.target.value)}
              />
              <div className="mt-1 text-[11px] text-gray-500">
                ヒント: \t=タブ, \n=改行, \r=CR, \u3000=全角空白 など（エクスポート時に実文字へ変換）
              </div>
              {/* Single-char hint/warn */}
              {(() => {
                const decode = (s: string) => s.replace(/\\(u[0-9a-fA-F]{4}|n|t|r|\\)/g, (_m, g1) => {
                  if (g1 === 'n') return '\n'
                  if (g1 === 't') return '\t'
                  if (g1 === 'r') return '\r'
                  if (g1 === '\\') return '\\'
                  if (g1 && g1.startsWith('u')) {
                    const code = parseInt(g1.slice(1), 16)
                    return isNaN(code) ? '' : String.fromCharCode(code)
                  }
                  return ''
                })
                const txt = typeof a.text === 'string' ? a.text : ''
                let graphemes = 0
                try {
                  const seg = (Intl as any).Segmenter ? new (Intl as any).Segmenter('ja', { granularity: 'grapheme' }) : null
                  const decoded = decode(txt)
                  graphemes = seg ? Array.from(seg.segment(decoded)).length : Array.from(decoded).length
                } catch {
                  graphemes = Array.from(decode(txt)).length
                }
                return graphemes <= 1 ? (
                  <div className="mt-1 text-[11px] text-gray-400">1文字入力推奨（\t, \n 等のエスケープ可）</div>
                ) : (
                  <div className="mt-1 text-[11px] text-amber-600">複数文字が入力されています（AzooKeyでは許容される場合があります）。</div>
                )
              })()}
            </div>
          )}
          {a.type === 'delete' && (
            <input className="w-full border rounded px-2 py-1 text-sm" type="number" placeholder="count" value={a.count ?? 1} onChange={(e)=>updateField(i,'count', Number(e.target.value))} />
          )}
          {a.type === 'move_cursor' && (
            <div className="flex space-x-2">
              <input className="flex-1 border rounded px-2 py-1 text-sm" type="number" placeholder="count" value={a.count ?? 0} onChange={(e)=>updateField(i,'count', Number(e.target.value))} />
              <select className="w-28 border rounded px-2 py-1 text-sm" value={a.direction || ''} onChange={(e)=>updateField(i,'direction', e.target.value)}>
                <option value="">(auto)</option>
                <option value="forward">forward</option>
                <option value="backward">backward</option>
              </select>
            </div>
          )}
          {a.type === 'move_tab' && (
            <MoveTabInput 
              value={a.tab_type || ''} 
              onChange={(value) => updateField(i, 'tab_type', value)}
            />
          )}
          {(a.type === 'toggle_cursor_bar' || a.type === 'toggle_shift' || a.type === 'complete' || a.type === 'smart_delete_default') && (
            <div className="text-[11px] text-gray-500">追加パラメータはありません</div>
          )}
        </div>
      ))}
      <button className="mt-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200" onClick={addAction}>+ add action</button>
    </div>
  )
}

// --- Variation Editor ---
interface VariationCardProps {
  dirLabel: string
  dirKey: 'left'|'up'|'right'|'down'
  keyboard: CustardKeyboard
  selectedIndex: number
  onChange: (kb: CustardKeyboard) => void
  onEdit: (dir: 'left'|'up'|'right'|'down') => void
}

function VariationCard({ dirLabel, dirKey, keyboard, selectedIndex, onChange, onEdit }: VariationCardProps) {
  const mapDir: any = { left: 'left', up: 'top', right: 'right', down: 'bottom' }
  const item = keyboard.interface.keys[selectedIndex] as any
  const topKey: Key = coerceKeyAt(item) as Key
  const variations: any[] = (topKey as any).variations || []
  const existing = (() => {
    if (!variations || !variations.length) return null
    const v = variations[0]
    if (v && v.type === 'flick_variation') {
      return (variations as any[]).find(x => x.direction === mapDir[dirKey]) || null
    }
    const idxMap: any = { left: 0, up: 1, right: 2, down: 3 }
    const idx = idxMap[dirKey]
    return variations[idx] ? { type:'flick_variation', direction: mapDir[dirKey], key: variations[idx] } : null
  })()

  const enabled = !!existing

  const updateKB = (updater: (k: CustardKeyboard)=>void) => {
    const kb = JSON.parse(JSON.stringify(keyboard)) as CustardKeyboard
    updater(kb)
    onChange(kb)
  }

  const setEnabled = (value: boolean) => {
    updateKB(kb => {
      const item = kb.interface.keys[selectedIndex] as any
      const k: Key = (item.key_type ? item.key : item) as Key
      const dir = mapDir[dirKey]
      let vars: any[] = (k as any).variations || []
      if (vars[0] && !('direction' in vars[0])) {
        // Convert legacy Key[] to FlickVariation[], ensuring longpress_actions exist on each variation.key
        vars = ['left','up','right','down']
          .map((d, i)=> {
            const v = vars[i]
            if (!v) return null
            // Ensure longpress_actions on variation.key
            const vk: any = { ...(v as any) }
            if (!vk.longpress_actions || typeof vk.longpress_actions !== 'object') {
              vk.longpress_actions = { duration: 'normal', start: [], repeat: [] }
            } else {
              vk.longpress_actions.start = Array.isArray(vk.longpress_actions.start) ? vk.longpress_actions.start : []
              vk.longpress_actions.repeat = Array.isArray(vk.longpress_actions.repeat) ? vk.longpress_actions.repeat : []
              vk.longpress_actions.duration = vk.longpress_actions.duration || 'normal'
            }
            return ({ type:'flick_variation', direction: (d==='up'?'top': d==='down'?'bottom': d), key: vk })
          })
          .filter(Boolean) as any
      }
      if (value) {
        // New variation key: include required longpress_actions for CustardKit
        const def: Key = { design: { label: { type: 'text', text: '' }, color: 'normal' }, press_actions: [], longpress_actions: { duration: 'normal', start: [], repeat: [] } } as any
        const ex = (vars as any[]).find(x => x.direction === dir)
        if (!ex) (vars as any[]).push({ type:'flick_variation', direction: dir, key: def })
      } else {
        vars = (vars as any[]).filter(x => x.direction !== dir)
      }
      (k as any).variations = vars
    })
  }

  const resolveVarKey = (kb: CustardKeyboard): Key | null => {
    const item = kb.interface.keys[selectedIndex] as any
    const k: Key = (item.key_type ? item.key : item) as Key
    const dir = mapDir[dirKey]
    const vars: any[] = (k as any).variations || []
    const v0 = vars[0]
    if (v0 && v0.type === 'flick_variation') {
      const found = (vars as any[]).find(x => x.direction === dir)
      return found ? (found.key as Key) : null
    }
    const idxMap: any = { left: 0, up: 1, right: 2, down: 3 }
    const idx = idxMap[dirKey]
    return vars[idx] || null
  }
  const vk = resolveVarKey(keyboard)
  const summaryLabel = (() => {
    if (!vk) return '—'
    const lb: any = (vk as any).design?.label || {}
    if (typeof lb.text === 'string') return lb.text || '（無）'
    if (typeof lb.system_image === 'string') return `sys:${lb.system_image}`
    if (typeof lb.main === 'string' || (lb.main && typeof lb.main.text === 'string')) return `${lb.main?.text||lb.main||''}${lb.sub ? '/'+(lb.sub?.text||lb.sub) : ''}`
    return '—'
  })()

  const pressCount = ((vk as any)?.press_actions || []).length
  const lpStart = ((vk as any)?.longpress_actions?.start || []).length
  const lpRepeat = ((vk as any)?.longpress_actions?.repeat || []).length

  return (
    <div className="border rounded p-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-700 truncate" title={summaryLabel}>{dirLabel}: {summaryLabel}</div>
        <label className="text-xs text-gray-600 flex items-center space-x-1">
          <input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} />
          <span>Enabled</span>
        </label>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
        <div>press:{pressCount} LP:{lpStart}/{lpRepeat}</div>
        <button className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200" onClick={()=>onEdit(dirKey)}>編集</button>
      </div>
    </div>
  )
}

// Detail editor for a single flick variation (full width)
function VariationDetailEditor({ dirKey, keyboard, selectedIndex, onChange }: { dirKey: 'left'|'up'|'right'|'down', keyboard: CustardKeyboard, selectedIndex: number, onChange: (kb: CustardKeyboard)=>void }) {
  const mapDir: any = { left: 'left', up: 'top', right: 'right', down: 'bottom' }
  const resolveVarKey = (kb: CustardKeyboard): Key | null => {
    const item = kb.interface.keys[selectedIndex] as any
    const k: Key = (item.key_type ? item.key : item) as Key
    const dir = mapDir[dirKey]
    const vars: any[] = (k as any).variations || []
    const v0 = vars[0]
    if (v0 && v0.type === 'flick_variation') {
      const found = (vars as any[]).find(x => x.direction === dir)
      return found ? (found.key as Key) : null
    }
    const idxMap: any = { left: 0, up: 1, right: 2, down: 3 }
    const idx = idxMap[dirKey]
    return vars[idx] || null
  }

  const updateKB = (updater: (k: CustardKeyboard)=>void) => {
    const kb = JSON.parse(JSON.stringify(keyboard)) as CustardKeyboard
    updater(kb)
    onChange(kb)
  }

  const vk = resolveVarKey(keyboard)
  const vlabel: any = (vk as any)?.design?.label || {}
  const vcolor = (vk as any)?.design?.color || 'normal'
  const vLabelType = (() => {
    if (!vk) return 'text'
    if (typeof vlabel.system_image === 'string') return 'system_image'
    if (typeof vlabel.text === 'string') return 'text'
    if (typeof vlabel.main === 'string' || (vlabel.main && typeof vlabel.main.text === 'string')) return 'main_and_sub'
    return 'text'
  })()

  const updateVarLabel = (field: 'text'|'system_image'|'main'|'sub', value: string) => {
    updateKB(kb => {
      const vkk = resolveVarKey(kb)
      if (!vkk) return
      vkk.design = (vkk as any).design || ({} as any)
      const curr = (vkk.design as any).label || {}
      let next: any = {}
      if (field === 'system_image') next = { system_image: value }
      else if (field === 'text') next = { text: value }
      else {
        const main = field === 'main' ? value : (curr.main?.text || curr.main || '')
        const sub = field === 'sub' ? value : (curr.sub?.text || curr.sub || '')
        next = { type: 'main_and_sub', main, sub }
      }
      ;(vkk.design as any).label = next
    })
  }

  const setVarColor = (color: string) => {
    updateKB(kb => {
      const vkk = resolveVarKey(kb)
      if (!vkk) return
      vkk.design = (vkk as any).design || ({} as any)
      ;(vkk.design as any).color = color
    })
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700">{dirKey.toUpperCase()} 詳細</div>
      <div className="flex items-center space-x-2 text-xs">
        <label className="flex items-center space-x-1"><input type="radio" name={`vlabel-${dirKey}-detail`} checked={vLabelType==='text'} onChange={()=>updateVarLabel('text', (vlabel.text||''))} /> <span>Text</span></label>
        <label className="flex items-center space-x-1"><input type="radio" name={`vlabel-${dirKey}-detail`} checked={vLabelType==='main_and_sub'} onChange={()=>updateVarLabel('main', (vlabel.main?.text||vlabel.main||''))} /> <span>Main+Sub</span></label>
        <label className="flex items-center space-x-1"><input type="radio" name={`vlabel-${dirKey}-detail`} checked={vLabelType==='system_image'} onChange={()=>updateVarLabel('system_image', (vlabel.system_image||''))} /> <span>System</span></label>
      </div>
      {vLabelType === 'text' && (
        <input className="w-full border rounded px-2 py-1 text-sm" value={vlabel.text||''} onChange={(e)=>updateVarLabel('text', e.target.value)} placeholder="Label text" />
      )}
      {vLabelType === 'main_and_sub' && (
        <div className="flex space-x-2">
          <input className="flex-1 border rounded px-2 py-1 text-sm" value={vlabel.main?.text||vlabel.main||''} onChange={(e)=>updateVarLabel('main', e.target.value)} placeholder="Main" />
          <input className="w-24 border rounded px-2 py-1 text-sm" value={vlabel.sub?.text||vlabel.sub||''} onChange={(e)=>updateVarLabel('sub', e.target.value)} placeholder="Sub" />
        </div>
      )}
      {vLabelType === 'system_image' && (
        <div>
          <input className="w-full border rounded px-2 py-1 text-sm" value={vlabel.system_image||''} onChange={(e)=>updateVarLabel('system_image', e.target.value)} placeholder="SFSymbol" list="sfsymbols-list" />
          <div className="mt-1 text-[11px] text-gray-500">候補から選択、または直接入力してください。</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {['delete.left','xmark','return','arrow.left','arrow.right','square.and.arrow.up','gearshape'].map(sym => (
              <button key={sym} className="px-1.5 py-0.5 text-[11px] border rounded hover:bg-gray-50" onClick={()=>updateVarLabel('system_image', sym)}>{sym}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <select className="w-full border rounded px-2 py-1 text-sm" value={vcolor} onChange={(e)=>setVarColor(e.target.value)}>
          <option value="normal">normal</option>
          <option value="special">special</option>
          <option value="selected">selected</option>
          <option value="unimportant">unimportant</option>
        </select>
      </div>
      <div>
        <div className="text-[11px] text-gray-600 mb-1">Press</div>
        <ActionList kind="press" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} resolveKey={resolveVarKey} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] text-gray-600 mb-1">LP Start</div>
          <ActionList kind="lp-start" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} resolveKey={resolveVarKey} />
        </div>
        <div>
          <div className="text-[11px] text-gray-600 mb-1">LP Repeat</div>
          <ActionList kind="lp-repeat" keyboard={keyboard} selectedIndex={selectedIndex} onChange={onChange} resolveKey={resolveVarKey} />
        </div>
      </div>
    </div>
  )
}

// --- Move Tab Input Component ---
interface MoveTabInputProps {
  value: string
  onChange: (value: string) => void
}

function MoveTabInput({ value, onChange }: MoveTabInputProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Common azooKey tab types
  const presets = [
    { value: '', label: 'タブタイプを選択' },
    { group: 'システム標準', options: [
      { value: 'number', label: 'number - 数字タブ' },
      { value: 'alphabet', label: 'alphabet - 英字タブ' },
      { value: 'hiragana', label: 'hiragana - ひらがなタブ' },
      { value: 'keyboard_change', label: 'keyboard_change - キーボード切り替え' }
    ]},
    { group: 'フリック標準', options: [
      { value: 'flick_abc_tab', label: 'flick_abc_tab - 英数字タブ' },
      { value: 'flick_hira_tab', label: 'flick_hira_tab - ひらがなタブ' },
      { value: 'flick_star123_tab', label: 'flick_star123_tab - 記号・数字タブ' }
    ]},
    { group: 'ユーザータブ', options: [
      { value: 'user_english', label: 'user_english - ユーザー英語' },
      { value: 'user_japanese', label: 'user_japanese - ユーザー日本語' },
      { value: 'user_symbols', label: 'user_symbols - ユーザー記号' },
      { value: 'user_numbers', label: 'user_numbers - ユーザー数字' }
    ]}
  ]

  // Check if current value is in presets
  const isPreset = presets.some(group => 
    Array.isArray(group.options) && group.options.some(option => option.value === value)
  ) || value === ''

  // Initialize custom input visibility based on current value
  React.useEffect(() => {
    setShowCustomInput(!isPreset && value !== '')
  }, [isPreset, value])

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true)
      // Don't change the actual value yet, let user type in custom input
    } else {
      setShowCustomInput(false)
      onChange(selectedValue)
    }
  }

  return (
    <div className="space-y-2">
      <select 
        className="w-full border rounded px-2 py-1 text-sm"
        value={showCustomInput ? 'custom' : (isPreset ? value : 'custom')}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        {presets.map((group, groupIndex) => (
          group.options ? (
            <optgroup key={groupIndex} label={group.group}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={groupIndex} value={group.value}>
              {group.label}
            </option>
          )
        ))}
        <optgroup label="その他">
          <option value="custom">カスタム...</option>
        </optgroup>
      </select>
      
      {showCustomInput && (
        <input 
          className="w-full border rounded px-2 py-1 text-sm" 
          placeholder="カスタムタブタイプを入力"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  )
}
