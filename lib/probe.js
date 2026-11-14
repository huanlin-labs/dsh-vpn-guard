/**
 * Read-only probes used by the VPN Guard host half.
 *
 * Every external command is short-lived and force-killed on timeout; no probe
 * keeps a child process alive after it returns. Nothing in this module writes
 * to SDKDNS/Clash configuration.
 */
import http from 'node:http'
import tls from 'node:tls'
import net from 'node:net'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const UA = 'dsh-vpn-guard/1.0'
const INFO_PATTERN = /剩余流量|套餐到期|距离下次重置|发送邮件|最新官网|注意|不推荐|以下节点/
const BUILTIN = new Set(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'PASS-RULE', 'COMPATIBLE', 'GLOBAL'])
const GROUP_TYPES = new Set(['Selector', 'URLTest', 'Fallback', 'LoadBalance', 'Relay'])

function dechunk(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const j = text.indexOf('\r\n', i)
    if (j < 0) break
    const size = parseInt(text.slice(i, j), 16)
    if (!Number.isFinite(size) || size <= 0) break
    out += text.slice(j + 2, j + 2 + size)
    i = j + 2 + size + 2
  }
  return out
}

function httpJson(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    let u
    try {
      u = new URL(url)
    } catch (error) {
      reject(error)
      return
    }
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': UA },
        timeout,
      },
      (res) => {
        let buf = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (buf += chunk))
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}`))
            return
          }
          try {
            resolve(JSON.parse(buf))
          } catch {
            reject(new Error(`invalid JSON: ${buf.slice(0, 160)}`))
          }
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end()
  })
}

/** HTTPS GET through the local HTTP CONNECT proxy (Clash mixed-port). */
function proxyJson(url, proxyHost, proxyPort, timeout = 15000) {
  return new Promise((resolve, reject) => {
    let u
    try {
      u = new URL(url)
    } catch (error) {
      reject(error)
      return
    }
    let settled = false
    const fail = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    const connectReq = http.request({
      host: proxyHost,
      port: proxyPort,
      method: 'CONNECT',
      path: `${u.hostname}:443`,
      headers: { Host: `${u.hostname}:443`, 'User-Agent': UA },
      timeout,
    })
    connectReq.on('timeout', () => fail(new Error('proxy CONNECT timeout')))
    connectReq.on('error', (error) => fail(new Error(`proxy CONNECT: ${error.message}`)))
    connectReq.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy()
        fail(new Error(`proxy CONNECT HTTP ${res.statusCode}`))
        return
      }
      const secure = tls.connect({ socket, servername: u.hostname }, () => {
        secure.write(
          `GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.hostname}\r\nUser-Agent: ${UA}\r\nAccept: application/json\r\nConnection: close\r\n\r\n`,
        )
      })
      const chunks = []
      secure.on('data', (chunk) => chunks.push(chunk))
      secure.on('error', (error) => fail(new Error(`TLS: ${error.message}`)))
      secure.setTimeout(timeout, () => {
        secure.destroy()
        fail(new Error('TLS timeout'))
      })
      secure.on('end', () => {
        if (settled) return
        settled = true
        try {
          const text = Buffer.concat(chunks).toString('utf8')
          const split = text.indexOf('\r\n\r\n')
          if (split < 0) throw new Error('bad HTTP response')
          const head = text.slice(0, split)
          let body = text.slice(split + 4)
          if (/transfer-encoding:\s*chunked/i.test(head)) body = dechunk(body)
          const status = Number((head.match(/^HTTP\/\d\.\d\s+(\d+)/) || [])[1])
          if (!status || status < 200 || status >= 300) throw new Error(`HTTP ${status}`)
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      })
    })
    connectReq.end()
  })
}

export function tcpCheck(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    let done = false
    const socket = net.connect({ host, port })
    const finish = (ok) => {
      if (done) return
      done = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeout, () => finish(false))
    socket.on('connect', () => finish(true))
    socket.on('error', () => finish(false))
  })
}

export function run(command, args, { timeout = 20000, env = {} } = {}) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, {
        windowsHide: true,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      resolve({ ok: false, code: -1, stdout: '', stderr: error.message })
      return
    }
    let stdout = ''
    let stderr = ''
    let done = false
    const finish = (code, extra = '') => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve({ ok: code === 0, code, stdout, stderr: stderr + extra })
    }
    const timer = setTimeout(() => {
      try {
        child.kill()
      } catch {
        /* ignore */
      }
      finish(-1, ' [timeout]')
    }, timeout)
    child.stdout.on('data', (chunk) => (stdout += chunk.toString('utf8')))
    child.stderr.on('data', (chunk) => (stderr += chunk.toString('utf8')))
    child.on('error', (error) => {
      stderr += error.message
      finish(-1)
    })
    child.on('close', (code) => finish(code ?? -1))
  })
}

function clashRequest(base, pathname, { method = 'GET', body = null, timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const raw = String(base || '')
    const pipePath = raw.startsWith('pipe:') ? raw.slice(5) : ''
    const split = raw.lastIndexOf(':')
    const host = split > 0 ? raw.slice(0, split) : raw
    const port = split > 0 ? Number(raw.slice(split + 1)) : 80
    const data = body == null ? null : Buffer.from(JSON.stringify(body))
    const req = http.request(
      {
        ...(pipePath ? { socketPath: pipePath } : { hostname: host, port }),
        path: pathname,
        method,
        headers: {
          Accept: 'application/json',
          'User-Agent': UA,
          ...(data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {}),
        },
        timeout,
      },
      (res) => {
        let buf = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (buf += chunk))
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Clash HTTP ${res.statusCode}: ${buf.slice(0, 200)}`))
            return
          }
          if (buf.trim() === '') {
            resolve(null)
            return
          }
          try {
            resolve(JSON.parse(buf))
          } catch {
            resolve(buf)
          }
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('Clash controller timeout')))
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

