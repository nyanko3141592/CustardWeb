#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const { readFileSync, existsSync } = require('node:fs')
const { resolve } = require('node:path')

function validateTS(obj) {
  try {
    if (!obj || typeof obj.identifier !== 'string') return false
    if (typeof obj.language !== 'string') return false
    if (typeof obj.input_style !== 'string') return false
    if (!obj.interface || !obj.interface.key_layout || typeof obj.interface.key_style !== 'string') return false
    if (!Array.isArray(obj.interface.keys)) return false
    // CustardKit requires metadata
    if (!obj.metadata || typeof obj.metadata.custard_version !== 'string' || typeof obj.metadata.display_name !== 'string') return false
    if (typeof obj.interface.key_layout.type !== 'string') return false
    for (const item of obj.interface.keys) {
      const isWrapper = !!item.key_type
      const keyType = isWrapper ? item.key_type : 'custom'
      const k = isWrapper ? item.key : item
      if (keyType === 'system') {
        if (!k || typeof k.type !== 'string') return false
        continue
      }
      if (!k || !k.design) return false
      const lb = k.design.label
      if (lb) {
        const okText = typeof lb.text === 'string'
        const okSys = typeof lb.system_image === 'string'
        const mainOk = typeof lb.main === 'string' || (lb.main && typeof lb.main.text === 'string')
        const subOk = lb.sub === undefined || typeof lb.sub === 'string' || (lb.sub && typeof lb.sub.text === 'string')
        if (!(okText || okSys || (mainOk && subOk))) return false
      }
      if (k.press_actions && !Array.isArray(k.press_actions)) return false
      if (typeof k.longpress_actions !== 'object') return false
      if (!Array.isArray(k.variations)) return false
    }
    return true
  } catch {
    return false
  }
}

function runSwiftValidator(jsonPath) {
  const pkgDir = resolve(__dirname, '..', 'CustardValidator')
  const releaseBin = resolve(pkgDir, '.build', 'release', 'custard-validate')
  let result
  if (existsSync(releaseBin)) {
    result = spawnSync(releaseBin, [jsonPath], { encoding: 'utf8' })
  } else {
    result = spawnSync('swift', ['run', '-c', 'release', 'CustardValidator', jsonPath], { cwd: pkgDir, encoding: 'utf8' })
  }
  const ok = result.status === 0 && /OK: (Custard|\[Custard\])/.test((result.stdout || '') + (result.stderr || ''))
  return { ok, status: result.status, stdout: result.stdout, stderr: result.stderr }
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node tools/compare-validators/index.js <file.json>')
    process.exit(2)
  }
  const jsonPath = resolve(process.cwd(), file)
  let data
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf8'))
  } catch (e) {
    console.error('❌ Failed to read/parse JSON:', e.message)
    process.exit(2)
  }

  const tsOK = validateTS(data)
  const swift = runSwiftValidator(jsonPath)
  const swiftOK = swift.ok

  console.log('TS validator:', tsOK ? 'OK' : 'NG')
  console.log('Swift validator:', swiftOK ? 'OK' : 'NG')
  if (!swiftOK) {
    process.stdout.write((swift.stdout || '') + (swift.stderr || ''))
  }
  if (tsOK === swiftOK) {
    console.log('✅ MATCH')
    process.exit(0)
  } else {
    console.log('❌ MISMATCH')
    process.exit(1)
  }
}

main()
