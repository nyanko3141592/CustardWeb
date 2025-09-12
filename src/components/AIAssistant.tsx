'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CustardKeyboard } from '@/types/custard'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
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
          messages: messages
        })
      })
      
      if (!response.ok) {
        throw new Error('API request failed')
      }
      
      const data = await response.json()
      
      if (data.keyboard) {
        onUpdate(data.keyboard, data.message)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'キーボードを更新しました！',
          timestamp: new Date()
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'エラーが発生しました。',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'エラーが発生しました。APIキーを確認してください。',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }
  
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }
  
  return (
    <div className="flex flex-col h-full">
      {showApiKeyInput ? (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowApiKeyInput(false)}
              disabled={!apiKey}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              設定
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Gemini APIキーを取得 →
            </a>
          </p>
        </div>
      ) : (
        <div className="px-4 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <span className="text-sm text-green-700">API接続済み</span>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            APIキーを変更
          </button>
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