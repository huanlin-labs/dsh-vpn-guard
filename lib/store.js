/** Minimal JSONL history + JSON config store under the plugin data directory. */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function defaultDataDir() {
  return path.join(os.homedir(), '.dsh', 'vpn-guard')
}

export function createStore(dataDir) {
  const root = dataDir || defaultDataDir()
  const historyFile = path.join(root, 'history.jsonl')
  const configFile = path.join(root, 'config.json')
  try {
    fs.mkdirSync(root, { recursive: true })
  } catch {
    /* the caller reports the failure on first write */
  }

  function readConfig() {
    try {
      if (!fs.existsSync(configFile)) return {}
      const parsed = JSON.parse(fs.readFileSync(configFile, 'utf8').replace(/^\uFEFF/, ''))
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  function saveConfig(patch) {
    const merged = { ...readConfig(), ...patch }
    fs.mkdirSync(root, { recursive: true })
    fs.writeFileSync(configFile, JSON.stringify(merged, null, 2), 'utf8')
    return merged
  }

  function appendHistory(record) {
    fs.mkdirSync(root, { recursive: true })
    fs.appendFileSync(historyFile, `${JSON.stringify(record)}\n`, 'utf8')
    prune()
  }

  function prune() {
    try {
      const stat = fs.statSync(historyFile)
      if (stat.size < 4 * 1024 * 1024) return
      const lines = fs.readFileSync(historyFile, 'utf8').split(/\r?\n/).filter(Boolean)
      fs.writeFileSync(historyFile, `${lines.slice(-2000).join('\n')}\n`, 'utf8')
    } catch {
      /* ignore */
    }
  }

  function readHistory(limit = 50) {
    try {
      if (!fs.existsSync(historyFile)) return []
      const lines = fs.readFileSync(historyFile, 'utf8').split(/\r?\n/).filter(Boolean)
      return lines
        .slice(-Math.max(1, Math.min(500, limit)))
        .reverse()
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)
    } catch {
      return []
    }
  }

  return { root, historyFile, configFile, readConfig, saveConfig, appendHistory, readHistory }
}