export function parseInfoNodes(names) {
  const text = names.join('\n')
  const traffic = text.match(/剩余流量[：:]\s*([\d.]+)\s*GB/i)
  const expiry = text.match(/套餐到期[：:]\s*(\d{4}-\d{2}-\d{2})/)
  const reset = text.match(/距离下次重置剩余[：:]\s*(\d+)\s*天/)
  return {
    trafficGb: traffic ? Number(traffic[1]) : null,
    expiry: expiry ? expiry[1] : null,
    resetDays: reset ? Number(reset[1]) : null,
    raw: names.filter((name) => INFO_PATTERN.test(name)),
  }
}

export function isRealNode(name, value) {
  if (typeof name !== 'string' || !value) return false
  if (BUILTIN.has(name)) return false
  if (GROUP_TYPES.has(value.type)) return false
  if (INFO_PATTERN.test(name)) return false
  return typeof value.type === 'string' && value.type.length > 0
}

function readYamlScalar(text, key) {
  if (typeof text !== 'string') return null
  const re = new RegExp(`^\\s*${key}\\s*:\\s*(.*?)\\s*$`, 'm')
  const match = text.match(re)
  if (!match) return null
  return match[1].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '').trim()
}

function readTextIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  } catch {
    return ''
  }
}

/**
 * Best-effort detection of a running Clash Verge (Rev) instance.
 * It never writes to Clash Verge; it only reads the process command line and
 * the app's own generated config. Clash Verge exposes its controller on a
 * Windows named pipe by default (external-controller is disabled), so the
 * returned value uses the `pipe:` scheme understood by clashRequest().
 */
