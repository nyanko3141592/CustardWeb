'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CustardKeyboard } from '@/types/custard'
import { AIAction, applyAiActions } from '@/lib/aiActions'

interface AIAssistantProps {
  keyboard: CustardKeyboard
  onUpdate: (keyboard: CustardKeyboard, message?: string) => void
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  actions?: AIAction[]
  summaries?: string[]
}

const suggestedPrompts = [
  'スペースキーを大きくして',
  '絵文字キーを追加して',
  'Enterキーの色を青にして',
  '数字キーボードに変更して',
  'キーのサイズを大きくして',
  'フリック入力対応にして'
]

const createInitialSystemMessage = (): Message => ({
  role: 'system',
  content: 'こんにちは！キーボードをカスタマイズするお手伝いをします。どのような変更を加えたいですか？',
  timestamp: new Date()
})

export default function AIAssistant({ keyboard, onUpdate }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    createInitialSystemMessage()
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const [mode, setMode] = useState<'keyboard' | 'actions'>('actions')
  const [connection, setConnection] = useState<null | { ok: boolean; message: string }>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set())
  const GEMINI_MODEL = 'gemini-2.5-flash'
  
  const arrow = (d?: string) => d === 'left' ? '←' : d === 'right' ? '→' : d === 'up' || d === 'top' ? '↑' : d === 'down' || d === 'bottom' ? '↓' : ''
  const summarizeAction = (a: AIAction): string => {
    const idx = (a as any).index != null ? `#${((a as any).index as number) + 1}` : ''
    switch (a.type) {
      case 'add_key': return `+key (${a.x},${a.y})`
      case 'remove_key': return `-key ${idx}`
      case 'move_key': return `move ${idx}→(${a.x},${a.y})`
      case 'set_key_size': return `size ${idx}=${a.width}x${a.height}`
      case 'set_key_label': return `label ${idx}='${a.text}'`
      case 'set_key_main_label': return `main ${idx}='${a.text}'`
      case 'set_key_sub_label': return `sub ${idx}='${a.text}'`
      case 'set_key_label_main_sub': return `label ${idx} main='${a.main}'${a.sub ? ` sub='${a.sub}'` : ''}`
      case 'set_key_color': return `color ${idx}=${a.color}`
      case 'set_press_input': return `input ${idx}='${a.text}'`
      case 'set_keyboard_layout': return `layout ${a.row_count}x${a.column_count}`
      case 'set_input_style': return `input_style=${a.input_style}`
      case 'set_language': return `lang=${a.language}`
      case 'rename': return `rename${a.identifier ? ` id='${a.identifier}'` : ''}${a.display_name ? ` name='${a.display_name}'` : ''}`
      case 'add_flick_variation': return `+flick ${idx}${arrow(a.direction)}`
      case 'remove_flick_variation': return `-flick ${idx}${arrow(a.direction)}`
      case 'set_flick_label': return `flick${arrow(a.direction)} ${idx} label='${a.text}'`
      case 'set_flick_main_label': return `flick${arrow(a.direction)} ${idx} main='${a.text}'`
      case 'set_flick_sub_label': return `flick${arrow(a.direction)} ${idx} sub='${a.text}'`
      case 'set_flick_label_main_sub': return `flick${arrow(a.direction)} ${idx} main='${a.main}'${a.sub ? ` sub='${a.sub}'` : ''}`
      case 'set_flick_input': return `flick${arrow(a.direction)} ${idx} input='${a.text}'`
      case 'set_flick_color': return `flick${arrow(a.direction)} ${idx} color=${a.color}`
      case 'set_longpress_duration': return `LP ${idx} dur=${a.duration}`
      case 'set_longpress_start_input': return `LP ${idx} start='${a.text}'`
      case 'set_longpress_repeat_input': return `LP ${idx} repeat='${a.text}'`
      case 'clear_longpress_start': return `LP ${idx} start:clear`
      case 'clear_longpress_repeat': return `LP ${idx} repeat:clear`
      case 'set_flick_longpress_duration': return `LP ${idx}${arrow(a.direction)} dur=${a.duration}`
      case 'set_flick_longpress_start_input': return `LP ${idx}${arrow(a.direction)} start='${a.text}'`
      case 'set_flick_longpress_repeat_input': return `LP ${idx}${arrow(a.direction)} repeat='${a.text}'`
      case 'clear_flick_longpress_start': return `LP ${idx}${arrow(a.direction)} start:clear`
      case 'clear_flick_longpress_repeat': return `LP ${idx}${arrow(a.direction)} repeat:clear`
      default: return ((a as any)?.type) || 'action'
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Persist API key locally (browser only)
  useEffect(() => {
    try {
      const k = localStorage.getItem('custard:geminiApiKey')
      if (k) {
        setApiKey(k)
        setShowApiKeyInput(false)
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem('custard:geminiApiKey', apiKey)
    } catch {}
  }, [apiKey])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !apiKey) return
    
    const userMessage: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      // Build prompt locally (same shape as former API route)
      const baseContext = `あなたはazooKeyキーボードのカスタマイズを支援するアシスタントです。\n現在のキーボード定義は JSON Custard 形式です。ユーザーの意図を理解し、安全で一貫した変更を提案してください。\n\n現在のキーボード定義:\n${JSON.stringify(keyboard, null, 2)}\n`
      const promptKeyboard = `${baseContext}
以下の仕様に従ってください:
- identifier, language, input_style, metadata などの基本構造を維持
- key_layout の type は "grid_fit" または "grid_scroll"
- key_style は "tenkey_style" または "pc_style"
- 各キーには design (label, color) とアクション (press_actions, longpress_actions) を定義
- アクションタイプ: input, delete, move_cursor, complete, move_tab など

ユーザーの指示: ${input}

応答は以下のJSON形式で返してください:
{
  "keyboard": { 更新されたキーボード定義 },
  "message": "変更内容の簡潔な説明"
}`
      const promptActions = `${baseContext}
GUI 操作ベースの "アクション" を生成してください。アプリが同じ操作を順番に適用して編集します。以下の型のみを使用:
- add_key { x, y, width?, height? }
- remove_key { index }
- move_key { index, x, y }
- set_key_size { index, width, height }
- set_key_label { index, text }
- set_key_main_label { index, text }
- set_key_sub_label { index, text }
- set_key_label_main_sub { index, main, sub? }
- set_key_color { index, color }
- set_press_input { index, text }
- set_keyboard_layout { row_count, column_count }
- set_input_style { input_style }
- set_language { language }
- rename { identifier?, display_name? }
- add_flick_variation { index, direction }
- remove_flick_variation { index, direction }
- set_flick_label { index, direction, text }
- set_flick_main_label { index, direction, text }
- set_flick_sub_label { index, direction, text }
- set_flick_label_main_sub { index, direction, main, sub? }
- set_flick_input { index, direction, text }
- set_flick_color { index, direction, color }
- set_longpress_duration { index, duration } // duration: normal|light
- set_longpress_start_input { index, text }
- set_longpress_repeat_input { index, text }
- clear_longpress_start { index }
- clear_longpress_repeat { index }
- set_flick_longpress_duration { index, direction, duration } // duration: normal|light
- set_flick_longpress_start_input { index, direction, text }
- set_flick_longpress_repeat_input { index, direction, text }
- clear_flick_longpress_start { index, direction }
- clear_flick_longpress_repeat { index, direction }

注意:
- index は 0 始まり。無効な index を出力しない。
- direction は left|up|right|down のいずれか。
- duration は normal|light のいずれか。
- x,y は grid_fit のセル座標。
- 必要に応じて flick を追加してから編集してよい（例: set_flick_label で未存在なら追加）。
- 矛盾する操作は避け、必要最小限のアクション列にする。

ユーザーの指示: ${input}

応答は JSON のみで返してください:
{
  "actions": [ { "type": "add_key", "x": 0, "y": 0 } ],
  "message": "変更内容の簡潔な説明"
}`

      const systemPrompt = mode === 'actions' ? promptActions : promptKeyboard

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      })

      if (!response.ok) {
        const errTxt = await response.text().catch(() => '')
        throw new Error(`Gemini request failed (${response.status}) ${errTxt}`)
      }

      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
      if (!generatedText) throw new Error('Empty response from Gemini')

      // Extract first JSON object from the text
      const match = generatedText.match(/\{[\s\S]*\}/)
      const parsed = match ? JSON.parse(match[0]) : {}

      if (parsed.keyboard) {
        onUpdate(parsed.keyboard, parsed.message)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: parsed.message || 'キーボードを更新しました！',
          timestamp: new Date()
        }])
      } else if (Array.isArray(parsed.actions)) {
        const actions = parsed.actions as AIAction[]
        try {
          const result = applyAiActions(keyboard, actions)
          onUpdate(result.keyboard, parsed.message || result.description)
          const summaries = actions.map(summarizeAction)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: parsed.message || result.description || 'アクションを適用しました',
            timestamp: new Date(),
            actions,
            summaries
          }])
        } catch (e) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'アクションの適用に失敗しました。',
            timestamp: new Date()
          }])
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: parsed.message || 'エラーが発生しました。',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラーが発生しました。'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `エラーが発生しました。APIキーや通信状況を確認してください。\n${msg}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }
  
  const handleConnectionTest = async () => {
    if (!apiKey) return
    setConnection(null)
    try {
      const systemPrompt = `接続テスト。変更不要。以下の形式で返答:\n{\n  "actions": [],\n  "message": "OK"\n}`
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setConnection({ ok: false, message: `NG (${res.status}) ${text || ''}` })
        return
      }
      const data = await res.json().catch(() => ({}))
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text === 'string') {
        setConnection({ ok: true, message: 'OK: 接続確認できました' })
      } else {
        setConnection({ ok: false, message: 'NG: 予期しない応答' })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setConnection({ ok: false, message: `NG: ${msg}` })
    }
  }
  
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const handleNewChat = () => {
    setMessages([createInitialSystemMessage()])
    setInput('')
    setConnection(null)
  }
  
  return (
    <div className="flex flex-col h-full">
      {showApiKeyInput ? (
        <div className="p-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Gemini API Key (AIza...)"
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs text-blue-600 hover:underline"
              title="Gemini APIキーを取得"
            >取得</a>
            <button
              onClick={() => setShowApiKeyInput(false)}
              disabled={!apiKey}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="APIキーを保存して接続"
            >設定</button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-1 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-700">API接続済み</span>
            <div className="flex items-center text-[11px] text-gray-700 gap-1">
              <span className="opacity-70">モード:</span>
              <button
                onClick={() => setMode('actions')}
                className={`px-1.5 py-0.5 rounded border ${mode === 'actions' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}
                title="GUIアクションで編集"
              >アクション</button>
              <button
                onClick={() => setMode('keyboard')}
                className={`px-1.5 py-0.5 rounded border ${mode === 'keyboard' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}
                title="JSON全体を編集"
              >JSON</button>
            </div>
            <button
              onClick={handleConnectionTest}
              className="ml-1 px-2 py-0.5 text-[11px] rounded bg-gray-100 hover:bg-gray-200 border border-gray-300"
              title="Gemini APIへの接続テストを実行"
            >接続テスト</button>
            <button
              onClick={handleNewChat}
              className="ml-1 px-2 py-0.5 text-[11px] rounded bg-white hover:bg-gray-100 border border-gray-300"
              title="新しいチャットを開始"
            >新規チャット</button>
            {connection && (
              <span className={`text-[11px] ${connection.ok ? 'text-green-700' : 'text-red-600'}`}>
                {connection.message}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="text-[11px] text-gray-500 hover:text-gray-700"
            title="APIキーを変更"
          >変更</button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-[85%] ${
              message.role === 'user' ? 'order-2' : ''
            }`}>
              {message.timestamp && (
                <div className={`text-xs text-gray-500 mb-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : message.role === 'assistant'
                    ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    : 'bg-blue-100 text-blue-800 rounded-lg'
                }`}
              >
                {message.content}
              </div>
              {message.role === 'assistant' && message.summaries && message.summaries.length > 0 && (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedSummaries(prev => {
                      const next = new Set(prev)
                      if (next.has(index)) next.delete(index); else next.add(index)
                      return next
                    })}
                    className="text-[11px] px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                    title="アクション一覧の表示/非表示を切り替え"
                  >
                    アクション {message.summaries.length}件 {expandedSummaries.has(index) ? '▲' : '▼'}
                  </button>
                  {expandedSummaries.has(index) && (
                    <div className="mt-1 flex flex-wrap gap-1 max-h-40 overflow-auto pr-1">
                      {message.summaries.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {!showApiKeyInput && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKey ? "キーボードをどのように変更しますか？" : "APIキーを設定してください"}
            disabled={loading || !apiKey}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !apiKey}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
