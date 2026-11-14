/**
 * dsh-vpn-guard — Host half.
 *
 * Provider-agnostic egress monitor. Clash/Mihomo is an optional adapter;
 * system-proxy and TUN setups work through the generic egress probe. The only
 * write action is an explicitly confirmed Clash selector switch (PUT
 * /proxies/<group>) and it is limited to the configured allow-list of groups.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  detectClashVerge,
  fetchExitInfo,
  getClashConnections,
  getClashState,
  getWindowsState,
  queryIpApi,
  runIpcheck,
  runIpjudge,
  switchClashNode,
} from './lib/probe.js'
import { computeScores } from './lib/score.js'
import { buildNodeRows, readCsvRows, readKeyNodes } from './lib/nodes.js'
import { createStore, defaultDataDir } from './lib/store.js'

export const inject = ['webServer']

const VERSION = '0.4.0'
const BASE = '/__dsh-vpn-guard'
const MAX_BODY = 32 * 1024

const DEFAULTS = {
  provider: 'auto',
  proxyMode: 'auto',
  controller: '',
  proxyHost: '127.0.0.1',
  proxyPort: 7890,
  selectorGroup: '',
  allowedSwitchGroups: [],
  processNames: [],
  serviceName: '',
  lightIntervalMs: 5 * 60 * 1000,
  fullIntervalMs: 6 * 60 * 60 * 1000,
  ipjudgePath: '',
  ipcheckPath: '',
  nodesCsvPath: '',
  keyNodesPath: '',
  trafficWarnGb: 20,
  expiryWarnDays: 30,
  scoreDropWarn: 10,
  dataDir: defaultDataDir(),
}

const PUBLIC_KEYS = [
  'provider',
  'proxyMode',
  'controller',
  'proxyHost',
  'proxyPort',
  'selectorGroup',
  'allowedSwitchGroups',
  'processNames',
  'serviceName',
  'lightIntervalMs',
  'fullIntervalMs',
  'ipjudgePath',
  'ipcheckPath',
  'nodesCsvPath',
  'keyNodesPath',
  'trafficWarnGb',
  'expiryWarnDays',
  'scoreDropWarn',
  'dataDir',
]

function normalizeStringList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function normalizeConfig(input) {
  const next = { ...DEFAULTS }
  if (input && typeof input === 'object') {
    for (const key of PUBLIC_KEYS) {
      if (input[key] !== undefined && input[key] !== null) next[key] = input[key]
    }
  }
  next.provider = ['auto', 'clash', 'system', 'none'].includes(next.provider) ? next.provider : 'auto'
  next.proxyMode = ['auto', 'http', 'tun', 'none'].includes(next.proxyMode) ? next.proxyMode : 'auto'
  next.proxyPort = Number(next.proxyPort) || 7890
  next.lightIntervalMs = Math.max(30 * 1000, Number(next.lightIntervalMs) || DEFAULTS.lightIntervalMs)
  next.fullIntervalMs = Math.max(60 * 1000, Number(next.fullIntervalMs) || DEFAULTS.fullIntervalMs)
  next.trafficWarnGb = Number(next.trafficWarnGb) || DEFAULTS.trafficWarnGb
  next.expiryWarnDays = Number(next.expiryWarnDays) || DEFAULTS.expiryWarnDays
  next.scoreDropWarn = Number(next.scoreDropWarn) || DEFAULTS.scoreDropWarn
  next.controller = typeof next.controller === 'string' ? next.controller.trim() : ''
  next.selectorGroup = typeof next.selectorGroup === 'string' ? next.selectorGroup.trim() : ''
  next.serviceName = typeof next.serviceName === 'string' ? next.serviceName.trim() : ''
  next.allowedSwitchGroups = normalizeStringList(next.allowedSwitchGroups)
  next.processNames = normalizeStringList(next.processNames)
  return next
}

function publicConfig(cfg) {
  return {
    provider: cfg.provider,
    proxyMode: cfg.proxyMode,
    controller: cfg.controller,
    proxyHost: cfg.proxyHost,
    proxyPort: cfg.proxyPort,
    selectorGroup: cfg.selectorGroup,
    allowedSwitchGroups: cfg.allowedSwitchGroups,
    processNames: cfg.processNames,
    serviceName: cfg.serviceName,
    lightIntervalMs: cfg.lightIntervalMs,
    fullIntervalMs: cfg.fullIntervalMs,
    ipjudgePath: cfg.ipjudgePath,
    ipcheckPath: cfg.ipcheckPath,
    nodesCsvPath: cfg.nodesCsvPath,
    keyNodesPath: cfg.keyNodesPath,
    trafficWarnGb: cfg.trafficWarnGb,
    expiryWarnDays: cfg.expiryWarnDays,
    scoreDropWarn: cfg.scoreDropWarn,
    dataDir: cfg.dataDir,
  }
}

function daysUntil(dateText) {
  if (!dateText) return null
  const target = Date.parse(`${dateText}T00:00:00+08:00`)
  if (!Number.isFinite(target)) return null
  return Math.ceil((target - Date.now()) / 86400000)
}

function buildAlerts(snapshot, previous, cfg) {
  const alerts = []
  const clash = snapshot.clash
  const windows = snapshot.windows
  if (cfg.controller && !clash?.reachable) {
    alerts.push({ level: 'bad', text: `Clash / Mihomo 控制器不可达：${clash?.error ?? cfg.controller}` })
  }
  if (cfg.proxyMode === 'http' && windows && !windows.mixedPort?.listening) {
    alerts.push({ level: 'warn', text: `本地代理端口 ${cfg.proxyHost}:${cfg.proxyPort} 未监听（TUN 用户请把代理模式改为 tun）` })
  }
  if (cfg.proxyMode !== 'tun') {
    const mixed = snapshot.detectedMixedPort ?? clash?.configs?.mixedPort
    if (mixed != null && Number(mixed) !== Number(cfg.proxyPort)) {
      alerts.push({ level: 'warn', text: `Clash mixed-port ${mixed} 与插件代理端口 ${cfg.proxyPort} 不一致` })
    }
  }
  if (windows?.systemProxy && windows.systemProxy.enabled === false) {
    alerts.push({ level: 'warn', text: '系统代理已关闭' })
  }
  if (!snapshot.exit?.ok) alerts.push({ level: 'warn', text: `出口 IP 获取失败：${snapshot.exit?.error ?? '未知错误'}` })
  if (previous?.exitIp && snapshot.exit?.ip && previous.exitIp !== snapshot.exit.ip) {
    alerts.push({ level: 'info', text: `出口 IP 变化：${previous.exitIp} → ${snapshot.exit.ip}` })
  }
  if (snapshot.scores?.ai != null && previous?.scores?.ai != null) {
    const drop = previous.scores.ai - snapshot.scores.ai
    if (drop >= cfg.scoreDropWarn) alerts.push({ level: 'warn', text: `AI 可用性下降 ${drop} 分（${previous.scores.ai} → ${snapshot.scores.ai}）` })
  }
  const traffic = snapshot.clash?.info?.trafficGb
  if (typeof traffic === 'number' && traffic < cfg.trafficWarnGb) {
    alerts.push({ level: 'warn', text: `剩余流量偏低：${traffic} GB` })
  }
  const expiryDays = daysUntil(snapshot.clash?.info?.expiry)
  if (typeof expiryDays === 'number' && expiryDays <= cfg.expiryWarnDays) {
    alerts.push({ level: 'warn', text: `套餐将在 ${expiryDays} 天后到期（${snapshot.clash.info.expiry}）` })
  }
  return alerts
}

function compactRecord(snapshot) {
  return {
    ts: snapshot.ts,
    mode: snapshot.mode,
    node: snapshot.current,
    exitIp: snapshot.exit?.ip ?? null,
    country: snapshot.exit?.country ?? null,
    latencyMs: snapshot.exit?.latencyMs ?? null,
    scores: snapshot.scores ?? null,
    aiScore: snapshot.ai?.ipjudge?.score ?? null,
    claudeLevel: snapshot.ai?.claude?.level ?? null,
    alerts: (snapshot.alerts ?? []).map((item) => item.text),
  }
}

function isLocalRequest(req) {
  const origin = req?.headers?.origin
  if (typeof origin !== 'string' || origin === '' || origin === 'null') return true
  try {
    const url = new URL(origin)
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]'
  } catch {
    return false
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (text.trim() === '') {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(text))
      } catch (error) {
        reject(new Error(`请求体不是合法 JSON：${error?.message ?? String(error)}`))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

export function apply(ctx, config) {
  const store = createStore(DEFAULTS.dataDir)
  let cfg = normalizeConfig({ ...config, ...store.readConfig() })
  store.saveConfig(publicConfig(cfg))

  let snapshot = null
  let running = null
  let lastFullAt = null
  let lastLightAt = null
  let nodeCache = { at: 0, rows: [] }
  const pendingSwitches = new Map()
  let timers = []
  let detectCache = { at: 0, value: null }

  async function getClashVergeDetection(force = false) {
    const now = Date.now()
    if (!force && detectCache.value && now - detectCache.at < 60 * 1000) return detectCache.value
    const value = await detectClashVerge()
    detectCache = { at: now, value }
    return value
  }

  async function resolvedController() {
    if (cfg.controller && !['auto', 'clash-verge'].includes(cfg.controller)) return cfg.controller
    const detected = await getClashVergeDetection()
    return detected?.ok ? detected.controller : ''
  }

  function readNodeSources() {
    const now = Date.now()
    if (now - nodeCache.at < 60 * 1000) return nodeCache.rows
    const rows = buildNodeRows({
      clash: snapshot?.clash ?? { groups: [], nodes: [] },
      csvRows: readCsvRows(cfg.nodesCsvPath),
      keyNodes: readKeyNodes(cfg.keyNodesPath),
    })
    nodeCache = { at: now, rows }
    return rows
  }

  async function probeLight() {
    const controller = await resolvedController()
    const detected = await getClashVergeDetection()
    const [clash, windows] = await Promise.all([
      getClashState(controller),
      getWindowsState({
        mixedPort: cfg.proxyPort,
        processNames: cfg.processNames,
        serviceName: cfg.serviceName,
      }),
    ])
    const exit = await fetchExitInfo({
      proxyHost: cfg.proxyHost,
      proxyPort: cfg.proxyPort,
      timeout: 15000,
      proxyMode: cfg.proxyMode,
    })
    const current =
      clash.groups.find((group) => group.name === cfg.selectorGroup)?.now ??
      clash.groups.find((group) => group.name === 'GLOBAL')?.now ??
      clash.groups[0]?.now ??
      null
    return {
      ts: new Date().toISOString(),
      mode: 'light',
      controller,
      controllerSource: detected?.ok ? detected.source : null,
      detectedApp: detected?.ok ? detected.app : null,
      detectedMixedPort: detected?.mixedPort ?? null,
      clash,
      windows,
      exit,
      current,
      ai: null,
      scores: null,
      alerts: [],
    }
  }

  async function probeFull() {
    const base = await probeLight()
    base.mode = 'full'
    const ip = base.exit?.ip ?? null
    const proxyUrl =
      cfg.proxyMode === 'http' || cfg.proxyMode === 'auto'
        ? `http://${cfg.proxyHost}:${cfg.proxyPort}`
        : ''
    const [ipApi, ipjudge] = await Promise.all([
      queryIpApi(ip),
      ip && cfg.ipjudgePath
        ? runIpjudge(cfg.ipjudgePath, ip, 45000, proxyUrl)
        : Promise.resolve({ ok: false, score: null, items: [], error: '未配置 ipjudge（可选）' }),
    ])
    const claude = cfg.ipcheckPath
      ? await runIpcheck(cfg.ipcheckPath, 120000, proxyUrl)
      : { ok: false, error: '未配置 ipcheck（可选）' }
    const chatgpt = ipjudge?.items?.find((item) => item.name === 'ChatGPT') ?? null
    const scores = computeScores({
      exitInfo: base.exit,
      ipApi,
      ipjudge,
      claude,
      network: {
        clashReachable: base.clash?.reachable === true,
        proxyPortListening: base.windows?.mixedPort?.listening === true,
      },
    })
    const previous = store.readHistory(1)[0] ?? null
    const complete = {
      ...base,
      ipApi,
      ai: {
        ipjudge,
        claude,
        codex: {
          level: chatgpt?.level ?? null,
          label: chatgpt ? '按 ChatGPT 同地区规则推断' : '无 ChatGPT 数据，无法推断',
          inferred: true,
        },
      },
      scores,
      alerts: [],
    }
    complete.alerts = buildAlerts(complete, previous, cfg)
    store.appendHistory(compactRecord(complete))
    return complete
  }

  async function runCheck(mode) {
    if (running) return running
    const job = (async () => {
      const result = mode === 'full' ? await probeFull() : await probeLight()
      if (mode === 'light') {
        // 轻检只刷新运行态；AI 评分属于全量结果，保留上一次全量值，
        // 避免每 5 分钟的轻检把页面上的评分清空（表现为“像没显示完”）。
        result.ai = snapshot?.ai ?? null
        result.scores = snapshot?.scores ?? null
        result.aiFromTs = lastFullAt
      }
      snapshot = result
      nodeCache = { at: 0, rows: [] }
      if (mode === 'full') lastFullAt = result.ts
      else lastLightAt = result.ts
      return result
    })()
    running = job
    try {
      return await job
    } finally {
      running = null
    }
  }

  function armTimers() {
    for (const timer of timers) clearInterval(timer)
    timers = []
    timers.push(
      setInterval(() => {
        runCheck('light').catch((error) => console.log(`[vpn-guard] light check failed: ${error?.message ?? error}`))
      }, cfg.lightIntervalMs),
    )
    timers.push(
      setInterval(() => {
        runCheck('full').catch((error) => console.log(`[vpn-guard] full check failed: ${error?.message ?? error}`))
      }, cfg.fullIntervalMs),
    )
  }

  ctx.effect(() => {
    const kickLight = setTimeout(() => {
      runCheck('light').catch(() => {})
    }, 1500)
    const kickFull = setTimeout(() => {
      runCheck('full').catch(() => {})
    }, 20000)
    armTimers()
    return () => {
      clearTimeout(kickLight)
      clearTimeout(kickFull)
      for (const timer of timers) clearInterval(timer)
      timers = []
      pendingSwitches.clear()
    }
  }, 'vpn-guard: timers')

  const routes = [
    {
      method: 'GET',
      path: `${BASE}/status`,
      handler: async () => ({
        ok: true,
        version: VERSION,
        snapshot,
        config: publicConfig(cfg),
        detection: detectCache.value,
        lastLightAt,
        lastFullAt,
        dataDir: cfg.dataDir,
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      }),
    },
    {
      method: 'GET',
      path: `${BASE}/detect`,
      handler: async () => ({ ok: true, detection: await getClashVergeDetection(true) }),
    },
    {
      method: 'GET',
      path: `${BASE}/clash`,
      handler: async () => {
        const controller = await resolvedController()
        const clash = await getClashState(controller)
        const connections = clash.reachable
          ? await getClashConnections(controller)
          : { ok: false, count: 0, uploadTotal: 0, downloadTotal: 0, memory: null, items: [], error: clash.error }
        return {
          ok: true,
          controller,
          clash,
          connections,
          updatedAt: new Date().toISOString(),
        }
      },
    },
    {
      method: 'POST',
      path: `${BASE}/check`,
      handler: async (req) => {
        const body = await readJsonBody(req)
        const mode = body.mode === 'full' ? 'full' : 'light'
        const result = await runCheck(mode)
        return { ok: true, snapshot: result, mode }
      },
    },
    {
      method: 'GET',
      path: `${BASE}/nodes`,
      handler: async () => {
        if (!snapshot) await runCheck('light')
        return { ok: true, nodes: readNodeSources(), updatedAt: snapshot?.ts ?? null }
      },
    },
    {
      method: 'GET',
      path: `${BASE}/history`,
      handler: async (_req, _res, url) => {
        const limit = Number(url.searchParams.get('limit') ?? 50)
        return { ok: true, history: store.readHistory(Math.max(1, Math.min(200, limit || 50))) }
      },
    },
    {
      method: 'POST',
      path: `${BASE}/switch`,
      handler: async (req) => {
        const body = await readJsonBody(req)
        const group = typeof body.group === 'string' ? body.group : cfg.selectorGroup
        const node = typeof body.node === 'string' ? body.node.trim() : ''
        if (!node) return { ok: false, error: '缺少目标节点', status: 400 }
        if (!cfg.allowedSwitchGroups.includes(group)) {
          return { ok: false, error: `不允许切换该组：${group}`, status: 403 }
        }
        const controller = await resolvedController()
        const clash = snapshot?.clash ?? (await getClashState(controller))
        const targetGroup = clash.groups.find((item) => item.name === group)
        if (!targetGroup) return { ok: false, error: `找不到 selector 组：${group}`, status: 400 }
        if (!targetGroup.all.includes(node)) return { ok: false, error: `节点不在该组内：${node}`, status: 400 }

        if (body.confirm !== true) {
          const token = crypto.randomUUID()
          pendingSwitches.set(token, { group, node, expiresAt: Date.now() + 60 * 1000 })
          for (const [key, value] of pendingSwitches) {
            if (value.expiresAt < Date.now()) pendingSwitches.delete(key)
          }
          return { ok: true, confirmRequired: true, token, group, node, expiresAt: Date.now() + 60 * 1000 }
        }

        const token = typeof body.token === 'string' ? body.token : ''
        const pending = pendingSwitches.get(token)
        if (!pending || pending.group !== group || pending.node !== node || pending.expiresAt < Date.now()) {
          return { ok: false, error: '确认令牌无效或已过期，请重新点击切换', status: 400 }
        }
        pendingSwitches.delete(token)
        await switchClashNode(controller, group, node)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        const result = await runCheck('light')
        return { ok: true, group, node, snapshot: result }
      },
    },
    {
      methods: ['GET', 'POST'],
      path: `${BASE}/config`,
      handler: async (req) => {
        if ((req.method ?? 'GET').toUpperCase() === 'GET') {
          return { ok: true, config: publicConfig(cfg) }
        }
        const body = await readJsonBody(req)
        const patch = {}
        for (const key of PUBLIC_KEYS) {
          if (body[key] !== undefined) patch[key] = body[key]
        }
        cfg = normalizeConfig({ ...cfg, ...patch })
        store.saveConfig(publicConfig(cfg))
        armTimers()
        return { ok: true, config: publicConfig(cfg) }
      },
    },
  ]

  for (const route of routes) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: route.path,
          handler: async (req, res) => {
            if (!isLocalRequest(req)) {
              sendJson(res, 403, { ok: false, error: '只接受本机窗口的请求' })
              return
            }
            const allowedMethods = route.methods ?? [route.method]
            if (!allowedMethods.includes((req.method ?? 'GET').toUpperCase())) {
              sendJson(res, 405, { ok: false, error: `method not allowed (use ${allowedMethods.join(' / ')})` })
              return
            }
            try {
              let url
              try {
                url = new URL(req.url ?? route.path, 'http://127.0.0.1')
              } catch {
                url = new URL(route.path, 'http://127.0.0.1')
              }
              const payload = await route.handler(req, res, url)
              const failed = payload !== null && typeof payload === 'object' && payload.ok === false
              const status = failed && Number.isInteger(payload.status) ? payload.status : failed ? 400 : 200
              sendJson(res, status, payload)
            } catch (error) {
              sendJson(res, 500, { ok: false, error: error?.message ?? String(error) })
            }
          },
        }),
      `vpn-guard: ${route.path}`,
    )
  }

  console.log(`[dsh-vpn-guard] host half loaded (v${VERSION}) — routes under ${BASE}`)
}