export async function detectClashVerge() {
  const out = {
    ok: false,
    app: 'Clash Verge',
    controller: '',
    source: null,
    mixedPort: null,
    processNames: ['clash-verge.exe', 'verge-mihomo.exe'],
    configPath: null,
    error: null,
  }
  if (process.platform !== 'win32') {
    out.error = 'Clash Verge detection is Windows-only'
    return out
  }
  const ps = "$p=Get-CimInstance Win32_Process -Filter \"Name='verge-mihomo.exe'\" | Select-Object -First 1; if($p){$p.CommandLine}"
  const proc = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { timeout: 6000 })
  const commandLine = proc.ok ? proc.stdout.replace(/^\uFEFF/, '').trim() : ''
  let dir = ''
  const dm = commandLine.match(/-d\s+("?)([^"\s]+)\1/)
  if (dm) dir = dm[2]
  if (!dir) {
    const appData = process.env.APPDATA ? path.join(process.env.APPDATA, 'io.github.clash-verge-rev.clash-verge-rev') : ''
    const localAppData = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'io.github.clash-verge-rev.clash-verge-rev') : ''
    dir = [appData, localAppData].find((item) => item && fs.existsSync(item)) || ''
  }
  if (dir) {
    const runtimeYaml = readTextIfExists(path.join(dir, 'clash-verge.yaml'))
    const vergeYaml = readTextIfExists(path.join(dir, 'verge.yaml'))
    const mixed = Number(readYamlScalar(runtimeYaml, 'mixed-port') || readYamlScalar(vergeYaml, 'verge_mixed_port'))
    if (Number.isInteger(mixed) && mixed > 0 && mixed <= 65535) out.mixedPort = mixed
    const external = readYamlScalar(runtimeYaml, 'external-controller')
    if (external && external !== "''" && external !== '""') {
      out.controller = external
      out.source = 'http'
    }
    if (dir) out.configPath = dir
  }
  const pm = commandLine.match(/-ext-ctl-pipe\s+("?)([^"\s]+)\1/)
  if (pm) {
    out.controller = `pipe:${pm[2]}`
    out.source = 'pipe'
  }
  out.ok = Boolean(out.controller)
  if (!out.ok) out.error = '未发现运行中的 verge-mihomo.exe 或可用控制器'
  return out
}

export async function getClashState(base) {
  const out = {
    reachable: false,
    version: null,
    configs: null,
    groups: [],
    nodes: [],
    info: { trafficGb: null, expiry: null, resetDays: null, raw: [] },
    error: null,
  }
  if (!base) {
    out.error = '未配置 Clash / Mihomo 控制器（可留空，改用系统代理或 TUN）'
    return out
  }
  try {
    const version = await clashRequest(base, '/version', { timeout: 4000 })
    out.version = version?.version ?? null
    const configs = await clashRequest(base, '/configs', { timeout: 4000 })
    out.configs = configs
      ? {
          mixedPort: configs['mixed-port'] ?? null,
          mode: configs.mode ?? null,
          allowLan: configs['allow-lan'] ?? null,
          tun: configs.tun?.enable ?? null,
        }
      : null
    const proxies = await clashRequest(base, '/proxies', { timeout: 6000 })
    const entries = Object.entries(proxies?.proxies ?? {})
    out.groups = entries
      .filter(([, value]) => GROUP_TYPES.has(value.type))
      .map(([name, value]) => ({
        name,
        type: value.type,
        now: typeof value.now === 'string' ? value.now : null,
        all: Array.isArray(value.all) ? value.all : [],
      }))
    out.nodes = entries
      .filter(([name, value]) => isRealNode(name, value))
      .map(([name, value]) => ({ name, type: value.type, delay: value.delay ?? null }))
    out.info = parseInfoNodes(entries.map(([name]) => name))
    out.reachable = true
  } catch (error) {
    out.error = error?.message ?? String(error)
  }
  return out
}

