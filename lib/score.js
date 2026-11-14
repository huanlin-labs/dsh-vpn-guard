/**
 * Evidence-weighted scoring.
 *
 * Scores are 0-100 health scores (higher is better). Internally every factor
 * is continuous; only the final value is rounded, so a clean IP does not get
 * an artificially "round" score just because every penalty happened to be 5.
 *
 * The weights below are heuristics, not vendor-published truth. Keep them
 * explainable: each penalty maps to one observable signal.
 */

const LEVEL_SCORE = {
  good: 97.4,
  info: 72.6,
  warn: 44.8,
  bad: 16.9,
}

const ISP_PENALTIES = [
  [/amazon|aws/i, 15.7],
  [/digitalocean|vultr|linode|hetzner|ovh/i, 18.9],
  [/cloudflare/i, 12.3],
  [/gtt|cogent|telia|ntt|level.?3/i, 7.7],
]

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function clampRaw(value) {
  if (!finite(value)) return null
  return Math.max(0, Math.min(100, value))
}

function scoreOut(value) {
  const raw = clampRaw(value)
  return raw == null ? null : Math.round(raw * 10) / 10
}

function reputationFlags(claude) {
  const rep = claude?.reputation || {}
  return {
    proxy: rep.proxy === true,
    vpn: rep.vpn === true,
    tor: rep.tor === true,
    crawler: rep.crawler === true,
    classification: String(rep.classification || ''),
  }
}

function identityScore({ exitInfo, ipApi, ipjudge, claude }) {
  let raw = 100
  if (ipApi?.proxy === true) raw -= 20.7
  if (ipApi?.hosting === true) raw -= 23.4
  if (ipApi?.mobile === true) raw += 2.8

  const flags = reputationFlags(claude)
  if (flags.proxy) raw -= 12.6
  if (flags.vpn) raw -= 14.8
  if (flags.tor) raw -= 31.5
  if (flags.crawler) raw -= 7.2

  const orgText = `${exitInfo?.asn ?? ''} ${exitInfo?.isp ?? ''} ${exitInfo?.org ?? ''}`
  for (const [pattern, penalty] of ISP_PENALTIES) {
    if (pattern.test(orgText)) {
      raw -= penalty
      break
    }
  }
  if (/商业|机房|数据中心/.test(flags.classification)) raw -= 5.9

  if (finite(ipjudge?.score) && ipjudge.score < 85) {
    raw -= (85 - ipjudge.score) * 0.35
  }
  return clampRaw(raw)
}

function reputationScore(claude) {
  if (!claude?.ok) return null
  const risk = finite(claude.reputation?.score) ? claude.reputation.score : null
  if (risk == null) return null
  let raw = 100 - risk * 0.68
  const flags = reputationFlags(claude)
  if (flags.proxy) raw -= 10.2
  if (flags.vpn) raw -= 12.8
  if (flags.tor) raw -= 30.4
  if (/商业|机房|数据中心/.test(flags.classification)) raw -= 4.6
  if (claude.abuse?.listed === true) raw -= 28.4
  return clampRaw(raw)
}

function aiScore(ipjudge, claude) {
  const items = Array.isArray(ipjudge?.items) ? ipjudge.items : []
  if (!finite(ipjudge?.score) && items.length === 0) return null
  const base = finite(ipjudge?.score) ? ipjudge.score : 70
  const levels = items
    .map((item) => LEVEL_SCORE[item.level])
    .filter((value) => finite(value))
  const average = levels.length
    ? levels.reduce((sum, value) => sum + value, 0) / levels.length
    : base
  // ipjudge's own score is the strongest signal; per-service levels add
  // platform-specific detail without letting one bad row dominate.
  let raw = base * 0.58 + average * 0.42
  if (/商业|机房|数据中心/.test(String(claude?.reputation?.classification || ''))) {
    raw -= 4.8
  }
  return clampRaw(raw)
}

function networkScore({ exitInfo, network }) {
  let raw = 0
  if (network?.clashReachable === true) raw += 25
  if (network?.proxyPortListening === true) raw += 25
  if (exitInfo?.ok === true) raw += 15
  if (exitInfo?.ok === true && finite(exitInfo.latencyMs)) {
    // Smooth latency curve: 50 ms ~= 33 points, 900 ms ~= 12, 2000 ms ~= 3.
    raw += 35 * Math.exp(-Math.max(0, exitInfo.latencyMs) / 850)
  }
  return clampRaw(raw)
}

export function computeScores({ exitInfo, ipApi, ipjudge, claude, network } = {}) {
  const identity = identityScore({ exitInfo, ipApi, ipjudge, claude })
  const reputation = reputationScore(claude)
  const ai = aiScore(ipjudge, claude)
  const networkValue = networkScore({ exitInfo, network })

  const parts = [
    { key: 'identity', value: identity, weight: 0.23 },
    { key: 'reputation', value: reputation, weight: 0.21 },
    { key: 'ai', value: ai, weight: 0.34 },
    { key: 'network', value: networkValue, weight: 0.22 },
  ].filter((part) => finite(part.value))

  const weightSum = parts.reduce((sum, part) => sum + part.weight, 0)
  const overall = weightSum
    ? parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum
    : null

  return {
    identity: scoreOut(identity),
    reputation: scoreOut(reputation),
    ai: scoreOut(ai),
    network: scoreOut(networkValue),
    overall: scoreOut(overall),
  }
}

export { LEVEL_SCORE }
