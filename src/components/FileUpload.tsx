'use client'

import React, { useRef, useState } from 'react'
import { CustardKeyboard } from '@/types/custard'

interface FileUploadProps {
  onFileLoad: (keyboard: CustardKeyboard, fileName: string) => void
}

export default function FileUpload({ onFileLoad }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const validateKeyboard = (data: any): data is CustardKeyboard => {
    return (
      data &&
      typeof data.identifier === 'string' &&
      typeof data.language === 'string' &&
      typeof data.input_style === 'string' &&
      data.metadata &&
      typeof data.metadata.custard_version === 'string' &&
      typeof data.metadata.display_name === 'string' &&
      data.interface &&
      data.interface.key_layout &&
      typeof data.interface.key_style === 'string' &&
      Array.isArray(data.interface.keys)
    )
  }
  
  const handleFile = async (file: File) => {
    try {
      setError(null)
      
      if (!file.name.endsWith('.json')) {
        throw new Error('JSONファイルを選択してください')
      }
      
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!validateKeyboard(data)) {
        throw new Error('無効なキーボード定義ファイルです。Custard形式のJSONファイルを選択してください')
      }
      
      onFileLoad(data, file.name)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('JSONファイルの形式が正しくありません')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('ファイルの読み込みに失敗しました')
      }
    }
  }
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }
  
  const handleClick = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <div className="relative">
      <button
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
          isDragging
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        + JSONファイル
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      {error && (
        <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-red-50 border border-red-200 rounded-md shadow-lg min-w-max">
          <p className="text-xs text-red-600">
            <span className="font-medium">エラー:</span> {error}
          </p>
        </div>
      )}
    </div>
  )
}