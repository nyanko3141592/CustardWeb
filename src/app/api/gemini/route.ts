import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export async function POST(request: NextRequest) {
  try {
    const { apiKey, prompt, currentKeyboard, messages, mode } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key is required' },
        { status: 400 }
      )
    }
    
    const baseContext = `あなたはazooKeyキーボードのカスタマイズを支援するアシスタントです。
現在のキーボード定義は JSON Custard 形式です。ユーザーの意図を理解し、安全で一貫した変更を提案してください。

現在のキーボード定義:
${JSON.stringify(currentKeyboard, null, 2)}
`

    const promptKeyboard = `${baseContext}
以下の仕様に従ってください:
- identifier, language, input_style, metadata などの基本構造を維持
- key_layout の type は "grid_fit" または "grid_scroll"
- key_style は "tenkey_style" または "pc_style"
- 各キーには design (label, color) とアクション (press_actions, longpress_actions) を定義
- アクションタイプ: input, delete, move_cursor, complete, move_tab など

ユーザーの指示: ${prompt}

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
- set_longpress_duration { index, duration }
- set_longpress_start_input { index, text }
- set_longpress_repeat_input { index, text }
- clear_longpress_start { index }
- clear_longpress_repeat { index }
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
- set_flick_longpress_duration { index, direction, duration }
- set_flick_longpress_start_input { index, direction, text }
- set_flick_longpress_repeat_input { index, direction, text }
- clear_flick_longpress_start { index, direction }
- clear_flick_longpress_repeat { index, direction }

注意:
- index は 0 始まり。無効な index を出力しない。
- direction は left|up|right|down のいずれか。
 - duration は short|normal|long のいずれか。
- x,y は grid_fit のセル座標。
- 必要に応じて flick を追加してから編集してよい（例: set_flick_label で未存在なら追加）。
- 矛盾する操作は避け、必要最小限のアクション列にする。

ユーザーの指示: ${prompt}

応答は JSON のみで返してください:
{
  "actions": [ { "type": "add_key", "x": 0, "y": 0 } ],
  "message": "変更内容の簡潔な説明"
}`

    const systemPrompt = mode === 'actions' ? promptActions : promptKeyboard
    
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
      let detail = ''
      try {
        detail = await response.text()
      } catch {}
      console.error('Gemini API error:', detail)
      return NextResponse.json(
        { message: 'Gemini APIエラーが発生しました', detail },
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
