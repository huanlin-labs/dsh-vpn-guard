# VPN Guard — design detail

## Position

DSH left sidebar page **VPN Guard**. The core is provider-agnostic: it measures the current egress through a direct route, a local HTTP proxy, or a TUN interface. Clash/Mihomo is an optional adapter for node lists and switching.

## Two layers

1. **Generic egress layer** — exit IP, country, region, ASN/ISP, latency, proxy/hosting flags, AI-service availability. Works with any VPN that changes the host's egress.
2. **Optional adapters** — Clash/Mihomo controller (`/version`, `/configs`, `/proxies`), subscription info nodes, node-level switching, process/service counters. Each capability is declared; unsupported UI is hidden.

## Provider matrix

| Setup | Egress | Controller | Node list | Switching |
|---|---|---|---|---|
| WireGuard / OpenVPN / Tailscale (TUN) | ✅ direct | — | — | — |
| System proxy (any client) | ✅ HTTP proxy | — | — | — |
| Clash / Mihomo / Clash Verge / SDKDNS | ✅ | ✅ | ✅ | ✅ allow-list |
| sing-box / v2rayN with Clash API | ✅ | ✅ (if exposed) | ✅ | ✅ allow-list |

## Scoring

- **Identity**: proxy/hosting flags, ASN/ISP heuristics.
- **Reputation**: abuse/reputation data if available.
- **AI availability**: ipjudge score + per-service levels when the optional tool is configured; otherwise null (“证据不足”), never 0.
- **Network**: controller reachability + local proxy port + latency.
- Per-service AI rows (Claude, ChatGPT, Gemini, Gemini API, Codex, Muse) and social rows are separate; social is explicitly **IP-side only**.

## Safety

- Read-only monitoring; the only write is Clash `PUT /proxies/<group>`.
- Switching is disabled unless `allowedSwitchGroups` is non-empty, and requires two steps plus a UI confirmation.
- No subscription URL, credential, cookie or browser profile is read or stored.
- Platform-specific probes (Windows registry/tasklist/service) run only on Windows and only when configured.

## Limitations

- A TUN-only setup cannot list nodes or switch nodes; it still measures egress and AI risk.
- IP intelligence is only as good as the public source; confidence is shown separately.
- Account-level platform risk needs device/browser signals and is out of scope for this plugin.
