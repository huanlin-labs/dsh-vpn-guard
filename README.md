# VPN Guard for DSH

A provider-agnostic egress and AI-risk monitor for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH).

It answers three questions without locking you into a particular VPN vendor:

1. **Is my traffic actually leaving through the expected exit?** — exit IP, country, ASN/ISP, latency.
2. **Would AI services treat this IP as normal?** — per-service view for Claude, ChatGPT, Gemini, Gemini API, Codex and Muse.
3. **Is the IP suitable for social platforms?** — IP-side suitability only; account/device risk is explicitly out of scope.

> **Privacy first:** the plugin does not read subscription links, credentials, cookies or browser profiles. It stores only compact probe results in `~/.dsh/vpn-guard/`.

## Design: generic core, optional adapters

| Capability | Generic core | Clash / Mihomo adapter |
|---|---|---|
| Exit IP / country / ASN / latency | ✅ direct, HTTP proxy or TUN | ✅ |
| Controller reachability | — | ✅ HTTP controller (`host:port`) or Clash Verge named pipe (`auto`) |
| Node list / selector groups | — | ✅ if the controller exposes `/proxies` |
| Node switching | — | ✅ allow-list + two-step confirm |
| Subscription traffic / expiry | — | ✅ when info nodes are exposed |
| Process / service counters | optional, user-defined names | optional |

This means WireGuard, OpenVPN, Tailscale, sing-box, v2rayN, Clash Verge, Mihomo, SDKDNS and “system proxy only” setups can all use the same page. Vendor-specific features simply stay hidden when the adapter cannot provide them.

## Requirements

- DSH desktop with the `webServer` service.
- Node.js 20.11+ (provided by DSH).
- A working VPN/proxy route **or** a Clash/Mihomo-compatible controller.
- Optional: `ipjudge` and `ipcheck` binaries. Without them, the page still works using generic egress checks; AI per-service rows fall back to `— / 证据不足`.

## Install

```text
plugin_manager install_bundle target="<absolute path to this directory>"
```

Restart DSH once after the first install. A **VPN 守卫 / VPN Guard** entry appears in the sidebar.

## Configure

Open **设置 / Settings**:

| Key | Meaning | Default |
|---|---|---|
| `provider` | `auto`, `clash`, `system`, `none` | `auto` |
| `proxyMode` | `auto`, `http`, `tun`, `none` | `auto` |
| `controller` | Clash/Mihomo controller: `host:port`, `auto` (auto-detect Clash Verge), or empty = no controller | empty |
| `proxyHost` / `proxyPort` | local HTTP proxy for egress probes | `127.0.0.1:7890` |
| `selectorGroup` | group shown as “current node”; empty = first group / GLOBAL | empty |
| `allowedSwitchGroups` | comma-separated groups the switch button may touch; empty = switching disabled | empty |
| `processNames` | comma-separated process names to count, e.g. `clash.exe, mihomo.exe` | empty |
| `serviceName` | Windows service name to query | empty |
| `ipjudgePath` / `ipcheckPath` | optional enrichment tools | empty |
| `nodesCsvPath` / `keyNodesPath` | optional node-health / reference-score files | empty |

Everything except the egress probe is optional. Missing adapters produce a neutral “not configured” state, never a fake zero or a red alert.

### Examples

**Clash Verge / Mihomo**

Clash Verge Rev usually exposes its controller on a **Windows named pipe** (`\\.\pipe\verge-mihomo-...`) and leaves `external-controller` disabled. The plugin detects the running `verge-mihomo.exe`, reads its pipe and mixed-port, and uses them automatically. In the settings page click **检测 Clash Verge** (Detect Clash Verge) to fill `controller: "auto"`, `proxyPort` and process names; no Clash Verge setting needs to be changed.

```json
{
  "provider": "clash",
  "proxyMode": "http",
  "controller": "auto",
  "proxyPort": 7900,
  "selectorGroup": "节点选择",
  "allowedSwitchGroups": ["节点选择"]
}
```

An explicit HTTP controller such as `127.0.0.1:9097` still works for other Clash/Mihomo builds.

The plugin page also includes a **Clash** subpage. It reads the live controller and shows:

- core status (version, mode, mixed-port, TUN, LAN, system proxy);
- every proxy group and its current node;
- active connections with host, network, chain, rule and byte counters;
- the full node list with delay and group membership.

Groups in `allowedSwitchGroups` can be switched from this page; everything else is read-only. The page refreshes every 15 seconds while open. It never edits Clash YAML or subscription files.

`GET /__dsh-vpn-guard/clash` returns the same aggregation for scripts or diagnostics.

**WireGuard / OpenVPN / Tailscale (TUN, no local HTTP port)**

```json
{
  "provider": "system",
  "proxyMode": "tun",
  "controller": "",
  "allowedSwitchGroups": []
}
```

**System proxy only**

```json
{
  "provider": "system",
  "proxyMode": "http",
  "proxyPort": 7890
}
```

## Safety boundaries

- No VPN configuration files, system proxy settings or firewall rules are modified.
- Switching is only `PUT /proxies/<group>` on a controller, restricted to `allowedSwitchGroups`, with a two-step token and an explicit confirmation dialog.
- The plugin never switches automatically; monitoring is read-only.
- The DSH client page is local-only and sends no data to third parties beyond the public IP-intelligence endpoints used for probing.

## Open-source layout

```text
index.js              Host half: HTTP routes + timers
lib/probe.js          Generic egress, Clash controller, platform probes, optional tools
lib/score.js          Four-dimension scoring
lib/nodes.js          Optional node list / CSV / reference merging
lib/store.js          history.jsonl + config.json
client.js             Client half: sidebar + tabbed page
cordis.patch.yml      Bundle patch
docs/DETAIL.md        Longer design notes
```

## Development

```bash
node --check index.js
node --check client.js
node --check lib/probe.js
node --check lib/score.js
node --check lib/nodes.js
node --check lib/store.js
```

## License

MIT — see [LICENSE](LICENSE).

## 中文简介

这是一个**不绑定任何 VPN 厂商**的 DSH 插件：只要能测到出口 IP（直连、系统代理或 TUN 均可），页面就能工作；Clash/Mihomo 控制器、节点列表、流量信息、进程/服务检测都是可选增强。SDKDNS 只是可配置的一种用法，不是核心前提。
