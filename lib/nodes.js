/** Merge Clash's live node list with the last node health CSV and key-node AI reference. */
import fs from 'node:fs'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else if (char !== '\r') field += char
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  if (rows.length === 0) return []
  const header = rows[0].map((cell) => cell.replace(/^\uFEFF/, '').trim())
  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, (cells[index] ?? '').trim()])))
}

export function readCsvRows(file) {
  try {
    if (!file || !fs.existsSync(file)) return []
    return parseCsv(fs.readFileSync(file, 'utf8'))
  } catch {
    return []
  }
}

export function readKeyNodes(file) {
  try {
    if (!file || !fs.existsSync(file)) return []
    const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeBase(name) {
  const text = String(name ?? '')
    .replace(/^[\u{1F1E6}-\u{1F1FF}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
    .trim()
  return text.split(/\s+/)[0] ?? text
}

function matchReference(base, references) {
  for (const reference of references) {
    const key = String(reference['节点'] ?? '')
    if (!key) continue
    if (base.includes(key)) return reference
    const head = key.split('-')[0]
    const digits = (key.match(/\d+/) || [])[0]
    if (head && digits && base.includes(head.slice(0, 2)) && base.includes(digits)) return reference
  }
  return null
}

export function buildNodeRows({ clash, csvRows = [], keyNodes = [] } = {}) {
  const groups = Array.isArray(clash?.groups) ? clash.groups : []
  const nodes = Array.isArray(clash?.nodes) ? clash.nodes : []
  return nodes.map((node) => {
    const base = normalizeBase(node.name)
    const csv = csvRows.find((row) => row.node === node.name) ?? null
    const reference = matchReference(base, keyNodes)
    const memberGroups = groups.filter((group) => group.all.includes(node.name)).map((group) => group.name)
    return {
      name: node.name,
      base,
      type: node.type,
      groups: memberGroups,
      current: groups.some((group) => group.now === node.name),
      csv: csv
        ? {
            status: csv.status || null,
            latencyMs: numberOrNull(csv.latency_ms),
            exitIp: csv.exit_ip || null,
            country: csv.country || null,
            countryCode: csv.country_code || null,
            isp: csv.isp || null,
            asn: csv.asn || null,
            proxy: csv.proxy === 'True',
            hosting: csv.hosting === 'True',
            score: numberOrNull(csv.score),
          }
        : null,
      aiRef: reference
        ? {
            score: numberOrNull(reference['分数']),
            claude: reference.Claude ?? null,
            chatgpt: reference.ChatGPT ?? null,
            gemini: reference.Gemini ?? null,
          }
        : null,
    }
  })
}
