import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { links } from '../src/links.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const external = new Set(Object.values(links))
const resources = new Set(['index.html', 'geodata/gebiet.json', 'geodata/tileset.json', 'geodata/basiskarte.glb', 'geodata/luftbild.glb', 'geodata/bombardierung-1944.geojson'])
const inspected = new Set()
let failures = 0

function fail(message) { failures++; console.error(`FAIL ${message}`) }
async function exists(path) {
  try { return (await stat(path)).isFile() } catch { return false }
}

async function files(directory) {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]))
  return nested.flat()
}

// Documentation URLs, local Markdown destinations and image sources.
for (const file of ['README.md', 'README.en.md', ...await files('doc')]) {
  if (extname(file) !== '.md') continue
  const text = await readFile(resolve(root, file), 'utf8')
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`)]+/g)) {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(match[0]).hostname)) external.add(match[0])
  }
  for (const match of text.matchAll(/\]\(([^)]+)\)|\bsrc="([^"]+)"/g)) {
    const target = (match[1] ?? match[2]).split('#')[0]
    if (!target || /^(https?:|data:)/.test(target)) continue
    if (!await exists(resolve(root, dirname(file), decodeURIComponent(target)))) fail(`${file}: missing ${target}`)
  }
}

for (const file of await files('src')) {
  const text = await readFile(resolve(root, file), 'utf8')
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`]+/g)) external.add(match[0])
}

// Follow all local 3D Tiles and glTF dependencies, including embedded GLB chunks.
async function inspect(path) {
  if (inspected.has(path)) return
  inspected.add(path)
  const full = resolve(root, 'public', path)
  if (!await exists(full)) { fail(`Missing map resource: ${path}`); return }
  resources.add(path)
  const buffer = await readFile(full)
  let json
  if (['.json', '.geojson', '.gltf'].includes(extname(path))) json = JSON.parse(buffer.toString())
  let glb = extname(path) === '.glb' ? buffer : null
  if (extname(path) === '.b3dm') {
    if (buffer.toString('ascii', 0, 4) !== 'b3dm') { fail(`Invalid 3D tile: ${path}`); return }
    glb = buffer.subarray(28 + [12, 16, 20, 24].reduce((sum, offset) => sum + buffer.readUInt32LE(offset), 0))
  }
  if (glb) {
    if (glb.toString('ascii', 0, 4) !== 'glTF') { fail(`Invalid GLB: ${path}`); return }
    json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString().trim())
  }
  async function walk(value) {
    if (!value || typeof value !== 'object') return
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === 'string' && /^https?:\/\//.test(item)) external.add(item)
      if ((key === 'uri' || key === 'url') && typeof item === 'string' && !/^(data:|https?:)/.test(item)) {
        await inspect(relative(resolve(root, 'public'), resolve(dirname(full), item)).replaceAll('\\', '/'))
      } else if (typeof item === 'object') await walk(item)
    }
  }
  await walk(json)
}
for (const path of [...resources].filter((path) => path !== 'index.html')) await inspect(path)

// In a built preview also verify HTML asset URLs and the Cesium worker runtime.
const baseArgument = process.argv.indexOf('--base')
if (baseArgument !== -1) {
  const base = new URL(process.argv[baseArgument + 1])
  if (!base.pathname.endsWith('/')) throw new Error('--base must end with /')
  const htmlResponse = await fetch(base, { signal: AbortSignal.timeout(15000) })
  if (!htmlResponse.ok) fail(`${base}: HTTP ${htmlResponse.status}`)
  const html = await htmlResponse.text()
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (!match[1].startsWith('data:')) resources.add(match[1])
  }
  for (const directory of ['Assets', 'ThirdParty', 'Widgets', 'Workers']) {
    const available = await files(`public/cesium/${directory}`)
    for (const file of available) resources.add(file.replace('public/', ''))
  }
  const queue = [...resources]
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const path = queue.shift()
      try {
        const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) })
        if (!response.ok) fail(`${path}: HTTP ${response.status}`)
        if (path !== 'index.html' && response.headers.get('content-type')?.includes('text/html')) fail(`${path}: returned HTML instead of an asset`)
        await response.body?.cancel()
      } catch (error) { fail(`${path}: ${error.message}`) }
    }
  }))
  console.log(`Checked ${resources.size} served resources at ${base}`)
}

if (process.argv.includes('--external')) {
  const queue = [...external].sort()
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      try {
        // Use GET: some official sources reject HEAD. Redirects are followed.
        const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Rheinblicke-Link-Check/1.0' } })
        if (!response.ok) fail(`${url}: HTTP ${response.status}`)
        else console.log(`OK ${response.status} ${url}${response.url !== url ? ` -> ${response.url}` : ''}`)
        await response.body?.cancel()
      } catch (error) { fail(`${url}: ${error.cause?.code ?? error.message}`) }
    }
  }))
  console.log(`Checked ${external.size} external URLs`)
} else console.log(`Checked local references; ${external.size} external URLs collected (use --external for live requests)`)

process.exitCode = failures ? 1 : 0
