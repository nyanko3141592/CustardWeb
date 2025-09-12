import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, prompt, currentKeyboard, messages } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key is required' },
        { status: 400 }
      )
    }
    
    const systemPrompt = `あなたはazooKeyキーボードのカスタマイズを支援するアシスタントです。
ユーザーの指示に基づいて、提供されたCustard形式のJSONキーボード定義を修正してください。

現在のキーボード定義:
${JSON.stringify(currentKeyboard, null, 2)}

以下の仕様に従ってください:
- identifier, language, input_style, metadataなどの基本構造を維持
- key_layoutのtypeは"grid_fit"または"grid_scroll"
- key_styleは"tenkey_style"または"pc_style"
- 各キーにはdesign (label, color)とアクション(press_actions, longpress_actions)を定義
- アクションタイプ: input, delete, move_cursor, complete, move_tabなど

ユーザーの指示: ${prompt}

応答は以下のJSON形式で返してください:
{
  "keyboard": { 更新されたキーボード定義 },
  "message": "変更内容の簡潔な説明"
}`
    
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json(
        { message: 'Gemini APIエラーが発生しました' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      return NextResponse.json(
        { message: '応答の生成に失敗しました' },
        { status: 500 }
      )
    }
    
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON not found in response')
      }
      
      const result = JSON.parse(jsonMatch[0])
      
      return NextResponse.json(result)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({
        message: generatedText,
        keyboard: null
      })
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}