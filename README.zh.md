# VPN 守卫 for DSH

一个**不绑定任何 VPN 厂商**的出口与 AI 风险监测插件，面向 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）。

它回答三个问题，且不逼你锁死在某一家 VPN 上：

1. **我的流量真的从预期的出口出去了吗？** —— 出口 IP、国家/地区、ASN/运营商、延迟。
2. **AI 服务会把这个 IP 当成正常用户吗？** —— 按服务分别看 Claude、ChatGPT、Gemini、Gemini API、Codex 与 Muse。
3. **这个 IP 适合上社交平台吗？** —— 只看 IP 侧适配度；账号/设备风险明确不在范围内。

> **隐私优先：** 插件不读订阅链接、凭据、Cookie 或浏览器 profile。它只在 `~/.dsh/vpn-guard/` 里存紧凑的探针结果。

## 设计：通用内核 + 可选适配器

| 能力 | 通用内核 | Clash / Mihomo 适配器 |
|---|---|---|
| 出口 IP / 国家 / ASN / 延迟 | ✅ 直连、HTTP 代理或 TUN | ✅ |
| 控制器可达性 | — | ✅ HTTP 控制器（`host:port`）或 Clash Verge 命名管道（`auto`） |
| 节点列表 / 策略组 | — | ✅ 控制器暴露 `/proxies` 时可用 |
| 切换节点 | — | ✅ 白名单 + 二次确认 |
| 订阅流量 / 到期 | — | ✅ 暴露了信息节点时可用 |
| 进程 / 服务计数 | 可选，名字自定义 | 可选 |

也就是说，WireGuard、OpenVPN、Tailscale、sing-box、v2rayN、Clash Verge、Mihomo、SDKDNS 以及「只用系统代理」的配置，都能用同一个页面。适配器给不出的能力，对应功能直接隐藏，不造假数据。

## 环境要求

- DSH 桌面版，且带 `webServer` 服务。
- Node.js 20.11+（DSH 自带）。
- 一条能用的 VPN/代理链路，**或者**一个 Clash/Mihomo 兼容控制器。
- 可选：`ipjudge` 与 `ipcheck` 可执行文件。没有它们页面照样能用通用出口检查；AI 逐服务那一栏降级显示 `— / 证据不足`。

## 评分模型（v2，0.5.0）

- 轻量检查只刷新实时状态，**从不**清除或覆盖 AI 评分。
- 只有一次完整的全量运行才会替换上一份「最近一次完整快照」；不完整的运行保留上一份完整结果，并标注为不完整。
- 缺证据就是 `null`（显示 `— / 证据不足`），绝不折算成低分。
- 稳定的 AI KPI 用最近 3 次完整运行的中位数；历史里保留原始值、评分版本与覆盖率/置信度。
- 最近一次完整快照持久化在 `~/.dsh/vpn-guard/last-full.json`，重启不会把页面清零。

精确规则见 [docs/SCORING.md](docs/SCORING.md)。

## 安装

```text
plugin_manager install_bundle target="<本目录的绝对路径>"
```

首次安装后重启 DSH 一次。侧栏会出现 **VPN 守卫 / VPN Guard** 入口。

## 配置

打开 **设置 / Settings**：

| 键 | 含义 | 默认 |
|---|---|---|
| `provider` | `auto`、`clash`、`system`、`none` | `auto` |
| `proxyMode` | `auto`、`http`、`tun`、`none` | `auto` |
| `controller` | Clash/Mihomo 控制器：`host:port`、`auto`（自动探测 Clash Verge），留空 = 不用控制器 | 空 |
| `proxyHost` / `proxyPort` | 出口探针走的本地 HTTP 代理 | `127.0.0.1:7890` |
| `selectorGroup` | 显示为「当前节点」的组；留空 = 第一个组 / GLOBAL | 空 |
| `allowedSwitchGroups` | 允许切换按钮触碰的组，逗号分隔；留空 = 禁止切换 | 空 |
| `processNames` | 要计数的进程名，逗号分隔，如 `clash.exe, mihomo.exe` | 空 |
| `serviceName` | 要查询的 Windows 服务名 | 空 |
| `ipjudgePath` / `ipcheckPath` | 可选的增强工具 | 空 |
| `nodesCsvPath` / `keyNodesPath` | 可选的节点健康 / 参考评分文件 | 空 |

除了出口探针，其余全是可选项。适配器缺失时给中性「未配置」状态，不会伪造 0 分或红色告警。

### 示例

**Clash Verge / Mihomo**

Clash Verge Rev 通常把控制器开在 **Windows 命名管道**（`\\.\pipe\verge-mihomo-...`）上，并把 `external-controller` 关着。插件会识别运行中的 `verge-mihomo.exe`，读出它的管道和 mixed-port 并自动使用。在设置页点 **检测 Clash Verge**，会填好 `controller: "auto"`、`proxyPort` 和进程名；不需要改 Clash Verge 的任何设置。

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

其他 Clash/Mihomo 构建仍可用显式 HTTP 控制器，例如 `127.0.0.1:9097`。

插件页面里还有一个 **Clash** 子页。它读取实时控制器并展示：

- 内核状态（版本、模式、mixed-port、TUN、LAN、系统代理）；
- 每个策略组及其当前节点；
- 活动连接，含主机、网络、链路、规则与字节计数；
- 完整节点列表，含延迟与所属策略组。

`allowedSwitchGroups` 里的组可以在该页切换，其余只读。页面打开期间每 15 秒刷新一次。它从不改 Clash YAML 或订阅文件。

`GET /__dsh-vpn-guard/clash` 返回同样的聚合结果，供脚本或诊断使用。

**WireGuard / OpenVPN / Tailscale（TUN，无本地 HTTP 端口）**

```json
{
  "provider": "system",
  "proxyMode": "tun",
  "controller": "",
  "allowedSwitchGroups": []
}
```

**只用系统代理**

```json
{
  "provider": "system",
  "proxyMode": "http",
  "proxyPort": 7890
}
```

## 安全边界

- 不修改任何 VPN 配置文件、系统代理设置或防火墙规则。
- 切换只对控制器发 `PUT /proxies/<group>`，且限制在 `allowedSwitchGroups` 内，需要二次 token 与显式确认对话框。
- 插件从不自动切换；监测全程只读。
- DSH 客户端页面只在本机运行；除探针用的公共 IP 情报接口外，不向第三方发送数据。

## 开源目录

```text
index.js              宿主半：HTTP 路由 + 定时器
lib/probe.js          通用出口、Clash 控制器、平台探针、可选工具
lib/score.js          四维评分
lib/nodes.js          可选的节点列表 / CSV / 参考值合并
lib/store.js          history.jsonl + config.json
client.js             客户端半：侧栏 + 分页页面
cordis.patch.yml      Bundle patch
docs/DETAIL.md        更长的设计说明
```

## 开发

```bash
node --check index.js
node --check client.js
node --check lib/probe.js
node --check lib/score.js
node --check lib/nodes.js
node --check lib/store.js
```

## 许可

MIT —— 见 [LICENSE](LICENSE)。