export async function getWindowsState({ mixedPort = 7890, processNames = [], serviceName = '' } = {}) {
  const out = {
    platform: process.platform,
    systemProxy: null,
    processes: { count: 0, counts: {}, names: [] },
    service: null,
    mixedPort: { port: mixedPort, listening: false },
  }
  const isWindows = process.platform === 'win32'
  if (isWindows) {
    const reg = await run('reg.exe', [
      'query',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    ])
    if (reg.ok) {
      const enable = reg.stdout.match(/ProxyEnable\s+REG_DWORD\s+0x([0-9a-f]+)/i)
      const server = reg.stdout.match(/ProxyServer\s+REG_SZ\s+(.+?)\s*$/im)
      out.systemProxy = {
        enabled: enable ? Number.parseInt(enable[1], 16) === 1 : null,
        server: server ? server[1].trim() : null,
      }
    }
    if (processNames.length > 0) {
      const tasklist = await run('tasklist.exe', ['/FO', 'CSV', '/NH'], { timeout: 8000 })
      if (tasklist.ok) {
        const wanted = new Set(processNames.map((name) => name.toLowerCase()))
        const counts = {}
        for (const line of tasklist.stdout.split(/\r?\n/)) {
          const m = line.match(/^"([^"]+)"\s*,/)
          if (!m) continue
          const name = m[1]
          if (wanted.has(name.toLowerCase())) counts[name] = (counts[name] ?? 0) + 1
        }
        const names = Object.keys(counts)
        out.processes = {
          count: names.reduce((sum, name) => sum + counts[name], 0),
          counts,
          names,
        }
      }
    }
    if (serviceName) {
      const service = await run('sc.exe', ['query', serviceName], { timeout: 5000 })
      if (service.ok) {
        const state = service.stdout.match(/STATE\s*:\s*\d+\s+(\w+)/i)
        out.service = { name: serviceName, state: state ? state[1] : 'UNKNOWN' }
      }
    }
  }
  out.mixedPort.listening = await tcpCheck('127.0.0.1', mixedPort)
  return out
}

export async function fetchExitInfo({ proxyHost = '127.0.0.1', proxyPort = 7890, timeout = 15000, proxyMode = 'http' } = {}) {
  const started = Date.now()
  const parse = (data, via) => ({
    ok: true,
    ip: data.ip,
    country: data.country,
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    timezone: typeof data.timezone === 'object' ? data.timezone?.id : data.timezone,
    asn: data.connection?.asn,
    isp: data.connection?.isp,
    org: data.connection?.org,
    source: 'ipwho.is',
    via,
    latencyMs: Date.now() - started,
  })
  let proxyError = null
  if (proxyMode !== 'none') {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const data = await proxyJson('https://ipwho.is/', proxyHost, proxyPort, timeout)
        if (data?.success) return parse(data, 'proxy')
        proxyError = 'ipwho.is returned success=false'
      } catch (error) {
        proxyError = error?.message ?? String(error)
      }
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }
  if (proxyMode === 'http' && proxyError) {
    return { ok: false, error: `代理出口探测失败：${proxyError}`, via: 'proxy', latencyMs: Date.now() - started }
  }
  try {
    const response = await globalThis.fetch('https://ipwho.is/', {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    const data = await response.json()
    if (data?.success) return parse(data, 'direct')
    return { ok: false, error: 'ipwho.is returned success=false', latencyMs: Date.now() - started }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error), latencyMs: Date.now() - started }
  }
}

