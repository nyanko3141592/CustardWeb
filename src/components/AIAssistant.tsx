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
}

const suggestedPrompts = [
  'スペースキーを大きくして',
  '絵文字キーを追加して',
  'Enterキーの色を青にして',
  '数字キーボードに変更して',
  'キーのサイズを大きくして',
  'フリック入力対応にして'
]

export default function AIAssistant({ keyboard, onUpdate }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'こんにちは！キーボードをカスタマイズするお手伝いをします。どのような変更を加えたいですか？',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const [mode, setMode] = useState<'keyboard' | 'actions'>('actions')
  const [connection, setConnection] = useState<null | { ok: boolean; message: string }>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
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
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          prompt: input,
          currentKeyboard: keyboard,
          messages: messages,
          mode
        })
      })
      
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '')
        throw new Error(`API request failed (${response.status}) ${errTxt}`)
      }
      
      const data = await response.json()

      if (data.keyboard) {
        onUpdate(data.keyboard, data.message)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'キーボードを更新しました！',
          timestamp: new Date()
        }])
      } else if (Array.isArray(data.actions)) {
        const actions = data.actions as AIAction[]
        try {
          const result = applyAiActions(keyboard, actions)
          onUpdate(result.keyboard, data.message || result.description)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message || result.description || 'アクションを適用しました',
            timestamp: new Date()
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
          content: data.message || 'エラーが発生しました。',
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
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          prompt: '接続テスト: 変更不要。空のアクションを返してください。',
          currentKeyboard: keyboard,
          messages: [],
          mode: 'actions'
        })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setConnection({ ok: false, message: `NG (${res.status}) ${text || ''}` })
        return
      }
      const data = await res.json().catch(() => ({}))
      if (Array.isArray(data.actions) || data.keyboard) {
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
