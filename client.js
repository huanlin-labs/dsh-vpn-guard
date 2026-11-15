window.__ModuleLoader__.load({
  id: 'dsh-vpn-guard',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback } = React

    const API = '/__dsh-vpn-guard'
    const C = {
      primary: 'var(--dsw-alias-label-primary)',
      secondary: 'var(--dsw-alias-label-secondary)',
      bg: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      border: 'var(--dsw-alias-border-l1)',
      border2: 'var(--dsw-alias-border-l2)',
      brand: 'var(--dsw-alias-brand-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
    }

    const CSS = `
.vpg{box-sizing:border-box;min-height:100%;padding:24px 28px 56px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:"Segoe UI","Microsoft YaHei UI","PingFang SC",system-ui,sans-serif;font-size:13px}
.vpg *{box-sizing:border-box}
.vpg-header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.vpg-title{font-size:22px;font-weight:700;margin:0;letter-spacing:.3px}
.vpg-sub{color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:5px;line-height:1.6}
.vpg-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.vpg-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;line-height:1.2}
.vpg-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.vpg-btn.primary{background:transparent;border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);color:var(--dsw-alias-brand-primary)}
.vpg-btn.primary:hover{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)}
.vpg-btn.danger{background:var(--dsw-alias-state-error-primary);border-color:transparent;color:#fff}
.vpg-btn:disabled{opacity:.5;cursor:wait}
.vpg-btn.small{padding:4px 9px;font-size:11px;font-weight:500}
.vpg-hero{display:flex;gap:18px;align-items:stretch;justify-content:space-between;flex-wrap:wrap;background:linear-gradient(135deg,color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent),transparent 60%),var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:18px 20px;margin-bottom:14px}
.vpg-hero-main{min-width:280px;flex:1 1 420px}
.vpg-eyebrow{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--dsw-alias-label-secondary);margin-bottom:6px}
.vpg-hero-title{font-size:24px;font-weight:800;line-height:1.25;margin-bottom:6px}
.vpg-hero-sub{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.7;max-width:720px}
.vpg-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.vpg-kpis{display:grid;grid-template-columns:repeat(4,minmax(92px,1fr));gap:10px;flex:1 1 420px;max-width:620px}
.vpg-kpi{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;min-width:0}
.vpg-kpi-label{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vpg-kpi-value{font-size:24px;font-weight:800;line-height:1.2;margin-top:4px;font-variant-numeric:tabular-nums}
.vpg-kpi-value small{font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-left:2px}
.vpg-kpi-note{font-size:10px;color:var(--dsw-alias-label-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vpg-tabs{display:flex;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);margin:0 0 16px;overflow:auto}
.vpg-tab{appearance:none;background:transparent;border:0;border-bottom:2px solid transparent;color:var(--dsw-alias-label-secondary);padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.vpg-tab:hover{color:var(--dsw-alias-label-primary)}
.vpg-tab.active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary)}
.vpg-tab-count{font-size:10px;color:var(--dsw-alias-label-secondary);margin-left:4px}
.vpg-grid{display:grid;gap:14px}
.vpg-grid.cards{grid-template-columns:repeat(4,minmax(0,1fr))}
.vpg-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:1100px){.vpg-grid.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.vpg-grid.two{grid-template-columns:1fr}.vpg-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.vpg-grid.cards{grid-template-columns:1fr}.vpg{padding:16px 14px 40px}.vpg-hero{padding:14px}.vpg-hero-title{font-size:20px}}
.vpg-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px;min-width:0}
.vpg-card h3{margin:0 0 10px;font-size:13px;color:var(--dsw-alias-label-secondary);font-weight:600;display:flex;justify-content:space-between;align-items:center;gap:8px}
.vpg-card-note{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.6;margin-bottom:10px}
.vpg-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px}
@media(max-width:760px){.vpg-facts{grid-template-columns:1fr}}
.vpg-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed var(--dsw-alias-border-l1);font-size:12px;min-width:0}
.vpg-row:last-child{border-bottom:0}
.vpg-row .k{color:var(--dsw-alias-label-secondary);flex:none;max-width:46%}
.vpg-row .v{text-align:right;word-break:break-all;min-width:0}
.vpg-mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.vpg-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid transparent;white-space:nowrap}
.vpg-dot{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor}
.vpg-alerts{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.vpg-alert{display:flex;gap:8px;align-items:flex-start;border:1px solid color-mix(in srgb, currentColor 30%, transparent);background:color-mix(in srgb, currentColor 10%, transparent);border-radius:9px;padding:7px 11px;font-size:12px}
.vpg-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vpg-filters{display:flex;gap:6px;flex-wrap:wrap}
.vpg-chip{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer}
.vpg-chip.active{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.vpg-input{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:12px;outline:none;min-width:180px}
.vpg-input:focus{border-color:var(--dsw-alias-brand-primary)}
.vpg-select{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 8px;font-size:11px;outline:none;max-width:100%}
.vpg-group-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(max-width:900px){.vpg-group-grid{grid-template-columns:1fr}}
.vpg-group{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-base);min-width:0}
.vpg-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.vpg-group-name{font-size:12px;font-weight:700;word-break:break-all}
.vpg-group-now{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.55;word-break:break-all;margin-bottom:7px}
.vpg-conn-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
@media(max-width:900px){.vpg-conn-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.vpg-table-wrap{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:10px}
.vpg-table{width:100%;border-collapse:collapse;min-width:820px;font-size:12px}
.vpg-table th,.vpg-table td{padding:9px 10px;text-align:left;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;vertical-align:middle}
.vpg-table th{position:sticky;top:0;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-weight:600;z-index:1}
.vpg-table tr:hover td{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent)}
.vpg-table td.wrap{white-space:normal;word-break:break-word}
.vpg-table tr.clickable{cursor:pointer}
.vpg-table tr.detail td{background:var(--dsw-alias-bg-base);white-space:normal}
.vpg-table tr.detail:hover td{background:var(--dsw-alias-bg-base)}
.vpg-score-cell{display:flex;align-items:center;gap:8px;min-width:100px}
.vpg-score-num{font-size:14px;font-weight:800;font-variant-numeric:tabular-nums}
.vpg-score-bar{height:5px;flex:1;background:var(--dsw-alias-border-l1);border-radius:99px;overflow:hidden;min-width:40px}
.vpg-score-bar i{display:block;height:100%;border-radius:99px;background:currentColor}
.vpg-evidence{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;padding:4px 2px 8px}
@media(max-width:760px){.vpg-evidence{grid-template-columns:1fr}}
.vpg-evidence-item{font-size:12px;display:flex;gap:8px;padding:4px 0;border-bottom:1px dashed var(--dsw-alias-border-l1)}
.vpg-evidence-item .k{color:var(--dsw-alias-label-secondary);min-width:88px}
.vpg-evidence-item .v{word-break:break-word}
.vpg-disclaimer{border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 28%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent);color:var(--dsw-alias-label-secondary);border-radius:9px;padding:8px 11px;font-size:11px;line-height:1.7;margin-bottom:12px}
.vpg-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:60;padding:20px}
.vpg-modal{width:min(440px,100%);background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.vpg-modal h3{margin:0 0 10px;font-size:16px;color:var(--dsw-alias-label-primary)}
.vpg-modal p{margin:0 0 10px;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary)}
.vpg-modal .target{font-size:13px;font-weight:700;color:var(--dsw-alias-label-primary);word-break:break-all}
.vpg-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.vpg-error{border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary);border-radius:9px;padding:8px 11px;font-size:12px;margin-bottom:12px;word-break:break-all}
.vpg-empty{color:var(--dsw-alias-label-secondary);font-size:12px;padding:18px 0;text-align:center;line-height:1.7}
.vpg-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}
@media(max-width:700px){.vpg-form{grid-template-columns:1fr}}
.vpg-field{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.vpg-field input{width:100%}
.vpg-foot{color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:14px;line-height:1.7}
.vpg-foot-line{display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-top:10px}
`

    const TABS = [
      ['overview', '总览'],
      ['clash', 'Clash'],
      ['ai', 'AI 服务'],
      ['social', '社媒'],
      ['nodes', '节点'],
      ['history', '历史'],
      ['settings', '设置'],
    ]

    function fmtTime(value) {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString('zh-CN', { hour12: false })
    }

    function ageText(value) {
      if (!value) return ''
      const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
      if (!Number.isFinite(minutes)) return ''
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes} 分钟前`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return `${hours} 小时前`
      return `${Math.round(hours / 24)} 天前`
    }

    function scoreMeta(scores) {
      return scores && scores.meta && typeof scores.meta === 'object' ? scores.meta : null
    }

    function confidenceLabel(meta) {
      if (!meta) return '未知'
      if (meta.confidence === 'high') return '高'
      if (meta.confidence === 'medium') return '中'
      if (meta.confidence === 'low') return '低'
      return '未知'
    }

    function coverageText(meta) {
      if (!meta || typeof meta.coverage !== 'number') return '—'
      return `${Math.round(meta.coverage * 100)}%`
    }

    function toneOf(level) {
      const text = String(level || '').toLowerCase()
      if (['good', 'ok', 'clear', 'success', 'true'].includes(text)) return C.success
      if (['warn', 'warning', 'attention', 'info', 'medium', 'incomplete'].includes(text)) return C.warn
      if (['bad', 'error', 'critical', 'high', 'false'].includes(text)) return C.error
      return C.secondary
    }

    function scoreTone(value) {
      if (typeof value !== 'number') return C.secondary
      if (value >= 85) return C.success
      if (value >= 60) return C.warn
      return C.error
    }

    function levelScore(level) {
      const text = String(level || '').toLowerCase()
      if (text === 'good') return 97.4
      if (text === 'info') return 72.6
      if (text === 'warn' || text === 'warning') return 44.8
      if (text === 'bad' || text === 'error') return 16.9
      return null
    }

    function clampScore(value) {
      return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
    }

    function shortText(value, max) {
      const text = String(value || '').replace(/\s+/g, ' ').trim()
      return text.length > max ? text.slice(0, max - 1) + '…' : text
    }

    function cleanNodeName(value) {
      return String(value || '')
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/\uFE0F/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function formatBytes(value) {
      const n = Number(value)
      if (!Number.isFinite(n) || n <= 0) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let index = 0
      let size = n
      while (size >= 1024 && index < units.length - 1) {
        size /= 1024
        index += 1
      }
      return `${size >= 100 ? size.toFixed(0) : size.toFixed(size >= 10 ? 1 : 2)} ${units[index]}`
    }

    function Pill(props) {
      const tone = props.tone || C.secondary
      return h(
        'span',
        {
          className: 'vpg-pill',
          style: {
            color: tone,
            borderColor: `color-mix(in srgb, ${tone} 35%, transparent)`,
            background: `color-mix(in srgb, ${tone} 12%, transparent)`,
          },
        },
        h('span', { className: 'vpg-dot' }),
        props.children,
      )
    }

    function Card(props) {
      return h(
        'section',
        { className: 'vpg-card', style: props.style },
        props.title ? h('h3', null, h('span', null, props.title), props.extra || null) : null,
        props.children,
      )
    }

    function Row(props) {
      return h(
        'div',
        { className: 'vpg-row' },
        h('span', { className: 'k' }, props.k),
        h('span', { className: props.mono ? 'v vpg-mono' : 'v' }, props.v ?? '—'),
      )
    }

    function ScoreCell(props) {
      const value = typeof props.value === 'number' ? props.value : null
      const muted = props.muted === true || props.confidence === '低' || props.confidence === '未知'
      const tone = value == null ? C.secondary : muted ? C.secondary : scoreTone(value)
      return h(
        'div',
        { className: 'vpg-score-cell', style: { color: tone } },
        h('span', { className: 'vpg-score-num' }, value == null ? '—' : value),
        h('span', { className: 'vpg-score-bar' }, h('i', { style: { width: `${value == null ? 0 : value}%` } })),
        muted && value != null ? h('span', { style: { fontSize: '9px', opacity: 0.75 } }, '低置信') : null,
      )
    }

    function Kpi(props) {
      const value = typeof props.value === 'number' ? props.value : null
      return h(
        'div',
        { className: 'vpg-kpi' },
        h('div', { className: 'vpg-kpi-label' }, props.label),
        h(
          'div',
          { className: 'vpg-kpi-value', style: { color: value == null ? C.secondary : scoreTone(value) } },
          value == null ? '—' : value,
          h('small', null, '/100'),
        ),
        h('div', { className: 'vpg-kpi-note' }, props.note || ''),
      )
    }

    function Evidence(props) {
      return h(
        'div',
        { className: 'vpg-evidence' },
        props.items.map((item, index) =>
          h(
            'div',
            { className: 'vpg-evidence-item', key: index },
            h('span', { className: 'k' }, item.k),
            h('span', { className: 'v' }, item.v ?? '—'),
          ),
        ),
      )
    }

    function buildServices(ai, exit) {
      const ipjudge = (ai && ai.ipjudge) || null
      const items = (ipjudge && ipjudge.items) || []
      const claude = (ai && ai.claude) || null
      const codex = (ai && ai.codex) || null
      const byName = (name) => items.find((item) => item.name === name) || null
      const claudeRep = (claude && claude.reputation) || {}
      const claudeAbuse = (claude && claude.abuse) || {}
      const claudeRegion = (claude && claude.region) || null
      const ipType =
        (claudeRep.classification && String(claudeRep.classification)) ||
        (exit && (exit.isp || exit.org)) ||
        '未知'
      const proxyFlags = [
        claudeRep.proxy ? 'proxy' : '',
        claudeRep.vpn ? 'VPN' : '',
        claudeRep.tor ? 'Tor' : '',
      ].filter(Boolean)
      const repRisk = typeof claudeRep.score === 'number' ? claudeRep.score : null
      const abuseListed = claudeAbuse.listed === true

      function regionOf(name, item) {
        if (name === 'Claude' && claudeRegion && typeof claudeRegion.unsupported === 'boolean') {
          return claudeRegion.unsupported ? '不支持' : '支持'
        }
        const text = String((item && item.text) || '')
        if (text.includes('未见开放') || text.includes('不支持')) return '未开放'
        if (text.includes('地区可用') || text.includes('地区在') || text.includes('地区开放')) return '已开放'
        return '未知'
      }

      function make(name, opts) {
        const item = opts.item
        let score = levelScore(item && item.level)
        if (score == null && opts.inferredFrom != null) score = opts.inferredFrom
        // No service-level result means "no evidence", not a neutral 68.4.
        // Missing data must stay missing so it cannot become a fake low score.
        const platformBias =
          {
            Claude: 0,
            ChatGPT: -1.3,
            Gemini: 0.8,
            'Gemini API': 1.5,
            'Codex（推断）': -2.4,
            Muse: -4.2,
          }[name] || 0
        if (score != null) score += platformBias
        const region = opts.region || '未知'
        if (score != null && (region === '不支持' || region === '未开放')) score = 0
        if (score != null) {
          if (claudeRep.proxy) score -= 34.6
          if (claudeRep.vpn) score -= 39.2
          if (claudeRep.tor) score -= 59.5
          if (abuseListed) score -= 39.4
          if (String(ipType).includes('商业') || String(ipType).includes('机房') || String(ipType).includes('数据中心')) score -= 9.7
          if (ipjudge && typeof ipjudge.score === 'number' && ipjudge.score < 70) score -= 14.6
          score = clampScore(score)
        }
        const confidence = item && claude && claude.ok && exit && exit.ok ? '中' : item ? '低' : '未知'
        const verdict =
          region === '不支持' || region === '未开放'
            ? '不建议'
            : score == null
              ? '证据不足'
              : confidence === '未知'
                ? '未判定'
                : confidence === '低'
                  ? '低置信'
                  : score >= 85
                    ? '可用'
                    : score >= 60
                      ? '可用但需注意'
                      : score > 0
                        ? '风险较高'
                        : '不建议'
        return {
          key: name,
          name,
          region,
          ipType,
          repRisk,
          proxyFlags,
          abuseListed,
          score,
          verdict,
          confidence,
          inferred: !!opts.inferred,
          note: shortText((item && item.text) || (opts.inferred && codex && codex.label) || '', 120),
          evidence: [
            { k: 'ipjudge 等级', v: (item && item.level) || '—' },
            { k: 'ipjudge 说明', v: (item && item.text) || '—' },
            { k: '地区资格', v: region },
            { k: 'IP 类型', v: ipType },
            { k: '信誉风险', v: repRisk == null ? '—' : `${repRisk}/100（越高越危险）` },
            { k: '代理标记', v: proxyFlags.join(' · ') || '未标记' },
            { k: '滥用记录', v: abuseListed ? '有记录' : claudeAbuse.listed === false ? '无记录' : '—' },
            { k: '置信度', v: confidence },
          ],
        }
      }

      const claudeItem = byName('Claude')
      const chatgptItem = byName('ChatGPT')
      const geminiItem = byName('Gemini')
      const geminiApiItem = byName('Gemini API')
      const chatgptScore = levelScore(chatgptItem && chatgptItem.level)
      const rows = [
        make('Claude', { item: claudeItem, region: regionOf('Claude', claudeItem) }),
        make('ChatGPT', { item: chatgptItem, region: regionOf('ChatGPT', chatgptItem) }),
        make('Gemini', { item: geminiItem, region: regionOf('Gemini', geminiItem) }),
        make('Gemini API', { item: geminiApiItem, region: regionOf('Gemini API', geminiApiItem) }),
        make('Codex（推断）', {
          item: null,
          region: regionOf('ChatGPT', chatgptItem),
          inferred: true,
          inferredFrom: chatgptScore,
        }),
      ]
      const muse = byName('Muse')
      if (muse) {
        rows.push(make('Muse', { item: muse, region: regionOf('Muse', muse) }))
      }
      return rows
    }

    function buildSocial(exit, ai) {
      const claude = (ai && ai.claude) || null
      const rep = (claude && claude.reputation) || {}
      const repRisk = typeof rep.score === 'number' ? rep.score : null
      const flags = [rep.proxy ? 'proxy' : '', rep.vpn ? 'VPN' : '', rep.tor ? 'Tor' : ''].filter(Boolean)
      const country = (exit && exit.country) || '未知'
      const base = 100
      const platforms = [
        { key: 'x', name: 'X / Twitter', dc: 30, proxy: 35, abuse: 40, note: '账号关联与设备指纹同样重要' },
        { key: 'facebook', name: 'Facebook', dc: 35, proxy: 40, abuse: 45, note: 'Meta 对共享出口较敏感' },
        { key: 'instagram', name: 'Instagram', dc: 35, proxy: 40, abuse: 45, note: '与 Facebook 同一风控体系' },
        { key: 'tiktok', name: 'TikTok', dc: 40, proxy: 45, abuse: 45, note: '地区与机房特征权重较高' },
        { key: 'telegram', name: 'Telegram', dc: 10, proxy: 20, abuse: 25, note: '对 IP 类型相对宽松' },
        { key: 'discord', name: 'Discord', dc: 30, proxy: 35, abuse: 40, note: '注册与语音风控独立' },
        { key: 'google', name: 'Google / YouTube', dc: 30, proxy: 35, abuse: 40, note: '账号历史与设备信号权重高' },
      ]
      return platforms.map((platform) => {
        let score = base
        if (String(exit?.isp || '').toLowerCase().includes('gtt') || String(rep.classification || '').includes('商业')) score -= platform.dc
        if (flags.length) score -= platform.proxy
        if (repRisk != null) score -= (repRisk / 100) * 24.6
        if (claude && claude.abuse && claude.abuse.listed === true) score -= platform.abuse
        score = clampScore(score)
        return {
          ...platform,
          country,
          score,
          verdict: score >= 85 ? '较适配' : score >= 60 ? '谨慎' : '不建议',
          flags,
          repRisk,
          evidence: [
            { k: '出口国家', v: country },
            { k: 'IP 类型', v: rep.classification || '—' },
            { k: '代理标记', v: flags.join(' · ') || '未标记' },
            { k: '信誉风险', v: repRisk == null ? '—' : `${repRisk}/100（越高越危险）` },
            { k: '账号归属', v: '未设置（仅评 IP 侧）' },
            { k: '说明', v: platform.note },
          ],
        }
      })
    }

    async function api(path, options) {
      const response = await fetch(API + path, {
        cache: 'no-store',
        ...(options || {}),
        headers: {
          ...(options && options.body ? { 'Content-Type': 'application/json' } : {}),
          ...((options && options.headers) || {}),
        },
      })
      let data
      try {
        data = await response.json()
      } catch {
        throw new Error(`接口返回非 JSON（HTTP ${response.status}）`)
      }
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`)
      return data
    }

    function VpnGuardIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 18,
          height: 18,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          d: 'M12 2 4 5v6c0 5.6 3.4 9.9 8 11 4.6-1.1 8-5.4 8-11V5l-8-3Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M8.4 12.2 11 14.8l4.8-4.9',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    function VpnGuardPage() {
      const [snapshot, setSnapshot] = useState(null)
      const [meta, setMeta] = useState(null)
      const [nodes, setNodes] = useState([])
      const [history, setHistory] = useState([])
      const [busy, setBusy] = useState('')
      const [error, setError] = useState(null)
      const [query, setQuery] = useState('')
      const [filter, setFilter] = useState('all')
      const [tab, setTab] = useState('overview')
      const [modal, setModal] = useState(null)
      const [draft, setDraft] = useState(null)
      const [expanded, setExpanded] = useState('')
      const [showAllNodes, setShowAllNodes] = useState(false)
      const [clashView, setClashView] = useState(null)
      const [clashBusy, setClashBusy] = useState(false)
      const [clashQuery, setClashQuery] = useState('')

      const loadStatus = useCallback(async () => {
        try {
          const data = await api('/status')
          setSnapshot(data.snapshot)
          setMeta({
            config: data.config,
            lastLightAt: data.lastLightAt,
            lastFullAt: data.lastFullAt,
            dataDir: data.dataDir,
            version: data.version,
            startedAt: data.startedAt,
          })
          setDraft((current) => current || data.config)
        } catch (err) {
          setError(err.message)
        }
      }, [])

      const loadNodes = useCallback(async () => {
        try {
          const data = await api('/nodes')
          setNodes(Array.isArray(data.nodes) ? data.nodes : [])
        } catch (err) {
          setError(err.message)
        }
      }, [])

      const loadHistory = useCallback(async () => {
        try {
          const data = await api('/history?limit=60')
          setHistory(Array.isArray(data.history) ? data.history : [])
        } catch (err) {
          setError(err.message)
        }
      }, [])

      const loadClash = useCallback(async () => {
        setClashBusy(true)
        try {
          const data = await api('/clash')
          setClashView(data)
        } catch (err) {
          setError(err.message)
        } finally {
          setClashBusy(false)
        }
      }, [])

      useEffect(() => {
        loadStatus()
        loadNodes()
        loadHistory()
        const timer = setInterval(loadStatus, 30000)
        const historyTimer = setInterval(loadHistory, 60000)
        return () => {
          clearInterval(timer)
          clearInterval(historyTimer)
        }
      }, [loadStatus, loadNodes, loadHistory])

      useEffect(() => {
        if (tab !== 'clash') return undefined
        loadClash()
        const timer = setInterval(loadClash, 15000)
        return () => clearInterval(timer)
      }, [tab, loadClash])

      async function runCheck(mode) {
        setBusy(mode)
        setError(null)
        try {
          const data = await api('/check', { method: 'POST', body: JSON.stringify({ mode }) })
          setSnapshot(data.snapshot)
          await Promise.all([loadNodes(), loadHistory(), loadStatus()])
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy('')
        }
      }

      function openSwitch(node) {
        const allowed = (meta && meta.config && meta.config.allowedSwitchGroups) || []
        const group = node.groups.find((name) => allowed.includes(name)) || null
        if (!group) {
          setError(`节点 ${node.name} 不在可切换的组内（只允许：${allowed.join('、') || '未配置'}）`)
          return
        }
        setModal({ node, group })
      }

      function openGroupSwitch(group, nodeName) {
        const allowed = (meta && meta.config && meta.config.allowedSwitchGroups) || []
        if (!allowed.includes(group)) {
          setError(`不允许切换该组：${group}`)
          return
        }
        setModal({ node: { name: nodeName }, group })
      }

      async function confirmSwitch() {
        if (!modal) return
        setBusy('switch')
        setError(null)
        try {
          const prepared = await api('/switch', {
            method: 'POST',
            body: JSON.stringify({ group: modal.group, node: modal.node.name }),
          })
          const done = await api('/switch', {
            method: 'POST',
            body: JSON.stringify({
              group: prepared.group,
              node: prepared.node,
              confirm: true,
              token: prepared.token,
            }),
          })
          setSnapshot(done.snapshot)
          setModal(null)
          await Promise.all([loadNodes(), loadHistory(), loadStatus()])
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy('')
        }
      }

      async function saveConfig() {
        if (!draft) return
        setBusy('config')
        setError(null)
        try {
          const payload = {
            ...draft,
            proxyPort: Number(draft.proxyPort),
            trafficWarnGb: Number(draft.trafficWarnGb),
            expiryWarnDays: Number(draft.expiryWarnDays),
            scoreDropWarn: Number(draft.scoreDropWarn),
            lightIntervalMs: Number(draft.lightIntervalMs),
            fullIntervalMs: Number(draft.fullIntervalMs),
            processNames: String(draft.processNames || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            allowedSwitchGroups: Array.isArray(draft.allowedSwitchGroups)
              ? draft.allowedSwitchGroups
              : String(draft.allowedSwitchGroups || '')
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
          }
          const data = await api('/config', { method: 'POST', body: JSON.stringify(payload) })
          setMeta((current) => ({ ...(current || {}), config: data.config }))
          setDraft(data.config)
          setTab('overview')
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy('')
        }
      }

      async function detectClashVerge() {
        setBusy('detect')
        setError(null)
        try {
          const data = await api('/detect')
          const d = data.detection || {}
          if (!d.ok) {
            setError(d.error || '未检测到运行中的 Clash Verge')
            return
          }
          setDraft((current) => ({
            ...(current || {}),
            provider: 'clash',
            proxyMode: 'http',
            controller: 'auto',
            proxyPort: d.mixedPort || current?.proxyPort || 7900,
            processNames: (d.processNames || []).join(', '),
            serviceName: '',
          }))
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy('')
        }
      }

      const vpn = snapshot && snapshot.windows ? snapshot.windows : null
      const clash = snapshot && snapshot.clash ? snapshot.clash : null
      const exit = snapshot && snapshot.exit ? snapshot.exit : null
      const ai = snapshot && snapshot.ai ? snapshot.ai : null
      const scores = snapshot && snapshot.scores ? snapshot.scores : null
      const metaInfo = scoreMeta(scores)
      const aiAt = (snapshot && snapshot.aiFromTs) || (meta && meta.lastFullAt) || null
      const aiAge = ageText(aiAt)
      const fullStatus = (snapshot && snapshot.fullStatus) || 'missing'
      const info = (clash && clash.info) || { trafficGb: null, expiry: null, resetDays: null }
      const alerts = (snapshot && snapshot.alerts) || []
      const cfg = (meta && meta.config) || {}
      const services = buildServices(ai, exit)
      const social = buildSocial(exit, ai)
      const serviceCount = services.filter((item) => item.score != null).length
      const socialCount = social.length

      const overallTone = alerts.some((item) => item.level === 'bad')
        ? C.error
        : !metaInfo || metaInfo.complete !== true
          ? C.secondary
          : alerts.length > 0
            ? C.warn
            : C.success
      const overallText = !snapshot
        ? '等待首次检测'
        : !metaInfo || metaInfo.complete !== true
          ? '证据不足'
          : alerts.some((item) => item.level === 'bad')
            ? '异常'
            : alerts.length > 0
              ? '注意'
              : '正常'

      const verdictTitle =
        !snapshot
          ? '正在读取出口状态'
          : alerts.some((item) => item.level === 'bad')
            ? '当前出口有需要处理的风险'
            : !metaInfo || metaInfo.complete !== true
              ? '证据不足，等待完整全量'
              : typeof scores.overall === 'number' && scores.overall >= 85 && metaInfo.confidence !== 'low'
                ? '当前出口状态良好'
                : '当前出口可用，但建议检查低分项'
      const verdictSub =
        !snapshot
          ? '首次加载会自动做一次轻量检测；AI 评分需要完整全量。'
          : `当前节点 ${cleanNodeName(snapshot.current) || '—'} · 出口 ${exit && exit.ok ? exit.ip : '获取失败'} · ${
              exit && exit.ok ? [exit.city, exit.country].filter(Boolean).join(' / ') : '—'
            } · AI ${ai ? `基于完整全量 ${fmtTime(aiAt)}${aiAge ? `（${aiAge}）` : ''} · 覆盖 ${coverageText(metaInfo)} · 置信 ${confidenceLabel(metaInfo)}` : '尚未完整全量'}${
              fullStatus === 'stale'
                ? ' · 本次全量不完整，保留上次完整结果'
                : fullStatus === 'partial'
                  ? ' · 本次全量不完整，暂无完整结果'
                  : ''
            }`

      const filteredNodes = nodes.filter((node) => {
        const text = `${node.name} ${node.base} ${node.csv?.isp || ''} ${node.csv?.exitIp || ''}`.toLowerCase()
        if (query && !text.includes(query.toLowerCase())) return false
        if (filter === 'current') return node.current
        if (filter === 'clean') return node.csv?.status === 'ok' && !node.csv?.proxy && !node.csv?.hosting
        if (filter === 'ok') return node.csv?.status === 'ok' || !node.csv
        if (filter === 'dead') return node.csv && node.csv.status !== 'ok'
        return true
      })
      const visibleNodes = showAllNodes ? filteredNodes : filteredNodes.slice(0, 20)

      function renderOverview() {
        return h(
          React.Fragment,
          null,
          alerts.length > 0
            ? h(
                'div',
                { className: 'vpg-alerts' },
                alerts.map((item, index) =>
                  h(
                    'div',
                    { className: 'vpg-alert', style: { color: toneOf(item.level) }, key: index },
                    h('span', null, item.level === 'bad' ? '●' : '▲'),
                    h('span', null, item.text),
                  ),
                ),
              )
            : null,
          h(
            'div',
            { className: 'vpg-grid two', style: { marginBottom: '14px' } },
            h(
              Card,
              {
                title: '运行状态',
                extra: h(
                  'button',
                  { className: 'vpg-btn small', onClick: () => setTab('clash') },
                  'Clash 管理',
                ),
              },
              h(
                'div',
                { className: 'vpg-facts' },
                h(Row, {
                  k: 'Clash / Mihomo',
                  v: cfg.controller
                    ? clash && clash.reachable
                      ? `可达 · ${clash.version || ''}`
                      : '不可达'
                    : '未配置（可选）',
                }),
                h(Row, {
                  k: `本地代理 ${cfg.proxyHost || '127.0.0.1'}:${cfg.proxyPort || 7890}`,
                  v: vpn && vpn.mixedPort && vpn.mixedPort.listening ? '监听中' : cfg.proxyMode === 'tun' ? 'TUN 模式' : '未监听',
                }),
                h(Row, {
                  k: 'VPN 进程',
                  v:
                    vpn && vpn.processes && vpn.processes.count > 0
                      ? Object.entries(vpn.processes.counts || {})
                          .map(([name, count]) => `${name} ×${count}`)
                          .join(' · ')
                      : '未配置进程名',
                }),
                h(Row, { k: '后台服务', v: vpn && vpn.service ? `${vpn.service.name} · ${vpn.service.state}` : '未配置' }),
                h(Row, {
                  k: '系统代理',
                  v: vpn && vpn.systemProxy ? (vpn.systemProxy.enabled ? `开启 · ${vpn.systemProxy.server || '—'}` : '关闭') : '—',
                }),
                h(Row, { k: '当前节点', v: snapshot && snapshot.current ? cleanNodeName(snapshot.current) : '—' }),
              ),
            ),
            h(
              Card,
              { title: '出口画像' },
              h(
                'div',
                { className: 'vpg-facts' },
                h(Row, {
                  k: '出口 IP',
                  v: exit && exit.ok ? exit.ip : `获取失败：${exit ? exit.error : '—'}`,
                  mono: true,
                }),
                h(Row, {
                  k: '位置 / ASN',
                  v: exit && exit.ok ? `${[exit.city, exit.region, exit.country].filter(Boolean).join(' · ')} · ${exit.asn || ''}` : '—',
                }),
                h(Row, { k: 'ISP', v: exit && exit.ok ? exit.isp || exit.org || '—' : '—' }),
                h(Row, { k: '出口延迟', v: exit && exit.ok ? `${exit.latencyMs} ms` : '—', mono: true }),
                h(Row, {
                  k: '剩余流量 / 到期',
                  v: `${info.trafficGb != null ? info.trafficGb + ' GB' : '—'} / ${info.expiry || '—'}${
                    info.resetDays != null ? `（${info.resetDays} 天后重置）` : ''
                  }`,
                }),
                h(Row, {
                  k: 'AI 评分时间',
                  v: aiAt
                    ? `完整全量 ${fmtTime(aiAt)}${aiAge ? `（${aiAge}）` : ''} · 覆盖 ${coverageText(metaInfo)} · 置信 ${confidenceLabel(metaInfo)}`
                    : '尚未完整全量',
                }),
              ),
            ),
          ),
          h(
            Card,
            { title: '一句话结论' },
            h(
              'div',
              { className: 'vpg-card-note', style: { marginBottom: 0, fontSize: '12px' } },
              snapshot
                ? `${verdictTitle}。AI ${
                    metaInfo?.complete
                      ? `3 次中位 ${scores.aiStable ?? '—'} / 本次 ${scores.ai ?? '—'}，覆盖 ${coverageText(metaInfo)}，置信 ${confidenceLabel(metaInfo)}`
                      : '证据不足（尚未取得完整全量）'
                  }；社媒 ${socialCount} 个平台仅做 IP 侧适配度。节点共 ${nodes.length} 个，默认展示前 20 个。`
                : '等待首次轻量检测。',
            ),
          ),
        )
      }

      function renderClash() {
        const live = clashView && clashView.clash ? clashView.clash : clash
        const connections = clashView && clashView.connections ? clashView.connections : null
        const configs = (live && live.configs) || {}
        const groups = (live && live.groups) || []
        const clashNodes = (live && live.nodes) || []
        const allowed = (cfg.allowedSwitchGroups || []).map((item) => String(item))
        const filteredClashNodes = clashNodes.filter((node) => {
          if (!clashQuery) return true
          const text = `${node.name} ${node.type || ''}`.toLowerCase()
          return text.includes(clashQuery.toLowerCase())
        })
        const groupNamesOf = (nodeName) =>
          groups.filter((group) => group.all.includes(nodeName)).map((group) => group.name)

        if (!live) {
          return h(Card, null, h('div', { className: 'vpg-empty' }, clashBusy ? '正在读取 Clash 状态…' : '尚未读取 Clash 状态。'))
        }

        return h(
          React.Fragment,
          null,
          h(
            'div',
            { className: 'vpg-toolbar' },
            h(
              'div',
              { className: 'vpg-card-note', style: { margin: 0 } },
              live.reachable
                ? `控制器 ${clashView && clashView.controller ? clashView.controller : '—'} · ${live.version || '版本未知'}`
                : `Clash 不可达：${live.error || '未知错误'}`,
            ),
            h('button', { className: 'vpg-btn small', disabled: clashBusy, onClick: loadClash }, clashBusy ? '刷新中…' : '刷新 Clash'),
          ),
          h(
            'div',
            { className: 'vpg-grid two', style: { marginBottom: '14px' } },
            h(
              Card,
              { title: '核心状态' },
              h(
                'div',
                { className: 'vpg-facts' },
                h(Row, { k: '控制器', v: live.reachable ? '可达' : '不可达' }),
                h(Row, { k: '运行模式', v: configs.mode || '—' }),
                h(Row, { k: 'mixed-port', v: configs.mixedPort != null ? String(configs.mixedPort) : '—', mono: true }),
                h(Row, { k: 'TUN', v: configs.tun == null ? '—' : configs.tun ? '开启' : '关闭' }),
                h(Row, { k: '允许局域网', v: configs.allowLan == null ? '—' : configs.allowLan ? '是' : '否' }),
                h(Row, { k: '系统代理', v: vpn && vpn.systemProxy ? (vpn.systemProxy.enabled ? `开启 · ${vpn.systemProxy.server || '—'}` : '关闭') : '—' }),
              ),
            ),
            h(
              Card,
              { title: '代理组' },
              groups.length === 0
                ? h('div', { className: 'vpg-empty' }, '没有代理组数据')
                : h(
                    'div',
                    { className: 'vpg-facts' },
                    ...groups.slice(0, 8).map((group) =>
                      h(Row, {
                        key: group.name,
                        k: `${group.name} · ${group.type}`,
                        v: `${cleanNodeName(group.now) || '—'}（${group.all.length}）`,
                      }),
                    ),
                  ),
            ),
          ),
          h(
            Card,
            { title: `代理组控制（${groups.length}）`, extra: h('span', { className: 'vpg-card-note', style: { margin: 0 } }, '只有白名单组可直接切换') },
            groups.length === 0
              ? h('div', { className: 'vpg-empty' }, '没有代理组')
              : h(
                  'div',
                  { className: 'vpg-group-grid' },
                  groups.map((group) =>
                    h(
                      'div',
                      { className: 'vpg-group', key: group.name },
                      h(
                        'div',
                        { className: 'vpg-group-head' },
                        h('span', { className: 'vpg-group-name' }, group.name),
                        h(Pill, { tone: group.type === 'Selector' ? C.brand : C.secondary }, group.type),
                      ),
                      h('div', { className: 'vpg-group-now' }, `当前：${cleanNodeName(group.now) || '—'} · ${group.all.length} 个节点`),
                      group.type === 'Selector' && allowed.includes(group.name)
                        ? h(
                            'select',
                            {
                              className: 'vpg-select',
                              value: '',
                              disabled: busy !== '',
                              onChange: (event) => {
                                const name = event.target.value
                                event.target.value = ''
                                if (name) openGroupSwitch(group.name, name)
                              },
                            },
                            h('option', { value: '' }, '选择节点切换…'),
                            group.all.map((name) => h('option', { key: name, value: name }, cleanNodeName(name) || name)),
                          )
                        : h('div', { className: 'vpg-card-note', style: { margin: 0 } }, '只读组'),
                    ),
                  ),
                ),
          ),
          h(
            Card,
            {
              title: '连接',
              extra: connections && connections.ok
                ? h('span', { className: 'vpg-card-note', style: { margin: 0 } }, `活动 ${connections.count} · ↑ ${formatBytes(connections.uploadTotal)} · ↓ ${formatBytes(connections.downloadTotal)}`)
                : null,
            },
            !connections
              ? h('div', { className: 'vpg-empty' }, clashBusy ? '读取中…' : '尚无连接数据')
              : !connections.ok
                ? h('div', { className: 'vpg-empty' }, `连接数据不可用：${connections.error || '未知错误'}`)
                : h(
                    'div',
                    { className: 'vpg-table-wrap', style: { maxHeight: '300px' } },
                    h(
                      'table',
                      { className: 'vpg-table' },
                      h('thead', null, h('tr', null, ['主机', '网络', '链路', '规则', '上传', '下载'].map((title) => h('th', { key: title }, title)))),
                      h(
                        'tbody',
                        null,
                        connections.items.length === 0
                          ? h('tr', null, h('td', { colSpan: 6, className: 'vpg-empty' }, '当前没有活动连接'))
                          : connections.items.map((item, index) =>
                              h(
                                'tr',
                                { key: item.id || index },
                                h('td', { className: 'wrap' }, item.host || '—', item.destinationPort ? `:${item.destinationPort}` : ''),
                                h('td', null, item.network || '—'),
                                h('td', { className: 'wrap' }, (item.chains || []).join(' → ') || '—'),
                                h('td', { className: 'wrap' }, [item.rule, item.rulePayload].filter(Boolean).join(' · ') || '—'),
                                h('td', { className: 'vpg-mono' }, formatBytes(item.upload)),
                                h('td', { className: 'vpg-mono' }, formatBytes(item.download)),
                              ),
                            ),
                      ),
                    ),
                  ),
          ),
          h(
            Card,
            {
              title: `节点（${clashNodes.length}）`,
              extra: h('input', {
                className: 'vpg-input',
                placeholder: '搜索节点',
                value: clashQuery,
                onChange: (event) => setClashQuery(event.target.value),
              }),
            },
            h(
              'div',
              { className: 'vpg-table-wrap', style: { maxHeight: '420px' } },
              h(
                'table',
                { className: 'vpg-table' },
                h('thead', null, h('tr', null, ['节点', '类型', '延迟', '所在组', '操作'].map((title) => h('th', { key: title }, title)))),
                h(
                  'tbody',
                  null,
                  filteredClashNodes.length === 0
                    ? h('tr', null, h('td', { colSpan: 5, className: 'vpg-empty' }, '没有匹配节点'))
                    : filteredClashNodes.map((node) => {
                        const inGroups = groupNamesOf(node.name)
                        const switchable = inGroups.find((name) => allowed.includes(name))
                        return h(
                          'tr',
                          { key: node.name },
                          h('td', { className: 'wrap' }, node.name),
                          h('td', null, node.type || '—'),
                          h('td', { className: 'vpg-mono' }, node.delay != null ? `${node.delay} ms` : '—'),
                          h('td', { className: 'wrap' }, inGroups.join(' / ') || '—'),
                          h(
                            'td',
                            null,
                            switchable
                              ? h('button', { className: 'vpg-btn small', disabled: busy !== '', onClick: () => openGroupSwitch(switchable, node.name) }, '切换')
                              : '—',
                          ),
                        )
                      }),
                ),
              ),
            ),
          ),
        )
      }

      function renderAI() {
        const aiMeta = scoreMeta(scores)
        const stability = (scores && scores.stability) || null
        return h(
          Card,
          {
            title: 'AI 服务矩阵',
            extra: ai && ai.ipjudge && ai.ipjudge.detail
              ? h(
                  'a',
                  { href: ai.ipjudge.detail, target: '_blank', rel: 'noreferrer', style: { color: C.brand, fontSize: '11px' } },
                  'ipjudge 详情 ↗',
                )
              : null,
          },
          !ai || !aiMeta || aiMeta.complete !== true
            ? h(
                'div',
                { className: 'vpg-empty' },
                '尚未取得完整全量结果。当前显示“证据不足”，不会用缺失数据凑低分；请点右上角「全量检测」。',
              )
            : h(
                React.Fragment,
                null,
                h(
                  'div',
                  { className: 'vpg-card-note' },
                  `完整全量 ${fmtTime(aiAt)}${aiAge ? `（${aiAge}）` : ''} · 覆盖 ${coverageText(aiMeta)} · 置信 ${confidenceLabel(aiMeta)} · 评分规则 ${aiMeta.version || '—'}`,
                ),
                fullStatus === 'stale'
                  ? h(
                      'div',
                      { className: 'vpg-card-note', style: { color: C.warn } },
                      '本次全量不完整，已保留上一次完整结果；不完整的来源不会被当作 0 分。',
                    )
                  : null,
                stability
                  ? h(
                      'div',
                      { className: 'vpg-card-note' },
                      `稳定性：最近 ${stability.samples || 1} 次完整全量的 AI 中位 ${stability.aiMedian ?? '—'}，本次 ${scores.ai ?? '—'}（${
                        stability.aiDelta == null ? '无前值' : stability.aiDelta > 0 ? `+${stability.aiDelta}` : stability.aiDelta
                      }）· ${stability.held ? '档位变动待连续 2 次确认，暂按前值' : stability.confirmed ? '已连续 2 次确认' : '样本不足'} · 原因：${stability.reason || '正常波动'}`,
                    )
                  : null,
                h(
                  'div',
                  { className: 'vpg-card-note' },
                  '每个服务单独计算；行可展开看证据。Gemini 网页与 API 分开；Codex 无独立名单，按 ChatGPT/OpenAI 规则推断。',
                ),
                h(
                  'div',
                  { className: 'vpg-table-wrap' },
                  h(
                    'table',
                    { className: 'vpg-table' },
                    h(
                      'thead',
                      null,
                      h('tr', null, ['服务', '地区资格', 'IP 类型', '信誉', '健康分', '结论', '置信'].map((title) => h('th', { key: title }, title))),
                    ),
                    h(
                      'tbody',
                      null,
                      services.map((item) => {
                        const open = expanded === item.key
                        return h(
                          React.Fragment,
                          { key: item.key },
                          h(
                            'tr',
                            { className: 'clickable', onClick: () => setExpanded(open ? '' : item.key) },
                            h('td', null, h('strong', null, item.name), item.inferred ? h('span', { style: { color: C.warn, fontSize: '10px', marginLeft: '6px' } }, '推断') : null),
                            h('td', null, h(Pill, { tone: item.region === '支持' || item.region === '已开放' ? C.success : item.region === '未知' ? C.secondary : C.error }, item.region)),
                            h('td', { className: 'wrap' }, shortText(item.ipType, 42)),
                            h('td', { className: 'vpg-mono' }, item.repRisk == null ? '—' : `${item.repRisk}/100`),
                            h('td', null, h(ScoreCell, { value: item.score, confidence: item.confidence })),
                            h(
                              'td',
                              null,
                              h(
                                Pill,
                                { tone: item.confidence === '低' || item.confidence === '未知' ? C.secondary : scoreTone(item.score) },
                                item.verdict,
                              ),
                            ),
                            h('td', null, item.confidence),
                          ),
                          open
                            ? h(
                                'tr',
                                { className: 'detail' },
                                h(
                                  'td',
                                  { colSpan: 7 },
                                  h(Evidence, { items: item.evidence }),
                                  item.note ? h('div', { className: 'vpg-card-note', style: { marginTop: '6px' } }, item.note) : null,
                                ),
                              )
                            : null,
                        )
                      }),
                    ),
                  ),
                ),
              ),
        )
      }

      function renderSocial() {
        return h(
          Card,
          { title: '社媒 IP 适配度' },
          h(
            'div',
            { className: 'vpg-disclaimer' },
            '平台不公开 IP 评分。这里只算 IP 侧适配度，不代表账号安全，也不预测封号；账号风险还需设备指纹、Cookie、登录行为和资料一致性。',
          ),
          !exit || !exit.ok
            ? h('div', { className: 'vpg-empty' }, '没有可用的出口信息。')
            : h(
                'div',
                { className: 'vpg-table-wrap' },
                h(
                  'table',
                  { className: 'vpg-table' },
                  h(
                    'thead',
                    null,
                    h('tr', null, ['平台', '出口国家', 'IP 类型', '风险信号', '适配度', '结论'].map((title) => h('th', { key: title }, title))),
                  ),
                  h(
                    'tbody',
                    null,
                    social.map((item) => {
                      const open = expanded === `social:${item.key}`
                      return h(
                        React.Fragment,
                        { key: item.key },
                        h(
                          'tr',
                          { className: 'clickable', onClick: () => setExpanded(open ? '' : `social:${item.key}`) },
                          h('td', null, h('strong', null, item.name)),
                          h('td', null, item.country),
                          h('td', { className: 'wrap' }, shortText(item.evidence[1].v, 38)),
                          h('td', null, item.flags.length ? item.flags.join(' · ') : '未标记'),
                          h('td', null, h(ScoreCell, { value: item.score })),
                          h('td', null, h(Pill, { tone: scoreTone(item.score) }, item.verdict)),
                        ),
                        open
                          ? h('tr', { className: 'detail' }, h('td', { colSpan: 6 }, h(Evidence, { items: item.evidence })))
                          : null,
                      )
                    }),
                  ),
                ),
              ),
        )
      }

      function renderNodes() {
        return h(
          Card,
          { title: `节点列表${nodes.length ? '（' + nodes.length + '）' : ''}` },
          h(
            'div',
            { className: 'vpg-toolbar' },
            h(
              'div',
              { className: 'vpg-filters' },
              [
                ['all', '全部'],
                ['current', '当前'],
                ['clean', '干净'],
                ['ok', '可用'],
                ['dead', '异常/不可用'],
              ].map(([key, label]) =>
                h('button', { key, className: 'vpg-chip' + (filter === key ? ' active' : ''), onClick: () => setFilter(key) }, label),
              ),
            ),
            h('input', {
              className: 'vpg-input',
              placeholder: '搜索节点 / IP / ISP',
              value: query,
              onChange: (event) => setQuery(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'vpg-table-wrap' },
            h(
              'table',
              { className: 'vpg-table' },
              h(
                'thead',
                null,
                h('tr', null, ['节点', '阶段', '状态', '延迟', '出口 IP', 'AI 参考', '所在组', '操作'].map((title) => h('th', { key: title }, title))),
              ),
              h(
                'tbody',
                null,
                visibleNodes.length === 0
                  ? h('tr', null, h('td', { colSpan: 8, className: 'vpg-empty' }, '没有匹配的节点'))
                  : visibleNodes.map((node) =>
                      h(
                        'tr',
                        { key: node.name },
                        h('td', null, node.current ? h('strong', null, node.name) : node.name),
                        h('td', null, node.csv ? h(Pill, { tone: C.secondary }, 'A 初筛') : '—'),
                        h(
                          'td',
                          null,
                          node.csv
                            ? h(Pill, { tone: toneOf(node.csv.status === 'ok' ? 'good' : 'bad') }, node.csv.status === 'ok' ? '可用' : '异常')
                            : h(Pill, { tone: C.secondary }, '未体检'),
                        ),
                        h('td', { className: 'vpg-mono' }, node.csv && node.csv.latencyMs != null ? `${node.csv.latencyMs} ms` : '—'),
                        h('td', { className: 'vpg-mono' }, (node.csv && node.csv.exitIp) || '—'),
                        h(
                          'td',
                          { className: 'vpg-mono' },
                          node.aiRef && node.aiRef.score != null
                            ? String(node.aiRef.score)
                            : node.csv && node.csv.score != null
                              ? String(node.csv.score)
                              : '—',
                        ),
                        h('td', { className: 'wrap' }, node.groups.join(' / ') || '—'),
                        h(
                          'td',
                          null,
                          node.current
                            ? h('span', { style: { color: C.success, fontSize: '11px' } }, '当前')
                            : node.groups.length > 0
                              ? h(
                                  'button',
                                  { className: 'vpg-btn small', disabled: busy !== '', onClick: () => openSwitch(node) },
                                  '切换',
                                )
                              : '—',
                        ),
                      ),
                    ),
              ),
            ),
          ),
          filteredNodes.length > 20
            ? h(
                'div',
                { className: 'vpg-foot-line' },
                h('span', { className: 'vpg-card-note', style: { margin: 0 } }, `显示 ${visibleNodes.length} / ${filteredNodes.length}`),
                h(
                  'button',
                  { className: 'vpg-btn small', onClick: () => setShowAllNodes((value) => !value) },
                  showAllNodes ? '只看前 20' : '显示全部',
                ),
              )
            : null,
        )
      }

      function renderHistory() {
        return h(
          Card,
          { title: '历史记录（最近 60 次）' },
          history.length === 0
            ? h('div', { className: 'vpg-empty' }, '暂无历史记录；全量检测会自动落盘。')
            : h(
                'div',
                { className: 'vpg-table-wrap' },
                h(
                  'table',
                  { className: 'vpg-table' },
                  h(
                    'thead',
                    null,
                    h('tr', null, ['时间', '模式', '规则', '节点', '出口 IP', '总分 / AI', '覆盖/置信', '告警'].map((title) => h('th', { key: title }, title))),
                  ),
                  h(
                    'tbody',
                    null,
                    history.map((item, index) =>
                      h(
                        'tr',
                        { key: `${item.ts}-${index}` },
                        h('td', { className: 'vpg-mono' }, fmtTime(item.ts)),
                        h('td', null, item.mode === 'full' ? '全量' : item.mode === 'full-partial' ? '全量(不完整)' : '轻量'),
                        h('td', { className: 'vpg-mono' }, item.scoreVersion || '—'),
                        h('td', { className: 'wrap' }, item.node || '—'),
                        h('td', { className: 'vpg-mono' }, item.exitIp || '—'),
                        h(
                          'td',
                          { className: 'vpg-mono' },
                          `${item.stableOverall ?? (item.scores && item.scores.overall != null ? item.scores.overall : '—')} / ${
                            item.stableAi ?? (item.aiScore != null ? item.aiScore : '—')
                          }`,
                        ),
                        h(
                          'td',
                          { className: 'vpg-mono' },
                          item.scoreMeta
                            ? `${Math.round((item.scoreMeta.coverage ?? 0) * 100)}% / ${item.scoreMeta.confidence || '—'}`
                            : item.complete === false
                              ? '不完整'
                              : '—',
                        ),
                        h('td', { className: 'wrap' }, (item.alerts || []).join('；') || '—'),
                      ),
                    ),
                  ),
                ),
              ),
          h(
            'div',
            { className: 'vpg-foot' },
            `数据目录：${meta && meta.dataDir ? meta.dataDir : '~/.dsh/vpn-guard'} · 版本 ${meta && meta.version ? meta.version : '—'}`,
          ),
        )
      }

      function renderSettings() {
        if (!draft) return h('div', { className: 'vpg-empty' }, '配置加载中…')
        return h(
          Card,
          { title: '插件配置（保存后立即生效）' },
          h(
            'div',
            { className: 'vpg-card-note' },
            '多源评分与免费 key 属下一阶段，本轮先完成分服务矩阵和分区界面。当前配置只影响检测路径与间隔。Clash Verge 用户可点“检测 Clash Verge”，自动读取命名管道与 mixed-port，无需开启外部控制器。',
          ),
          h(
            'div',
            { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' } },
            h(
              'button',
              { className: 'vpg-btn', disabled: busy !== '', onClick: detectClashVerge },
              busy === 'detect' ? '检测中…' : '检测 Clash Verge',
            ),
          ),
          h(
            'div',
            { className: 'vpg-form' },
            [
              ['provider', '适配器（auto / clash / system / none）'],
              ['proxyMode', '代理模式（auto / http / tun / none）'],
              ['controller', 'Clash / Mihomo 控制器（可留空）'],
              ['proxyHost', '代理主机'],
              ['proxyPort', '本地代理端口'],
              ['selectorGroup', '主 selector 组（可留空）'],
              ['allowedSwitchGroups', '允许切换的组（逗号分隔，留空=禁用）'],
              ['processNames', '进程名（逗号分隔，可留空）'],
              ['serviceName', '后台服务名（可留空）'],
              ['ipjudgePath', 'ipjudge 路径（可选）'],
              ['ipcheckPath', 'ipcheck 路径（可选）'],
              ['nodesCsvPath', '节点体检 CSV（可选）'],
              ['keyNodesPath', '关键节点 JSON（可选）'],
              ['trafficWarnGb', '流量告警阈值（GB）'],
              ['expiryWarnDays', '到期告警阈值（天）'],
              ['scoreDropWarn', 'AI 分下降阈值'],
              ['lightIntervalMs', '轻量间隔（毫秒）'],
              ['fullIntervalMs', '全量间隔（毫秒）'],
            ].map(([key, label]) =>
              h(
                'label',
                { className: 'vpg-field', key },
                h('span', null, label),
                h('input', {
                  className: 'vpg-input',
                  value: Array.isArray(draft[key]) ? draft[key].join(', ') : draft[key] ?? '',
                  onChange: (event) => setDraft((current) => ({ ...(current || {}), [key]: event.target.value })),
                }),
              ),
            ),
          ),
          h(
            'div',
            { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' } },
            h('button', { className: 'vpg-btn', onClick: () => setTab('overview') }, '取消'),
            h(
              'button',
              { className: 'vpg-btn primary', disabled: busy !== '', onClick: saveConfig },
              busy === 'config' ? '保存中…' : '保存配置',
            ),
          ),
        )
      }

      return h(
        'div',
        { className: 'vpg' },
        h('style', null, CSS),
        h(
          'header',
          { className: 'vpg-header' },
          h(
            'div',
            null,
            h('h1', { className: 'vpg-title' }, 'VPN 守卫'),
            h(
              'div',
              { className: 'vpg-sub' },
              `VPN / 代理${clash && clash.version ? ' · Clash ' + clash.version : ''} · 出口与 AI 风控监视`,
              meta && meta.lastLightAt ? ` · 轻量 ${fmtTime(meta.lastLightAt)}` : '',
              ` · AI ${aiAt ? ageText(aiAt) || fmtTime(aiAt) : '待完整全量'}`,
            ),
          ),
          h(
            'div',
            { className: 'vpg-actions' },
            h(Pill, { tone: overallTone }, overallText),
            h('button', { className: 'vpg-btn', disabled: busy !== '', onClick: () => runCheck('light') }, busy === 'light' ? '检测中…' : '手动刷新'),
            h(
              'button',
              { className: 'vpg-btn primary', disabled: busy !== '', onClick: () => runCheck('full') },
              busy === 'full' ? '全量检测中…（约 1 分钟）' : '全量检测',
            ),
            h('button', { className: 'vpg-btn', onClick: () => setTab('settings') }, '配置'),
          ),
        ),

        h(
          'section',
          { className: 'vpg-hero' },
          h(
            'div',
            { className: 'vpg-hero-main' },
            h('div', { className: 'vpg-eyebrow' }, snapshot ? `当前节点 · ${cleanNodeName(snapshot.current) || '—'}` : '等待首次检测'),
            h('div', { className: 'vpg-hero-title' }, verdictTitle),
            h('div', { className: 'vpg-hero-sub' }, verdictSub),
            h(
              'div',
              { className: 'vpg-chips' },
              h(Pill, { tone: overallTone }, overallText),
              exit && exit.ok ? h(Pill, { tone: C.success }, exit.ip) : null,
              exit && exit.ok ? h(Pill, { tone: C.secondary }, [exit.city, exit.country].filter(Boolean).join(' / ')) : null,
              ai && metaInfo?.complete
                ? h(
                    Pill,
                    { tone: scoreTone(scores.aiStable ?? scores.ai) },
                    `AI ${scores.aiStable ?? scores.ai ?? '—'}${metaInfo.confidence === 'low' ? ' · 低置信' : ''}`,
                  )
                : h(Pill, { tone: C.secondary }, 'AI 待完整全量'),
              aiAt ? h(Pill, { tone: aiAge && /小时|天/.test(aiAge) ? C.warn : C.secondary }, `AI 数据 ${aiAge || fmtTime(aiAt)}`) : null,
              info.trafficGb != null ? h(Pill, { tone: C.secondary }, `流量 ${info.trafficGb} GB`) : null,
            ),
          ),
          h(
            'div',
            { className: 'vpg-kpis' },
            h(Kpi, { label: '出口身份', value: scores ? scores.identity : null, note: 'IP 类型 / ASN' }),
            h(Kpi, { label: '信誉风险', value: scores ? scores.reputation : null, note: scores && scores.reputation == null ? '证据不足' : 'proxycheck / 滥用' }),
            h(Kpi, {
              label: 'AI 可用性',
              value: scores ? scores.aiStable ?? scores.ai : null,
              note: metaInfo
                ? scores.ai == null
                  ? '证据不足 · 本次无 AI 数据'
                  : `3 次中位 · 本次 ${scores.ai ?? '—'} · 置信 ${confidenceLabel(metaInfo)}`
                : '待完整全量',
            }),
            h(Kpi, {
              label: '网络质量',
              value: scores ? scores.network : null,
              note: scores && scores.network == null ? '证据不足' : '控制器 / 端口 / 延迟',
            }),
          ),
        ),

        error ? h('div', { className: 'vpg-error' }, error) : null,

        h(
          'nav',
          { className: 'vpg-tabs' },
          TABS.map(([key, label]) =>
            h(
              'button',
              { key, className: 'vpg-tab' + (tab === key ? ' active' : ''), onClick: () => setTab(key) },
              label,
              key === 'clash' && clashView && clashView.clash && clashView.clash.reachable
                ? h('span', { className: 'vpg-tab-count' }, 'Clash Verge')
                : null,
              key === 'ai' && ai ? h('span', { className: 'vpg-tab-count' }, `${serviceCount}`) : null,
              key === 'social' ? h('span', { className: 'vpg-tab-count' }, `${socialCount}`) : null,
              key === 'nodes' && nodes.length ? h('span', { className: 'vpg-tab-count' }, `${nodes.length}`) : null,
            ),
          ),
        ),

        !snapshot
          ? h(Card, null, h('div', { className: 'vpg-empty' }, '正在首次检测，请稍候……（首次全量检测会自动进行）'))
          : tab === 'overview'
            ? renderOverview()
            : tab === 'clash'
              ? renderClash()
              : tab === 'ai'
                ? renderAI()
                : tab === 'social'
                  ? renderSocial()
                  : tab === 'nodes'
                    ? renderNodes()
                    : tab === 'history'
                      ? renderHistory()
                      : renderSettings(),

        modal
          ? h(
              'div',
              { className: 'vpg-modal-backdrop' },
              h(
                'div',
                { className: 'vpg-modal' },
                h('h3', null, '确认切换节点'),
                h('p', null, '目标节点：'),
                h('div', { className: 'target' }, modal.node.name),
                h('p', { style: { marginTop: '12px' } }, `切换组：${modal.group}`),
                h(
                  'p',
                  null,
                  '切换会立即改变所有走该代理/路由的流量出口。插件不会修改 VPN 配置，也不会自动再次切换；如需恢复，请在同一位置切回原节点。',
                ),
                h(
                  'div',
                  { className: 'vpg-modal-actions' },
                  h('button', { className: 'vpg-btn', disabled: busy === 'switch', onClick: () => setModal(null) }, '取消'),
                  h(
                    'button',
                    { className: 'vpg-btn danger', disabled: busy === 'switch', onClick: confirmSwitch },
                    busy === 'switch' ? '切换中…' : '确认切换',
                  ),
                ),
              ),
            )
          : null,
      )
    }

    function apply(ctx) {
      try {
        const disposeRow = ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'vpn-guard',
              order: 6,
              label: 'VPN 守卫',
            },
            VpnGuardIcon,
          ),
        )
        const disposePage = ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'vpn-guard' }, VpnGuardPage),
        )
        ctx.effect(() => () => {
          disposePage()
          disposeRow()
        })
        console.log('[dsh-vpn-guard] client: nav row + page registered')
      } catch (error) {
        console.error('[dsh-vpn-guard] client: slot registration failed', error)
      }
    }

    return { apply, inject: ['slots'] }
  },
})