export async function queryIpApi(ip, timeout = 6000) {
  if (!ip) return null
  const parse = (text) => {
    const data = JSON.parse(String(text).replace(/^\uFEFF/, '').trim())
    if (data?.status !== 'success') return null
    return {
      proxy: data.proxy === true,
      hosting: data.hosting === true,
      mobile: data.mobile === true,
      isp: data.isp ?? null,
      org: data.org ?? null,
      as: data.as ?? null,
    }
  }
  try {
    const data = await httpJson(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,proxy,hosting,mobile,countryCode,isp,org,as,query`,
      timeout,
    )
    if (data?.status === 'success') {
      return {
        proxy: data.proxy === true,
        hosting: data.hosting === true,
        mobile: data.mobile === true,
        isp: data.isp ?? null,
        org: data.org ?? null,
        as: data.as ?? null,
      }
    }
  } catch {
    /* fall through to the system-proxy-aware PowerShell request */
  }
  try {
    // The DSH host process is not guaranteed to inherit the Windows system
    // proxy, while PowerShell's Invoke-RestMethod does. ip-api is the free
    // no-key source for proxy/hosting flags, so keep this narrow fallback.
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,proxy,hosting,mobile,countryCode,isp,org,as,query`
    const command = `$ProgressPreference='SilentlyContinue'; try { Invoke-RestMethod -Uri '${url}' -TimeoutSec 8 | ConvertTo-Json -Compress } catch { '' }`
    const result = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      timeout: timeout + 4000,
    })
    if (result.ok && result.stdout.trim() !== '') return parse(result.stdout)
  } catch {
    /* ignore */
  }
  return null
}

export async function runIpjudge(exe, ip, timeout = 45000, proxyUrl = '') {
  const res = await run(exe, [ip], {
    timeout,
    env: {
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      ...(proxyUrl ? { HTTP_PROXY: proxyUrl, HTTPS_PROXY: proxyUrl } : {}),
    },
  })
  const text = `${res.stdout}\n${res.stderr}`
  const scoreMatch = text.match(/score\s+(\d+)/i)
  const score = scoreMatch ? Number(scoreMatch[1]) : null
  const items = []
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(Claude|ChatGPT|Gemini API|Gemini|Muse)\s+(good|warn|bad|info)\s+(.*)$/)
    if (m) items.push({ name: m[1], level: m[2], text: m[3].trim() })
  }
  const detail = (text.match(/detail:\s*(https?:\/\/\S+)/i) || [])[1] ?? null
  return {
    ok: res.ok || Number.isFinite(score),
    score,
    items,
    detail,
    raw: text.slice(-2000),
    error: res.ok || Number.isFinite(score) ? null : (res.stderr || 'ipjudge failed').slice(0, 500),
  }
}

export async function runIpcheck(exe, timeout = 120000, proxyUrl = '') {
  let dir = null
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-vpn-guard-'))
    const file = path.join(dir, 'ipcheck.json')
    const res = await run(exe, ['--json', '--output', file], {
      timeout,
      env: {
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
        ...(proxyUrl ? { HTTP_PROXY: proxyUrl, HTTPS_PROXY: proxyUrl } : {}),
      },
    })
    if (!fs.existsSync(file)) {
      return { ok: false, error: 'ipcheck did not create its output file', stderr: (res.stderr || '').slice(0, 500) }
    }
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
    const data = JSON.parse(text)
    const checks = Array.isArray(data.checks) ? data.checks : []
    const byId = Object.fromEntries(checks.map((check) => [check.id, check]))
    const location = byId['network.location']?.data ?? {}
    const reputation = byId['claude.web.reputation']?.data ?? {}
    const abuse = byId['claude.web.abuse']?.data ?? {}
    const region = byId['claude.region']?.data ?? {}
    const summary = data.summary ?? {}
    return {
      ok: true,
      level: summary.level ?? null,
      message: summary.message ?? null,
      location,
      reputation: {
        classification: reputation.classification ?? null,
        score: reputation.score ?? null,
        proxy: reputation.proxy ?? null,
        vpn: reputation.vpn ?? null,
        tor: reputation.tor ?? null,
        crawler: reputation.crawler ?? null,
      },
      abuse: { listed: abuse.listed ?? null },
      region: { unsupported: region.unsupported ?? null, routes: region.routes ?? [] },
      checks: checks.map((check) => ({
        id: check.id,
        label: check.label,
        severity: check.severity,
        summary: check.summary,
      })),
    }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error) }
  } finally {
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
  }
}

export async function switchClashNode(base, group, node) {
  await clashRequest(base, `/proxies/${encodeURIComponent(group)}`, {
    method: 'PUT',
    body: { name: node },
    timeout: 8000,
  })
}
