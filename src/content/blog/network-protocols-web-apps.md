---
title: "网络协议入门：从 HTTP 请求到 WebSocket 和 WebRTC"
description: "用一间虚构的线上自习室，讲清 TCP、UDP、TLS、HTTP 和 JSON-RPC 各管什么，以及为什么 WebRTC 信令通了，通话还可能连不上。"
pubDate: 2026-11-29
category: "学习笔记"
draft: false
---

打开一间线上自习室，页面先显示房间名。几秒钟后，老师发来一条通知。接着你点了连麦，两个人开始说话。屏幕上都是同一个网页，背后却有三种不同的通信需求。

这间自习室和下文的消息都是为教学构造的。房间资料可以用一条 HTTP 请求加载，通知可以走 WebSocket，连麦里的声音可以走 WebRTC。理解这些协议，我通常先问一个小问题：**页面上的一个动作，到了网络上究竟变成了什么？**

## 打开房间时，TCP、TLS 和 HTTP 在做什么

浏览器请求 `https://study.example.com/api/rooms/7`。假设这次使用 HTTP/1.1，复用了已经建立的 HTTPS 连接。把请求解密后看，大致是下面这样。

```http
GET /api/rooms/7 HTTP/1.1
Host: study.example.com
```

服务端返回 `200 OK`，响应正文是 `{"id":7,"name":"周末自习室"}`。HTTP 给了双方一套共同的语义，包括方法、目标、头字段、状态码和正文。应用于是知道“这是读取 7 号房间资料”，浏览器也知道收到了一个成功的响应。[RFC 9110 · HTTP 语义](https://www.rfc-editor.org/rfc/rfc9110.html)

这次连接里，TLS 保护通信内容，浏览器通常会验证服务端证书和域名，并在握手后通过加密和完整性保护传输数据。底下的 TCP 把字节按顺序交给接收端，遇到丢失会尝试重传。TCP 提供的是一串字节，应用一次 `write` 的边界不会跟着传过去。UDP 传送的是一个个数据报，协议本身没有给应用提供有序交付或丢失重传。[RFC 8446 · TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html) · [RFC 9293 · TCP](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2) · [RFC 768 · UDP](https://www.rfc-editor.org/rfc/rfc768.html)

因此这次可以从上到下写成 `HTTP/1.1 → TLS → TCP → IP`。换成 HTTP/3，同样的请求语义由 QUIC 承载。QUIC 使用 UDP 数据报，在自己的协议里提供可靠的流，并将 TLS 1.3 握手集成到连接建立中。打开 DevTools，给 Network 表格加上 Protocol 列，可以看到实际协商出的 `h2`、`h3` 或 `http/1.1`。继续追一条请求从地址栏到服务器，也可以从本系列的 HTTP 图解开始。[RFC 9114 · HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html) · [RFC 9001 · QUIC 与 TLS](https://www.rfc-editor.org/rfc/rfc9001.html) · [一次 HTTP 请求的全貌](/blog/http-request-anatomy/)

## 如果把读取房间写成一次远程调用

浏览器也可以让服务器执行一个名为 `room.get` 的方法。这样的接口按操作名来组织，属于 RPC，也就是远程过程调用。若约定使用 JSON-RPC 2.0，同样的请求和响应可以写成这样。

```json
{"jsonrpc":"2.0","method":"room.get","params":{"roomId":7},"id":42}
```

```json
{"jsonrpc":"2.0","result":{"id":7,"name":"周末自习室"},"id":42}
```

`id: 42` 用来把返回值和这次调用对上。即使多个调用同时进行，客户端也能识别结果属于哪一个。调用失败时，响应携带 `error`。请求省略 `id` 就成了通知，接收方不会为这条通知发回 JSON-RPC 响应。若操作需要确认，例如服务端是否真的保存了修改，就保留请求 ID 并检查响应。[JSON-RPC 2.0 §4–5](https://www.jsonrpc.org/specification)

上面两段 JSON 可以走 `POST /rpc` 的请求和响应正文，也可以由应用约定各放入一条 WebSocket 文本消息。JSON-RPC 规定方法和返回值怎么写，HTTP 或 WebSocket 负责把它们送过去。具体绑定可能用 HTTP 200 返回一个带 `error` 的 JSON-RPC 响应。调试时先看 HTTP 层收到了什么，再检查调用有没有成功。[JSON-RPC 2.0 · 传输独立性](https://www.jsonrpc.org/specification#overview)

## 发了一条 JSON，网络上会有几个包？

房间页要同步举手和公告，两边都可能先开口。浏览器与服务器建立 WebSocket 后，各自都能主动发消息。若走经典的 HTTP/1.1 握手，浏览器发出带 `Upgrade: websocket` 的请求，服务器接受后返回 `101 Switching Protocols`。随后双方使用 WebSocket 帧通信。用 `wss://` 时，这段通信也受 TLS 保护。HTTP/2 和 HTTP/3 上有各自的扩展 CONNECT 方式，下面的 101 演示针对 HTTP/1.1。[RFC 6455 · 握手](https://www.rfc-editor.org/rfc/rfc6455.html#section-4) · [RFC 8441 · HTTP/2](https://www.rfc-editor.org/rfc/rfc8441.html) · [RFC 9220 · HTTP/3](https://www.rfc-editor.org/rfc/rfc9220.html)

假设应用约定一条 WebSocket 文本消息承载一条 JSON-RPC 调用。刚才的 `room.get` 消息可以装进一个文本帧，也可以拆成首帧加续帧。下面只画出载荷的切分位置，省略帧头和掩码。

```text
文本帧  FIN=0  {"jsonrpc":"2.0","method":"room.get",
续帧    FIN=1  "params":{"roomId":7},"id":42}
```

第二帧到齐后，浏览器才会把完整消息交给 `message` 事件。再往下一层看，TCP 段可能只带某个 WebSocket 帧的一部分，也可能带上相邻两个帧的字节。如果连接用了 TLS，中间还有 TLS 记录层。DevTools 里的消息列表适合核对应用收发了什么，拿它数 TCP 段会得到错误的结论。[RFC 6455 §5.4 · 消息分片](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.4) · [WHATWG · WebSocket 消息事件](https://websockets.spec.whatwg.org/#feedback-from-the-protocol) · [RFC 9293 · TCP 分段](https://www.rfc-editor.org/rfc/rfc9293.html#name-segmentation)

在 Protocol Explorer 左侧选 **WebSocket**，切到「时序」，点「单步」依次观察 TCP 建连、HTTP Upgrade、101 和随后双方发送的帧。再播放到 ping/pong 和关闭，看看哪些帧属于协议自身。演示用的是 HTTP/1.1 升级。上面把一条 JSON 拆成两帧的场景是另一个构造例子，用来理解消息边界。[Protocol Explorer](https://protocol-explorer-alpha.vercel.app/)

如果页面只接收服务器发来的进度，例如等一份转写结果，SSE 也是一种选择。客户端要发命令时照常发 HTTP 请求，服务端用一条 HTTP 响应持续发送事件。可以进一步看一条事件何时才被解析出来，以及断线后怎样恢复。[Agent 的回答为什么一口气冒出来？追一条 SSE 事件流](/blog/sse-agent-streaming/)

## 信令交换成功了，为什么连麦还没通？

通知能通过 WebSocket 送到两个浏览器，说明它们都能联系服务器。连麦还需要找出一条能承载音视频的路径。两端往往在不同的局域网里，浏览器所知的私网地址可能走不到对方。家里的路由器或上游设备还可能做 NAT，把内网地址和端口映射成外面可见的一组值。

建立 WebRTC 会话时，浏览器通过**信令**交换 offer、answer 和 ICE 候选。前两者描述媒体能力及会话参数，候选代表可尝试的网络地址。信令可以复用自习室已经有的 WebSocket，也可以走 HTTP。拿到可以配对的候选后，两端就能开始连通性检查，后续发现的候选仍可继续交换。[WebRTC · 建立 PeerConnection](https://webrtc.org/getting-started/peer-connections) · [RFC 8445 §6–8 · 检查与提名](https://www.rfc-editor.org/rfc/rfc8445.html) · [RFC 8838 · Trickle ICE](https://www.rfc-editor.org/rfc/rfc8838.html)

| 名字 | 在这次连麦里做什么 |
| --- | --- |
| STUN | 帮浏览器得知 STUN 服务器观察到的映射地址和端口。ICE 的连通性检查也使用 STUN。 |
| TURN | 在服务器侧分配一个可用的中继地址，选中这条路径后由中继服务器转发包。 |
| ICE | 收集并交换候选，按候选对做检查，由控制方提名可用的候选对。 |

拿到映射地址，只说明 STUN 服务器能看见一次往返。换成另一个浏览器来发包，路由器或防火墙仍可能拦下。部署 TURN 后，中继候选可以与直连候选一起参与检查。实际走哪条路径，要看连通性、优先级和应用策略。应用还可以设置 `iceTransportPolicy: "relay"`，只让本端使用中继候选。这时如果中继不可用，本端不会退回直连。[RFC 8489 · STUN](https://www.rfc-editor.org/rfc/rfc8489.html) · [RFC 8656 · TURN](https://www.rfc-editor.org/rfc/rfc8656.html) · [W3C · relay 策略](https://www.w3.org/TR/webrtc/#dom-rtcicetransportpolicy-relay)

例如甲和乙能交换信令，但直连检查没通过。假设 ICE 选中了甲的中继候选和乙的一个可达候选，这次通话可以这样理解。此处省略了候选收集和媒体握手。

```text
甲 ── offer ─→ 信令服务 ── offer ─→ 乙
甲 ←─ answer ─ 信令服务 ←─ answer ─ 乙
甲 ←─────── 通过信令交换 ICE 候选 ───────→ 乙
直连检查失败，经 TURN 的候选对检查成功并被选中
甲 ←───────── TURN 中继 ─────────→ 乙
```

排查时，先看双方的 offer 和 answer 有没有成功设置，再看 `iceConnectionState`。如果交换已经完成而 ICE 进入 `failed`，可以继续核对两端收到的候选以及 TURN 是否可达。连接成功后，可用 `RTCPeerConnection.getStats()` 从 `transport` 报告取 `selectedCandidatePairId`，再查该候选对的本地与远端候选类型。任一侧的类型为 `relay`，就说明这条选中路径经过 TURN。[W3C · ICE 连接状态](https://www.w3.org/TR/webrtc/#dom-rtciceconnectionstate) · [W3C · WebRTC Stats](https://www.w3.org/TR/webrtc-stats/#dom-rtctransportstats-selectedcandidatepairid)

## 同一个 WebRTC 连接，声音和数据怎么发

通话里的音视频可以用 SRTP 承载，DTLS 握手为它建立密钥。应用自己收发的数据则可以走 `RTCDataChannel`，它把 SCTP 放在 DTLS 里面。在常见的 UDP 路径上，这两部分都能使用 ICE 选中的路径。遇到限制 UDP 的网络，浏览器也可能通过 TCP 或 TLS 连接 TURN，所以看见 WebRTC 时，仍要确认实际选中的路径。[RFC 8831 §5 · 协议栈](https://www.rfc-editor.org/rfc/rfc8831.html#section-5) · [RFC 8835 §3.4–3.5 · 传输与媒体](https://www.rfc-editor.org/rfc/rfc8835.html#section-3.4)

假如两人在自习室里共享光标，上一帧的位置晚到，画出来只会让光标倒退。可以为光标单独建一条允许乱序且关闭消息重传的 DataChannel，用递增序号丢弃比已显示位置更旧的消息。下面的调用假设已有一个 `RTCPeerConnection`，发送前还要完成信令，等待通道进入 `open`。

```js
const cursorChannel = peerConnection.createDataChannel("cursor", {
  ordered: false,
  maxRetransmits: 0,
});
```

`ordered: false` 允许乱序交付。重传由另一项控制，示例用 `maxRetransmits: 0` 关闭消息重传。也可以用 `maxPacketLifeTime` 限制尝试传送的时长，单位是毫秒，二者只能设一个。省略这两个限制且保留默认的 `ordered: true`，得到可靠且有序的通道。房间公告如果要求重连后还能补看，仍应由应用保存记录，再按确认或游标补发。[W3C · RTCDataChannelInit](https://www.w3.org/TR/webrtc/#rtcdatachannelinit) · [RFC 8831 §6](https://www.rfc-editor.org/rfc/rfc8831.html#section-6)
